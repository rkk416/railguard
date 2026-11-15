import crypto from "crypto";
import { UserRole } from "@prisma/client";

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  issuedAt: number;
  expiresAt: number;
}

const DEFAULT_SECRET = "railguard-auth-signing-key-fallback-min-32chars";

function getSecret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Default TTL is 12 hours.
 */
export function createSessionToken(
  user: { id: string; email: string; role: UserRole },
  ttlMs = 12 * 60 * 60 * 1000
): string {
  const now = Date.now();
  const payload: SessionTokenPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    issuedAt: now,
    expiresAt: now + ttlMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Validates a session token's cryptographic signature and expiration.
 * Returns the decoded payload if valid and unexpired; otherwise returns null.
 */
export function verifySessionToken(token: string | undefined | null): SessionTokenPayload | null {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload: SessionTokenPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    );

    if (!payload.userId || !payload.email || !payload.role || !payload.expiresAt) {
      return null;
    }

    if (Date.now() > payload.expiresAt) {
      return null; // Expired session
    }

    return payload;
  } catch {
    return null;
  }
}
