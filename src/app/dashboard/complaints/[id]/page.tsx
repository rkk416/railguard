import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { UserRole, ComplaintStatus, ComplaintSeverity } from "@prisma/client";
import { CaseInvestigationActions } from "@/components/dashboard/CaseInvestigationActions";
import { findDuplicateCandidates } from "@/services/duplicateDetectionService";
import {
  ArrowLeft,
  Train,
  MapPin,
  Calendar,
  AlertTriangle,
  FileImage,
  Shield,
  History,
  Package,
  Copy,
} from "lucide-react";

interface ComplaintDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ComplaintDetailPageProps) {
  const { id } = await params;
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    select: { complaintRef: true },
  });
  return {
    title: complaint ? `Case ${complaint.complaintRef} — RailGuard Control Room` : "Case Details",
  };
}

export default async function ComplaintDetailPage({ params }: ComplaintDetailPageProps) {
  const { id } = await params;

  // 1. Resolve Session User
  const cookieStore = await cookies();
  const sessionEmail = cookieStore.get("railguard_session")?.value || "reviewer@railguard.test";

  let currentUser = null;
  try {
    currentUser = await prisma.user.findUnique({
      where: { email: sessionEmail },
    });

    if (!currentUser) {
      currentUser = await prisma.user.findFirst({
        where: { role: UserRole.QUALITY_REVIEWER },
      });
    }
  } catch (err) {
    console.error("[ComplaintDetailPage] User session query error:", err);
  }

  const safeUser = currentUser
    ? { id: currentUser.id, name: currentUser.name, role: currentUser.role }
    : { id: "demo-user-id", name: "Priya Sharma", role: UserRole.QUALITY_REVIEWER };

  // 2. Fetch Complaint with full relations
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      train: {
        include: { originStation: true, destinationStation: true },
      },
      station: true,
      packagingUnit: {
        include: {
          product: {
            include: { vendor: true },
          },
        },
      },
      evidence: true,
      events: {
        orderBy: { createdAt: "asc" },
        include: { actor: true },
      },
      investigation: {
        include: {
          investigator: true,
          correctiveActions: {
            orderBy: { createdAt: "desc" },
            include: { verifiedBy: true },
          },
        },
      },
    },
  });

  if (!complaint || complaint.deletedAt) {
    notFound();
  }

  // 3. Fetch available investigators for assignment dropdown and duplicate candidates
  const [availableReviewers, duplicateCandidates] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    findDuplicateCandidates(complaint.id),
  ]);

  const getStatusBadgeStyle = (status: ComplaintStatus) => {
    switch (status) {
      case ComplaintStatus.SUBMITTED:
        return { bg: "#eef2f1", text: "#3d524e", border: "#c2d1cd" };
      case ComplaintStatus.UNDER_REVIEW:
        return { bg: "#fdf8ee", text: "#7a5c1a", border: "#ebd7a9" };
      case ComplaintStatus.INVESTIGATION:
        return { bg: "#f2f7f5", text: "#2d6a5e", border: "#b8ddd6" };
      case ComplaintStatus.ACTION_REQUIRED:
        return { bg: "#fbf2ef", text: "#963d28", border: "#ecc8be" };
      case ComplaintStatus.NEEDS_INFORMATION:
        return { bg: "#f4f0f8", text: "#523a6b", border: "#d7cae5" };
      case ComplaintStatus.RESOLVED:
        return { bg: "#eef8f2", text: "#1b6334", border: "#b4e3c5" };
      case ComplaintStatus.REJECTED:
        return { bg: "#faf0f0", text: "#7a2828", border: "#e8c0c0" };
      case ComplaintStatus.DUPLICATE:
        return { bg: "#f0ede4", text: "#5c6663", border: "#d5d0c3" };
    }
  };

  const getSeverityBadgeStyle = (sev: ComplaintSeverity) => {
    switch (sev) {
      case ComplaintSeverity.CRITICAL:
        return { bg: "#fbf2ef", text: "#c65f48", border: "#ecc8be" };
      case ComplaintSeverity.HIGH:
        return { bg: "#fef5ec", text: "#b26a28", border: "#f0d5b8" };
      case ComplaintSeverity.MEDIUM:
        return { bg: "#fdf8ee", text: "#b28d55", border: "#ebd7a9" };
      case ComplaintSeverity.LOW:
        return { bg: "#f0ede4", text: "#8a9490", border: "#e4e0d4" };
    }
  };

  const statusStyle = getStatusBadgeStyle(complaint.status);
  const sevStyle = getSeverityBadgeStyle(complaint.severity);

  return (
    <div className="space-y-6">
      {/* 1. Navigation & Case Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--paper-mid)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard#triage"
            className="p-2 rounded border transition-colors"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-mono" style={{ color: "var(--rail-ink)" }}>
                {complaint.complaintRef}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded text-xs font-mono font-bold border"
                style={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  borderColor: statusStyle.border,
                }}
              >
                {complaint.status.replace("_", " ")}
              </span>
              <span
                className="px-2 py-0.5 rounded text-xs font-mono font-semibold border"
                style={{
                  backgroundColor: sevStyle.bg,
                  color: sevStyle.text,
                  borderColor: sevStyle.border,
                }}
              >
                {complaint.severity}
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
              Logged on {new Date(complaint.createdAt).toLocaleString()} UTC • Category:{" "}
              <strong style={{ color: "var(--rail-ink)" }}>
                {complaint.category.replace("_", " ")}
              </strong>
            </p>
          </div>
        </div>

        {/* Cryptographic Token Reference Note */}
        <div className="text-right text-xs font-mono hidden md:block" style={{ color: "var(--ink-faint)" }}>
          <div>TOKEN STORAGE: SHA-256 HASH</div>
          <div className="text-[10px] truncate max-w-xs font-mono">
            {complaint.trackingTokenHash}
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Allegation, Journey, Evidence, Batch */}
        <div className="lg:col-span-2 space-y-6">
          {/* Potential Duplicate Banner */}
          {duplicateCandidates.length > 0 && complaint.status !== ComplaintStatus.DUPLICATE && (
            <div
              className="rounded-lg border p-4 text-xs space-y-2"
              style={{
                backgroundColor: "#fdf8ee",
                borderColor: "#ebd7a9",
                color: "var(--brass)",
              }}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Copy className="w-4 h-4" />
                  <span>Potential Duplicate Incidents Detected ({duplicateCandidates.length})</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider">
                  Automated Correlation
                </span>
              </div>
              <p className="leading-relaxed text-[11px]" style={{ color: "var(--ink-muted)" }}>
                Similar complaints were filed within a 24-hour window matching this train route, station, or coach.
              </p>
              <div className="space-y-1 pt-1">
                {duplicateCandidates.map((dc) => (
                  <div
                    key={dc.id}
                    className="p-2 rounded border flex items-center justify-between text-[11px]"
                    style={{
                      backgroundColor: "white",
                      borderColor: "var(--paper-mid)",
                    }}
                  >
                    <div>
                      <Link
                        href={`/dashboard/complaints/${dc.id}`}
                        className="font-mono font-bold hover:underline mr-2"
                        style={{ color: "var(--jade)" }}
                      >
                        {dc.complaintRef}
                      </Link>
                      <span className="mr-2" style={{ color: "var(--ink-muted)" }}>
                        [{dc.category}]
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: "var(--brass)" }}>
                        ({dc.matchReason})
                      </span>
                    </div>
                    <span className="font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                      Status: {dc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passenger Allegation Card */}
          <div
            className="rounded-lg border p-5 shadow-xs"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
            }}
          >
            <h2
              className="text-xs font-bold uppercase tracking-wider font-mono mb-3 flex items-center gap-2"
              style={{ color: "var(--rail-ink)" }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "var(--signal-red)" }} />
              <span>Passenger Allegation Record</span>
            </h2>

            <div
              className="p-4 rounded border mb-4 text-sm leading-relaxed font-sans"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              &ldquo;{complaint.description}&rdquo;
            </div>

            {/* Rejection Notice if rejected */}
            {complaint.status === ComplaintStatus.REJECTED && complaint.rejectionReason && (
              <div
                className="mb-4 p-3 rounded border text-xs"
                style={{
                  backgroundColor: "#faf0f0",
                  borderColor: "#ecc8be",
                  color: "var(--signal-red)",
                }}
              >
                <strong className="block font-semibold mb-0.5">
                  Formal Rejection Justification:
                </strong>
                {complaint.rejectionReason}
              </div>
            )}

            {/* Journey Context Details */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t"
              style={{ borderColor: "var(--paper-mid)" }}
            >
              <div>
                <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  TRAIN / ROUTE
                </span>
                <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                  <Train className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
                  <span>
                    {complaint.train?.trainNumber || complaint.unmatchedTrainNumber || "Unassigned"}
                  </span>
                </div>
                {complaint.train && (
                  <div className="text-[11px] truncate" style={{ color: "var(--ink-muted)" }}>
                    {complaint.train.originStation.code} → {complaint.train.destinationStation.code}
                  </div>
                )}
              </div>

              <div>
                <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  INCIDENT LOCATION
                </span>
                <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} />
                  <span>{complaint.station ? `${complaint.station.code} (${complaint.station.name})` : "En-route"}</span>
                </div>
                {complaint.coach && (
                  <div className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>
                    Coach: <span className="font-bold">{complaint.coach}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  JOURNEY DATE
                </span>
                <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                  <Calendar className="w-3.5 h-3.5" style={{ color: "var(--ink-faint)" }} />
                  <span>
                    {complaint.journeyDate
                      ? new Date(complaint.journeyDate).toLocaleDateString()
                      : "Not specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product & Catering Vendor Card */}
          {complaint.packagingUnit && (
            <div
              className="rounded-lg border p-5 shadow-xs"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
              }}
            >
              <h2
                className="text-xs font-bold uppercase tracking-wider font-mono mb-3 flex items-center gap-2"
                style={{ color: "var(--rail-ink)" }}
              >
                <Package className="w-4 h-4" style={{ color: "var(--jade)" }} />
                <span>Verified Packaging &amp; Contractor Details</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    PRODUCT
                  </span>
                  <div className="font-semibold" style={{ color: "var(--rail-ink)" }}>
                    {complaint.packagingUnit.product.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                    Category: {complaint.packagingUnit.product.category.replace("_", " ")}
                  </div>
                </div>

                <div>
                  <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    BATCH / QR CODE
                  </span>
                  <div className="font-mono font-bold" style={{ color: "var(--jade)" }}>
                    {complaint.packagingUnit.batchNumber}
                  </div>
                  <div className="text-[11px] font-mono truncate" style={{ color: "var(--ink-muted)" }}>
                    {complaint.packagingUnit.qrCodeIdentifier}
                  </div>
                </div>

                <div>
                  <span className="block mb-0.5 font-mono text-[10px]" style={{ color: "var(--ink-faint)" }}>
                    APPROVED CONTRACTOR
                  </span>
                  <div className="font-semibold" style={{ color: "var(--rail-ink)" }}>
                    {complaint.packagingUnit.product.vendor.name}
                  </div>
                  <div className="text-[11px] font-mono" style={{ color: "var(--ink-muted)" }}>
                    {complaint.packagingUnit.product.vendor.code} • {complaint.packagingUnit.product.vendor.licenseNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evidence Photos Gallery */}
          <div
            className="rounded-lg border p-5 shadow-xs"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
            }}
          >
            <h2 className="text-xs font-bold uppercase tracking-wider font-mono mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: "var(--rail-ink)" }}>
                <FileImage className="w-4 h-4" style={{ color: "var(--brass)" }} />
                <span>Inspection Evidence Photos ({complaint.evidence.length})</span>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded font-mono border"
                style={{
                  backgroundColor: "#fdf8ee",
                  borderColor: "#ebd7a9",
                  color: "var(--brass)",
                }}
              >
                SYNTHETIC DEMO ASSETS
              </span>
            </h2>

            {complaint.evidence.length === 0 ? (
              <div
                className="p-8 text-center text-xs border border-dashed rounded"
                style={{ borderColor: "var(--paper-mid)", color: "var(--ink-faint)" }}
              >
                No photographic evidence attached to this allegation.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="border rounded overflow-hidden"
                    style={{
                      borderColor: "var(--paper-mid)",
                      backgroundColor: "var(--archive-paper)",
                    }}
                  >
                    <div className="aspect-[4/3] w-full flex items-center justify-center relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/evidence/${ev.id}`}
                        alt={ev.fileName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      className="p-2.5 border-t text-[11px] font-mono flex items-center justify-between"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span className="truncate">{ev.fileName}</span>
                      <span style={{ color: "var(--ink-faint)" }}>
                        {Math.round(ev.fileSizeBytes / 1024)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Actions Box, Investigation Status, History */}
        <div className="space-y-6">
          {/* Interactive Case Mutation Actions Box */}
          <CaseInvestigationActions
            complaintId={complaint.id}
            currentStatus={complaint.status}
            currentUser={safeUser}
            investigation={complaint.investigation}
            availableReviewers={availableReviewers}
          />

          {/* Investigation Findings Card */}
          {complaint.investigation && (
            <div
              className="rounded-lg border p-4 shadow-xs text-xs space-y-2"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
              }}
            >
              <h3 className="font-bold uppercase tracking-wider font-mono flex items-center justify-between" style={{ color: "var(--rail-ink)" }}>
                <span>Inquiry Findings</span>
                {complaint.investigation.determination && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded border font-mono"
                    style={{
                      backgroundColor: "#f2f7f5",
                      borderColor: "#c2d9d2",
                      color: "var(--jade)",
                    }}
                  >
                    {complaint.investigation.determination.replace("_", " ")}
                  </span>
                )}
              </h3>

              <div
                className="p-3 rounded border font-sans whitespace-pre-wrap leading-relaxed"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                {complaint.investigation.findings || "Preliminary inquiry underway."}
              </div>

              <div className="text-[11px] space-y-1 font-mono pt-1" style={{ color: "var(--ink-muted)" }}>
                <div>
                  Investigator:{" "}
                  <strong style={{ color: "var(--rail-ink)" }}>
                    {complaint.investigation.investigator?.name || "Unassigned"}
                  </strong>
                </div>
                <div>
                  Assigned At: {new Date(complaint.investigation.assignedAt).toLocaleString()}
                </div>
                <div>
                  Status:{" "}
                  <span
                    className="font-semibold"
                    style={{ color: complaint.investigation.isCompleted ? "var(--jade)" : "var(--brass)" }}
                  >
                    {complaint.investigation.isCompleted ? "Inquiry Completed" : "Active Inquest"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Corrective Actions Linked to Case */}
          {complaint.investigation?.correctiveActions && complaint.investigation.correctiveActions.length > 0 && (
            <div
              className="rounded-lg border p-4 shadow-xs text-xs space-y-2.5"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
              }}
            >
              <h3 className="font-bold uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: "var(--rail-ink)" }}>
                <Shield className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
                <span>Corrective Mandates ({complaint.investigation.correctiveActions.length})</span>
              </h3>

              <div className="space-y-2">
                {complaint.investigation.correctiveActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded border"
                    style={{
                      backgroundColor: "var(--archive-paper)",
                      borderColor: "var(--paper-mid)",
                    }}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold mb-1" style={{ color: "var(--rail-ink)" }}>
                      <span>{act.actionType.replace("_", " ")}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={{
                          backgroundColor: "white",
                          borderColor: "var(--paper-mid)",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {act.status}
                      </span>
                    </div>
                    <p className="leading-relaxed mb-2" style={{ color: "var(--rail-ink)" }}>
                      {act.description}
                    </p>
                    <div className="text-[10px] font-mono space-y-0.5" style={{ color: "var(--ink-muted)" }}>
                      <div>Responsible: {act.responsibleParty}</div>
                      {act.deadline && <div>Deadline: {new Date(act.deadline).toLocaleDateString()}</div>}
                      {act.verificationOutcome && (
                        <div className="font-semibold mt-1" style={{ color: "var(--jade)" }}>
                          Outcome: {act.verificationOutcome}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Append-Only Audit History Timeline */}
          <div
            className="rounded-lg border p-4 shadow-xs text-xs space-y-3"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
            }}
          >
            <h3 className="font-bold uppercase tracking-wider font-mono flex items-center gap-1.5" style={{ color: "var(--rail-ink)" }}>
              <History className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} />
              <span>Audit Chain of Custody ({complaint.events.length})</span>
            </h3>

            <div
              className="relative pl-4 space-y-3.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5"
              style={{
                // @ts-expect-error custom variable
                "--tw-before-bg": "var(--paper-mid)",
              }}
            >
              {complaint.events.map((evt) => (
                <div key={evt.id} className="relative">
                  <span
                    className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full border"
                    style={{
                      borderColor: "var(--jade)",
                      backgroundColor: "var(--archive-paper)",
                    }}
                  />
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-0.5">
                      <span className="font-bold" style={{ color: "var(--jade)" }}>
                        {evt.newStatus.replace("_", " ")}
                      </span>
                      <span style={{ color: "var(--ink-faint)" }}>
                        {new Date(evt.createdAt).toLocaleDateString()} {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="leading-relaxed font-sans" style={{ color: "var(--rail-ink)" }}>
                      {evt.explanation}
                    </p>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--ink-faint)" }}>
                      Actor: {evt.actor?.name || evt.actorRole}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
