import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { ComplaintReportingForm } from "@/components/passenger/ComplaintReportingForm";
import { ArrowLeft, Database } from "lucide-react";

export const metadata = {
  title: "Report Food Quality Issue — RailGuard",
  description: "Passenger food hygiene and quality allegation submission portal.",
};

export const dynamic = "force-dynamic";

interface ReportPageProps {
  searchParams: Promise<{ p?: string }>;
}

export default async function ReportPage({ searchParams }: ReportPageProps) {
  const params = await searchParams;
  const initialQr = params.p || "";

  // Fetch stations and trains — graceful error on DB unavailability
  let seededStations: { id: string; code: string; name: string }[] = [];
  let seededTrains: { id: string; trainNumber: string; trainName: string }[] = [];
  let dbError: string | null = null;

  try {
    const [stations, trains] = await Promise.all([
      prisma.station.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: "asc" },
      }),
      prisma.train.findMany({
        select: { id: true, trainNumber: true, trainName: true },
        orderBy: { trainNumber: "asc" },
      }),
    ]);
    seededStations = stations;
    seededTrains = trains;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    dbError = msg.includes("connect")
      ? "Database is not reachable. Start PostgreSQL and reload the page."
      : "An error occurred loading reference data.";
    console.error("[ReportPage] DB error:", msg);
  }

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
              style={{ backgroundColor: "var(--signal-red)", color: "white" }}
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
                Passenger Portal
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
            className="inline-block px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-3"
            style={{
              backgroundColor: "rgba(198,95,72,0.1)",
              color: "var(--signal-red)",
              border: "1px solid rgba(198,95,72,0.25)",
            }}
          >
            Academic Demonstration System
          </span>
          <h1
            className="text-2xl sm:text-3xl font-bold font-serif tracking-tight"
            style={{ color: "var(--rail-ink)" }}
          >
            Report a Food Quality Issue
          </h1>
          <p
            className="text-xs sm:text-sm mt-2 leading-relaxed"
            style={{ color: "var(--ink-muted)" }}
          >
            Document catering concerns with evidence. All reports receive a
            cryptographic tracking token and are reviewed in the central
            inspection register.
          </p>
        </div>

        {/* DB error state */}
        {dbError && (
          <div
            className="mb-8 rounded-lg border p-5 flex items-start gap-4"
            style={{
              backgroundColor: "rgba(198,95,72,0.06)",
              borderColor: "rgba(198,95,72,0.25)",
            }}
          >
            <Database
              className="w-5 h-5 mt-0.5 shrink-0"
              style={{ color: "var(--signal-red)" }}
            />
            <div>
              <p
                className="font-semibold text-sm mb-1"
                style={{ color: "var(--signal-red)" }}
              >
                Database Unavailable
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                {dbError}
              </p>
              <p className="text-xs mt-2 font-mono" style={{ color: "var(--ink-faint)" }}>
                To start the local database:{" "}
                <code
                  className="px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                >
                  pg_ctl start -D .pgdata
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Complaint reporting form */}
        <ComplaintReportingForm
          initialQrCode={initialQr}
          seededStations={seededStations}
          seededTrains={seededTrains}
        />
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
        RailGuard Passenger Incident Reporting Portal • Demonstration Platform • No Real Passenger Information Collected
      </footer>
    </div>
  );
}
