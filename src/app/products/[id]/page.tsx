import Link from "next/link";
import { verifyPackagingUnit } from "@/services/productService";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  ArrowLeft,
  FileText,
  Building2,
  Calendar,
  Clock,
  QrCode,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductVerificationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductVerificationPage({
  params,
}: ProductVerificationPageProps) {
  const { id } = await params;
  const result = await verifyPackagingUnit(id);

  const getStatusBadge = () => {
    switch (result.status) {
      case "VERIFIED":
        return {
          bg: "#f2f7f5",
          border: "#c2d9d2",
          text: "var(--jade)",
          icon: <ShieldCheck className="w-8 h-8" style={{ color: "var(--jade)" }} />,
          title: "Demonstration Record Verified",
          subtitle:
            "This packaging batch matches a registered demonstration pantry catering record.",
        };
      case "EXPIRED":
        return {
          bg: "#fdf8ee",
          border: "#ebd7a9",
          text: "var(--brass)",
          icon: <AlertTriangle className="w-8 h-8" style={{ color: "var(--brass)" }} />,
          title: "Packaging Batch Expired",
          subtitle:
            "Official records indicate this batch has exceeded its permitted consumption window.",
        };
      case "RECALLED":
        return {
          bg: "#fbf2ef",
          border: "#ecc8be",
          text: "var(--signal-red)",
          icon: <AlertOctagon className="w-8 h-8" style={{ color: "var(--signal-red)" }} />,
          title: "Batch Recalled by Quality Control",
          subtitle:
            "This batch has been marked as recalled. Do not consume this product.",
        };
      case "UNRECOGNIZED":
      default:
        return {
          bg: "white",
          border: "var(--paper-mid)",
          text: "var(--ink-muted)",
          icon: <HelpCircle className="w-8 h-8" style={{ color: "var(--ink-faint)" }} />,
          title: "Unregistered Packaging Identifier",
          subtitle:
            "This code was not found in the demonstration registry. It may be unregistered or non-standard.",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--archive-paper)", color: "var(--rail-ink)" }}
    >
      {/* Top Navigation */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium text-sm transition-colors"
            style={{ color: "var(--ink-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to RailGuard
          </Link>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded font-mono font-semibold uppercase tracking-wider border"
              style={{
                backgroundColor: "rgba(82, 124, 114, 0.1)",
                borderColor: "rgba(82, 124, 114, 0.3)",
                color: "var(--jade)",
              }}
            >
              Simulated Audit Register
            </span>
          </div>
        </div>
      </header>

      {/* Decorative route line */}
      <div className="route-line" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Status Banner */}
        <div
          className="rounded-lg border p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-5"
          style={{
            backgroundColor: badge.bg,
            borderColor: badge.border,
          }}
        >
          <div
            className="p-2.5 rounded border"
            style={{ backgroundColor: "white", borderColor: badge.border }}
          >
            {badge.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold font-serif" style={{ color: "var(--rail-ink)" }}>
                {badge.title}
              </h1>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded border font-semibold"
                style={{
                  backgroundColor: "white",
                  borderColor: badge.border,
                  color: badge.text,
                }}
              >
                {result.status}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
              {badge.subtitle}
            </p>
          </div>
          <Link
            href={`/report?p=${encodeURIComponent(id)}`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded text-xs font-semibold transition-colors"
            style={{
              backgroundColor: "var(--rail-ink)",
              color: "var(--archive-paper)",
            }}
          >
            <FileText className="w-4 h-4" />
            Report Issue
          </Link>
        </div>

        {/* Product & Packaging Details */}
        {result.isRecognized && result.product && result.packagingUnit && result.vendor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Information */}
            <div
              className="rounded-lg border p-6"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
              }}
            >
              <div
                className="flex items-center gap-2 pb-3 mb-4 border-b"
                style={{ borderColor: "var(--paper-mid)" }}
              >
                <Building2 className="w-5 h-5" style={{ color: "var(--jade)" }} />
                <h2 className="font-semibold text-sm font-serif" style={{ color: "var(--rail-ink)" }}>
                  Product &amp; Caterer Profile
                </h2>
              </div>
              <dl className="space-y-3.5 text-sm">
                <div>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    Product Name
                  </dt>
                  <dd className="font-semibold text-base mt-0.5" style={{ color: "var(--rail-ink)" }}>
                    {result.product.name}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                      Category
                    </dt>
                    <dd className="font-medium mt-0.5" style={{ color: "var(--rail-ink)" }}>
                      {result.product.category.replace("_", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                      Shelf Life
                    </dt>
                    <dd className="font-medium mt-0.5 flex items-center gap-1" style={{ color: "var(--rail-ink)" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "var(--ink-faint)" }} />
                      {result.product.shelfLifeHours} Hours
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    FSSAI / Safety License
                  </dt>
                  <dd
                    className="font-mono text-xs px-2 py-1 rounded border mt-0.5 inline-block"
                    style={{
                      backgroundColor: "var(--archive-paper)",
                      borderColor: "var(--paper-mid)",
                      color: "var(--rail-ink)",
                    }}
                  >
                    {result.product.fssaiLicense}
                  </dd>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: "var(--paper-mid)" }}>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    Authorized Caterer / Contractor
                  </dt>
                  <dd className="font-medium mt-0.5 flex items-center justify-between" style={{ color: "var(--rail-ink)" }}>
                    <span>{result.vendor.name}</span>
                    <span className="text-xs font-mono" style={{ color: "var(--ink-muted)" }}>
                      {result.vendor.code}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Packaging Unit & Batch Information */}
            <div
              className="rounded-lg border p-6"
              style={{
                backgroundColor: "white",
                borderColor: "var(--paper-mid)",
              }}
            >
              <div
                className="flex items-center gap-2 pb-3 mb-4 border-b"
                style={{ borderColor: "var(--paper-mid)" }}
              >
                <QrCode className="w-5 h-5" style={{ color: "var(--brass)" }} />
                <h2 className="font-semibold text-sm font-serif" style={{ color: "var(--rail-ink)" }}>
                  Packaging Batch Register
                </h2>
              </div>
              <dl className="space-y-3.5 text-sm">
                <div>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    Batch Number
                  </dt>
                  <dd className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--rail-ink)" }}>
                    {result.packagingUnit.batchNumber}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-mono uppercase flex items-center gap-1" style={{ color: "var(--ink-faint)" }}>
                      <Calendar className="w-3.5 h-3.5" />
                      Packaged On
                    </dt>
                    <dd className="text-xs font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      {new Date(result.packagingUnit.packagingDate).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-mono uppercase flex items-center gap-1" style={{ color: "var(--ink-faint)" }}>
                      <Calendar className="w-3.5 h-3.5" />
                      Expiry Date
                    </dt>
                    <dd className="text-xs font-mono mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      {new Date(result.packagingUnit.expiryDate).toLocaleString()}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    QR Identifier Token
                  </dt>
                  <dd
                    className="font-mono text-xs p-2 rounded border mt-0.5 break-all"
                    style={{
                      backgroundColor: "var(--archive-paper)",
                      borderColor: "var(--paper-mid)",
                      color: "var(--rail-ink)",
                    }}
                  >
                    {result.packagingUnit.qrCodeIdentifier}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-mono uppercase" style={{ color: "var(--ink-faint)" }}>
                    Batch Status
                  </dt>
                  <dd className="mt-0.5">
                    <span
                      className="inline-block text-xs font-mono font-semibold px-2 py-0.5 rounded border"
                      style={{
                        backgroundColor: "var(--archive-paper)",
                        borderColor: "var(--paper-mid)",
                        color: "var(--rail-ink)",
                      }}
                    >
                      {result.packagingUnit.status}
                    </span>
                  </dd>
                </div>
              </dl>

              {/* Action Buttons for Verified Batch */}
              <div
                className="mt-6 pt-4 border-t flex flex-wrap items-center gap-3"
                style={{ borderColor: "var(--paper-mid)" }}
              >
                <Link
                  href={`/report?p=${encodeURIComponent(result.packagingUnit.qrCodeIdentifier)}`}
                  className="px-4 py-2 rounded text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  style={{ backgroundColor: "var(--signal-red)" }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Report Issue With This Batch</span>
                </Link>
                <Link
                  href="/"
                  className="px-4 py-2 rounded text-xs font-medium border transition-colors"
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                >
                  Check Another Code
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg border p-8 text-center"
            style={{
              backgroundColor: "white",
              borderColor: "var(--paper-mid)",
            }}
          >
            <HelpCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--ink-faint)" }} />
            <h3 className="text-lg font-bold font-serif" style={{ color: "var(--rail-ink)" }}>
              Packaging Record Not in Registry
            </h3>
            <p className="text-sm max-w-md mx-auto mt-1 mb-6" style={{ color: "var(--ink-muted)" }}>
              The identifier{" "}
              <code
                className="font-mono text-xs px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: "var(--archive-paper)",
                  borderColor: "var(--paper-mid)",
                }}
              >
                {id}
              </code>{" "}
              was not found in the demonstration registry. If you suspect packaging tampering or
              unapproved vending, you can still file an unverified complaint.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/report?p=${encodeURIComponent(id)}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded text-white text-xs font-semibold transition-colors"
                style={{ backgroundColor: "var(--rail-ink)" }}
              >
                File Unverified Complaint
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded text-xs font-medium border transition-colors"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--paper-mid)",
                  color: "var(--rail-ink)",
                }}
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}

        {/* Prototype Disclaimer */}
        <div
          className="mt-8 rounded-lg border p-4 text-xs leading-relaxed"
          style={{
            backgroundColor: "white",
            borderColor: "var(--paper-mid)",
            color: "var(--ink-muted)",
          }}
        >
          <p className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--rail-ink)" }}>
            <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--jade)" }} />
            Demonstration Prototype Disclaimer
          </p>
          RailGuard is an academic research platform for railway food quality oversight. All
          caterer names, meal trays, FSSAI numbers, and packaging identifiers are simulated
          demonstration records. A scanned QR code validates existence in this demonstration database;
          it does not substitute for physical anti-counterfeiting measures.
        </div>
      </main>

      {/* Footer */}
      <footer
        className="py-4 px-6 text-center text-xs font-mono border-t mt-auto"
        style={{
          backgroundColor: "var(--rail-ink)",
          borderColor: "rgba(240,237,228,0.1)",
          color: "rgba(240,237,228,0.4)",
        }}
      >
        RailGuard Product &amp; Packaging Verification • Demonstration System
      </footer>
    </div>
  );
}
