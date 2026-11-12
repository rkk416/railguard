import { describe, it, expect } from "vitest";
import { validateEvidenceBuffer } from "@/lib/validation/evidenceFileValidation";

describe("Evidence File Binary Magic Signature Validation", () => {
  it("approves valid JPEG binary buffer", () => {
    // JPEG header: FF D8 FF E0
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const result = validateEvidenceBuffer(jpegBuffer, "image/jpeg", "food_sample.jpg");
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/jpeg");
    expect(result.extension).toBe(".jpg");
  });

  it("approves valid PNG binary buffer", () => {
    // PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const result = validateEvidenceBuffer(pngBuffer, "image/png", "sample.png");
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/png");
    expect(result.extension).toBe(".png");
  });

  it("approves valid WebP binary buffer", () => {
    // WebP header: 'RIFF' + 4 bytes size + 'WEBP'
    const riff = Buffer.from("RIFF");
    const size = Buffer.from([0x00, 0x00, 0x00, 0x20]);
    const webp = Buffer.from("WEBP");
    const webpBuffer = Buffer.concat([riff, size, webp, Buffer.alloc(10)]);

    const result = validateEvidenceBuffer(webpBuffer, "image/webp", "sample.webp");
    expect(result.valid).toBe(true);
    expect(result.detectedMime).toBe("image/webp");
    expect(result.extension).toBe(".webp");
  });

  it("rejects malicious disguised text/script file with .jpg extension", () => {
    const fakeBuffer = Buffer.from("<html><script>alert('malicious')</script></html>");
    const result = validateEvidenceBuffer(fakeBuffer, "image/jpeg", "exploit.jpg");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Unsupported file format/i);
  });

  it("rejects files exceeding 5MB limit", () => {
    // 5MB + 1 byte
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    largeBuffer[0] = 0xff;
    largeBuffer[1] = 0xd8;
    largeBuffer[2] = 0xff;

    const result = validateEvidenceBuffer(largeBuffer, "image/jpeg", "huge.jpg");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/exceeds 5MB/i);
  });
});
