import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetPublicComplaintTracking = vi.fn();
const mockSubmitPassengerComplaint = vi.fn();

vi.mock("@/services/complaintTrackingService", () => ({
  getPublicComplaintTracking: (...args: unknown[]) => mockGetPublicComplaintTracking(...args),
}));

vi.mock("@/services/complaintSubmissionService", () => ({
  submitPassengerComplaint: (...args: unknown[]) => mockSubmitPassengerComplaint(...args),
}));

import { POST as trackPOST } from "@/app/api/track/route";
import { POST as complaintPOST } from "@/app/api/complaints/route";

describe("POST /api/track API Validation & Route Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects request missing complaintRef or trackingToken with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintRef: "" }),
    });

    const res = await trackPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("rejects token shorter than 16 characters with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaintRef: "RG-2026-0001", trackingToken: "short" }),
    });

    const res = await trackPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/at least 16 characters/i);
  });

  it("returns 404 with uniform error when service returns not found or invalid token", async () => {
    mockGetPublicComplaintTracking.mockResolvedValueOnce({
      success: false,
      error: "Case record not found or invalid tracking credentials provided.",
    });

    const req = new NextRequest("http://localhost:3000/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintRef: "RG-2026-9999",
        trackingToken: "TOKEN-DEMO-RG-2026-9999",
      }),
    });

    const res = await trackPOST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe(
      "Case record not found or invalid tracking credentials provided."
    );
  });

  it("returns 200 with sanitized complaint details on successful lookup", async () => {
    mockGetPublicComplaintTracking.mockResolvedValueOnce({
      success: true,
      complaint: {
        complaintRef: "RG-2026-0001",
        status: "SUBMITTED",
        category: "SPOILAGE",
        severity: "HIGH",
        description: "Test description",
        coach: "B1",
        createdAt: "2026-11-01T00:00:00.000Z",
        train: null,
        unmatchedTrainNumber: null,
        station: null,
        packagingUnit: null,
        publicEvents: [],
        evidenceAssets: [],
      },
    });

    const req = new NextRequest("http://localhost:3000/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        complaintRef: "RG-2026-0001",
        trackingToken: "TOKEN-DEMO-RG-2026-0001",
      }),
    });

    const res = await trackPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.complaint.complaintRef).toBe("RG-2026-0001");
  });
});

describe("POST /api/complaints Validation & Error Handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects request with missing or short description with 400", async () => {
    const formData = new FormData();
    formData.append("category", "SPOILAGE");
    formData.append("severity", "MEDIUM");
    formData.append("description", "Too short"); // 9 chars

    const req = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: formData,
    });

    const res = await complaintPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/at least 10 characters/i);
  });

  it("rejects invalid complaint category with 400", async () => {
    const formData = new FormData();
    formData.append("category", "INVALID_CAT");
    formData.append("severity", "MEDIUM");
    formData.append("description", "Valid length description for testing.");

    const req = new NextRequest("http://localhost:3000/api/complaints", {
      method: "POST",
      body: formData,
    });

    const res = await complaintPOST(req);
    expect(res.status).toBe(400);
  });
});