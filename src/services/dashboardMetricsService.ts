import { prisma } from "@/lib/db/prisma";
import { ComplaintStatus, ComplaintCategory, ComplaintSeverity, CorrectiveActionStatus } from "@prisma/client";

export interface ControlRoomMetrics {
  totalActiveCases: number;
  urgentSpoilageCases: number;
  overdueInvestigations: number;
  overdueCorrectiveActions: number;
  totalResolved: number;
  duplicateCount: number;
  rejectedCount: number;
  vendorComplianceRate: number | null; // null when no actions due
  complianceBreakdown: {
    satisfactory: number;
    nonCompliant: number;
    escalated: number;
    overdueUncompleted: number;
    denominator: number;
  };
  totalComplaints: number;
  activeAlertsCount: number;
  generatedAt: string;
}

/**
 * Computes authoritative Control Room Operational Metrics directly from PostgreSQL.
 * Strict compliance with formulas defined in docs/DATABASE.md.
 * Zero hardcoded or simulated values.
 */
export async function getControlRoomMetrics(): Promise<ControlRoomMetrics> {
  const now = new Date();
  const investigationThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours ago

  const activeStatuses: ComplaintStatus[] = [
    ComplaintStatus.SUBMITTED,
    ComplaintStatus.UNDER_REVIEW,
    ComplaintStatus.INVESTIGATION,
    ComplaintStatus.ACTION_REQUIRED,
    ComplaintStatus.NEEDS_INFORMATION,
  ];

  // 1. Run database counts in parallel
  const [
    totalComplaints,
    totalActiveCases,
    urgentSpoilageCases,
    overdueInvestigations,
    totalResolved,
    duplicateCount,
    rejectedCount,
    activeAlertsCount,
    allActions,
  ] = await Promise.all([
    // Total undeleted complaints
    prisma.complaint.count({
      where: { deletedAt: null },
    }),

    // Total Active Cases: active status AND not soft-deleted
    prisma.complaint.count({
      where: {
        status: { in: activeStatuses },
        deletedAt: null,
      },
    }),

    // Urgent Spoilage Cases: Active cases WHERE category IN (SPOILAGE, FOREIGN_OBJECT) AND severity IN (HIGH, CRITICAL)
    prisma.complaint.count({
      where: {
        status: { in: activeStatuses },
        category: { in: [ComplaintCategory.SPOILAGE, ComplaintCategory.FOREIGN_OBJECT] },
        severity: { in: [ComplaintSeverity.HIGH, ComplaintSeverity.CRITICAL] },
        deletedAt: null,
      },
    }),

    // Overdue Investigations: status = INVESTIGATION and assigned > 48h ago without determination
    prisma.complaint.count({
      where: {
        status: ComplaintStatus.INVESTIGATION,
        deletedAt: null,
        investigation: {
          determination: null,
          assignedAt: { lt: investigationThreshold },
        },
      },
    }),

    // Total Resolved
    prisma.complaint.count({
      where: {
        status: ComplaintStatus.RESOLVED,
        deletedAt: null,
      },
    }),

    // Duplicate Count
    prisma.complaint.count({
      where: {
        status: ComplaintStatus.DUPLICATE,
        deletedAt: null,
      },
    }),

    // Rejected Count
    prisma.complaint.count({
      where: {
        status: ComplaintStatus.REJECTED,
        deletedAt: null,
      },
    }),

    // Open or Acknowledged Recurring Alerts
    prisma.recurringIssueAlert.count({
      where: {
        status: { in: ["OPEN", "ACKNOWLEDGED"] },
      },
    }),

    // Fetch all corrective actions to calculate single-count compliance rate
    prisma.correctiveAction.findMany({
      select: {
        id: true,
        status: true,
        deadline: true,
        verificationOutcome: true,
      },
    }),
  ]);

  // 2. Vendor Compliance Rate Calculation:
  // Each action counted exactly once into mutually exclusive categories:
  // - SATISFACTORY: status === VERIFIED_COMPLETE (and verification was satisfactory)
  // - NON_COMPLIANT: status === NON_COMPLIANT
  // - ESCALATED: status === ESCALATED
  // - OVERDUE_UNCOMPLETED: status in (PENDING, IN_PROGRESS) AND deadline < now
  // Note: pending/in-progress actions within grace period (deadline >= now) are excluded from denominator.
  let satisfactory = 0;
  let nonCompliant = 0;
  let escalated = 0;
  let overdueUncompleted = 0;

  for (const act of allActions) {
    if (act.status === CorrectiveActionStatus.VERIFIED_COMPLETE) {
      satisfactory += 1;
    } else if (act.status === CorrectiveActionStatus.NON_COMPLIANT) {
      nonCompliant += 1;
    } else if (act.status === CorrectiveActionStatus.ESCALATED) {
      escalated += 1;
    } else if (
      (act.status === CorrectiveActionStatus.PENDING || act.status === CorrectiveActionStatus.IN_PROGRESS) &&
      act.deadline &&
      act.deadline < now
    ) {
      overdueUncompleted += 1;
    }
  }

  const denominator = satisfactory + nonCompliant + escalated + overdueUncompleted;
  const vendorComplianceRate =
    denominator > 0 ? Math.round((satisfactory / denominator) * 100) : null;

  return {
    totalActiveCases,
    urgentSpoilageCases,
    overdueInvestigations,
    overdueCorrectiveActions: overdueUncompleted,
    totalResolved,
    duplicateCount,
    rejectedCount,
    vendorComplianceRate,
    complianceBreakdown: {
      satisfactory,
      nonCompliant,
      escalated,
      overdueUncompleted,
      denominator,
    },
    totalComplaints,
    activeAlertsCount,
    generatedAt: now.toISOString(),
  };
}
