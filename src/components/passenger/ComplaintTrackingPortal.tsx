"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PublicComplaintDetails } from "@/services/complaintTrackingService";
import {
  Search,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  Train,
  MapPin,
  Calendar,
  History,
  XCircle,
} from "lucide-react";

interface ComplaintTrackingPortalProps {
  initialRef?: string;
}

export function ComplaintTrackingPortal({
  initialRef = "",
}: ComplaintTrackingPortalProps) {
  const [complaintRef, setComplaintRef] = useState(initialRef);
  const [trackingToken, setTrackingToken] = useState(() => {
    if (typeof window === "undefined" || !initialRef) return "";
    try {
      return sessionStorage.getItem(`rg_token_${initialRef}`) || "";
    } catch {
      return "";
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [complaint, setComplaint] = useState<PublicComplaintDetails | null>(null);

  const handleLookup = useCallback(async (ref: string, token: string) => {
    if (!ref.trim() || !token.trim()) {
      setErrorMsg("Please enter both your Complaint Reference and Secret Tracking Token.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setComplaint(null);

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintRef: ref.trim(),
          trackingToken: token.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Case record not found or invalid credentials.");
      }

      setComplaint(data.complaint);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialRef) return;
    let storedToken = "";
    try {
      storedToken = sessionStorage.getItem(`rg_token_${initialRef}`) || "";
    } catch {
      // ignore storage access error
    }

    if (storedToken) {
      let cancelled = false;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintRef: initialRef.trim(), trackingToken: storedToken.trim() }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d.complaint) {
            setComplaint(d.complaint);
          }
        })
        .catch(() => {
          // ignore automated lookup error
        });

      return () => {
        cancelled = true;
      };
    }
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(complaintRef, trackingToken);
  };

  const loadPreset = (ref: string, token: string) => {
    setComplaintRef(ref);
    setTrackingToken(token);
    handleLookup(ref, token);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return { bg: "#eef2f1", text: "#3d524e", border: "#c2d1cd" };
      case "UNDER_REVIEW":
        return { bg: "#fdf8ee", text: "#7a5c1a", border: "#ebd7a9" };
      case "INVESTIGATION":
        return { bg: "#f2f7f5", text: "#2d6a5e", border: "#b8ddd6" };
      case "ACTION_REQUIRED":
        return { bg: "#fbf2ef", text: "#963d28", border: "#ecc8be" };
      case "RESOLVED":
        return { bg: "#eef8f2", text: "#1b6334", border: "#b4e3c5" };
      case "REJECTED":
        return { bg: "#faf0f0", text: "#7a2828", border: "#e8c0c0" };
      default:
        return { bg: "#f0ede4", text: "#252d2b", border: "#d5d0c3" };
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 1. Lookup Card */}
      <div
        className="rounded-lg border p-6 sm:p-7 shadow-xs"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div
          className="flex items-center gap-2 mb-4 text-xs font-mono uppercase tracking-wider font-semibold"
          style={{ color: "var(--jade)" }}
        >
          <Shield className="w-4 h-4" />
          <span>Cryptographic Case Verification</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-mono font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--rail-ink)" }}
              >
                Complaint Reference Number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
                <input
                  type="text"
                  required
                  value={complaintRef}
                  onChange={(e) => setComplaintRef(e.target.value)}
                  placeholder="e.g. RG-2026-0001"
                  className="w-full rounded pl-9 pr-3 py-2 text-xs font-mono uppercase border focus:outline-none"
                  style={{
                    backgroundColor: "var(--archive-paper)",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-mono font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "var(--rail-ink)" }}
              >
                Secret Tracking Token
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-faint)" }} />
                <input
                  type="text"
                  required
                  value={trackingToken}
                  onChange={(e) => setTrackingToken(e.target.value)}
                  placeholder="Paste 32-character token"
                  className="w-full rounded pl-9 pr-3 py-2 text-xs font-mono border focus:outline-none"
                  style={{
                    backgroundColor: "var(--archive-paper)",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              className="p-3 rounded border text-xs flex items-center gap-2"
              style={{
                backgroundColor: "rgba(198,95,72,0.08)",
                borderColor: "rgba(198,95,72,0.3)",
                color: "var(--signal-red)",
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !complaintRef.trim() || !trackingToken.trim()}
            className="w-full py-2.5 px-4 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? "Verifying SHA-256 Token..." : "Authenticate & Track Case"}</span>
          </button>
        </form>

        {/* Demo Preset Buttons */}
        <div
          className="mt-5 pt-4 border-t"
          style={{ borderColor: "var(--paper-mid)" }}
        >
          <span
            className="text-[10px] font-mono block mb-2 font-semibold uppercase tracking-wider"
            style={{ color: "var(--ink-muted)" }}
          >
            Demonstration Presets (One-Click Testing):
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => loadPreset("RG-2026-0001", "TOKEN-DEMO-RG-2026-0001")}
              className="px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              Case 0001 (Submitted)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("RG-2026-0007", "TOKEN-DEMO-RG-2026-0007")}
              className="px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              Case 0007 (Under Review)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("RG-2026-0012", "TOKEN-DEMO-RG-2026-0012")}
              className="px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              Case 0012 (Investigation)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("RG-2026-0026", "TOKEN-DEMO-RG-2026-0026")}
              className="px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              Case 0026 (Resolved)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("RG-2026-0031", "TOKEN-DEMO-RG-2026-0031")}
              className="px-2.5 py-1 rounded border text-[11px] font-mono transition-colors cursor-pointer"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              Case 0031 (Rejected)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tracking Details View */}
      {complaint && (
        <div
          className="rounded-lg border p-6 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-300"
          style={{
            backgroundColor: "white",
            borderColor: "var(--paper-mid)",
            color: "var(--rail-ink)",
          }}
        >
          {/* Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b"
            style={{ borderColor: "var(--paper-mid)" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono" style={{ color: "var(--jade)" }}>
                  {complaint.complaintRef}
                </span>
                {(() => {
                  const s = getStatusBadgeStyle(complaint.status);
                  return (
                    <span
                      className="px-2.5 py-0.5 rounded text-xs font-mono font-bold border"
                      style={{
                        backgroundColor: s.bg,
                        color: s.text,
                        borderColor: s.border,
                      }}
                    >
                      {complaint.status.replace("_", " ")}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                Submitted on {new Date(complaint.createdAt).toLocaleString()} UTC
              </p>
            </div>

            <div
              className="text-xs font-mono px-3 py-1.5 rounded border"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--ink-muted)",
              }}
            >
              Category:{" "}
              <strong style={{ color: "var(--rail-ink)" }}>
                {complaint.category.replace("_", " ")}
              </strong>
            </div>
          </div>

          {/* Resolution Outcome Banner if Closed */}
          {complaint.resolutionSummary && (
            <div
              className="p-4 rounded border text-xs leading-relaxed"
              style={{
                backgroundColor:
                  complaint.status === "RESOLVED" ? "#eef8f2" : "#faf0f0",
                borderColor:
                  complaint.status === "RESOLVED" ? "#b4e3c5" : "#e8c0c0",
                color:
                  complaint.status === "RESOLVED" ? "#1b6334" : "#7a2828",
              }}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {complaint.status === "RESOLVED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {complaint.status === "RESOLVED"
                    ? "Case Verified & Formally Resolved"
                    : "Inquiry Concluded: Allegation Disproven / Rejected"}
                </span>
              </div>
              <p>{complaint.resolutionSummary}</p>
            </div>
          )}

          {/* Allegation Summary */}
          <div>
            <h4
              className="text-xs font-mono font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--ink-muted)" }}
            >
              Reported Food Condition
            </h4>
            <div
              className="p-3.5 rounded border text-xs leading-relaxed font-sans"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              &ldquo;{complaint.description}&rdquo;
            </div>
          </div>

          {/* Journey Context */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-4 rounded border"
            style={{
              backgroundColor: "var(--archive-paper)",
              borderColor: "var(--paper-mid)",
            }}
          >
            <div>
              <span className="font-mono block mb-0.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                TRAIN / ROUTE
              </span>
              <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                <Train className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
                <span>{complaint.train?.trainNumber || complaint.unmatchedTrainNumber || "Unassigned"}</span>
              </div>
              {complaint.coach && (
                <div className="text-[11px] font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                  Coach: {complaint.coach}
                </div>
              )}
            </div>

            <div>
              <span className="font-mono block mb-0.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                STATION
              </span>
              <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: "var(--brass)" }} />
                <span>{complaint.station ? `${complaint.station.code} (${complaint.station.name})` : "En-route"}</span>
              </div>
            </div>

            <div>
              <span className="font-mono block mb-0.5 text-[10px]" style={{ color: "var(--ink-faint)" }}>
                DATE OF SERVICE
              </span>
              <div className="font-semibold flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--ink-muted)" }} />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Evidence Photos */}
          {complaint.evidenceAssets.length > 0 && (
            <div>
              <h4
                className="text-xs font-mono font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                style={{ color: "var(--ink-muted)" }}
              >
                <FileImage className="w-4 h-4" style={{ color: "var(--jade)" }} />
                <span>Attached Evidence Photos ({complaint.evidenceAssets.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {complaint.evidenceAssets.map((ev) => (
                  <div
                    key={ev.id}
                    className="border rounded overflow-hidden"
                    style={{
                      borderColor: "var(--paper-mid)",
                      backgroundColor: "var(--archive-paper)",
                    }}
                  >
                    <div className="aspect-[4/3] w-full flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.streamUrl || `/api/evidence/${ev.id}`}
                        alt={ev.fileName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      className="p-2 border-t text-[11px] font-mono flex items-center justify-between"
                      style={{
                        backgroundColor: "white",
                        borderColor: "var(--paper-mid)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span className="truncate">{ev.fileName}</span>
                      <span style={{ color: "var(--jade)" }}>Verified Asset</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Audit Events Timeline */}
          <div>
            <h4
              className="text-xs font-mono font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
              style={{ color: "var(--ink-muted)" }}
            >
              <History className="w-4 h-4" style={{ color: "var(--brass)" }} />
              <span>Public Audit Timeline ({complaint.publicEvents.length} Milestones)</span>
            </h4>

            <div
              className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5"
              style={{
                // @ts-expect-error custom variable
                "--tw-before-bg": "var(--paper-mid)",
              }}
            >
              {complaint.publicEvents.map((evt, idx) => (
                <div key={idx} className="relative">
                  <span
                    className="absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      borderColor: "var(--jade)",
                      backgroundColor: "white",
                    }}
                  />
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-0.5">
                      <span className="font-bold" style={{ color: "var(--jade)" }}>
                        {evt.newStatus.replace("_", " ")}
                      </span>
                      <span style={{ color: "var(--ink-faint)" }}>
                        {new Date(evt.createdAt).toLocaleDateString()} {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: "var(--rail-ink)" }}>
                      {evt.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
