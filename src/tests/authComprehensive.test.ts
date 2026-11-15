import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/sessionToken";

// ── Mock Prisma ──
const mockFindUniqueUser = vi.fn();
const mockFindFirstUser = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUniqueUser(...args),
      findFirst: (...args: unknown[]) => mockFindFirstUser(...args),
    },
  },
}));

import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { resolveSession, requireAdmin, requireReviewer } from "@/lib/auth/session";
import { NextRequest } from "next/server";

describe("Staff Authentication Security Suite — 10 Required Scenarios", () => {
  const reviewerPassword = "InspectionReviewer#2026";
  const adminPassword = "DirectorAdmin#2026";

  const reviewerUser = {
    id: "user-reviewer-123",
    email: "reviewer@railguard.gov.in",
    name: "Priya Sharma",
    role: UserRole.QUALITY_REVIEWER,
    passwordHash: hashPassword(reviewerPassword),
  };

  const adminUser = {
    id: "user-admin-456",
    email: "director@railguard.gov.in",
    name: "Rajesh Kumar",
    role: UserRole.ADMIN,
    passwordHash: hashPassword(adminPassword),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Scenario 1: Valid authorized reviewer login ──
  it("Scenario 1: allows valid authorized reviewer login with signed session cookie", async () => {
    mockFindUniqueUser.mockResolvedValueOnce(reviewerUser);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: reviewerUser.email,
        password: reviewerPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe(UserRole.QUALITY_REVIEWER);
    expect(data.user.email).toBe(reviewerUser.email);

    // Verify session cookie set with secure flags
    const cookieHeader = res.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain("railguard_session=");
    expect(cookieHeader?.toLowerCase()).toContain("httponly");
    expect(cookieHeader?.toLowerCase()).toContain("samesite=lax");
  });

  // ── Scenario 2: Valid administrator login ──
  it("Scenario 2: allows valid administrator login with ADMIN role privileges", async () => {
    mockFindUniqueUser.mockResolvedValueOnce(adminUser);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminUser.email,
        password: adminPassword,
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe(UserRole.ADMIN);
    expect(data.user.email).toBe(adminUser.email);
  });

  // ── Scenario 3: Incorrect password ──
  it("Scenario 3: rejects incorrect password with generic error without revealing existence", async () => {
    mockFindUniqueUser.mockResolvedValueOnce(reviewerUser);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: reviewerUser.email,
        password: "CompletelyWrongPassword!",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("Invalid staff credentials or account not recognized.");
  });

  // ── Scenario 4: Unknown email address ──
  it("Scenario 4: rejects unknown email with identical generic error to prevent account enumeration", async () => {
    mockFindUniqueUser.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.officer@railway.gov.in",
        password: "SomePassword123",
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("Invalid staff credentials or account not recognized.");
  });

  // ── Scenario 5: Empty form submission ──
  it("Scenario 5: rejects empty form submissions with 400 Bad Request", async () => {
    const emptyPayloads = [
      {},
      { email: "", password: "" },
      { email: "reviewer@railway.gov.in", password: "" },
      { email: "not-an-email", password: "password123" },
    ];

    for (const body of emptyPayloads) {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const res = await loginHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    }
  });

  // ── Scenario 6: Unauthenticated access to staff dashboard ──
  it("Scenario 6: denies unauthenticated access to staff dashboard endpoints", async () => {
    const unauthenticatedReq = new NextRequest("http://localhost:3000/dashboard");

    const sessionResult = await resolveSession(unauthenticatedReq);
    expect(sessionResult.authenticated).toBe(false);
    expect(sessionResult.user).toBeNull();

    const guardResult = await requireReviewer(unauthenticatedReq);
    expect(guardResult.authorized).toBe(false);
    expect(guardResult.statusCode).toBe(401);
  });

  // ── Scenario 7: Reviewer attempting administrator-only actions ──
  it("Scenario 7: strictly forbids Quality Reviewer from performing admin-only operations (403)", async () => {
    const reviewerToken = createSessionToken({
      id: reviewerUser.id,
      email: reviewerUser.email,
      role: UserRole.QUALITY_REVIEWER,
    });

    mockFindUniqueUser.mockResolvedValueOnce(reviewerUser);

    const req = new NextRequest("http://localhost:3000/api/complaints/123/delete", {
      headers: {
        cookie: `railguard_session=${reviewerToken}`,
      },
    });

    const adminGuardResult = await requireAdmin(req);
    expect(adminGuardResult.authorized).toBe(false);
    expect(adminGuardResult.statusCode).toBe(403);
    expect(adminGuardResult.error).toContain("Administrator role required");
  });

  // ── Scenario 8: Session expiration ──
  it("Scenario 8: rejects expired session tokens and revokes access", async () => {
    // Generate token with negative TTL (already expired)
    const expiredToken = createSessionToken(
      {
        id: reviewerUser.id,
        email: reviewerUser.email,
        role: UserRole.QUALITY_REVIEWER,
      },
      -1000 // Expired 1 second ago
    );

    expect(verifySessionToken(expiredToken)).toBeNull();

    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: `railguard_session=${expiredToken}`,
      },
    });

    const sessionResult = await resolveSession(req);
    expect(sessionResult.authenticated).toBe(false);
    expect(sessionResult.error).toContain("expired");
  });

  // ── Scenario 9: Logout and subsequent protected-page access ──
  it("Scenario 9: invalidates session on logout and blocks subsequent protected access", async () => {
    const logoutRes = await logoutHandler();
    expect(logoutRes.status).toBe(200);

    const cookieHeader = logoutRes.headers.get("set-cookie");
    expect(cookieHeader).toBeDefined();
    // Cookie cleared with max-age=0
    expect(cookieHeader).toContain("Max-Age=0");

    // Subsequent access without cookie is blocked
    const subsequentReq = new NextRequest("http://localhost:3000/dashboard");
    const sessionResult = await resolveSession(subsequentReq);
    expect(sessionResult.authenticated).toBe(false);
  });

  // ── Scenario 10: Repeated failed login attempts rate limiting ──
  it("Scenario 10: rate limits repeated failed login attempts from the same IP (429)", async () => {
    mockFindUniqueUser.mockResolvedValue(null);

    const testIp = "192.168.100.42";
    let lastResponse: Response | null = null;

    // Send 11 rapid requests from the same IP
    for (let i = 0; i < 11; i++) {
      const req = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          email: "target@railway.gov.in",
          password: `WrongPassword${i}`,
        }),
      });

      lastResponse = await loginHandler(req);
    }

    expect(lastResponse).not.toBeNull();
    expect(lastResponse?.status).toBe(429);
    const data = await lastResponse?.json();
    expect(data.code).toBe("RATE_LIMITED");
    expect(data.error).toContain("Too many login attempts");
  });
});
