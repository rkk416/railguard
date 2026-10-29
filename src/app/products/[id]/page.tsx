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
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />,
          title: "Demonstration Record Verified",
          subtitle:
            "This packaging batch matches a registered demonstration pantry catering record.",
        };
      case "EXPIRED":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
          title: "Packaging Batch Expired",
          subtitle:
            "Official records indicate this batch has exceeded its permitted consumption window.",
        };
      case "RECALLED":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          icon: <AlertOctagon className="w-8 h-8 text-rose-600" />,
          title: "Batch Recalled by Quality Control",
          subtitle:
            "This batch has been marked as recalled. Do not consume this product.",
        };
      case "UNRECOGNIZED":
      default:
        return {
          bg: "bg-slate-50 border-slate-200 text-slate-800",
          icon: <HelpCircle className="w-8 h-8 text-slate-600" />,
          title: "Unregistered Packaging Identifier",
          subtitle:
            "This code was not found in the demonstration registry. It may be unregistered or non-standard.",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to RailGuard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
              Simulated Audit Data
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Status Banner */}
        <div
          className={`rounded-xl border p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${badge.bg}`}
        >
          <div className="p-2 rounded-lg bg-white/80 shadow-xs">{badge.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{badge.title}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/60 border">
                {result.status}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-90">{badge.subtitle}</p>
          </div>
          <Link
            href={`/report?p=${encodeURIComponent(id)}`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Report Issue
          </Link>
        </div>

        {/* Product & Packaging Details */}
        {result.isRecognized && result.product && result.packagingUnit && result.vendor ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h2 className="font-semibold text-slate-900">
                  Product & Caterer Information
                </h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    Product Name
                  </dt>
                  <dd className="font-medium text-slate-900 text-base mt-0.5">
                    {result.product.name}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Category
                    </dt>
                    <dd className="font-medium text-slate-800 mt-0.5">
                      {result.product.category.replace("_", " ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase">
                      Shelf Life
                    </dt>
                    <dd className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {result.product.shelfLifeHours} Hours
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    FSSAI / Safety License
                  </dt>
                  <dd className="font-mono text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 mt-0.5 inline-block">
                    {result.product.fssaiLicense}
                  </dd>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    Authorized Caterer / Vendor
                  </dt>
                  <dd className="font-medium text-slate-900 mt-0.5 flex items-center justify-between">
                    <span>{result.vendor.name}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {result.vendor.code}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Packaging Unit & Batch Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-900">
                  Packaging Batch Information
                </h2>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    Batch Number
                  </dt>
                  <dd className="font-mono text-sm font-semibold text-slate-900 mt-0.5">
                    {result.packagingUnit.batchNumber}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Packaged On
                    </dt>
                    <dd className="text-xs font-mono text-slate-700 mt-0.5">
                      {new Date(result.packagingUnit.packagingDate).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Expiry Date
                    </dt>
                    <dd className="text-xs font-mono text-slate-700 mt-0.5">
                      {new Date(result.packagingUnit.expiryDate).toLocaleString()}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    QR Identifier Token
                  </dt>
                  <dd className="font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5 break-all">
                    {result.packagingUnit.qrCodeIdentifier}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase">
                    Batch Status
                  </dt>
                  <dd className="mt-0.5">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {result.packagingUnit.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-900">
              Packaging Record Not in Registry
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 mb-6">
              The identifier <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{id}</code> is not currently registered. If you suspect packaging tampering or unapproved vending, you can still file an unverified complaint.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/report?p=${encodeURIComponent(id)}`}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-colors"
              >
                File Unverified Complaint
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}

        {/* Audit Prototype Disclaimer Card */}
        <div className="mt-10 rounded-xl bg-slate-100 border border-slate-200 p-5 text-xs text-slate-600 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Demonstration Prototype Disclaimer
          </p>
          RailGuard is an academic research platform for railway food quality oversight. All caterer names, meal trays, FSSAI numbers, and packaging identifiers shown above are simulated demonstration records. A scanned QR code validates that a record was entered in this demonstration system; it does not constitute physical tamper-proof verification of physical packaging.
        </div>
      </main>
    </div>
  );
}
