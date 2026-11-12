import crypto from "crypto";

/**
 * Generates a cryptographically random 32-character tracking token.
 * Shown to the passenger exactly once upon complaint submission.
 */
export function generateTrackingToken(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

/**
 * Computes the SHA-256 hash of a tracking token.
 * Only this hash is stored in the database (Complaint.trackingTokenHash).
 */
export function hashTrackingToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token.trim().toUpperCase())
    .digest("hex");
}

/**
 * Verifies a raw token against a stored SHA-256 hash in constant time.
 */
export function verifyTrackingToken(rawToken: string, storedHash: string): boolean {
  const computedHash = hashTrackingToken(rawToken);
  try {
    const a = Buffer.from(computedHash, "hex");
    const b = Buffer.from(storedHash, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const EVIDENCE_SECRET =
  process.env.EVIDENCE_TOKEN_SECRET ||
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  "railguard_evidence_signing_key_2026_demo";

/**
 * Generates a short-lived HMAC-signed evidence access token.
 * Valid for 15 minutes (900 seconds) by default.
 * Scoped strictly to the specific evidenceId and complaintId.
 */
export function generateEvidenceAccessToken(
  evidenceId: string,
  complaintId: string,
  expiresInSeconds: number = 900
): string {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const payload = `${evidenceId}:${complaintId}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", EVIDENCE_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

/**
 * Verifies a short-lived evidence access token against evidenceId and complaintId.
 * Performs constant-time HMAC comparison and validates expiration.
 */
export function verifyEvidenceAccessToken(
  token: string,
  evidenceId: string,
  complaintId: string
): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 4) return false;
    const [tokenEvidenceId, tokenComplaintId, expiresAtStr, signature] = parts;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false; // Expired
    }

    if (tokenEvidenceId !== evidenceId || tokenComplaintId !== complaintId) {
      return false; // Scoped to different evidence/complaint
    }

    const payload = `${tokenEvidenceId}:${tokenComplaintId}:${expiresAtStr}`;
    const expectedSig = crypto
      .createHmac("sha256", EVIDENCE_SECRET)
      .update(payload)
      .digest("hex");

    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expectedSig, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
