import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateEvidenceAccessToken,
} from "@/lib/crypto/token";

const mockFindUniqueEvidence = vi.fn();
const mockResolveSession = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    complaintEvidence: {
      findUnique: (...args: unknown[]) => mockFindUniqueEvidence(...args),
    },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  resolveSession: (...args: unknown[]) => mockResolveSession(...args),
}));

// Mock fs to simulate evidence file on disk
vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs");
  const existsSync = vi.fn().mockReturnValue(true);
  const readFileSync = vi.fn().mockReturnValue(Buffer.from("<svg>test</svg>"));
  return {
    ...actual,
    existsSync,
    readFileSync,
    default: {
      ...actual,
      existsSync,
      readFileSync,
    },
  };
});

import { GET } from "@/app/api/evidence/[id]/route";
import { NextRequest } from "next/server";

describe("Evidence Authorization Proxy (/api/evidence/[id])", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvidence = {
    id: "evidence-123",
    complaintId: "complaint-456",
    storagePath: "uploads/test.svg",
    fileName: "meal_issue.svg",
    mimeType: "image/svg+xml",
    complaint: {
      id: "complaint-456",
    },
  };

  it("authorizes authenticated reviewer without needing any token", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(mockEvidence);
    mockResolveSession.mockResolvedValueOnce({
      authenticated: true,
      user: { id: "user-1", email: "reviewer@railguard.test", role: "QUALITY_REVIEWER" },
    });

    const req = new NextRequest("http://localhost:3000/api/evidence/evidence-123");
    const response = await GET(req, { params: Promise.resolve({ id: "evidence-123" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("authorizes passenger using a valid short-lived evidence access token", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(mockEvidence);
    mockResolveSession.mockResolvedValueOnce({ authenticated: false, user: null });

    const evidenceToken = generateEvidenceAccessToken("evidence-123", "complaint-456", 300);
    const req = new NextRequest(
      `http://localhost:3000/api/evidence/evidence-123?evidenceToken=${encodeURIComponent(evidenceToken)}`
    );
    const response = await GET(req, { params: Promise.resolve({ id: "evidence-123" }) });

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("rejects permanent tracking token if passed as credential (prevents token reuse)", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(mockEvidence);
    mockResolveSession.mockResolvedValueOnce({ authenticated: false, user: null });

    // Passing permanent tracking token via ?token= is NOT accepted
    const req = new NextRequest(
      "http://localhost:3000/api/evidence/evidence-123?token=A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4"
    );
    const response = await GET(req, { params: Promise.resolve({ id: "evidence-123" }) });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toMatch(/Unauthorized: Reviewer session or valid evidence access token required/i);
  });

  it("rejects expired short-lived evidence access token", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(mockEvidence);
    mockResolveSession.mockResolvedValueOnce({ authenticated: false, user: null });

    const expiredToken = generateEvidenceAccessToken("evidence-123", "complaint-456", -10);
    const req = new NextRequest(
      `http://localhost:3000/api/evidence/evidence-123?evidenceToken=${encodeURIComponent(expiredToken)}`
    );
    const response = await GET(req, { params: Promise.resolve({ id: "evidence-123" }) });

    expect(response.status).toBe(403);
  });

  it("rejects token scoped to a different evidenceId (cross-evidence authorization defense)", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(mockEvidence);
    mockResolveSession.mockResolvedValueOnce({ authenticated: false, user: null });

    // Token generated for evidence-OTHER, used to access evidence-123
    const foreignToken = generateEvidenceAccessToken("evidence-OTHER", "complaint-456", 300);
    const req = new NextRequest(
      `http://localhost:3000/api/evidence/evidence-123?evidenceToken=${encodeURIComponent(foreignToken)}`
    );
    const response = await GET(req, { params: Promise.resolve({ id: "evidence-123" }) });

    expect(response.status).toBe(403);
  });

  it("returns 404 when evidence record does not exist in database", async () => {
    mockFindUniqueEvidence.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/evidence/non-existent-id");
    const response = await GET(req, { params: Promise.resolve({ id: "non-existent-id" }) });

    expect(response.status).toBe(404);
  });
});