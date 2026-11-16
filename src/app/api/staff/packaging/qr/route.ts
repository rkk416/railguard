import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSession } from "@/lib/auth/session";
import { generateQrDataUrl, generateQrSvg } from "@/lib/qr/generator";
import { parseQrContent } from "@/lib/qr/parser";

export const dynamic = "force-dynamic";

/**
 * POST /api/staff/packaging/qr
 *
 * Secure staff-only endpoint to generate official high-resolution QR codes
 * for registered packaging units.
 *
 * Returns data URL (PNG) and vector SVG.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await resolveSession(req);
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { error: "Authentication required to generate staff QR labels." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { identifier } = body;

    const parsed = parseQrContent(identifier);
    if (!parsed.valid || !parsed.identifier) {
      return NextResponse.json(
        { error: parsed.error || "Valid packaging identifier is required." },
        { status: 400 }
      );
    }

    const unit = await prisma.packagingUnit.findUnique({
      where: { qrCodeIdentifier: parsed.identifier },
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        { error: "Packaging unit not found in database registry." },
        { status: 404 }
      );
    }

    // Resolve application base URL
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;

    // Generate PNG Data URL and SVG vector
    const [{ dataUrl, targetUrl }, { svg }] = await Promise.all([
      generateQrDataUrl(unit.qrCodeIdentifier, baseUrl),
      generateQrSvg(unit.qrCodeIdentifier, baseUrl),
    ]);

    return NextResponse.json({
      success: true,
      identifier: unit.qrCodeIdentifier,
      targetUrl,
      dataUrl,
      svg,
      unit: {
        id: unit.id,
        batchNumber: unit.batchNumber,
        status: unit.status,
        packagingDate: unit.packagingDate.toISOString(),
        expiryDate: unit.expiryDate.toISOString(),
        productName: unit.product.name,
        category: unit.product.category,
        fssaiLicense: unit.product.fssaiLicense,
        vendorName: unit.product.vendor.name,
        vendorCode: unit.product.vendor.code,
      },
    });
  } catch (error: unknown) {
    console.error("[POST /api/staff/packaging/qr] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR label for packaging unit." },
      { status: 500 }
    );
  }
}
