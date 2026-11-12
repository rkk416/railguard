import { prisma } from "@/lib/db/prisma";
import { ComplaintStatus, UserRole } from "@prisma/client";

export interface DuplicateCandidate {
  id: string;
  complaintRef: string;
  category: string;
  severity: string;
  createdAt: string;
  status: string;
  description: string;
  coach: string | null;
  matchReason: string;
}

/**
 * Searches for potential duplicate complaints based on matching train, station,
 * coach, and category within a temporal window.
 */
export async function findDuplicateCandidates(complaintId: string): Promise<DuplicateCandidate[]> {
  const target = await prisma.complaint.findUnique({
    where: { id: complaintId },
    select: {
      id: true,
      trainId: true,
      unmatchedTrainNumber: true,
      stationId: true,
      coach: true,
      category: true,
      createdAt: true,
    },
  });

  if (!target) return [];

  // Window: 24 hours around incident
  const timeWindowMs = 24 * 60 * 60 * 1000;
  const startWindow = new Date(target.createdAt.getTime() - timeWindowMs);
  const endWindow = new Date(target.createdAt.getTime() + timeWindowMs);

  const candidates = await prisma.complaint.findMany({
    where: {
      id: { not: complaintId },
      deletedAt: null,
      createdAt: { gte: startWindow, lte: endWindow },
      OR: [
        // Match 1: Same train and same category
        ...(target.trainId ? [{ trainId: target.trainId, category: target.category }] : []),
        // Match 2: Same unmatched train number and category
        ...(target.unmatchedTrainNumber
          ? [{ unmatchedTrainNumber: target.unmatchedTrainNumber, category: target.category }]
          : []),
        // Match 3: Same station and same category
        ...(target.stationId ? [{ stationId: target.stationId, category: target.category }] : []),
      ],
    },
    select: {
      id: true,
      complaintRef: true,
      category: true,
      severity: true,
      status: true,
      description: true,
      coach: true,
      trainId: true,
      unmatchedTrainNumber: true,
      stationId: true,
      createdAt: true,
    },
    take: 5,
  });

  return candidates.map((c) => {
    let matchReason = "Matching category and timeframe";
    if (target.trainId && c.trainId === target.trainId) {
      matchReason = target.coach && c.coach === target.coach
        ? "Identical train and coach"
        : "Identical train route within 24h";
    } else if (target.stationId && c.stationId === target.stationId) {
      matchReason = "Identical station and category within 24h";
    }

    return {
      id: c.id,
      complaintRef: c.complaintRef,
      category: c.category,
      severity: c.severity,
      status: c.status,
      description: c.description,
      coach: c.coach,
      createdAt: c.createdAt.toISOString(),
      matchReason,
    };
  });
}

/**
 * Marks a complaint as DUPLICATE and links it to the original master complaint reference.
 */
export async function markComplaintAsDuplicate(input: {
  complaintId: string;
  originalComplaintRef: string;
  actorId: string;
  actorRole: UserRole;
  notes?: string;
}) {
  const { complaintId, originalComplaintRef, actorId, actorRole, notes } = input;

  if (actorRole !== UserRole.QUALITY_REVIEWER && actorRole !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED: Only reviewers or administrators can mark complaints as duplicates.");
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    throw new Error("NOT_FOUND: Complaint record does not exist.");
  }

  if (complaint.status === ComplaintStatus.RESOLVED) {
    throw new Error("INVALID_STATE: Cannot mark a formally resolved complaint as duplicate.");
  }

  const explanation = notes
    ? `Classified as duplicate of master case ${originalComplaintRef}. ${notes}`
    : `Classified as duplicate of master case ${originalComplaintRef}.`;

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id: complaintId },
      data: {
        status: ComplaintStatus.DUPLICATE,
        rejectionReason: `Duplicate of case ${originalComplaintRef}`,
      },
    });

    await tx.complaintEvent.create({
      data: {
        complaintId,
        actorId,
        actorRole,
        previousStatus: complaint.status,
        newStatus: ComplaintStatus.DUPLICATE,
        explanation,
        isPublic: true,
      },
    });

    return updated;
  });
}
