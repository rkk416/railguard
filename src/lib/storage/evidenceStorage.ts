import fs from "fs";
import path from "path";
import os from "os";

/**
 * Returns the resolved base storage directory for private evidence.
 * - On Vercel or AWS Lambda, the local filesystem outside /tmp is read-only (EROFS).
 * - In local development or persistent servers, falls back to ./evidence_storage
 *   or process.env.EVIDENCE_STORAGE_PATH if explicitly configured.
 */
export function getEvidenceBasePath(): string {
  if (process.env.EVIDENCE_STORAGE_PATH) {
    return path.resolve(process.env.EVIDENCE_STORAGE_PATH);
  }

  // Detect serverless execution environments (Vercel, AWS Lambda, Netlify)
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
    return path.join(os.tmpdir(), "railguard_evidence");
  }

  return path.resolve(process.cwd(), "evidence_storage");
}

export function getUploadsDir(): string {
  return path.join(getEvidenceBasePath(), "uploads");
}

export function getDemoDir(): string {
  return path.join(getEvidenceBasePath(), "demo");
}

export function ensureStorageDirectories(): void {
  const uploads = getUploadsDir();
  const demo = getDemoDir();

  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads, { recursive: true });
  }
  if (!fs.existsSync(demo)) {
    fs.mkdirSync(demo, { recursive: true });
  }
}
