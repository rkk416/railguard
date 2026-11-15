import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import { validateRole } from "../../scripts/provisionStaff";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Staff Provisioning CLI Validation & Security", () => {
  it("strictly validates allowed roles: ADMIN and QUALITY_REVIEWER", () => {
    expect(validateRole("ADMIN")).toBe(UserRole.ADMIN);
    expect(validateRole("admin")).toBe(UserRole.ADMIN);
    expect(validateRole("1")).toBe(UserRole.ADMIN);

    expect(validateRole("QUALITY_REVIEWER")).toBe(UserRole.QUALITY_REVIEWER);
    expect(validateRole("reviewer")).toBe(UserRole.QUALITY_REVIEWER);
    expect(validateRole("2")).toBe(UserRole.QUALITY_REVIEWER);

    // Rejects unauthorized roles
    expect(validateRole("INSPECTOR")).toBeNull();
    expect(validateRole("SUPERUSER")).toBeNull();
    expect(validateRole("GUEST")).toBeNull();
    expect(validateRole("")).toBeNull();
  });

  it("hashes passwords with scrypt which matches the login verification algorithm", async () => {
    const rawPass = "MySecureAdminKey!2026";
    const hashed = hashPassword(rawPass);

    expect(hashed.startsWith("scrypt$")).toBe(true);

    // Verifies with login verification function
    const isLoginValid = verifyPassword(rawPass, hashed);
    expect(isLoginValid).toBe(true);

    const isWrongValid = verifyPassword("WrongPassword123", hashed);
    expect(isWrongValid).toBe(false);
  });
});
