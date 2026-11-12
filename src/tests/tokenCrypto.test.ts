import { describe, it, expect } from "vitest";
import {
  generateTrackingToken,
  hashTrackingToken,
  verifyTrackingToken,
  generateEvidenceAccessToken,
  verifyEvidenceAccessToken,
} from "@/lib/crypto/token";

describe("Tracking Token Cryptography", () => {
  it("generates 32-character hexadecimal tracking tokens", () => {
    const token = generateTrackingToken();
    expect(token).toHaveLength(32);
    expect(/^[A-F0-9]{32}$/.test(token)).toBe(true);
  });

  it("produces deterministic SHA-256 hash for identical tokens", () => {
    const token = "TOKEN-DEMO-TEST-1234567890ABCDEF";
    const hash1 = hashTrackingToken(token);
    const hash2 = hashTrackingToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it("handles case-insensitivity and whitespace trimming gracefully", () => {
    const token = "token-demo-test-1234567890abcdef";
    const hash1 = hashTrackingToken(token);
    const hash2 = hashTrackingToken("  TOKEN-DEMO-TEST-1234567890ABCDEF  ");
    expect(hash1).toBe(hash2);
  });

  it("verifies valid tokens and rejects invalid tokens", () => {
    const token = generateTrackingToken();
    const hash = hashTrackingToken(token);

    expect(verifyTrackingToken(token, hash)).toBe(true);
    expect(verifyTrackingToken("WRONG-TOKEN-VALUE-1234567890", hash)).toBe(false);
  });
});

describe("Short-Lived Evidence Access Token Security", () => {
  const evidenceId = "ev-123-uuid";
  const complaintId = "complaint-456-uuid";

  it("generates a valid evidence access token and verifies it", () => {
    const token = generateEvidenceAccessToken(evidenceId, complaintId, 300);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const isValid = verifyEvidenceAccessToken(token, evidenceId, complaintId);
    expect(isValid).toBe(true);
  });

  it("rejects token when evidenceId does not match (cross-evidence authorization defense)", () => {
    const token = generateEvidenceAccessToken(evidenceId, complaintId, 300);
    const isValid = verifyEvidenceAccessToken(token, "different-evidence-id", complaintId);
    expect(isValid).toBe(false);
  });

  it("rejects token when complaintId does not match (cross-complaint isolation)", () => {
    const token = generateEvidenceAccessToken(evidenceId, complaintId, 300);
    const isValid = verifyEvidenceAccessToken(token, evidenceId, "different-complaint-id");
    expect(isValid).toBe(false);
  });

  it("rejects expired evidence access tokens", () => {
    // Generate token that expired 1 second ago (-1s)
    const token = generateEvidenceAccessToken(evidenceId, complaintId, -1);
    const isValid = verifyEvidenceAccessToken(token, evidenceId, complaintId);
    expect(isValid).toBe(false);
  });

  it("rejects tampered or malformed evidence access tokens", () => {
    const validToken = generateEvidenceAccessToken(evidenceId, complaintId, 300);
    const tampered = validToken.slice(0, -4) + "AAAA";
    expect(verifyEvidenceAccessToken(tampered, evidenceId, complaintId)).toBe(false);
    expect(verifyEvidenceAccessToken("not:a:valid:token", evidenceId, complaintId)).toBe(false);
    expect(verifyEvidenceAccessToken("", evidenceId, complaintId)).toBe(false);
  });
});
