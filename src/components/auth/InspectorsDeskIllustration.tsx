import React from "react";
import Link from "next/link";
import { Train, ShieldCheck, Clock, FileCheck, ArrowUpRight } from "lucide-react";

export function InspectorsDeskIllustration() {
  return (
    <div
      className="relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 h-full overflow-hidden"
      style={{
        backgroundColor: "var(--rail-ink)",
        color: "var(--archive-paper)",
      }}
    >
      {/* Background Architectural Grid & Subtle Watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(240, 237, 228, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(240, 237, 228, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative Large Watermark Typography in Background */}
      <div
        className="absolute -right-8 -bottom-12 select-none pointer-events-none opacity-[0.03] font-serif text-[180px] font-black leading-none"
        style={{ color: "var(--archive-paper)" }}
      >
        RG
      </div>

      {/* ── TOP: Brand & Ledger Metadata ── */}
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "rgba(240, 237, 228, 0.15)" }}>
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm tracking-wider transition-transform group-hover:scale-105"
              style={{ backgroundColor: "var(--jade)", color: "white" }}
            >
              RG
            </div>
            <div>
              <div className="font-mono font-bold text-base tracking-wider" style={{ color: "var(--archive-paper)" }}>
                RAILGUARD
              </div>
              <div className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "var(--brass)" }}>
                The Living Inspection Register
              </div>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 rounded border" style={{ borderColor: "rgba(240, 237, 228, 0.15)", backgroundColor: "rgba(0,0,0,0.2)", color: "var(--brass)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--jade)" }} />
            <span>REGISTER / RG-OPS / 2026</span>
          </div>
        </div>

        {/* Editorial Heading */}
        <div className="space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(178, 141, 85, 0.15)", color: "var(--brass)", border: "1px solid rgba(178, 141, 85, 0.3)" }}>
            <span>DIVISION OF QUALITY OVERSIGHT</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.12]" style={{ color: "var(--archive-paper)" }}>
            Every inspection leaves a record.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed max-w-lg opacity-80" style={{ color: "var(--archive-paper)" }}>
            RailGuard connects on-train passenger dining feedback with central food safety governance — establishing tamper-evident chains of custody, strict investigation workflows, and recurring pattern intelligence across the railway network.
          </p>
        </div>
      </div>

      {/* ── MIDDLE: Dynamic Railway Route & Inspection Ledger Visual ── */}
      <div className="relative z-10 my-8 py-6 border-y" style={{ borderColor: "rgba(240, 237, 228, 0.12)" }}>
        {/* Route Line Connecting Stations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono" style={{ color: "var(--brass)" }}>
            <span className="flex items-center gap-1.5">
              <Train className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
              <span>ACTIVE CORRIDOR MONITORING</span>
            </span>
            <span className="text-[10px] opacity-75">LIVE AUDIT FEED</span>
          </div>

          {/* SVG Animated Railway Track */}
          <div className="relative w-full py-4">
            <svg viewBox="0 0 500 60" className="w-full h-auto overflow-visible" preserveAspectRatio="none">
              {/* Sleeper / Track Ties */}
              <line x1="10" y1="30" x2="490" y2="30" stroke="rgba(240, 237, 228, 0.2)" strokeWidth="6" strokeDasharray="4 8" />
              {/* Continuous Track Rail */}
              <line x1="10" y1="28" x2="490" y2="28" stroke="rgba(240, 237, 228, 0.4)" strokeWidth="1.5" />
              <line x1="10" y1="32" x2="490" y2="32" stroke="rgba(240, 237, 228, 0.4)" strokeWidth="1.5" />

              {/* Station Waypoints */}
              {/* Station 1: NDLS */}
              <circle cx="40" cy="30" r="5" fill="#527c72" stroke="#252d2b" strokeWidth="2" />
              <text x="40" y="16" fill="#f0ede4" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">NDLS</text>
              <text x="40" y="48" fill="#b28d55" fontSize="7" fontFamily="monospace" textAnchor="middle">00:00</text>

              {/* Station 2: CNB */}
              <circle cx="180" cy="30" r="4" fill="#b28d55" stroke="#252d2b" strokeWidth="2" />
              <text x="180" y="16" fill="#f0ede4" fontSize="9" fontFamily="monospace" textAnchor="middle">CNB</text>
              <text x="180" y="48" fill="rgba(240,237,228,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">04:35</text>

              {/* Station 3: HWH */}
              <circle cx="330" cy="30" r="4" fill="#b28d55" stroke="#252d2b" strokeWidth="2" />
              <text x="330" y="16" fill="#f0ede4" fontSize="9" fontFamily="monospace" textAnchor="middle">HWH</text>
              <text x="330" y="48" fill="rgba(240,237,228,0.5)" fontSize="7" fontFamily="monospace" textAnchor="middle">12:10</text>

              {/* Station 4: MMCT */}
              <circle cx="460" cy="30" r="5" fill="#527c72" stroke="#252d2b" strokeWidth="2" />
              <text x="460" y="16" fill="#f0ede4" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MMCT</text>
              <text x="460" y="48" fill="#527c72" fontSize="7" fontFamily="monospace" textAnchor="middle">VERIFIED</text>
            </svg>
          </div>
        </div>

        {/* Authentic Rubber Inspection Stamps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          {/* Stamp 1 */}
          <div
            className="p-2.5 rounded border text-center select-none transform -rotate-1 transition-transform hover:rotate-0"
            style={{
              borderColor: "rgba(240, 237, 228, 0.25)",
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          >
            <div className="text-[9px] font-mono tracking-widest uppercase opacity-60">PHASE 01</div>
            <div className="font-mono font-bold text-xs tracking-wider" style={{ color: "var(--archive-paper)" }}>
              REGISTERED
            </div>
            <div className="text-[8px] font-mono opacity-50 mt-0.5">ON-PACK QR</div>
          </div>

          {/* Stamp 2 */}
          <div
            className="p-2.5 rounded border text-center select-none transform rotate-2 transition-transform hover:rotate-0"
            style={{
              borderColor: "rgba(178, 141, 85, 0.4)",
              backgroundColor: "rgba(178, 141, 85, 0.1)",
            }}
          >
            <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "var(--brass)" }}>TRIAGE</div>
            <div className="font-mono font-bold text-xs tracking-wider" style={{ color: "var(--brass)" }}>
              UNDER REVIEW
            </div>
            <div className="text-[8px] font-mono opacity-60 mt-0.5">EVIDENCE CHECK</div>
          </div>

          {/* Stamp 3 */}
          <div
            className="p-2.5 rounded border text-center select-none transform -rotate-2 transition-transform hover:rotate-0"
            style={{
              borderColor: "rgba(82, 124, 114, 0.5)",
              backgroundColor: "rgba(82, 124, 114, 0.15)",
            }}
          >
            <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: "var(--jade)" }}>OFFICIAL</div>
            <div className="font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-1" style={{ color: "var(--jade)" }}>
              <ShieldCheck className="w-3 h-3" />
              VERIFIED
            </div>
            <div className="text-[8px] font-mono opacity-70 mt-0.5">LAB & AUDIT</div>
          </div>

          {/* Stamp 4 */}
          <div
            className="p-2.5 rounded border text-center select-none transform rotate-1 transition-transform hover:rotate-0"
            style={{
              borderColor: "rgba(240, 237, 228, 0.25)",
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          >
            <div className="text-[9px] font-mono tracking-widest uppercase opacity-60">LIFECYCLE</div>
            <div className="font-mono font-bold text-xs tracking-wider" style={{ color: "var(--archive-paper)" }}>
              RESOLVED
            </div>
            <div className="text-[8px] font-mono opacity-50 mt-0.5">ACTION TAKEN</div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Inspection Station Badges & Public Portal Link ── */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 text-xs font-mono">
        <div className="flex items-center gap-4 text-xs opacity-75">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} />
            <span>24/7 Monitoring Console</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
            <span>Cryptographic Logbook</span>
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 transition-colors opacity-80 hover:opacity-100"
          style={{ color: "var(--brass)" }}
        >
          <span>Passenger Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
