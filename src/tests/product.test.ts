import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildReportUrl, generateQrDataUrl, generateQrSvg } from "@/lib/qr/generator";
import { verifyPackagingUnit } from "@/services/productService";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type PackagingUnitPayload = Prisma.PackagingUnitGetPayload<{
  include: { product: { include: { vendor: true } } };
}>;

// Mock prisma client for unit test isolation
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    packagingUnit: {
      findUnique: vi.fn(),
    },
  },
}));

describe("QR Generator Utility Suite", () => {
  it("buildReportUrl creates expected URL with default and custom base URLs", () => {
    const urlDefault = buildReportUrl("DEMO-123", "http://localhost:3000");
    expect(urlDefault).toBe("http://localhost:3000/report?p=DEMO-123");

    const urlWithSlash = buildReportUrl("DEMO-BATCH 4", "https://railguard.test/");
    expect(urlWithSlash).toBe("https://railguard.test/report?p=DEMO-BATCH%204");
  });

  it("generateQrDataUrl outputs a valid base64 PNG data URL", async () => {
    const result = await generateQrDataUrl("TEST-QR-CODE", "https://railguard.test");
    expect(result.targetUrl).toBe("https://railguard.test/report?p=TEST-QR-CODE");
    expect(result.dataUrl).toContain("data:image/png;base64,");
  });

  it("generateQrSvg outputs a valid SVG string", async () => {
    const result = await generateQrSvg("TEST-QR-SVG", "https://railguard.test");
    expect(result.targetUrl).toBe("https://railguard.test/report?p=TEST-QR-SVG");
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
  });
});

describe("Product Service Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns UNRECOGNIZED when identifier is empty or whitespace", async () => {
    const result = await verifyPackagingUnit("   ");
    expect(result.status).toBe("UNRECOGNIZED");
    expect(result.isRecognized).toBe(false);
    expect(result.isDemonstrationData).toBe(true);
  });

  it("returns UNRECOGNIZED when identifier does not exist in registry", async () => {
    vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce(null);

    const result = await verifyPackagingUnit("NON-EXISTENT-ID-999");
    expect(result.status).toBe("UNRECOGNIZED");
    expect(result.isRecognized).toBe(false);
    expect(result.message).toContain("Unregistered packaging identifier");
  });

  it("returns VERIFIED for active, non-expired demonstration batch", async () => {
    const futureDate = new Date(Date.now() + 86400000); // +1 day
    const pastDate = new Date(Date.now() - 3600000); // -1 hour

    vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
      id: "pkg-1",
      productId: "prod-1",
      batchNumber: "BATCH-TEST-01",
      packagingDate: pastDate,
      expiryDate: futureDate,
      qrCodeIdentifier: "DEMO-ACTIVE-001",
      status: "ACTIVE",
      createdAt: pastDate,
      updatedAt: pastDate,
      product: {
        id: "prod-1",
        vendorId: "vnd-1",
        name: "Standard Thali",
        category: "MEAL_TRAY",
        fssaiLicense: "FSSAI-12345",
        standardPrice: null,
        shelfLifeHours: 12,
        createdAt: pastDate,
        updatedAt: pastDate,
        vendor: {
          id: "vnd-1",
          name: "Northern Pantry",
          code: "VND-001",
          contactEmail: "vendor@test.com",
          contactPhone: null,
          licenseNumber: "FSSAI-001",
          status: "ACTIVE",
          createdAt: pastDate,
          updatedAt: pastDate,
        },
      },
    } as unknown as PackagingUnitPayload);

    const result = await verifyPackagingUnit("DEMO-ACTIVE-001");
    expect(result.status).toBe("VERIFIED");
    expect(result.isRecognized).toBe(true);
    expect(result.product?.name).toBe("Standard Thali");
    expect(result.vendor?.name).toBe("Northern Pantry");
  });

  it("returns EXPIRED when packaging record is marked EXPIRED or date passed", async () => {
    const pastExpiry = new Date(Date.now() - 86400000); // -1 day

    vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
      id: "pkg-expired",
      productId: "prod-1",
      batchNumber: "BATCH-EXP-01",
      packagingDate: new Date(Date.now() - 172800000),
      expiryDate: pastExpiry,
      qrCodeIdentifier: "DEMO-EXP-001",
      status: "EXPIRED",
      createdAt: pastExpiry,
      updatedAt: pastExpiry,
      product: {
        id: "prod-1",
        vendorId: "vnd-1",
        name: "Idli Combo",
        category: "MEAL_TRAY",
        fssaiLicense: "FSSAI-12345",
        standardPrice: null,
        shelfLifeHours: 8,
        createdAt: pastExpiry,
        updatedAt: pastExpiry,
        vendor: {
          id: "vnd-1",
          name: "Western Pantry",
          code: "VND-002",
          contactEmail: "vendor@test.com",
          contactPhone: null,
          licenseNumber: "FSSAI-002",
          status: "ACTIVE",
          createdAt: pastExpiry,
          updatedAt: pastExpiry,
        },
      },
    } as unknown as PackagingUnitPayload);

    const result = await verifyPackagingUnit("DEMO-EXP-001");
    expect(result.status).toBe("EXPIRED");
    expect(result.isRecognized).toBe(true);
    expect(result.message).toContain("exceeded its recorded expiry date");
  });

  it("returns RECALLED when packaging unit status is RECALLED", async () => {
    const futureDate = new Date(Date.now() + 86400000);

    vi.mocked(prisma.packagingUnit.findUnique).mockResolvedValueOnce({
      id: "pkg-recalled",
      productId: "prod-1",
      batchNumber: "BATCH-RECALL-01",
      packagingDate: new Date(),
      expiryDate: futureDate,
      qrCodeIdentifier: "DEMO-RECALL-001",
      status: "RECALLED",
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: "prod-1",
        vendorId: "vnd-1",
        name: "Veg Biryani",
        category: "MEAL_TRAY",
        fssaiLicense: "FSSAI-12345",
        standardPrice: null,
        shelfLifeHours: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        vendor: {
          id: "vnd-1",
          name: "Deccan Kitchen",
          code: "VND-003",
          contactEmail: "vendor@test.com",
          contactPhone: null,
          licenseNumber: "FSSAI-003",
          status: "UNDER_REVIEW",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    } as unknown as PackagingUnitPayload);

    const result = await verifyPackagingUnit("DEMO-RECALL-001");
    expect(result.status).toBe("RECALLED");
    expect(result.isRecognized).toBe(true);
    expect(result.message).toContain("RECALLED");
  });
});
