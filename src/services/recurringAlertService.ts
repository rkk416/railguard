import { prisma } from "@/lib/db/prisma";
import { AlertStatus, ComplaintCategory, UserRole } from "@prisma/client";

export interface RecurringAlertSummary {
  id: string;
  category: ComplaintCategory;
  triggerCount: number;
  timeWindowHours: number;
  reason: string;
  status: AlertStatus;
  createdAt: string;
  vendor: {
    id: string;
    name: string;
    code: string;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
  triggeringComplaintsCount: number;
  recentComplaintRefs: string[];
}

/**
 * Retrieves all recurring-issue alerts with vendor, product, and linked complaint details.
 */
export async function getRecurringIssueAlerts(): Promise<RecurringAlertSummary[]> {
  const alerts = await prisma.recurringIssueAlert.findMany({
    orderBy: [
      { status: "asc" }, // OPEN first, then ACKNOWLEDGED, etc.
      { createdAt: "desc" },
    ],
    include: {
      vendor: {
        select: { id: true, name: true, code: true },
      },
      product: {
        select: { id: true, name: true },
      },
      complaintLinks: {
        select: {
          complaint: {
            select: { complaintRef: true },
          },
        },
      },
    },
  });

  return alerts.map((a) => ({
    id: a.id,
    category: a.category,
    triggerCount: a.triggerCount,
    timeWindowHours: a.timeWindowHours,
    reason: a.reason,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    vendor: a.vendor,
    product: a.product,
    triggeringComplaintsCount: a.complaintLinks.length,
    recentComplaintRefs: a.complaintLinks.map((l) => l.complaint.complaintRef),
  }));
}

/**
 * Updates the status of a recurring issue alert (Reviewer/Admin only).
 */
export async function updateAlertStatus(
  alertId: string,
  newStatus: AlertStatus,
  actorRole: UserRole
) {
  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only quality reviewers or administrators can manage alerts.");
  }

  const existing = await prisma.recurringIssueAlert.findUnique({
    where: { id: alertId },
  });

  if (!existing) {
    throw new Error("NOT_FOUND: Alert record does not exist.");
  }

  return await prisma.recurringIssueAlert.update({
    where: { id: alertId },
    data: { status: newStatus },
  });
}

/**
 * Evaluates whether a complaint triggers or links to a recurring issue alert.
 * If >= 3 complaints in the same category occur for the same vendor/product within 48h,
 * an alert is created or updated with complaint associations.
 */
export async function evaluateRecurringIssue(complaintId: string) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      packagingUnit: {
        include: {
          product: {
            include: { vendor: true },
          },
        },
      },
    },
  });

  if (!complaint) return null;

  const vendorId = complaint.packagingUnit?.product?.vendorId;
  const productId = complaint.packagingUnit?.productId;
  const category = complaint.category;

  if (!vendorId && !productId) return null;

  // Window: 48 hours
  const windowHours = 48;
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  // Find undeleted complaints with same vendor/product & category within window
  const matchingComplaints = await prisma.complaint.findMany({
    where: {
      category,
      deletedAt: null,
      createdAt: { gte: cutoff },
      packagingUnit: {
        product: {
          ...(vendorId ? { vendorId } : {}),
          ...(productId ? { id: productId } : {}),
        },
      },
    },
    select: { id: true, complaintRef: true },
  });

  const threshold = 3;
  if (matchingComplaints.length < threshold) {
    return null;
  }

  // Check if an OPEN or ACKNOWLEDGED alert already exists
  let alert = await prisma.recurringIssueAlert.findFirst({
    where: {
      category,
      vendorId: vendorId || null,
      productId: productId || null,
      status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
    },
  });

  const vendorName = complaint.packagingUnit?.product?.vendor.name || "Unknown Caterer";
  const productName = complaint.packagingUnit?.product?.name || "Packaged Item";

  if (!alert) {
    alert = await prisma.recurringIssueAlert.create({
      data: {
        vendorId: vendorId || null,
        productId: productId || null,
        category,
        triggerCount: matchingComplaints.length,
        timeWindowHours: windowHours,
        reason: `Repeated ${category.replace("_", " ")} complaints (${matchingComplaints.length} cases in ${windowHours}h) on ${productName} by ${vendorName}.`,
        status: AlertStatus.OPEN,
      },
    });
  } else {
    // Update trigger count
    alert = await prisma.recurringIssueAlert.update({
      where: { id: alert.id },
      data: {
        triggerCount: matchingComplaints.length,
        reason: `Repeated ${category.replace("_", " ")} complaints (${matchingComplaints.length} cases in ${windowHours}h) on ${productName} by ${vendorName}.`,
      },
    });
  }

  // Link any unlinked complaints
  for (const c of matchingComplaints) {
    await prisma.recurringIssueAlertComplaint.upsert({
      where: {
        alertId_complaintId: {
          alertId: alert.id,
          complaintId: c.id,
        },
      },
      update: {},
      create: {
        alertId: alert.id,
        complaintId: c.id,
      },
    });
  }

  return alert;
}
