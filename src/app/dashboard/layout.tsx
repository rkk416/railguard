import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { RoleSwitcherBar } from "@/components/dashboard/RoleSwitcherBar";
import { AdminResetModal } from "@/components/dashboard/AdminResetModal";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import {
  LayoutDashboard,
  ClipboardList,
  QrCode,
  Radio,
  FileText,
} from "lucide-react";

import { verifySessionToken } from "@/lib/auth/sessionToken";

export const metadata = {
  title: "Control Room Dashboard — RailGuard",
  description: "Centralized railway food quality audit and complaint triage console.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve server-side user identity from cryptographically signed session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("railguard_session")?.value;

  if (!sessionToken) {
    redirect("/login?from=/dashboard");
  }

  const tokenPayload = verifySessionToken(sessionToken);
  if (!tokenPayload) {
    redirect("/login?from=/dashboard");
  }

  let currentUser = null;
  try {
    currentUser = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
    });
  } catch (err) {
    console.error("[DashboardLayout] DB query error:", err);
  }

  if (!currentUser || currentUser.role !== tokenPayload.role) {
    redirect("/login?from=/dashboard");
  }

  const safeUser = {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    role: currentUser.role,
  };

  const isAdmin = safeUser.role === UserRole.ADMIN;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row antialiased"
      style={{ backgroundColor: "var(--archive-paper)", color: "var(--rail-ink)" }}
    >
      {/* ── 1. Rail Ink Inspection Sidebar ── */}
      <aside
        className="w-full md:w-64 border-r flex flex-col shrink-0"
        style={{
          backgroundColor: "var(--rail-ink)",
          borderColor: "rgba(240,237,228,0.12)",
          color: "var(--archive-paper)",
        }}
      >
        {/* Brand Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(240,237,228,0.12)" }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs font-mono"
              style={{ backgroundColor: "var(--jade)", color: "white" }}
            >
              RG
            </div>
            <div>
              <div
                className="font-bold text-sm tracking-wide font-mono"
                style={{ color: "var(--archive-paper)" }}
              >
                RAILGUARD
              </div>
              <div
                className="text-[9px] font-mono tracking-widest uppercase"
                style={{ color: "var(--brass)" }}
              >
                Inspection Register
              </div>
            </div>
          </Link>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--jade)" }}
            title="System Active"
          />
        </div>

        {/* Operational Status Pill */}
        <div
          className="px-4 py-2 border-b"
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            borderColor: "rgba(240,237,228,0.08)",
          }}
        >
          <div
            className="flex items-center gap-2 text-[10px] font-mono"
            style={{ color: "rgba(240,237,228,0.6)" }}
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span className="uppercase tracking-wider font-semibold">MODE:</span>
            <span style={{ color: "var(--brass)" }} className="font-bold">
              ACADEMIC DEMO
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 flex-1 font-medium text-xs">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded font-semibold transition-colors"
            style={{
              backgroundColor: "rgba(82, 124, 114, 0.2)",
              color: "var(--archive-paper)",
              border: "1px solid rgba(82, 124, 114, 0.4)",
            }}
          >
            <LayoutDashboard className="w-4 h-4" style={{ color: "var(--jade)" }} />
            <span>Inspection Console</span>
          </Link>

          <Link
            href="/dashboard#triage"
            className="flex items-center gap-2.5 px-3 py-2 rounded transition-colors hover:bg-white/5"
            style={{ color: "rgba(240,237,228,0.7)" }}
          >
            <ClipboardList className="w-4 h-4" style={{ color: "var(--brass)" }} />
            <span>Triage Queue</span>
          </Link>

          <Link
            href="/report"
            className="flex items-center gap-2.5 px-3 py-2 rounded transition-colors hover:bg-white/5"
            style={{ color: "rgba(240,237,228,0.7)" }}
          >
            <FileText className="w-4 h-4" style={{ color: "var(--signal-red)" }} />
            <span>Passenger Portal</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded transition-colors hover:bg-white/5"
            style={{ color: "rgba(240,237,228,0.7)" }}
          >
            <QrCode className="w-4 h-4" style={{ color: "rgba(240,237,228,0.5)" }} />
            <span>Packaging Lookup</span>
          </Link>
        </nav>

        {/* Admin Operations & Reset Section */}
        <div
          className="p-4 border-t space-y-3"
          style={{
            backgroundColor: "rgba(0,0,0,0.25)",
            borderColor: "rgba(240,237,228,0.12)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-mono font-semibold uppercase tracking-wider"
              style={{ color: "rgba(240,237,228,0.6)" }}
            >
              ADMIN OPS
            </span>
            <AdminResetModal isAdmin={isAdmin} />
          </div>

          {/* User Badge */}
          <div
            className="p-2.5 rounded border"
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderColor: "rgba(240,237,228,0.12)",
            }}
          >
            <div
              className="text-[11px] font-semibold truncate"
              style={{ color: "var(--archive-paper)" }}
            >
              {safeUser.name}
            </div>
            <div
              className="text-[10px] font-mono truncate"
              style={{ color: "rgba(240,237,228,0.5)" }}
            >
              {safeUser.email}
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── 2. Main Work Area (Warm Archive Paper) ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Role Switcher */}
        <RoleSwitcherBar currentUser={safeUser} />

        {/* Content Container */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Route line */}
        <div className="route-line" />

        {/* Footer */}
        <footer
          className="py-3 px-6 text-center text-xs font-mono border-t"
          style={{
            backgroundColor: "var(--archive-paper)",
            borderColor: "var(--paper-mid)",
            color: "var(--ink-faint)",
          }}
        >
          RailGuard Inspection Register Console • Certified for Academic &amp; Demonstration Use • All Complaints Synthetic
        </footer>
      </div>
    </div>
  );
}
