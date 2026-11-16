import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UserRole } from "@prisma/client";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      user = {
        findUnique: (...args: unknown[]) => mockFindUnique(...args),
        create: (...args: unknown[]) => mockCreate(...args),
      };
      $disconnect = vi.fn();
    },
    UserRole: {
      ADMIN: "ADMIN",
      QUALITY_REVIEWER: "QUALITY_REVIEWER",
    },
  };
});

import { bootstrapStaffAccounts } from "../../scripts/bootstrapStaff";

describe("Staff Headless Bootstrap Engine (bootstrapStaff)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("skips auto-provision when environment variables are not configured", async () => {
    delete process.env.INITIAL_ADMIN_EMAIL;
    delete process.env.INITIAL_ADMIN_PASSWORD;
    delete process.env.INITIAL_REVIEWER_EMAIL;
    delete process.env.INITIAL_REVIEWER_PASSWORD;

    const res = await bootstrapStaffAccounts(false);
    expect(res.provisionedCount).toBe(0);
    expect(res.skippedCount).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("preserves existing staff accounts and does not overwrite passwords", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "admin@railguard.gov.in";
    process.env.INITIAL_ADMIN_PASSWORD = "AdminPassword#2026";

    mockFindUnique.mockResolvedValueOnce({
      id: "existing-admin-id",
      email: "admin@railguard.gov.in",
      role: UserRole.ADMIN,
      passwordHash: "existing-hash",
    });

    const res = await bootstrapStaffAccounts(false);
    expect(res.skippedCount).toBe(1);
    expect(res.provisionedCount).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("safely provisions new admin and reviewer accounts when valid credentials provided", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "admin@railguard.gov.in";
    process.env.INITIAL_ADMIN_PASSWORD = "AdminPassword#2026";
    process.env.INITIAL_REVIEWER_EMAIL = "reviewer@railguard.gov.in";
    process.env.INITIAL_REVIEWER_PASSWORD = "ReviewerPassword#2026";

    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockImplementation(({ data }: { data: unknown }) =>
      Promise.resolve({ id: "new-user-id", ...(data as object) })
    );

    const res = await bootstrapStaffAccounts(false);
    expect(res.provisionedCount).toBe(2);
    expect(res.skippedCount).toBe(0);
    expect(mockCreate).toHaveBeenCalledTimes(2);

    const firstCallData = mockCreate.mock.calls[0][0].data;
    expect(firstCallData.email).toBe("admin@railguard.gov.in");
    expect(firstCallData.role).toBe(UserRole.ADMIN);
    expect(firstCallData.passwordHash.startsWith("scrypt$")).toBe(true);

    const secondCallData = mockCreate.mock.calls[1][0].data;
    expect(secondCallData.email).toBe("reviewer@railguard.gov.in");
    expect(secondCallData.role).toBe(UserRole.QUALITY_REVIEWER);
    expect(secondCallData.passwordHash.startsWith("scrypt$")).toBe(true);
  });

  it("supports dryRun mode without executing database inserts", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "admin@railguard.gov.in";
    process.env.INITIAL_ADMIN_PASSWORD = "AdminPassword#2026";

    mockFindUnique.mockResolvedValue(null);

    const res = await bootstrapStaffAccounts(true);
    expect(res.provisionedCount).toBe(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
