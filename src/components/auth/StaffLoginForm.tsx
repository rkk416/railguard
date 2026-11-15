"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  UserCheck,
  Shield,
  ArrowLeft,
} from "lucide-react";

export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Quick evaluation preset fill
  const handlePresetSelect = (presetEmail: string, presetName: string, roleTitle: string) => {
    setEmail(presetEmail);
    setPassword("RailGuard@2026");
    setError(null);
    setSuccessMessage(`Loaded ${presetName} credentials (${roleTitle})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Please enter your registered staff email address.");
      return;
    }
    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      setSuccessMessage(`Authorized as ${data.user.name} (${data.user.role}). Redirecting...`);

      // Smooth transition to dashboard
      setTimeout(() => {
        router.push(data.redirectTo || redirectTarget);
        router.refresh();
      }, 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error during authentication";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 h-full"
      style={{
        backgroundColor: "var(--archive-paper)",
        color: "var(--rail-ink)",
      }}
    >
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Mobile Header Brand (visible when split layout stacks) */}
        <div className="lg:hidden flex items-center justify-between border-b pb-4 mb-2" style={{ borderColor: "var(--paper-mid)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs font-mono" style={{ backgroundColor: "var(--jade)", color: "white" }}>
              RG
            </div>
            <div>
              <span className="font-mono font-bold text-sm" style={{ color: "var(--rail-ink)" }}>RAILGUARD</span>
              <span className="block text-[9px] font-mono uppercase tracking-widest" style={{ color: "var(--brass)" }}>Inspection Register</span>
            </div>
          </div>
          <Link href="/" className="text-xs font-mono flex items-center gap-1 opacity-75 hover:opacity-100" style={{ color: "var(--rail-ink)" }}>
            <ArrowLeft className="w-3 h-3" />
            <span>Public Home</span>
          </Link>
        </div>

        {/* Section Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--jade)" }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "var(--ink-muted)" }}>
              STAFF AUTHENTICATION DESK
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight" style={{ color: "var(--rail-ink)" }}>
            Welcome back.
          </h2>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Access the RailGuard inspection workspace and quality triage console.
          </p>
        </div>

        {/* Evaluation Demo Credentials Helper */}
        <div
          className="p-3.5 rounded border space-y-2.5"
          style={{
            backgroundColor: "#FAF8F5",
            borderColor: "var(--paper-mid)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold" style={{ color: "var(--brass)" }}>
              DEMONSTRATION ACCESS ROSTER:
            </span>
            <span className="text-[10px] font-mono text-emerald-800 font-medium">Click to fill</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Reviewer Chip */}
            <button
              type="button"
              onClick={() => handlePresetSelect("reviewer@railguard.test", "Priya Sharma", "Senior Inspector")}
              className="text-left p-2 rounded border transition-all text-xs cursor-pointer hover:shadow-xs group"
              style={{
                backgroundColor: email === "reviewer@railguard.test" ? "rgba(82, 124, 114, 0.1)" : "white",
                borderColor: email === "reviewer@railguard.test" ? "var(--jade)" : "var(--paper-mid)",
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--jade)" }}>
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Inspector Priya S.</span>
              </div>
              <div className="text-[10px] font-mono truncate opacity-75 mt-0.5" style={{ color: "var(--ink-muted)" }}>
                reviewer@railguard.test
              </div>
            </button>

            {/* Admin Chip */}
            <button
              type="button"
              onClick={() => handlePresetSelect("admin@railguard.test", "Rajesh Kumar", "Director")}
              className="text-left p-2 rounded border transition-all text-xs cursor-pointer hover:shadow-xs group"
              style={{
                backgroundColor: email === "admin@railguard.test" ? "rgba(178, 141, 85, 0.1)" : "white",
                borderColor: email === "admin@railguard.test" ? "var(--brass)" : "var(--paper-mid)",
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold" style={{ color: "var(--brass)" }}>
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Director Rajesh K.</span>
              </div>
              <div className="text-[10px] font-mono truncate opacity-75 mt-0.5" style={{ color: "var(--ink-muted)" }}>
                admin@railguard.test
              </div>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-3 rounded border text-xs flex items-start gap-2.5 animate-fadeIn"
            style={{
              backgroundColor: "rgba(198, 95, 72, 0.08)",
              borderColor: "var(--signal-red)",
              color: "var(--signal-red)",
            }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div
            className="p-3 rounded border text-xs flex items-start gap-2.5 animate-fadeIn"
            style={{
              backgroundColor: "rgba(82, 124, 114, 0.1)",
              borderColor: "var(--jade)",
              color: "var(--jade)",
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="email-input"
              className="block text-xs font-mono font-semibold tracking-wide uppercase"
              style={{ color: "var(--rail-ink)" }}
            >
              Work Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: "var(--ink-faint)" }}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="inspector@railguard.test"
                disabled={loading}
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded border bg-white focus:outline-hidden transition-all font-mono"
                style={{
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-input"
                className="block text-xs font-mono font-semibold tracking-wide uppercase"
                style={{ color: "var(--rail-ink)" }}
              >
                Inspection Key / Password
              </label>
              <span className="text-[10px] font-mono opacity-60" style={{ color: "var(--ink-faint)" }}>
                Standard bcrypt/scrypt
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{ color: "var(--ink-faint)" }}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loading}
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded border bg-white focus:outline-hidden transition-all font-mono"
                style={{
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors"
                style={{ color: "var(--ink-faint)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Enter Inspection Register</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Regulatory Footer Note */}
        <div
          className="pt-6 border-t space-y-3 text-center"
          style={{ borderColor: "var(--paper-mid)" }}
        >
          <div className="flex items-center justify-center gap-2 text-[11px] font-mono" style={{ color: "var(--ink-faint)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brass)" }} />
            <span>Authorized railway personnel only</span>
          </div>

          <p className="text-[11px] leading-relaxed max-w-sm mx-auto" style={{ color: "var(--ink-faint)" }}>
            Official railway food safety inspection console. All access sessions are logged with cryptographic timestamps in compliance with RailGuard quality audit protocols.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium transition-colors hover:underline"
              style={{ color: "var(--jade)" }}
            >
              <span>← Return to Public Passenger Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
