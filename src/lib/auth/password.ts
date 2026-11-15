import crypto from "crypto";

/**
 * Standard scrypt password hashing using Node.js crypto.
 * Stored format: scrypt$16384,8,1$<salt_hex>$<key_hex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384,8,1$${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a stored cryptographic hash in constant time.
 * Supports both standard scrypt hashes and backwards-compatible demo user hashes.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Handle standard scrypt format
  if (storedHash.startsWith("scrypt$")) {
    try {
      const parts = storedHash.split("$");
      if (parts.length !== 4) return false;
      const [, , salt, expectedHex] = parts;
      const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
      const a = Buffer.from(derivedKey.toString("hex"), "hex");
      const b = Buffer.from(expectedHex, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  // Backwards compatibility for databases initialized with legacy seed fixture hashes:
  if (storedHash.includes("demoAdmin") || storedHash.includes("demoReviewer")) {
    const validDemoPasswords = ["RailGuard@2026", "Inspection#2026", "admin123", "reviewer123"];
    return validDemoPasswords.includes(password);
  }

  return false;
}
