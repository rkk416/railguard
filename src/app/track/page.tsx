import React from "react";
import Link from "next/link";
import { ComplaintTrackingPortal } from "@/components/passenger/ComplaintTrackingPortal";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Track Case Status — RailGuard",
  description: "Secure, cryptographic passenger complaint tracking portal.",
};

export const dynamic = "force-dynamic";

interface TrackPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--archive-paper)", color: "var(--rail-ink)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b px-4 py-3"
        style={{
          backgroundColor: "var(--rail-ink)",
          borderColor: "rgba(240,237,228,0.1)",
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs font-mono"
              style={{ backgroundColor: "var(--jade)", color: "white" }}
            >
              RG
            </div>
            <div>
              <span
                className="font-bold font-mono tracking-wider text-sm"
                style={{ color: "var(--archive-paper)" }}
              >
                RAILGUARD
              </span>
              <span
                className="block text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "var(--jade)" }}
              >
                Case Tracking
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "rgba(240,237,228,0.6)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Route line */}
      <div className="route-line" />

      {/* Main */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
        {/* Page header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-3"
            style={{
              backgroundColor: "rgba(82,124,114,0.1)",
              color: "var(--jade)",
              border: "1px solid rgba(82,124,114,0.25)",
            }}
          >
            <Lock className="w-3 h-3" />
            SHA-256 Token Verification
          </span>
          <h1
            className="text-2xl sm:text-3xl font-bold font-serif tracking-tight"
            style={{ color: "var(--rail-ink)" }}
          >
            Track Case Status &amp; Audit Timeline
          </h1>
          <p
            className="text-xs sm:text-sm mt-2 leading-relaxed"
            style={{ color: "var(--ink-muted)" }}
          >
            Enter your complaint reference and 32-character tracking token to
            view verified inspection findings, remedies, and public timeline milestones.
          </p>
        </div>

        {/* Tracking portal */}
        <ComplaintTrackingPortal initialRef={params.ref} />
      </main>

      {/* Footer */}
      <div className="route-line" />
      <footer
        className="py-4 px-6 text-center text-xs font-mono"
        style={{
          backgroundColor: "var(--rail-ink)",
          color: "rgba(240,237,228,0.4)",
        }}
      >
        RailGuard Case Tracking Portal • SHA-256 Token Privacy Protection • Synthetic Demo Mode
      </footer>
    </div>
  );
}
