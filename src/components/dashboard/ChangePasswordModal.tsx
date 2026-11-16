"use client";

import React, { useState } from "react";
import { KeyRound, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setSuccessMsg("Password updated successfully. Session credentials refreshed.");
      setTimeout(() => {
        setIsOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password update failed.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderColor: "rgba(240, 237, 228, 0.15)",
          color: "var(--archive-paper)",
        }}
        title="Change staff account credentials"
      >
        <KeyRound className="w-3 h-3" style={{ color: "var(--brass)" }} />
        <span>Change Password</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="rounded-xl shadow-2xl max-w-md w-full p-6 border text-slate-100"
            style={{
              backgroundColor: "var(--rail-ink)",
              borderColor: "rgba(240, 237, 228, 0.2)",
            }}
          >
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg border"
                  style={{
                    backgroundColor: "rgba(180, 142, 60, 0.15)",
                    borderColor: "rgba(180, 142, 60, 0.4)",
                    color: "var(--brass)",
                  }}
                >
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide text-slate-100">
                    Update Account Credentials
                  </h3>
                  <p className="text-[10px] font-mono tracking-wider" style={{ color: "var(--brass)" }}>
                    STAFF SECURITY REGISTER
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-300 bg-rose-950/70 border border-rose-800 p-2.5 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="text-xs text-emerald-300 bg-emerald-950/70 border border-emerald-800 p-2.5 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs rounded font-medium text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: "var(--jade)" }}
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
