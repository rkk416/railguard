import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComplaintStatus, UserRole } from "@prisma/client";

const mockFindUniqueComplaint = vi.fn();
const mockFindManyComplaints = vi.fn();
const mockUpdateComplaint = vi.fn();
const mockCreateEvent = vi.fn();
const mockTransaction = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    complaint: {
      findUnique: (...args: unknown[]) => mockFindUniqueComplaint(...args),
      findMany: (...args: unknown[]) => mockFindManyComplaints(...args),
      update: (...args: unknown[]) => mockUpdateComplaint(...args),
    },
    complaintEvent: {
      create: (...args: unknown[]) => mockCreateEvent(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import {
  findDuplicateCandidates,
  markComplaintAsDuplicate,
} from "@/services/duplicateDetectionService";

describe("Duplicate Complaint Detection & Correlation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const targetComplaint = {
    id: "comp-target",
    trainId: "train-12951",
    unmatchedTrainNumber: null,
    stationId: "station-ndls",
    coach: "B4-22",
    category: "SPOILAGE",
    createdAt: new Date("2026-11-10T08:00:00Z"),
  };

  it("finds potential duplicate complaints matching train, coach, and category within 24h", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce(targetComplaint);
    mockFindManyComplaints.mockResolvedValueOnce([
      {
        id: "comp-dup-1",
        complaintRef: "RG-2026-0005",
        category: "SPOILAGE",
        severity: "HIGH",
        status: "SUBMITTED",
        description: "Cold stale dal in coach B4.",
        coach: "B4-22",
        trainId: "train-12951",
        unmatchedTrainNumber: null,
        stationId: "station-ndls",
        createdAt: new Date("2026-11-10T08:30:00Z"),
      },
    ]);

    const candidates = await findDuplicateCandidates("comp-target");
    expect(candidates).toHaveLength(1);
    expect(candidates[0].complaintRef).toBe("RG-2026-0005");
    expect(candidates[0].matchReason).toBe("Identical train and coach");
  });

  it("returns empty array if no temporal or geographic candidate matches", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce(targetComplaint);
    mockFindManyComplaints.mockResolvedValueOnce([]);

    const candidates = await findDuplicateCandidates("comp-target");
    expect(candidates).toEqual([]);
  });

  it("marks a complaint as duplicate and records an auditable public ComplaintEvent", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce({
      id: "comp-target",
      status: ComplaintStatus.SUBMITTED,
    });

    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        complaint: {
          update: mockUpdateComplaint.mockResolvedValue({
            id: "comp-target",
            status: ComplaintStatus.DUPLICATE,
          }),
        },
        complaintEvent: {
          create: mockCreateEvent.mockResolvedValue({ id: "evt-1" }),
        },
      };
      return await callback(tx);
    });

    const result = await markComplaintAsDuplicate({
      complaintId: "comp-target",
      originalComplaintRef: "RG-2026-0001",
      actorId: "user-rev-1",
      actorRole: UserRole.QUALITY_REVIEWER,
      notes: "Same passenger submitted second ticket with extra photo.",
    });

    expect(result.status).toBe(ComplaintStatus.DUPLICATE);
    expect(mockUpdateComplaint).toHaveBeenCalledWith({
      where: { id: "comp-target" },
      data: {
        status: ComplaintStatus.DUPLICATE,
        rejectionReason: "Duplicate of case RG-2026-0001",
      },
    });

    expect(mockCreateEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({
        complaintId: "comp-target",
        newStatus: ComplaintStatus.DUPLICATE,
        isPublic: true,
      }),
    });
  });

  it("prevents marking a formally RESOLVED complaint as duplicate", async () => {
    mockFindUniqueComplaint.mockResolvedValueOnce({
      id: "comp-resolved",
      status: ComplaintStatus.RESOLVED,
    });

    await expect(
      markComplaintAsDuplicate({
        complaintId: "comp-resolved",
        originalComplaintRef: "RG-2026-0001",
        actorId: "user-1",
        actorRole: UserRole.QUALITY_REVIEWER,
      })
    ).rejects.toThrow(/INVALID_STATE/i);
  });
});
