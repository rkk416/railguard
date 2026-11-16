import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserRole } from "@prisma/client";
import { createSessionToken } from "@/lib/auth/sessionToken";
import { NextRequest } from "next/server";

const mockFindManyPackaging = vi.fn();
const mockFindUniquePackaging = vi.fn();
const mockFindUniqueUser = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    packagingUnit: {
      findMany: (...args: unknown[]) => mockFindManyPackaging(...args),
      findUnique: (...args: unknown[]) => mockFindUniquePackaging(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockFindUniqueUser(...args),
    },
  },
}));

import { GET as getPackagingHandler } from "@/app/api/staff/packaging/route";
import { POST as generateQrHandler } from "@/app/api/staff/packaging/qr/route";

describe("Staff Packaging Management & QR Generation API", () => {
  const staffUser = {
    id: "staff-reviewer-01",
    email: "reviewer@railguard.gov.in",
    name: "RailGuard Quality Reviewer",
    role: UserRole.QUALITY_REVIEWER,
  };

  const validToken = createSessionToken(staffUser);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindUniqueUser.mockResolvedValue(staffUser);
  });

  describe("GET /api/staff/packaging", () => {
    it("returns 401 if request is unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/packaging");
      const res = await getPackagingHandler(req);
      expect(res.status).toBe(401);
    });

    it("returns packaging units list when authenticated as staff", async () => {
      const now = new Date();
      mockFindManyPackaging.mockResolvedValueOnce([
        {
          id: "pkg-1",
          qrCodeIdentifier: "DEMO-THALI-ACTIVE-001",
          batchNumber: "BATCH-NR-01",
          status: "ACTIVE",
          packagingDate: now,
          expiryDate: now,
          product: {
            id: "prod-1",
            name: "Standard Thali",
            category: "MEAL_TRAY",
            fssaiLicense: "FSSAI-001",
            shelfLifeHours: 12,
            vendor: {
              id: "v-1",
              name: "Northern Caterers",
              code: "VND-NR-001",
              licenseNumber: "LIC-001",
            },
          },
        },
      ]);

      const req = new NextRequest("http://localhost:3000/api/staff/packaging", {
        headers: {
          Cookie: `railguard_session=${validToken}`,
        },
      });

      const res = await getPackagingHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.total).toBe(1);
      expect(data.units[0].qrCodeIdentifier).toBe("DEMO-THALI-ACTIVE-001");
    });
  });

  describe("POST /api/staff/packaging/qr", () => {
    it("returns 401 if unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/packaging/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "DEMO-THALI-ACTIVE-001" }),
      });
      const res = await generateQrHandler(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 if identifier is missing or malformed", async () => {
      const req = new NextRequest("http://localhost:3000/api/staff/packaging/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `railguard_session=${validToken}`,
        },
        body: JSON.stringify({ identifier: "   " }),
      });
      const res = await generateQrHandler(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 if packaging unit does not exist in registry", async () => {
      mockFindUniquePackaging.mockResolvedValueOnce(null);

      const req = new NextRequest("http://localhost:3000/api/staff/packaging/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `railguard_session=${validToken}`,
        },
        body: JSON.stringify({ identifier: "NON-EXISTENT-UNIT" }),
      });
      const res = await generateQrHandler(req);
      expect(res.status).toBe(404);
    });

    it("generates scannable PNG dataUrl and SVG vector for valid unit", async () => {
      const now = new Date();
      mockFindUniquePackaging.mockResolvedValueOnce({
        id: "pkg-1",
        qrCodeIdentifier: "DEMO-THALI-ACTIVE-001",
        batchNumber: "BATCH-NR-01",
        status: "ACTIVE",
        packagingDate: now,
        expiryDate: now,
        product: {
          name: "Standard Thali",
          category: "MEAL_TRAY",
          fssaiLicense: "FSSAI-001",
          vendor: {
            name: "Northern Caterers",
            code: "VND-NR-001",
          },
        },
      });

      const req = new NextRequest("http://localhost:3000/api/staff/packaging/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `railguard_session=${validToken}`,
          Host: "railguard.internal",
        },
        body: JSON.stringify({ identifier: "DEMO-THALI-ACTIVE-001" }),
      });

      const res = await generateQrHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.identifier).toBe("DEMO-THALI-ACTIVE-001");
      expect(data.dataUrl).toContain("data:image/png;base64,");
      expect(data.svg).toContain("<svg");
      expect(data.targetUrl).toContain("/report?p=DEMO-THALI-ACTIVE-001");
    });
  });
});
