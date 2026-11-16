"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Search,
  X,
  ExternalLink,
  Camera,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { CameraQrScanner } from "@/components/qr/CameraQrScanner";

export interface PackagingUnitItem {
  id: string;
  qrCodeIdentifier: string;
  batchNumber: string;
  status: "ACTIVE" | "EXPIRED" | "RECALLED";
  packagingDate: string;
  expiryDate: string;
  product: {
    id: string;
    name: string;
    category: string;
    fssaiLicense: string;
    shelfLifeHours: number;
  };
  vendor: {
    id: string;
    name: string;
    code: string;
    licenseNumber: string;
  };
}

interface PackagingRegistryTableProps {
  initialUnits: PackagingUnitItem[];
}

export function PackagingRegistryTable({ initialUnits }: PackagingRegistryTableProps) {
  const [units] = useState<PackagingUnitItem[]>(initialUnits);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUnit, setSelectedUnit] = useState<PackagingUnitItem | null>(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrTargetUrl, setQrTargetUrl] = useState<string | null>(null);

  // Camera Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerNotification, setScannerNotification] = useState<string | null>(null);

  // Filter units
  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.qrCodeIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Open QR modal and fetch high-res generated QR code
  const handleOpenQrModal = async (unit: PackagingUnitItem) => {
    setSelectedUnit(unit);
    setQrModalOpen(true);
    setIsGeneratingQr(true);
    setQrDataUrl(null);
    setQrTargetUrl(null);

    try {
      const res = await fetch("/api/staff/packaging/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: unit.qrCodeIdentifier }),
      });

      const data = await res.json();
      if (res.ok && data.dataUrl) {
        setQrDataUrl(data.dataUrl);
        setQrTargetUrl(data.targetUrl);
      }
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Trigger print dialog
  const handlePrintLabel = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Trigger download of QR PNG image
  const handleDownloadPng = () => {
    if (!qrDataUrl || !selectedUnit) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `RailGuard-QR-${selectedUnit.qrCodeIdentifier}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle camera scan test inside dashboard
  const handleScanSuccess = (identifier: string) => {
    setSearchTerm(identifier);
    setScannerNotification(`Recognized batch: ${identifier}`);
    setTimeout(() => setScannerNotification(null), 4000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{ backgroundColor: "#f2f7f5", color: "var(--jade)", border: "1px solid #c2d9d2" }}
          >
            <ShieldCheck className="w-3 h-3" />
            ACTIVE
          </span>
        );
      case "EXPIRED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{ backgroundColor: "#fdf8ee", color: "var(--brass)", border: "1px solid #ebd7a9" }}
          >
            <AlertTriangle className="w-3 h-3" />
            EXPIRED
          </span>
        );
      case "RECALLED":
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{ backgroundColor: "#fbf2ef", color: "var(--signal-red)", border: "1px solid #ecc8be" }}
          >
            <AlertOctagon className="w-3 h-3" />
            RECALLED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div
        className="p-4 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: "var(--ink-faint)" }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search QR, product, batch..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded border focus:outline-none"
            style={{
              backgroundColor: "var(--archive-paper)",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono rounded border focus:outline-none"
            style={{
              backgroundColor: "var(--archive-paper)",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            <option value="ALL">All Statuses ({units.length})</option>
            <option value="ACTIVE">Active Units</option>
            <option value="EXPIRED">Expired Units</option>
            <option value="RECALLED">Recalled Units</option>
          </select>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-1.5 rounded text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ backgroundColor: "var(--jade)" }}
            title="Scan packaging QR code with camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Test Scanner</span>
          </button>
        </div>
      </div>

      {scannerNotification && (
        <div className="p-2.5 rounded text-xs border flex items-center gap-2 bg-emerald-50 text-emerald-800 border-emerald-300 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{scannerNotification}</span>
        </div>
      )}

      {/* Registry Table */}
      <div
        className="rounded-lg border overflow-hidden shadow-xs"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr
                className="border-b font-mono text-[11px] uppercase tracking-wider"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--ink-faint)",
                }}
              >
                <th className="py-2.5 px-4 font-semibold">QR Identifier</th>
                <th className="py-2.5 px-4 font-semibold">Food Product</th>
                <th className="py-2.5 px-4 font-semibold">Pantry Caterer / Kitchen</th>
                <th className="py-2.5 px-4 font-semibold">Batch No.</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Expiry Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--paper-mid)" }}>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold" style={{ color: "var(--rail-ink)" }}>
                      <div className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--jade)" }} />
                        <span>{u.qrCodeIdentifier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold" style={{ color: "var(--rail-ink)" }}>
                        {u.product.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {u.product.category} • Lic: {u.product.fssaiLicense}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{u.vendor.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">Code: {u.vendor.code}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.batchNumber}</td>
                    <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {new Date(u.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQrModal(u)}
                          className="px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1 transition-colors hover:bg-slate-100 cursor-pointer"
                          style={{
                            borderColor: "var(--paper-mid)",
                            color: "var(--rail-ink)",
                          }}
                          title="Generate & view printable QR code label"
                        >
                          <QrCode className="w-3 h-3 text-emerald-700" />
                          <span>QR Label</span>
                        </button>

                        <Link
                          href={`/products/${encodeURIComponent(u.qrCodeIdentifier)}`}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 transition-colors"
                          title="View public inspection page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-mono text-slate-500">
                    No packaging records found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable QR Label Modal */}
      {qrModalOpen && selectedUnit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
        >
          <div
            className="w-full max-w-md rounded-xl overflow-hidden border shadow-2xl bg-white"
            style={{ borderColor: "var(--paper-mid)" }}
          >
            {/* Modal Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{
                backgroundColor: "var(--rail-ink)",
                color: "var(--archive-paper)",
              }}
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs font-mono uppercase tracking-wider">
                  Official Packaging Label Certificate
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Label Card */}
            <div id="printable-qr-label" className="p-6 flex flex-col items-center text-center">
              <div
                className="w-full border-2 border-dashed p-4 rounded-lg bg-amber-50/40 relative mb-4"
                style={{ borderColor: "var(--paper-mid)" }}
              >
                {/* Railway Inspection Header */}
                <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-500 mb-1">
                  Indian Railways Quality Oversite • Packaging Batch
                </div>
                <div className="text-sm font-bold font-serif mb-2" style={{ color: "var(--rail-ink)" }}>
                  {selectedUnit.product.name}
                </div>

                {/* QR Code Display */}
                <div className="flex justify-center my-3 min-h-[180px] items-center">
                  {isGeneratingQr ? (
                    <div className="flex flex-col items-center gap-2 text-xs font-mono text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Generating QR barcode...</span>
                    </div>
                  ) : qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt={`QR code for ${selectedUnit.qrCodeIdentifier}`}
                      width={180}
                      height={180}
                      unoptimized
                      className="border border-slate-300 rounded p-1.5 bg-white shadow-xs"
                    />
                  ) : (
                    <span className="text-xs text-rose-500">Failed to render QR barcode.</span>
                  )}
                </div>

                {/* Identifier Token */}
                <div
                  className="font-mono text-xs font-bold px-2 py-1 rounded inline-block mb-3 border"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                >
                  {selectedUnit.qrCodeIdentifier}
                </div>

                {/* Batch Specifications */}
                <div className="grid grid-cols-2 gap-2 text-left text-[11px] font-mono border-t pt-2 border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[9px]">BATCH NUMBER</span>
                    <span className="font-semibold text-slate-800">{selectedUnit.batchNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">STATUS</span>
                    {getStatusBadge(selectedUnit.status)}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">FSSAI LICENSE</span>
                    <span className="text-slate-700">{selectedUnit.product.fssaiLicense}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">EXPIRY DATE</span>
                    <span className="text-slate-700">
                      {new Date(selectedUnit.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 text-left text-[10px] font-mono text-slate-500">
                  Caterer: {selectedUnit.vendor.name} ({selectedUnit.vendor.code})
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={!qrDataUrl || isGeneratingQr}
                  className="flex-1 py-2 px-3 rounded text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                  style={{
                    backgroundColor: "var(--archive-paper)",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintLabel}
                  disabled={!qrDataUrl || isGeneratingQr}
                  className="flex-1 py-2 px-3 rounded text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: "var(--jade)" }}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Label</span>
                </button>
              </div>

              {qrTargetUrl && (
                <div className="mt-3 text-[10px] font-mono text-slate-400 truncate max-w-full">
                  Target: {qrTargetUrl}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real Optical Camera Scanner Modal */}
      <CameraQrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Inspector Verification Scanner"
        description="Scan any packaging QR label to instantly isolate its record"
      />
    </div>
  );
}
