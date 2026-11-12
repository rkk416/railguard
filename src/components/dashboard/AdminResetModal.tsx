"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, AlertTriangle, X, CheckCircle, Shield } from "lucide-react";

interface AdminResetModalProps {
  isAdmin: boolean;
}

export function AdminResetModal({ isAdmin }: AdminResetModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  if (!isAdmin) {
    return null; // Reset control is strictly hidden and inaccessible to non-admins
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput !== "RESET_DEMO_DATABASE") {
      setErrorMsg('You must type "RESET_DEMO_DATABASE" to proceed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "RESET_DEMO_DATABASE" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute demonstration reset");
      }

      setSuccessMsg("Reset completed successfully. Pristine 35-case baseline restored.");
      setTimeout(() => {
        setIsOpen(false);
        setConfirmationInput("");
        setSuccessMsg(null);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900 transition-colors shadow-sm"
      >
        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
        <span>Reset Demo DB</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/80">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Demonstration Database Reset
                  </h3>
                  <p className="text-xs text-rose-400 font-mono">
                    ADMINISTRATIVE OVERRIDE REQUIRED
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This operation purges all temporary test mutations, cleans uploaded
              evidence files via post-commit queue, and restores the exact{" "}
              <strong className="text-slate-100">35-complaint baseline</strong> with 8
              investigations and 5 corrective actions.
            </p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Type <span className="font-mono text-rose-400">RESET_DEMO_DATABASE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder="RESET_DEMO_DATABASE"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-400 bg-rose-950/60 border border-rose-900 p-2.5 rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-900 p-2.5 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmationInput !== "RESET_DEMO_DATABASE" || isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {isSubmitting ? "Resetting Database..." : "Execute Atomic Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
