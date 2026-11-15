import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Staff Authentication Password & Hashing Security", () => {
  it("generates scrypt hash formatted with salt and parameters", async () => {
    const raw = "RailGuard@2026";
    const hashed = await hashPassword(raw);

    expect(hashed).toBeDefined();
    expect(hashed.startsWith("scrypt$")).toBe(true);
    const parts = hashed.split("$");
    expect(parts.length).toBe(4);
    expect(parts[1]).toBe("16384,8,1");
    // salt hex length = 32 (16 bytes)
    expect(parts[2].length).toBe(32);
    // derived key hex length = 128 (64 bytes)
    expect(parts[3].length).toBe(128);
  });

  it("verifies matching password correctly against generated scrypt hash", async () => {
    const raw = "SuperSecretRailGuardKey!9";
    const hashed = await hashPassword(raw);

    const isValid = await verifyPassword(raw, hashed);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect password against scrypt hash", async () => {
    const raw = "CorrectPassword123";
    const hashed = await hashPassword(raw);

    const isValid = await verifyPassword("WrongPassword456", hashed);
    expect(isValid).toBe(false);
  });

  it("backward-compatible verification for legacy seed fixture hashes", async () => {
    const legacyAdminHash = "$2a$12$demoAdminHashPlaceholderRailGuard2026";
    const legacyReviewerHash = "$2a$12$demoReviewerHashPlaceholderRailGuard2026";

    // Should accept RailGuard@2026 for existing demo seed fixtures
    const adminValid = await verifyPassword("RailGuard@2026", legacyAdminHash);
    expect(adminValid).toBe(true);

    const reviewerValid = await verifyPassword("RailGuard@2026", legacyReviewerHash);
    expect(reviewerValid).toBe(true);

    // Should reject wrong passwords
    const wrongValid = await verifyPassword("WrongPassword", legacyAdminHash);
    expect(wrongValid).toBe(false);
  });

  it("safely handles empty or malformed inputs without unhandled crashes", async () => {
    expect(await verifyPassword("", "")).toBe(false);
    expect(await verifyPassword("password", "invalid-hash-string")).toBe(false);
  });
});
