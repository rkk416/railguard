"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, ArrowRight, ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

export function PackagingLookupForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier.trim()) {
      router.push(`/products/${encodeURIComponent(identifier.trim())}`);
    }
  };

  const handleQuickDemo = (demoId: string) => {
    setIdentifier(demoId);
    router.push(`/products/${encodeURIComponent(demoId)}`);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="qr-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
          >
            Packaging QR Identifier / Batch Token
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400">
              <QrCode className="w-5 h-5" />
            </div>
            <input
              id="qr-input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. DEMO-THALI-ACTIVE-001"
              className="w-full pl-11 pr-32 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!identifier.trim()}
              className="absolute right-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            >
              Verify
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Quick Test Demo Presets */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-2.5">
          Simulated Demonstration Batches (Click to Test):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo("DEMO-THALI-ACTIVE-001")}
            className="text-left px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Active Meal
            </div>
            <span className="block text-[11px] font-mono text-emerald-700 mt-0.5 truncate">
              DEMO-THALI-ACTIVE-001
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo("DEMO-BREAKFAST-EXPIRED-003")}
            className="text-left px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Expired Batch
            </div>
            <span className="block text-[11px] font-mono text-amber-700 mt-0.5 truncate">
              DEMO-BREAKFAST-EXPIRED
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo("DEMO-BIRYANI-RECALLED-004")}
            className="text-left px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-colors group"
          >
            <div className="flex items-center gap-1.5 text-rose-800 font-semibold text-xs">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              Recalled Batch
            </div>
            <span className="block text-[11px] font-mono text-rose-700 mt-0.5 truncate">
              DEMO-BIRYANI-RECALLED
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
