"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ComplaintCategory,
  ComplaintSeverity,
} from "@prisma/client";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  Copy,
  ExternalLink,
  Train,
  Send,
  Camera,
} from "lucide-react";
import { CameraQrScanner } from "@/components/qr/CameraQrScanner";

interface PackagingVerificationInfo {
  status: "VERIFIED" | "EXPIRED" | "RECALLED" | "UNRECOGNIZED";
  isRecognized: boolean;
  message: string;
  packagingUnit?: {
    batchNumber: string;
    expiryDate: string;
    qrCodeIdentifier: string;
  };
  product?: {
    name: string;
    category: string;
  };
  vendor?: {
    name: string;
    code: string;
  };
}

interface ComplaintReportingFormProps {
  initialQrCode?: string;
  seededStations: { id: string; code: string; name: string }[];
  seededTrains: { id: string; trainNumber: string; trainName: string }[];
}

export function ComplaintReportingForm({
  initialQrCode = "",
  seededStations,
  seededTrains,
}: ComplaintReportingFormProps) {
  // Packaging lookup state
  const [qrCode, setQrCode] = useState(initialQrCode);
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [verificationResult, setVerificationResult] = useState<PackagingVerificationInfo | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<ComplaintCategory>(ComplaintCategory.SPOILAGE);
  const [severity, setSeverity] = useState<ComplaintSeverity>(ComplaintSeverity.MEDIUM);
  const [description, setDescription] = useState("");
  const [trainNumber, setTrainNumber] = useState(seededTrains[0]?.trainNumber || "");
  const [stationCode, setStationCode] = useState(seededStations[0]?.code || "");
  const [coach, setCoach] = useState("");
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split("T")[0]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Evidence Files
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    complaintRef: string;
    trackingToken: string;
    createdAt: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Verify QR
  const verifyPackaging = useCallback(async (identifier: string) => {
    if (!identifier.trim()) return;
    setIsVerifyingQr(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();
      setVerificationResult(data);
    } catch {
      setVerificationResult({
        status: "UNRECOGNIZED",
        isRecognized: false,
        message: "Network or server lookup failed.",
      });
    } finally {
      setIsVerifyingQr(false);
    }
  }, []);

  // Auto-verify if initial QR code provided on mount
  useEffect(() => {
    if (!initialQrCode) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVerifyingQr(true);
    fetch(`/api/products/${encodeURIComponent(initialQrCode.trim())}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setVerificationResult(data); })
      .catch(() => {
        if (!cancelled)
          setVerificationResult({ status: "UNRECOGNIZED", isRecognized: false, message: "Network or server lookup failed." });
      })
      .finally(() => { if (!cancelled) setIsVerifyingQr(false); });
    return () => { cancelled = true; };
  }, [initialQrCode]);

  // Handle File Selections
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 3) {
      alert("You can upload a maximum of 3 evidence images.");
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const f of selected) {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds 5MB limit.`);
        continue;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        alert(`File "${f.name}" is not a supported format (JPEG, PNG, WebP).`);
        continue;
      }
      newFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setSubmitError("Description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      if (qrCode.trim()) formData.append("packagingQrCode", qrCode.trim());
      formData.append("category", category);
      formData.append("severity", severity);
      formData.append("description", description.trim());
      if (trainNumber.trim()) formData.append("trainNumber", trainNumber.trim());
      if (stationCode.trim()) formData.append("stationCode", stationCode.trim());
      if (coach.trim()) formData.append("coach", coach.trim());
      if (journeyDate) formData.append("journeyDate", journeyDate);
      if (contactEmail.trim()) formData.append("contactEmail", contactEmail.trim());
      if (contactPhone.trim()) formData.append("contactPhone", contactPhone.trim());

      for (const f of files) {
        formData.append("evidence", f);
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSubmissionResult({
        complaintRef: data.complaint.complaintRef,
        trackingToken: data.trackingToken,
        createdAt: data.complaint.createdAt,
      });

      // Cache token in sessionStorage so user doesn't lose it if they click Track
      try {
        sessionStorage.setItem(`rg_token_${data.complaint.complaintRef}`, data.trackingToken);
      } catch {
        // ignore storage error
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = () => {
    if (submissionResult?.trackingToken) {
      navigator.clipboard.writeText(submissionResult.trackingToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (submissionResult) {
    return (
      <div
        className="rounded-lg border p-6 sm:p-8 max-w-xl mx-auto shadow-md animate-in fade-in duration-300"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
          color: "var(--rail-ink)",
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{
              backgroundColor: "rgba(82, 124, 114, 0.12)",
              color: "var(--jade)",
            }}
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif tracking-tight" style={{ color: "var(--rail-ink)" }}>
            Complaint Logged Successfully
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
            Your allegation has been recorded in the central inspection register.
          </p>
        </div>

        {/* Case Reference & Secret Tracking Token Card */}
        <div
          className="rounded border p-5 mb-6 space-y-4"
          style={{
            backgroundColor: "var(--archive-paper)",
            borderColor: "var(--paper-mid)",
          }}
        >
          <div>
            <span
              className="text-[10px] font-mono uppercase tracking-wider block mb-1"
              style={{ color: "var(--ink-faint)" }}
            >
              Complaint Reference Number
            </span>
            <div className="text-2xl font-bold font-mono" style={{ color: "var(--jade)" }}>
              {submissionResult.complaintRef}
            </div>
          </div>

          <div className="pt-3 border-t" style={{ borderColor: "var(--paper-mid)" }}>
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                style={{ color: "var(--brass)" }}
              >
                Secret Tracking Token (Save Immediately)
              </span>
              <button
                type="button"
                onClick={copyToken}
                className="text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                style={{ color: "var(--jade)" }}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToken ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <div
              className="p-3 rounded border font-mono text-sm break-all select-all font-bold"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              {submissionResult.trackingToken}
            </div>
          </div>
        </div>

        {/* Important Warning Notice */}
        <div
          className="p-3.5 rounded border text-xs mb-6 flex items-start gap-2.5"
          style={{
            backgroundColor: "rgba(198, 95, 72, 0.08)",
            borderColor: "rgba(198, 95, 72, 0.3)",
            color: "var(--signal-red)",
          }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold mb-0.5">
              Cryptographic Token Privacy Notice:
            </strong>
            This raw tracking token is displayed exactly once and is{" "}
            <strong>never stored in plaintext on our servers</strong> (only its SHA-256 hash is kept).
            Save this token together with your reference number to track updates at{" "}
            <code className="font-mono px-1 py-0.5 rounded bg-black/10">/track</code>.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href={`/track?ref=${encodeURIComponent(submissionResult.complaintRef)}`}
            className="w-full py-2.5 px-4 font-semibold text-xs rounded flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            <span>Proceed to Public Tracking Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmissionResult(null);
              setDescription("");
              setFiles([]);
              setFilePreviews([]);
            }}
            className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold rounded border transition-colors cursor-pointer"
            style={{
              backgroundColor: "transparent",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          >
            File Another Report
          </button>
        </div>
      </div>
    );
  }

  // STANDARD FORM VIEW
  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* 1. Packaging QR Code Card */}
      <div
        className="rounded-lg border p-5 shadow-xs"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <label
            className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
            style={{ color: "var(--rail-ink)" }}
          >
            <QrCode className="w-4 h-4" style={{ color: "var(--jade)" }} />
            <span>Packaging QR Identifier (Optional)</span>
          </label>
          <span className="text-[11px] font-mono" style={{ color: "var(--ink-faint)" }}>
            Scan packaging barcode
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="e.g. DEMO-THALI-ACTIVE-001"
            className="flex-1 rounded px-3 py-2 text-xs font-mono border focus:outline-none"
            style={{
              backgroundColor: "var(--archive-paper)",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border"
            style={{
              backgroundColor: "var(--jade)",
              borderColor: "#3d5e56",
              color: "white",
            }}
            title="Scan packaging QR code with camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Camera</span>
          </button>
          <button
            type="button"
            disabled={isVerifyingQr || !qrCode.trim()}
            onClick={() => verifyPackaging(qrCode)}
            className="px-3.5 py-2 rounded text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            {isVerifyingQr ? "Checking..." : "Verify"}
          </button>
        </div>

        {/* Camera Scanner Dialog */}
        <CameraQrScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(scannedId) => {
            setQrCode(scannedId);
            verifyPackaging(scannedId);
          }}
        />

        {/* Verification Result Badge & Card */}
        {verificationResult && (
          <div
            className="p-3.5 rounded border text-xs"
            style={{
              backgroundColor:
                verificationResult.status === "VERIFIED"
                  ? "#f2f7f5"
                  : verificationResult.status === "EXPIRED"
                  ? "#fdf8ee"
                  : verificationResult.status === "RECALLED"
                  ? "#fbf2ef"
                  : "var(--archive-paper)",
              borderColor:
                verificationResult.status === "VERIFIED"
                  ? "#c2d9d2"
                  : verificationResult.status === "EXPIRED"
                  ? "#ebd7a9"
                  : verificationResult.status === "RECALLED"
                  ? "#ecc8be"
                  : "var(--paper-mid)",
              color:
                verificationResult.status === "VERIFIED"
                  ? "var(--jade)"
                  : verificationResult.status === "EXPIRED"
                  ? "var(--brass)"
                  : verificationResult.status === "RECALLED"
                  ? "var(--signal-red)"
                  : "var(--ink-muted)",
            }}
          >
            <div className="flex items-center justify-between font-mono font-bold mb-1.5">
              <span>Status: {verificationResult.status}</span>
              {verificationResult.product && (
                <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  {verificationResult.product.name}
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed mb-1">{verificationResult.message}</p>
            {verificationResult.vendor && (
              <div
                className="text-[10px] font-mono pt-1 border-t"
                style={{ borderColor: "currentColor", opacity: 0.8 }}
              >
                Authorized Caterer: {verificationResult.vendor.name} ({verificationResult.vendor.code})
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Allegation Details Card */}
      <div
        className="rounded-lg border p-5 shadow-xs space-y-4"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
          style={{ color: "var(--rail-ink)" }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: "var(--signal-red)" }} />
          <span>Incident Classification</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Category */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Food Issue Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full rounded p-2.5 border focus:outline-none"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              {Object.keys(ComplaintCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Perceived Hazard Severity *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
              className="w-full rounded p-2.5 border focus:outline-none"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              <option value={ComplaintSeverity.LOW}>LOW (Minor packaging or aesthetic defect)</option>
              <option value={ComplaintSeverity.MEDIUM}>MEDIUM (Temperature or freshness concern)</option>
              <option value={ComplaintSeverity.HIGH}>HIGH (Active spoilage, sour odor, foreign matter)</option>
              <option value={ComplaintSeverity.CRITICAL}>CRITICAL (Hazardous contamination, insect, sharp debris)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
            Detailed Allegation Description *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed: odor, texture, foreign object, temperature, or condition upon delivery..."
            className="w-full rounded p-3 text-xs leading-relaxed border focus:outline-none"
            style={{
              backgroundColor: "var(--archive-paper)",
              borderColor: "var(--paper-mid)",
              color: "var(--rail-ink)",
            }}
          />
          <div className="flex justify-between text-[11px] font-mono mt-1" style={{ color: "var(--ink-faint)" }}>
            <span>Minimum 10 characters</span>
            <span>{description.length} / 2500</span>
          </div>
        </div>
      </div>

      {/* 3. Journey Context Card */}
      <div
        className="rounded-lg border p-5 shadow-xs space-y-4"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
          style={{ color: "var(--rail-ink)" }}
        >
          <Train className="w-4 h-4" style={{ color: "var(--jade)" }} />
          <span>Journey &amp; Incident Location</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Train Number */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Train Number / Name
            </label>
            <input
              type="text"
              list="train-suggestions"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="e.g. 12951 or Mumbai Rajdhani"
              className="w-full rounded p-2.5 border focus:outline-none font-mono text-xs"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
            <datalist id="train-suggestions">
              {seededTrains.map((t) => (
                <option key={t.id} value={t.trainNumber}>
                  {t.trainNumber} - {t.trainName}
                </option>
              ))}
            </datalist>
          </div>

          {/* Incident Station */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Station / Nearest Transit Point
            </label>
            <select
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              className="w-full rounded p-2.5 border focus:outline-none"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            >
              <option value="">Select Station (Optional)</option>
              {seededStations.map((st) => (
                <option key={st.id} value={st.code}>
                  {st.code} - {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Coach Number */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Coach &amp; Berth / Seat (Optional)
            </label>
            <input
              type="text"
              value={coach}
              onChange={(e) => setCoach(e.target.value)}
              placeholder="e.g. B4 / Berth 42"
              className="w-full rounded p-2.5 border focus:outline-none font-mono text-xs"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
          </div>

          {/* Journey Date */}
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Date of Incident / Meal Service
            </label>
            <input
              type="date"
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              className="w-full rounded p-2.5 border focus:outline-none font-mono text-xs"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. Evidence Attachments */}
      <div
        className="rounded-lg border p-5 shadow-xs space-y-4"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
            style={{ color: "var(--rail-ink)" }}
          >
            <Upload className="w-4 h-4" style={{ color: "var(--brass)" }} />
            <span>Photographic Evidence (Up to 3 Photos, Max 5MB Each)</span>
          </h3>
          <span className="text-[11px] font-mono" style={{ color: "var(--ink-faint)" }}>
            {files.length} / 3 selected
          </span>
        </div>

        {/* Upload Button */}
        {files.length < 3 && (
          <label
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
            style={{
              borderColor: "var(--paper-mid)",
              backgroundColor: "var(--archive-paper)",
            }}
          >
            <Upload className="w-6 h-6 mb-2" style={{ color: "var(--ink-faint)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--rail-ink)" }}>
              Click to select meal photographs
            </span>
            <span className="text-[11px] mt-1" style={{ color: "var(--ink-faint)" }}>
              JPEG, PNG, or WebP up to 5MB
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* Selected Previews */}
        {filePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {filePreviews.map((preview, idx) => (
              <div
                key={idx}
                className="relative rounded border overflow-hidden aspect-square group"
                style={{
                  borderColor: "var(--paper-mid)",
                  backgroundColor: "var(--archive-paper)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Evidence preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Optional Passenger Contact Details */}
      <div
        className="rounded-lg border p-5 shadow-xs space-y-4"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xs font-bold uppercase tracking-wider font-mono"
            style={{ color: "var(--rail-ink)" }}
          >
            Optional Contact Details
          </h3>
          <span className="text-[11px] font-mono" style={{ color: "var(--ink-faint)" }}>
            Token tracking is always anonymous
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="For notification on remedy resolution"
              className="w-full rounded p-2.5 border focus:outline-none"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1.5" style={{ color: "var(--rail-ink)" }}>
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="Mobile contact for inspection inquiry"
              className="w-full rounded p-2.5 border focus:outline-none font-mono"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
                color: "var(--rail-ink)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Submit Error Banner */}
      {submitError && (
        <div
          className="p-3.5 rounded border text-xs flex items-center gap-2"
          style={{
            backgroundColor: "rgba(198, 95, 72, 0.08)",
            borderColor: "rgba(198, 95, 72, 0.3)",
            color: "var(--signal-red)",
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || description.trim().length < 10}
        className="w-full py-3 px-6 rounded font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
        style={{
          backgroundColor: "var(--rail-ink)",
          color: "var(--archive-paper)",
        }}
      >
        <Send className="w-4 h-4" />
        <span>{isSubmitting ? "Cryptographically Securing & Logging..." : "Submit Incident Allegation"}</span>
      </button>
    </form>
  );
}
