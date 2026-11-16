import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/sessionToken";
import { NextRequest } from "next/server";

const mockFindUniqueUser = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUniqueUser(...args),
      update: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

import { POST as changePasswordHandler } from "@/app/api/auth/change-password/route";

describe("Staff Password Change API (/api/auth/change-password)", () => {
  const currentPassword = "CurrentPassword#2026";
  const staffUser = {
    id: "user-staff-789",
    email: "reviewer@railguard.gov.in",
    name: "RailGuard Quality Reviewer",
    role: UserRole.QUALITY_REVIEWER,
    passwordHash: hashPassword(currentPassword),
  };

  const validToken = createSessionToken({
    id: staffUser.id,
    email: staffUser.email,
    role: staffUser.role,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when request is not authenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "any",
        newPassword: "NewStrongPassword#2026",
      }),
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when current password is empty", async () => {
    mockFindUniqueUser.mockResolvedValue(staffUser);

    const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `railguard_session=${validToken}`,
      },
      body: JSON.stringify({
        currentPassword: "",
        newPassword: "NewStrongPassword#2026",
      }),
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Current password is required");
  });

  it("returns 400 when new password is fewer than 8 characters", async () => {
    mockFindUniqueUser.mockResolvedValue(staffUser);

    const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `railguard_session=${validToken}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: "short",
      }),
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("at least 8 characters");
  });

  it("returns 400 when current password verification fails", async () => {
    mockFindUniqueUser.mockResolvedValue(staffUser);

    const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `railguard_session=${validToken}`,
      },
      body: JSON.stringify({
        currentPassword: "IncorrectCurrentPassword#123",
        newPassword: "NewStrongPassword#2026",
      }),
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Current password verification failed");
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("successfully updates password and refreshes session cookie when valid", async () => {
    mockFindUniqueUser.mockResolvedValue(staffUser);
    mockUpdateUser.mockResolvedValue({ ...staffUser });

    const newPassword = "NewStrongPassword#2026";
    const req = new NextRequest("http://localhost:3000/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `railguard_session=${validToken}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword,
      }),
    });

    const res = await changePasswordHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify DB update called with scrypt hash
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    const updateArgs = mockUpdateUser.mock.calls[0][0];
    expect(updateArgs.where.id).toBe(staffUser.id);
    expect(updateArgs.data.passwordHash.startsWith("scrypt$")).toBe(true);

    // Verify cookie set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("railguard_session=");
  });
});
