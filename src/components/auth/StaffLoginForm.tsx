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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Invalid staff credentials or account not recognized.");
        setLoading(false);
        return;
      }

      // Successful authentication: navigate to protected destination
      router.push(redirectTarget);
      router.refresh();
    } catch (err) {
      console.error("[StaffLoginForm] Network error:", err);
      setError("Network or server connection failed. Please verify your connection.");
      setLoading(false);
    }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16"
      style={{
        backgroundColor: "var(--archive-paper)",
        color: "var(--rail-ink)",
      }}
    >
      <div className="w-full max-w-md mx-auto space-y-8">
        {/* Navigation Return Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono transition-colors hover:underline"
            style={{ color: "var(--ink-muted)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Portal</span>
          </Link>
        </div>

        {/* Header Register Identity */}
        <div className="space-y-2 border-b pb-6" style={{ borderColor: "var(--paper-mid)" }}>
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--paper-mid)",
                color: "var(--ink-muted)",
              }}
            >
              [AUTH-REG-01]
            </span>
            <div
              className="flex items-center gap-1 text-[11px] font-mono"
              style={{ color: "var(--jade)" }}
            >
              <Shield className="w-3 h-3" />
              <span>TLS 1.3 / STRICT RBAC</span>
            </div>
          </div>

          <h2
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight pt-1"
            style={{ color: "var(--rail-ink)" }}
          >
            Staff Authentication Desk
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
            Official railway food quality inspection and control room register. Enter your designated staff credentials to access the inspection register.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-3.5 rounded border text-xs flex items-start gap-2.5 animate-fadeIn"
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

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
              <div
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                style={{ color: "var(--ink-faint)" }}
              >
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email-input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@railway.gov.in"
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
            </div>
            <div className="relative">
              <div
                className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                style={{ color: "var(--ink-faint)" }}
              >
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
          <div
            className="flex items-center justify-center gap-2 text-[11px] font-mono"
            style={{ color: "var(--ink-faint)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--brass)" }} />
            <span>Authorized railway personnel only</span>
          </div>

          <p className="text-[11px] leading-relaxed max-w-sm mx-auto" style={{ color: "var(--ink-faint)" }}>
            Official railway food safety inspection console. Staff credentials are provisioned by Central IT Operations. All access sessions are logged with cryptographic timestamps in compliance with RailGuard quality audit protocols.
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
