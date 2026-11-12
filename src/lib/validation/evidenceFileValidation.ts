export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
  extension?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates an uploaded evidence file against size limits and binary magic number signatures.
 * Rejects disguised or malicious file extensions.
 */
export function validateEvidenceBuffer(
  buffer: Buffer,
  declaredMimeType: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fileName: string
): FileValidationResult {
  // 1. File Size Check
  if (buffer.length === 0) {
    return { valid: false, error: "File is empty" };
  }
  if (buffer.length > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds 5MB maximum limit" };
  }

  // 2. Binary Magic Number Signature Verification
  // JPEG: Starts with FF D8 FF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, detectedMime: "image/jpeg", extension: ".jpg" };
  }

  // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png", extension: ".png" };
  }

  // WebP: Starts with 'RIFF' (0-3) and 'WEBP' (8-11)
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { valid: true, detectedMime: "image/webp", extension: ".webp" };
  }

  return {
    valid: false,
    error: `Unsupported file format. Only JPEG, PNG, and WebP images with valid binary signatures are permitted. Declared: ${declaredMimeType}`,
  };
}
