import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/staff/packaging
 *
 * Secure staff-only endpoint to list packaging units and their registered batches.
 * Requires authenticated Quality Reviewer or Admin session.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveSession(req);
    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { error: "Authentication required to access packaging registry." },
        { status: 401 }
      );
    }

    const units = await prisma.packagingUnit.findMany({
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = units.map((u) => ({
      id: u.id,
      qrCodeIdentifier: u.qrCodeIdentifier,
      batchNumber: u.batchNumber,
      status: u.status,
      packagingDate: u.packagingDate.toISOString(),
      expiryDate: u.expiryDate.toISOString(),
      product: {
        id: u.product.id,
        name: u.product.name,
        category: u.product.category,
        fssaiLicense: u.product.fssaiLicense,
        shelfLifeHours: u.product.shelfLifeHours,
      },
      vendor: {
        id: u.product.vendor.id,
        name: u.product.vendor.name,
        code: u.product.vendor.code,
        licenseNumber: u.product.vendor.licenseNumber,
      },
    }));

    return NextResponse.json({
      success: true,
      total: data.length,
      units: data,
    });
  } catch (error: unknown) {
    console.error("[GET /api/staff/packaging] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve packaging units from database." },
      { status: 500 }
    );
  }
}
