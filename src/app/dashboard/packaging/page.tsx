import React from "react";
import { prisma } from "@/lib/db/prisma";
import { PackagingRegistryTable, PackagingUnitItem } from "@/components/dashboard/PackagingRegistryTable";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Packaging & QR Registry — RailGuard Control Room",
  description: "Official railway catering packaging units, QR codes, and batch certificates.",
};

export default async function PackagingRegistryPage() {
  let units: PackagingUnitItem[] = [];

  try {
    const rawUnits = await prisma.packagingUnit.findMany({
      include: {
        product: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    units = rawUnits.map((u) => ({
      id: u.id,
      qrCodeIdentifier: u.qrCodeIdentifier,
      batchNumber: u.batchNumber,
      status: u.status as "ACTIVE" | "EXPIRED" | "RECALLED",
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
  } catch (err) {
    console.error("[PackagingRegistryPage] Database query error:", err);
  }

  const activeCount = units.filter((u) => u.status === "ACTIVE").length;
  const expiredCount = units.filter((u) => u.status === "EXPIRED").length;
  const recalledCount = units.filter((u) => u.status === "RECALLED").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
              style={{
                backgroundColor: "rgba(82, 124, 114, 0.15)",
                borderColor: "rgba(82, 124, 114, 0.4)",
                color: "var(--jade)",
              }}
            >
              Quality Assurance Register
            </span>
            <span className="text-xs font-mono text-slate-500">• Section 22-B</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-serif" style={{ color: "var(--rail-ink)" }}>
            Packaging Units &amp; QR Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Official catering packaging inventory, active batch certificates, and cryptographic QR code generation for base kitchen dispatch.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded border bg-white text-center">
            <span className="block text-[10px] font-mono text-slate-400">TOTAL UNITS</span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--rail-ink)" }}>
              {units.length}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded border bg-emerald-50 text-center border-emerald-200">
            <span className="block text-[10px] font-mono text-emerald-600">ACTIVE</span>
            <span className="text-sm font-bold font-mono text-emerald-700">{activeCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded border bg-amber-50 text-center border-amber-200">
            <span className="block text-[10px] font-mono text-amber-600">EXPIRED</span>
            <span className="text-sm font-bold font-mono text-amber-700">{expiredCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded border bg-rose-50 text-center border-rose-200">
            <span className="block text-[10px] font-mono text-rose-600">RECALLED</span>
            <span className="text-sm font-bold font-mono text-rose-700">{recalledCount}</span>
          </div>
        </div>
      </div>

      {/* Main Table Component */}
      <PackagingRegistryTable initialUnits={units} />
    </div>
  );
}
