import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseQrContent } from "@/lib/qr/parser";
import { verifyPackagingUnit } from "@/services/productService";
import { generateQrDataUrl, generateQrSvg } from "@/lib/qr/generator";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type PackagingPayload = Prisma.PackagingUnitGetPayload<{
  include: { product: { include: { vendor: true } } };
}>;

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    packagingUnit: {
      findUnique: vi.fn(),
    },
  },
}));

describe("QR Scanning & Product Verification Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("End-to-End QR Content & URL Extraction", () => {
    it("round-trips from generated QR code target URL to parsed identifier", async () => {
      const originalId = "DEMO-THALI-ACTIVE-001";
      const { targetUrl } = await generateQrDataUrl(originalId, "https://railguard.render.com");

      expect(targetUrl).toBe("https://railguard.render.com/report?p=DEMO-THALI-ACTIVE-001");

      const parsed = parseQrContent(targetUrl);
      expect(parsed.valid).toBe(true);
      expect(parsed.identifier).toBe(originalId);
      expect(parsed.sourceType).toBe("railguard_report_url");
    });

    it("round-trips vector SVG generated URL to parsed identifier", async () => {
      const originalId = "DEMO-WATER-ACTIVE-002";
      const { targetUrl, svg } = await generateQrSvg(originalId, "https://railguard.render.com");

      expect(svg).toContain("<svg");
      const parsed = parseQrContent(targetUrl);
      expect(parsed.valid).toBe(true);
      expect(parsed.identifier).toBe(originalId);
    });

    it("extracts identifier from /products/[id] direct scan URLs", () => {
      const url = "https://railguard.render.com/products/DEMO-BREAKFAST-EXPIRED-003";
      const parsed = parseQrContent(url);
      expect(parsed.valid).toBe(true);
      expect(parsed.identifier).toBe("DEMO-BREAKFAST-EXPIRED-003");
      expect(parsed.sourceType).toBe("railguard_product_url");
    });

    it("strictly rejects external URLs with malicious payloads", () => {
      const maliciousUrls = [
        "https://evil-phishing.com/report?p=DEMO-001",
        "https://attacker.com/products/DEMO-001",
        "https://google.com?token=123",
      ];

      for (const badUrl of maliciousUrls) {
        const parsed = parseQrContent(badUrl);
        expect(parsed.valid).toBe(false);
        expect(parsed.error).toContain("Unrecognized QR code destination");
      }
    });
  });

  describe("Product Verification against Database Records", () => {
    it("verifies active packaging unit when scanned as full URL", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 86400000);

      vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
        id: "pkg-1",
        productId: "prod-1",
        batchNumber: "BATCH-NR-01",
        packagingDate: now,
        expiryDate: futureDate,
        qrCodeIdentifier: "DEMO-THALI-ACTIVE-001",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
        product: {
          id: "prod-1",
          vendorId: "v-1",
          name: "Standard Veg Thali",
          category: "MEAL_TRAY",
          fssaiLicense: "FSSAI-12345",
          standardPrice: null,
          shelfLifeHours: 12,
          createdAt: now,
          updatedAt: now,
          vendor: {
            id: "v-1",
            name: "Northern Caterers",
            code: "VND-001",
            licenseNumber: "LIC-001",
            status: "ACTIVE",
            createdAt: now,
            updatedAt: now,
          },
        },
      } as unknown as PackagingPayload);

      // Verify passing full scanned URL directly to verification service
      const scannedUrl = "https://railguard.render.com/report?p=DEMO-THALI-ACTIVE-001";
      const result = await verifyPackagingUnit(scannedUrl);

      expect(result.status).toBe("VERIFIED");
      expect(result.isRecognized).toBe(true);
      expect(result.packagingUnit?.qrCodeIdentifier).toBe("DEMO-THALI-ACTIVE-001");
      expect(result.product?.name).toBe("Standard Veg Thali");
      expect(result.vendor?.name).toBe("Northern Caterers");
    });

    it("flags expired packaging batch accurately", async () => {
      const pastDate = new Date(Date.now() - 3600000);

      vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
        id: "pkg-exp",
        productId: "prod-1",
        batchNumber: "BATCH-EXP",
        packagingDate: new Date(Date.now() - 7200000),
        expiryDate: pastDate,
        qrCodeIdentifier: "DEMO-BREAKFAST-EXPIRED-003",
        status: "EXPIRED",
        createdAt: pastDate,
        updatedAt: pastDate,
        product: {
          name: "Idli Combo",
          category: "MEAL_TRAY",
          fssaiLicense: "FSSAI-001",
          shelfLifeHours: 8,
          vendor: {
            name: "Western Gourmet",
            code: "VND-002",
          },
        },
      } as unknown as PackagingPayload);

      const result = await verifyPackagingUnit("DEMO-BREAKFAST-EXPIRED-003");
      expect(result.status).toBe("EXPIRED");
      expect(result.message).toContain("exceeded its recorded expiry date");
    });

    it("flags recalled packaging batch accurately", async () => {
      const now = new Date();
      vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
        id: "pkg-recall",
        productId: "prod-1",
        batchNumber: "BATCH-REC",
        packagingDate: now,
        expiryDate: new Date(now.getTime() + 86400000),
        qrCodeIdentifier: "DEMO-BIRYANI-RECALLED-004",
        status: "RECALLED",
        createdAt: now,
        updatedAt: now,
        product: {
          name: "Veg Biryani",
          category: "MEAL_TRAY",
          fssaiLicense: "FSSAI-001",
          shelfLifeHours: 10,
          vendor: {
            name: "Southern Pantries",
            code: "VND-003",
          },
        },
      } as unknown as PackagingPayload);

      const result = await verifyPackagingUnit("DEMO-BIRYANI-RECALLED-004");
      expect(result.status).toBe("RECALLED");
      expect(result.message).toContain("RECALLED");
    });

    it("returns UNRECOGNIZED when database record is absent", async () => {
      vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce(null);

      const result = await verifyPackagingUnit("UNKNOWN-QR-999");
      expect(result.status).toBe("UNRECOGNIZED");
      expect(result.isRecognized).toBe(false);
      expect(result.message).toContain("Unregistered packaging identifier");
    });

    it("returns UNRECOGNIZED when identifier is invalid or empty", async () => {
      const resultEmpty = await verifyPackagingUnit("   ");
      expect(resultEmpty.status).toBe("UNRECOGNIZED");
      expect(resultEmpty.isRecognized).toBe(false);

      const resultMalformed = await verifyPackagingUnit("<script>bad</script>");
      expect(resultMalformed.status).toBe("UNRECOGNIZED");
      expect(resultMalformed.isRecognized).toBe(false);
    });
  });
});
