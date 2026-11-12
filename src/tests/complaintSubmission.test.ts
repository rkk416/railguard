import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ComplaintCategory, ComplaintSeverity, ComplaintStatus } from "@prisma/client";
import fs from "fs";
import path from "path";

// Mock prisma for isolated service testing
const mockCreateComplaint = vi.fn();
const mockCreateEvidence = vi.fn();
const mockCreateEvent = vi.fn();
const mockTransaction = vi.fn();
const mockFindUniqueComplaint = vi.fn();
const mockFindUniqueTrain = vi.fn();
const mockFindUniqueStation = vi.fn();
const mockFindUniquePackaging = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    complaint: {
      findUnique: (...args: unknown[]) => mockFindUniqueComplaint(...args),
    },
    train: {
      findUnique: (...args: unknown[]) => mockFindUniqueTrain(...args),
    },
    station: {
      findUnique: (...args: unknown[]) => mockFindUniqueStation(...args),
    },
    packagingUnit: {
      findUnique: (...args: unknown[]) => mockFindUniquePackaging(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

import { submitPassengerComplaint } from "@/services/complaintSubmissionService";

describe("Complaint Submission Service (/report)", () => {
  const uploadsDir = path.resolve(process.cwd(), "evidence_storage", "uploads");

  // Valid 1x1 JPEG fixture (FF D8 FF ...)
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  // Valid PNG fixture (89 50 4E 47 ...)
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueComplaint.mockResolvedValue(null); // No collision on candidate ref
    mockFindUniqueTrain.mockResolvedValue(null);
    mockFindUniqueStation.mockResolvedValue(null);
    mockFindUniquePackaging.mockResolvedValue(null);

    // Default transaction implementation
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        complaint: {
          create: mockCreateComplaint.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
            id: "complaint-new-uuid",
            complaintRef: data.complaintRef,
            status: ComplaintStatus.SUBMITTED,
            createdAt: new Date("2026-11-10T04:00:00Z"),
          })),
        },
        complaintEvidence: {
          create: mockCreateEvidence.mockImplementation(async ({ data }: { data: unknown }) => ({
            id: "ev-uuid",
            ...(data as object),
          })),
        },
        complaintEvent: {
          create: mockCreateEvent.mockImplementation(async ({ data }: { data: unknown }) => ({
            id: "event-uuid",
            ...(data as object),
          })),
        },
      };
      return await callback(tx);
    });
  });

  afterEach(() => {
    // Clean any test files in uploadsDir
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".webp")) {
          try {
            fs.unlinkSync(path.join(uploadsDir, f));
          } catch {
            // ignore
          }
        }
      }
    }
  });

  it("submits a valid complaint without images and creates complaint + initial public event", async () => {
    const result = await submitPassengerComplaint({
      category: ComplaintCategory.SPOILAGE,
      severity: ComplaintSeverity.HIGH,
      description: "Rice was moldy and had an offensive odor upon serving.",
      trainNumber: "12951",
      stationCode: "NDLS",
      coach: "B2-14",
    });

    expect(result.complaintRef).toMatch(/^RG-\d{4}-\d+/);
    expect(result.trackingToken).toHaveLength(32);
    expect(result.evidenceCount).toBe(0);

    expect(mockCreateComplaint).toHaveBeenCalledTimes(1);
    expect(mockCreateEvent).toHaveBeenCalledTimes(1);
    expect(mockCreateEvidence).not.toHaveBeenCalled();

    // Verify initial public event creation
    const eventCall = mockCreateEvent.mock.calls[0][0];
    expect(eventCall.data.actorRole).toBe("PASSENGER");
    expect(eventCall.data.newStatus).toBe(ComplaintStatus.SUBMITTED);
    expect(eventCall.data.isPublic).toBe(true);
  });

  it("submits a valid complaint with 1–3 images and saves evidence records", async () => {
    const result = await submitPassengerComplaint({
      category: ComplaintCategory.FOREIGN_OBJECT,
      severity: ComplaintSeverity.CRITICAL,
      description: "Found sharp metal wire inside vegetarian biryani portion.",
      evidenceFiles: [
        { fileName: "photo1.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
        { fileName: "photo2.png", declaredMimeType: "image/png", buffer: validPngBuffer },
      ],
    });

    expect(result.complaintRef).toBeDefined();
    expect(result.evidenceCount).toBe(2);
    expect(mockCreateEvidence).toHaveBeenCalledTimes(2);
  });

  it("rejects complaints with description shorter than 10 characters", async () => {
    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.LOW,
        description: "Bad food", // 8 chars
      })
    ).rejects.toThrow(/at least 10 characters/i);
  });

  it("rejects complaints with description exceeding 2500 characters", async () => {
    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.LOW,
        description: "A".repeat(2501),
      })
    ).rejects.toThrow(/cannot exceed 2500 characters/i);
  });

  it("rejects more than 3 evidence files", async () => {
    const files = [
      { fileName: "1.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
      { fileName: "2.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
      { fileName: "3.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
      { fileName: "4.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
    ];

    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.MEDIUM,
        description: "Vegetables were undercooked and unhygienic.",
        evidenceFiles: files,
      })
    ).rejects.toThrow(/maximum of 3 evidence images/i);
  });

  it("rejects evidence with spoofed MIME type or invalid binary signatures", async () => {
    const fakeImageBuffer = Buffer.from("THIS IS AN EXE FILE OR SCRIPT");

    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.MEDIUM,
        description: "Food was cold and smelled sour during transit.",
        evidenceFiles: [
          { fileName: "trojan.jpg", declaredMimeType: "image/jpeg", buffer: fakeImageBuffer },
        ],
      })
    ).rejects.toThrow(/Unsupported file format/i);
  });

  it("rejects oversized evidence files (> 5MB)", async () => {
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 100);
    // Add valid JPEG header to simulate disguised oversized image
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;

    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.MEDIUM,
        description: "Food was cold and smelled sour during transit.",
        evidenceFiles: [
          { fileName: "huge.jpg", declaredMimeType: "image/jpeg", buffer: oversizedBuffer },
        ],
      })
    ).rejects.toThrow(/exceeds 5MB/i);
  });

  it("cleans up written evidence files if database transaction fails (no orphaned files)", async () => {
    // Force transaction failure
    mockTransaction.mockImplementationOnce(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        complaint: {
          create: vi.fn().mockResolvedValue({ id: "temp-id" }),
        },
        complaintEvidence: {
          create: vi.fn().mockImplementation(() => {
            // Throw error after writing file
            throw new Error("Simulated database deadlock during evidence record insertion");
          }),
        },
        complaintEvent: {
          create: vi.fn(),
        },
      };
      return await callback(tx);
    });

    const fileListBefore = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];

    await expect(
      submitPassengerComplaint({
        category: ComplaintCategory.SPOILAGE,
        severity: ComplaintSeverity.MEDIUM,
        description: "Pantry service provided substandard meal box.",
        evidenceFiles: [
          { fileName: "test.jpg", declaredMimeType: "image/jpeg", buffer: validJpegBuffer },
        ],
      })
    ).rejects.toThrow(/Simulated database deadlock/i);

    const fileListAfter = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    // Confirm no orphaned files remain
    expect(fileListAfter.length).toBe(fileListBefore.length);
  });
});