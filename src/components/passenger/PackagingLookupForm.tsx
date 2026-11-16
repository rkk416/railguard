"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Camera,
  AlertCircle,
} from "lucide-react";
import { CameraQrScanner } from "@/components/qr/CameraQrScanner";
import { parseQrContent } from "@/lib/qr/parser";

export function PackagingLookupForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const processAndNavigate = (rawCode: string) => {
    setValidationError(null);
    const parsed = parseQrContent(rawCode);

    if (!parsed.valid || !parsed.identifier) {
      setValidationError(parsed.error || "Please enter a valid packaging QR identifier.");
      return;
    }

    setIdentifier(parsed.identifier);
    router.push(`/products/${encodeURIComponent(parsed.identifier)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      processAndNavigate(identifier);
    }
  };

  const handleQuickDemo = (demoId: string) => {
    setIdentifier(demoId);
    processAndNavigate(demoId);
  };

  const handleCameraScanSuccess = (scannedCode: string) => {
    setIdentifier(scannedCode);
    processAndNavigate(scannedCode);
  };

  return (
    <>
      <div
        className="w-full max-w-xl mx-auto rounded-lg border p-6 md:p-8"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
          boxShadow: "0 4px 20px rgba(37, 45, 43, 0.05)",
        }}
      >
        {/* Top Scanner CTA Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => {
              setValidationError(null);
              setIsScannerOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-xs cursor-pointer border hover:opacity-95"
            style={{
              backgroundColor: "var(--jade)",
              borderColor: "#3d5e56",
              color: "white",
            }}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Packaging QR Code (Camera)</span>
          </button>
        </div>

        {/* Divider with 'OR' badge */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="w-full border-t" style={{ borderColor: "var(--paper-mid)" }} />
          <span
            className="absolute px-3 text-[10px] font-mono uppercase tracking-widest bg-white"
            style={{ color: "var(--ink-faint)" }}
          >
            Or Manual Verification
          </span>
        </div>

        {/* Manual Identifier Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="qr-input"
              className="block text-xs font-mono font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--rail-ink)" }}
            >
              Packaging QR Identifier / Batch Token
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5" style={{ color: "var(--ink-faint)" }}>
                <QrCode className="w-5 h-5" />
              </div>
              <input
                id="qr-input"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. DEMO-THALI-ACTIVE-001"
                className="w-full pl-11 pr-28 py-3 rounded text-sm font-mono placeholder:text-slate-400 focus:outline-none transition-all border"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: validationError ? "var(--signal-red)" : "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
              <button
                type="submit"
                disabled={!identifier.trim()}
                className="absolute right-1.5 px-4 py-2 rounded text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
                style={{
                  backgroundColor: "var(--rail-ink)",
                  color: "var(--archive-paper)",
                }}
              >
                <span>Verify</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {validationError && (
              <div
                className="mt-2 text-xs p-2.5 rounded border flex items-center gap-2 animate-in fade-in"
                style={{
                  backgroundColor: "#fbf2ef",
                  borderColor: "#ecc8be",
                  color: "var(--signal-red)",
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
        </form>

        {/* Quick Test Demo Presets */}
        <div
          className="mt-6 pt-5 border-t"
          style={{ borderColor: "var(--paper-mid)" }}
        >
          <p
            className="text-xs font-mono font-medium mb-2.5"
            style={{ color: "var(--ink-muted)" }}
          >
            Quick Demo Registry Batches (Click to Test):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("DEMO-THALI-ACTIVE-001")}
              className="text-left px-3 py-2 rounded border transition-colors group cursor-pointer"
              style={{
                backgroundColor: "#f2f7f5",
                borderColor: "#c2d9d2",
              }}
            >
              <div
                className="flex items-center gap-1.5 font-semibold text-xs"
                style={{ color: "var(--jade)" }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Active Meal
              </div>
              <span
                className="block text-[11px] font-mono mt-0.5 truncate"
                style={{ color: "var(--ink-muted)" }}
              >
                DEMO-THALI-ACTIVE-001
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("DEMO-BREAKFAST-EXPIRED-003")}
              className="text-left px-3 py-2 rounded border transition-colors group cursor-pointer"
              style={{
                backgroundColor: "#fdf8ee",
                borderColor: "#ebd7a9",
              }}
            >
              <div
                className="flex items-center gap-1.5 font-semibold text-xs"
                style={{ color: "var(--brass)" }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Expired Batch
              </div>
              <span
                className="block text-[11px] font-mono mt-0.5 truncate"
                style={{ color: "var(--ink-muted)" }}
              >
                DEMO-BREAKFAST-EXPIRED
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("DEMO-BIRYANI-RECALLED-004")}
              className="text-left px-3 py-2 rounded border transition-colors group cursor-pointer"
              style={{
                backgroundColor: "#fbf2ef",
                borderColor: "#ecc8be",
              }}
            >
              <div
                className="flex items-center gap-1.5 font-semibold text-xs"
                style={{ color: "var(--signal-red)" }}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                Recalled Batch
              </div>
              <span
                className="block text-[11px] font-mono mt-0.5 truncate"
                style={{ color: "var(--ink-muted)" }}
              >
                DEMO-BIRYANI-RECALLED
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Optical Camera Scanner Modal */}
      <CameraQrScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </>
  );
}
