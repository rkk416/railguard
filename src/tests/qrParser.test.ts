import { describe, it, expect } from "vitest";
import { parseQrContent } from "@/lib/qr/parser";

describe("RailGuard QR Content Parser & Sanitizer", () => {
  it("successfully parses valid raw identifiers", () => {
    const rawIds = [
      "DEMO-THALI-ACTIVE-001",
      "DEMO-WATER-ACTIVE-002",
      "DEMO-BREAKFAST-EXPIRED-003",
      "DEMO-BIRYANI-RECALLED-004",
      "BATCH_2026.04A",
      "IR-NDLS-12951-P9",
    ];

    for (const id of rawIds) {
      const res = parseQrContent(id);
      expect(res.valid).toBe(true);
      expect(res.identifier).toBe(id);
      expect(res.sourceType).toBe("raw_identifier");
    }
  });

  it("extracts identifier from canonical RailGuard report URLs (?p=...)", () => {
    const urls = [
      "https://railguard.render.com/report?p=DEMO-THALI-ACTIVE-001",
      "http://localhost:3000/report?p=DEMO-WATER-ACTIVE-002",
      "/report?p=DEMO-BREAKFAST-EXPIRED-003",
      "https://railguard.gov.in/report?qr=DEMO-BIRYANI-RECALLED-004",
    ];

    const expected = [
      "DEMO-THALI-ACTIVE-001",
      "DEMO-WATER-ACTIVE-002",
      "DEMO-BREAKFAST-EXPIRED-003",
      "DEMO-BIRYANI-RECALLED-004",
    ];

    urls.forEach((url, i) => {
      const res = parseQrContent(url);
      expect(res.valid).toBe(true);
      expect(res.identifier).toBe(expected[i]);
      expect(res.sourceType).toBe("railguard_report_url");
    });
  });

  it("extracts identifier from canonical RailGuard product verification URLs (/products/...)", () => {
    const urls = [
      "https://railguard.render.com/products/DEMO-THALI-ACTIVE-001",
      "http://localhost:3000/products/DEMO-WATER-ACTIVE-002",
      "/products/DEMO-BREAKFAST-EXPIRED-003",
    ];

    const expected = [
      "DEMO-THALI-ACTIVE-001",
      "DEMO-WATER-ACTIVE-002",
      "DEMO-BREAKFAST-EXPIRED-003",
    ];

    urls.forEach((url, i) => {
      const res = parseQrContent(url);
      expect(res.valid).toBe(true);
      expect(res.identifier).toBe(expected[i]);
      expect(res.sourceType).toBe("railguard_product_url");
    });
  });

  it("rejects empty, null, or whitespace inputs", () => {
    expect(parseQrContent("").valid).toBe(false);
    expect(parseQrContent("   ").valid).toBe(false);
    expect(parseQrContent(null).valid).toBe(false);
    expect(parseQrContent(undefined).valid).toBe(false);
  });

  it("rejects untrusted external URLs without RailGuard paths", () => {
    const evilUrls = [
      "https://malicious-phishing.com/steal-login",
      "https://google.com/search?q=food",
      "http://attacker.site/report-issue",
    ];

    for (const url of evilUrls) {
      const res = parseQrContent(url);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Unrecognized QR code destination");
    }
  });

  it("rejects malformed raw identifiers with script tags or invalid characters", () => {
    const malformed = [
      "<script>alert(1)</script>",
      "DEMO THALI WITH SPACES",
      "ID; DROP TABLE users;--",
      "X", // too short (<3)
      "a".repeat(101), // too long (>100)
    ];

    for (const item of malformed) {
      const res = parseQrContent(item);
      expect(res.valid).toBe(false);
    }
  });
});
