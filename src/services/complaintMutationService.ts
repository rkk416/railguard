import { prisma } from "@/lib/db/prisma";
import {
  ComplaintStatus,
  UserRole,
  InvestigationDetermination,
  CorrectiveActionType,
  CorrectiveActionStatus,
} from "@prisma/client";

export interface StatusTransitionInput {
  complaintId: string;
  targetStatus: ComplaintStatus;
  actorId: string;
  actorRole: UserRole;
  explanation: string;
  rejectionReason?: string;
}

export interface AssignInvestigatorInput {
  complaintId: string;
  investigatorId: string;
  actorId: string;
  actorRole: UserRole;
  notes?: string;
}

export interface AppendFindingsInput {
  complaintId: string;
  findings: string;
  determination?: InvestigationDetermination;
  isCompleted?: boolean;
  actorId: string;
  actorRole: UserRole;
}

export interface AddCorrectiveActionInput {
  complaintId: string;
  actionType: CorrectiveActionType;
  description: string;
  responsibleParty: string;
  deadline?: Date;
  actorId: string;
  actorRole: UserRole;
}

export interface SoftDeleteComplaintInput {
  complaintId: string;
  deletedReason: string;
  actorId: string;
  actorRole: UserRole;
}

// Allowed state transitions based on docs/DATABASE.md state machine
const PERMITTED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.SUBMITTED]: [
    ComplaintStatus.UNDER_REVIEW,
    ComplaintStatus.DUPLICATE,
    ComplaintStatus.REJECTED,
  ],
  [ComplaintStatus.UNDER_REVIEW]: [
    ComplaintStatus.INVESTIGATION,
    ComplaintStatus.NEEDS_INFORMATION,
    ComplaintStatus.REJECTED,
    ComplaintStatus.DUPLICATE,
  ],
  [ComplaintStatus.NEEDS_INFORMATION]: [
    ComplaintStatus.UNDER_REVIEW,
    ComplaintStatus.REJECTED,
  ],
  [ComplaintStatus.INVESTIGATION]: [
    ComplaintStatus.ACTION_REQUIRED,
    ComplaintStatus.RESOLVED,
    ComplaintStatus.REJECTED,
  ],
  [ComplaintStatus.ACTION_REQUIRED]: [
    ComplaintStatus.RESOLVED,
  ],
  [ComplaintStatus.RESOLVED]: [
    ComplaintStatus.UNDER_REVIEW, // Reopened case
  ],
  [ComplaintStatus.REJECTED]: [
    ComplaintStatus.UNDER_REVIEW, // Reopened case
  ],
  [ComplaintStatus.DUPLICATE]: [], // Terminal state
};

/**
 * Validates whether a state transition is legal in the RailGuard state machine.
 */
export function isTransitionPermitted(
  currentStatus: ComplaintStatus,
  targetStatus: ComplaintStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = PERMITTED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Executes a status transition within an atomic database transaction.
 * Appends an immutable ComplaintEvent and strictly enforces rejection justifications.
 */
export async function transitionComplaintStatus(input: StatusTransitionInput) {
  const { complaintId, targetStatus, actorId, actorRole, explanation, rejectionReason } = input;

  // Authorization check: Reviewer or Admin only
  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only authorized quality reviewers or administrators can change case status.");
  }

  // Fetch current complaint
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { investigation: true },
  });

  if (!complaint) {
    throw new Error("NOT_FOUND: Complaint not found.");
  }

  if (complaint.deletedAt) {
    throw new Error("INVALID_STATE: Cannot transition a deleted complaint.");
  }

  // State machine validation
  if (!isTransitionPermitted(complaint.status, targetStatus)) {
    throw new Error(
      `INVALID_TRANSITION: Transition from ${complaint.status} to ${targetStatus} is not permitted.`
    );
  }

  // Rejection requires documented justification
  if (targetStatus === ComplaintStatus.REJECTED && (!rejectionReason || rejectionReason.trim().length === 0)) {
    throw new Error("VALIDATION_ERROR: Rejection reason is mandatory when marking a complaint as REJECTED.");
  }

  const isReopening =
    (complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.REJECTED) &&
    targetStatus === ComplaintStatus.UNDER_REVIEW;

  return await prisma.$transaction(async (tx) => {
    // 1. Update Complaint Record
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: targetStatus,
        rejectionReason: targetStatus === ComplaintStatus.REJECTED ? rejectionReason : complaint.rejectionReason,
      },
    });

    // 2. If case is being reopened, preserve prior investigation and append chronological notice
    if (isReopening && complaint.investigation) {
      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
      const reopenNote = `\n\n[Reopened ${timestamp} UTC by ${actorRole}]: ${explanation}`;
      await tx.investigation.update({
        where: { id: complaint.investigation.id },
        data: {
          isCompleted: false,
          findings: (complaint.investigation.findings || "") + reopenNote,
        },
      });
    }

    // 3. Append Immutable Audit Event
    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: complaint.status,
        newStatus: targetStatus,
        explanation: explanation.trim() || `Status updated from ${complaint.status} to ${targetStatus}`,
        isPublic: true,
      },
    });

    return updated;
  });
}

/**
 * Assigns or reassigns an investigator to a complaint within a transaction.
 */
export async function assignInvestigator(input: AssignInvestigatorInput) {
  const { complaintId, investigatorId, actorId, actorRole, notes } = input;

  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only authorized personnel can assign investigators.");
  }

  const [complaint, investigator] = await Promise.all([
    prisma.complaint.findUnique({ where: { id: complaintId } }),
    prisma.user.findUnique({ where: { id: investigatorId } }),
  ]);

  if (!complaint) throw new Error("NOT_FOUND: Complaint not found.");
  if (!investigator) throw new Error("NOT_FOUND: Investigator user not found.");

  return await prisma.$transaction(async (tx) => {
    // Upsert investigation
    const inv = await tx.investigation.upsert({
      where: { complaintId },
      update: {
        investigatorId,
        findings: notes ? notes : undefined,
      },
      create: {
        complaintId,
        investigatorId,
        findings: notes || "Investigation initiated by control room reviewer.",
      },
    });

    // If complaint is still in SUBMITTED or UNDER_REVIEW, move to INVESTIGATION
    if (complaint.status === ComplaintStatus.SUBMITTED || complaint.status === ComplaintStatus.UNDER_REVIEW) {
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.INVESTIGATION },
      });
    }

    // Append Audit Event
    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: complaint.status,
        newStatus: ComplaintStatus.INVESTIGATION,
        explanation: `Assigned investigator ${investigator.name} (${investigator.email}). ${notes || ""}`.trim(),
        isPublic: true,
      },
    });

    return inv;
  });
}

/**
 * Appends investigative findings and determination to an existing investigation.
 */
export async function appendInvestigativeFindings(input: AppendFindingsInput) {
  const { complaintId, findings, determination, isCompleted, actorId, actorRole } = input;

  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only authorized personnel can document findings.");
  }

  const existingInv = await prisma.investigation.findUnique({
    where: { complaintId },
  });

  if (!existingInv) {
    throw new Error("NOT_FOUND: No active investigation found for this complaint.");
  }

  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);
  const updatedFindings = existingInv.findings
    ? `${existingInv.findings}\n\n[Findings recorded ${timestamp} UTC]: ${findings}`
    : `[Findings recorded ${timestamp} UTC]: ${findings}`;

  return await prisma.$transaction(async (tx) => {
    const inv = await tx.investigation.update({
      where: { id: existingInv.id },
      data: {
        findings: updatedFindings,
        determination: determination !== undefined ? determination : existingInv.determination,
        isCompleted: isCompleted !== undefined ? isCompleted : existingInv.isCompleted,
        completedAt: isCompleted ? new Date() : existingInv.completedAt,
      },
    });

    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: null,
        newStatus: "FINDINGS_UPDATED",
        explanation: `Investigative findings documented. Determination: ${determination || "Pending"}.`,
        isPublic: false, // Internal reviewer note
      },
    });

    return inv;
  });
}

/**
 * Creates a corrective action linked to an investigation.
 */
export async function createCorrectiveAction(input: AddCorrectiveActionInput) {
  const { complaintId, actionType, description, responsibleParty, deadline, actorId, actorRole } = input;

  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only authorized personnel can issue corrective actions.");
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: { investigation: true },
  });

  if (!complaint) throw new Error("NOT_FOUND: Complaint not found.");
  if (!complaint.investigation) {
    throw new Error("INVALID_STATE: Cannot issue corrective action before an investigation record exists.");
  }

  return await prisma.$transaction(async (tx) => {
    const action = await tx.correctiveAction.create({
      data: {
        investigationId: complaint.investigation!.id,
        actionType,
        description,
        responsibleParty,
        deadline,
        status: CorrectiveActionStatus.PENDING,
      },
    });

    // If complaint is in INVESTIGATION, transition to ACTION_REQUIRED
    if (complaint.status === ComplaintStatus.INVESTIGATION) {
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: ComplaintStatus.ACTION_REQUIRED },
      });
    }

    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: complaint.status,
        newStatus: ComplaintStatus.ACTION_REQUIRED,
        explanation: `Corrective action issued: ${actionType} assigned to ${responsibleParty}. Deadline: ${deadline ? deadline.toLocaleDateString() : "Immediate"}.`,
        isPublic: true,
      },
    });

    return action;
  });
}

/**
 * Soft deletes a complaint (strictly ADMIN only).
 */
export async function softDeleteComplaint(input: SoftDeleteComplaintInput) {
  const { complaintId, deletedReason, actorId, actorRole } = input;

  if (actorRole !== UserRole.ADMIN) {
    throw new Error("FORBIDDEN: Only administrators have privilege to soft-delete case records.");
  }

  if (!deletedReason || deletedReason.trim().length === 0) {
    throw new Error("VALIDATION_ERROR: An administrative deletion rationale must be recorded.");
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) throw new Error("NOT_FOUND: Complaint not found.");

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        deletedAt: new Date(),
        deletedReason,
        deletedById: actorId,
      },
    });

    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: complaint.status,
        newStatus: "SOFT_DELETED",
        explanation: `Case soft-deleted by administrator. Rationale: ${deletedReason}`,
        isPublic: false,
      },
    });

    return updated;
  });
}
