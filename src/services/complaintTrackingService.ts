import { prisma } from "@/lib/db/prisma";
import {
  verifyTrackingToken,
  hashTrackingToken,
  generateEvidenceAccessToken,
} from "@/lib/crypto/token";
import { ComplaintStatus, ComplaintCategory, ComplaintSeverity } from "@prisma/client";

// Constant dummy hash to guarantee constant-time execution on missing records
const DUMMY_HASH = hashTrackingToken("DUMMY_TOKEN_TIMING_DEFENSE_12345678");

export interface PublicComplaintDetails {
  complaintRef: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  description: string;
  coach: string | null;
  createdAt: string;
  train: {
    trainNumber: string;
    trainName: string;
  } | null;
  unmatchedTrainNumber: string | null;
  station: {
    code: string;
    name: string;
  } | null;
  packagingUnit: {
    batchNumber: string;
    qrCodeIdentifier: string;
    productName: string;
    vendorName: string;
  } | null;
  publicEvents: {
    newStatus: string;
    explanation: string;
    createdAt: string;
  }[];
  evidenceAssets: {
    id: string;
    fileName: string;
    streamUrl: string;
  }[];
  resolutionSummary?: string;
}

export interface TrackingResult {
  success: boolean;
  error?: string;
  complaint?: PublicComplaintDetails;
}

/**
 * Public Complaint Tracking Service.
 * Authenticates passenger queries using constant-time SHA-256 token verification.
 * Enforces uniform error messaging and strict information sanitization.
 */
export async function getPublicComplaintTracking(
  complaintRef: string,
  rawToken: string
): Promise<TrackingResult> {
  const normalizedRef = (complaintRef || "").trim().toUpperCase();
  const normalizedToken = (rawToken || "").trim().toUpperCase();

  // Basic format sanity (accepts standard 32-char generated tokens as well as seeded fixtures)
  if (!normalizedRef || !normalizedToken || normalizedToken.length < 16 || normalizedToken.length > 64) {
    return {
      success: false,
      error: "Invalid complaint reference or tracking token format.",
    };
  }

  // 1. Lookup Complaint Record
  const complaint = await prisma.complaint.findUnique({
    where: { complaintRef: normalizedRef },
    include: {
      train: {
        select: { trainNumber: true, trainName: true },
      },
      station: {
        select: { code: true, name: true },
      },
      packagingUnit: {
        select: {
          batchNumber: true,
          qrCodeIdentifier: true,
          product: {
            select: {
              name: true,
              vendor: { select: { name: true, code: true } },
            },
          },
        },
      },
      evidence: {
        select: { id: true, fileName: true },
      },
      events: {
        where: { isPublic: true },
        orderBy: { createdAt: "asc" },
        select: {
          newStatus: true,
          explanation: true,
          createdAt: true,
          isPublic: true,
        },
      },
    },
  });

  // 2. Uniform Timing & Error Defense:
  // If complaint not found or soft-deleted, run token verification on dummy hash
  if (!complaint || complaint.deletedAt) {
    verifyTrackingToken(normalizedToken, DUMMY_HASH);
    return {
      success: false,
      error: "Case record not found or invalid tracking credentials provided.",
    };
  }

  // 3. Cryptographic Token Verification
  const isAuthorized = verifyTrackingToken(normalizedToken, complaint.trackingTokenHash);
  if (!isAuthorized) {
    return {
      success: false,
      error: "Case record not found or invalid tracking credentials provided.",
    };
  }

  // 4. Sanitize and Format Public Response
  // Internal notes, personal contact details, and investigator identities are strictly excluded
  const sanitizedEvents = complaint.events
    .filter((e) => e.isPublic === true)
    .map((e) => ({
      newStatus: e.newStatus,
      explanation: e.explanation,
      createdAt: e.createdAt.toISOString(),
    }));

  const evidenceAssets = complaint.evidence.map((ev) => ({
    id: ev.id,
    fileName: ev.fileName,
    streamUrl: `/api/evidence/${ev.id}?evidenceToken=${generateEvidenceAccessToken(
      ev.id,
      complaint.id
    )}`,
  }));

  let resolutionSummary: string | undefined;
  if (complaint.status === ComplaintStatus.RESOLVED) {
    const finalEvent = complaint.events[complaint.events.length - 1];
    resolutionSummary = finalEvent?.explanation || "Investigation concluded and verified closed.";
  } else if (complaint.status === ComplaintStatus.REJECTED) {
    resolutionSummary = complaint.rejectionReason || "Inquiry determined allegation unsubstantiated.";
  }

  const publicData: PublicComplaintDetails = {
    complaintRef: complaint.complaintRef,
    status: complaint.status,
    category: complaint.category,
    severity: complaint.severity,
    description: complaint.description,
    coach: complaint.coach,
    createdAt: complaint.createdAt.toISOString(),
    train: complaint.train,
    unmatchedTrainNumber: complaint.unmatchedTrainNumber,
    station: complaint.station,
    packagingUnit: complaint.packagingUnit
      ? {
          batchNumber: complaint.packagingUnit.batchNumber,
          qrCodeIdentifier: complaint.packagingUnit.qrCodeIdentifier,
          productName: complaint.packagingUnit.product.name,
          vendorName: complaint.packagingUnit.product.vendor.name,
        }
      : null,
    publicEvents: sanitizedEvents,
    evidenceAssets,
    resolutionSummary,
  };

  return {
    success: true,
    complaint: publicData,
  };
}
