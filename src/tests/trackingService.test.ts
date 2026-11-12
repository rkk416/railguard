import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashTrackingToken, verifyEvidenceAccessToken } from "@/lib/crypto/token";

const mockFindUnique = vi.fn();

// Mock the Prisma client before importing the service so no real DB calls occur
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    complaint: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { getPublicComplaintTracking } from "@/services/complaintTrackingService";

describe("Public Complaint Tracking Security & Sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validToken = "A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4";
  const validHash = hashTrackingToken(validToken);

  const mockComplaint = {
    id: "complaint-uuid-1",
    complaintRef: "RG-2026-0001",
    trackingTokenHash: validHash,
    status: "INVESTIGATION",
    category: "SPOILAGE",
    severity: "HIGH",
    description: "Cold stale dal served with sour smell.",
    coach: "B4-24",
    createdAt: new Date("2026-11-01T10:00:00Z"),
    deletedAt: null,
    // Sensitive fields that must NOT be exposed:
    contactEmail: "passenger@example.com",
    contactPhone: "+91-9999999999",
    train: { trainNumber: "12951", trainName: "Rajdhani Express" },
    unmatchedTrainNumber: null,
    station: { code: "NDLS", name: "New Delhi" },
    packagingUnit: null,
    evidence: [
      { id: "ev-1", fileName: "dal_photo.jpg", storagePath: "uploads/secret-file-name.jpg" },
    ],
    events: [
      {
        newStatus: "SUBMITTED",
        explanation: "Complaint submitted by passenger.",
        createdAt: new Date("2026-11-01T10:00:00Z"),
        isPublic: true,
      },
      {
        newStatus: "INVESTIGATION",
        explanation: "Inspector assigned to review pantry records.",
        createdAt: new Date("2026-11-01T11:00:00Z"),
        isPublic: true,
      },
      // Internal event with isPublic: false (should never appear)
      {
        newStatus: "INVESTIGATION",
        explanation: "INTERNAL NOTE: Spoke with pantry manager, suspect cooler failure.",
        createdAt: new Date("2026-11-01T11:30:00Z"),
        isPublic: false,
      },
    ],
  };

  it("rejects lookup with malformed or invalid token length", async () => {
    const result = await getPublicComplaintTracking("RG-2026-0001", "short");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid complaint reference or tracking token format/i);
  });

  it("returns uniform error message for non-existent case reference", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    const result = await getPublicComplaintTracking("RG-2026-9999", validToken);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Case record not found or invalid tracking credentials provided."
    );
  });

  it("returns exact same uniform error message for valid reference with invalid token", async () => {
    mockFindUnique.mockResolvedValueOnce(mockComplaint);
    const result = await getPublicComplaintTracking(
      "RG-2026-0001",
      "WRONGTOKENWRONGTOKENWRONGTOKEN12"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Case record not found or invalid tracking credentials provided."
    );
  });

  it("returns uniform error message for soft-deleted complaints (defense against state disclosure)", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...mockComplaint,
      deletedAt: new Date(),
    });
    const result = await getPublicComplaintTracking("RG-2026-0001", validToken);
    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Case record not found or invalid tracking credentials provided."
    );
  });

  it("returns sanitized public data and excludes personal contact details", async () => {
    mockFindUnique.mockResolvedValueOnce(mockComplaint);
    const result = await getPublicComplaintTracking("RG-2026-0001", validToken);

    expect(result.success).toBe(true);
    expect(result.complaint).toBeDefined();

    // Verify sanitized public fields
    expect(result.complaint?.complaintRef).toBe("RG-2026-0001");
    expect(result.complaint?.status).toBe("INVESTIGATION");
    expect(result.complaint?.description).toBe("Cold stale dal served with sour smell.");

    // Verify sensitive fields are strictly excluded
    const raw = result.complaint as unknown as Record<string, unknown>;
    expect(raw.contactEmail).toBeUndefined();
    expect(raw.contactPhone).toBeUndefined();
    expect(raw.deletedAt).toBeUndefined();
    expect(raw.deletedReason).toBeUndefined();
    expect(raw.deletedById).toBeUndefined();
  });

  it("excludes private evidence filesystem storagePath and generates short-lived evidenceToken", async () => {
    mockFindUnique.mockResolvedValueOnce(mockComplaint);
    const result = await getPublicComplaintTracking("RG-2026-0001", validToken);

    expect(result.success).toBe(true);
    const evidenceAsset = result.complaint?.evidenceAssets[0];
    expect(evidenceAsset).toBeDefined();
    expect(evidenceAsset?.fileName).toBe("dal_photo.jpg");

    // Must NOT contain internal storage path
    const rawEv = evidenceAsset as unknown as Record<string, unknown>;
    expect(rawEv.storagePath).toBeUndefined();

    // Must use ?evidenceToken= and NOT ?token=
    expect(evidenceAsset?.streamUrl).toContain("/api/evidence/ev-1?evidenceToken=");
    expect(evidenceAsset?.streamUrl).not.toContain("?token=");
    // Must NOT contain the raw permanent tracking token
    expect(evidenceAsset?.streamUrl).not.toContain(validToken);

    // Verify the generated evidenceToken is valid for ev-1 and complaint-uuid-1
    const tokenMatch = evidenceAsset?.streamUrl.match(/evidenceToken=([^&]+)/);
    expect(tokenMatch).toBeTruthy();
    const token = decodeURIComponent(tokenMatch![1]);
    expect(verifyEvidenceAccessToken(token, "ev-1", "complaint-uuid-1")).toBe(true);
  });

  it("excludes internal reviewer events from public status timeline", async () => {
    mockFindUnique.mockResolvedValueOnce(mockComplaint);
    const result = await getPublicComplaintTracking("RG-2026-0001", validToken);

    expect(result.success).toBe(true);
    const events = result.complaint?.publicEvents || [];
    // Only the events returned from the query should appear (and mockComplaint had 3 in DB, but query specifies isPublic: true)
    // The service maps whatever complaint.events are provided:
    events.forEach((evt) => {
      expect(evt.explanation).not.toContain("INTERNAL NOTE");
    });
  });
});
