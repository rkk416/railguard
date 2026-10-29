import Link from "next/link";
import { PackagingLookupForm } from "@/components/passenger/PackagingLookupForm";
import {
  Search,
  AlertCircle,
  TrendingUp,
  Lock,
  Train,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner: Prototype Disclaimer */}
      <div className="bg-slate-900 text-slate-300 px-4 py-2 text-xs text-center border-b border-slate-800">
        <span className="font-semibold text-amber-400">Audit Demonstration Prototype:</span>{" "}
        Simulated railway food quality oversight system. Independent academic project — not affiliated with or endorsed by Indian Railways or IRCTC.
      </div>

      {/* Main Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Train className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                RailGuard
              </span>
              <span className="text-[10px] block font-mono uppercase tracking-wider text-slate-400 -mt-1">
                Quality Audit Platform
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
            <Link
              href="/track"
              className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span>Track Complaint</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Reviewer Portal</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 border-b border-slate-200 bg-linear-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-xs font-semibold mb-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
            Independent Railway Food Safety & Hygiene Audit
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl mx-auto leading-tight">
            Railway Food Safety, <br className="hidden sm:inline" />
            <span className="text-sky-700">Verified at Every Seat.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Scan packaging QR codes, verify caterer licenses and shelf-life records, report hygiene or spoilage concerns with photo evidence, and monitor formal investigations.
          </p>

          <div className="mt-10">
            <PackagingLookupForm />
          </div>
        </div>
      </section>

      {/* How RailGuard Works */}
      <section className="py-16 md:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-sky-700">
            End-to-End Workflow
          </h2>
          <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            How RailGuard Operates
          </p>
          <p className="text-sm text-slate-600 mt-2">
            A structured, evidence-driven chain of custody that bridges passenger feedback with quality control oversight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center mb-4">
              01
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              Scan & Verify Batch
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scan the QR code printed on authorized pantry meal packaging or enter the batch identifier to check caterer licenses, packaging timestamp, and expiry data.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center mb-4">
              02
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              Document with Evidence
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Encounter an issue? Report foreign objects, spoilage, or hygiene concerns with photographs, train number, and coach location. No account required.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center mb-4">
              03
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">
              Investigate & Rectify
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Authorised quality reviewers inspect evidence, assign inspectors, record formal findings, impose vendor corrective remedies, and update the passenger timeline.
            </p>
          </div>
        </div>
      </section>

      {/* Audit Transparency Core Principles */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-4 border border-slate-200">
                <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                Fairness & Due Process
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Clear Separation Between Allegation and Finding
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                RailGuard is engineered with operational integrity. A submitted passenger report is treated as an <strong>allegation</strong> pending review. Only formal inspection by authorized safety teams constitutes a <strong>confirmed finding</strong>.
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Cryptographic Tracking Token:</strong> Protects passenger privacy and stops unauthorized third parties from enumerating case records.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Isolated Private Evidence:</strong> Food photographs are stored in private storage with short-lived presigned URLs—never exposed to public scraping.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Algorithmic Pattern Detection:</strong> Recurring complaints trigger automatic supervisory alerts without uncalibrated vendor blacklisting.
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8 space-y-4">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" />
                Operational Status Progression
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">1. SUBMITTED</span>
                  <span className="text-slate-500">Passenger report logged</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-sky-800">2. UNDER_REVIEW</span>
                  <span className="text-slate-500">Quality reviewer triage</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-indigo-800">3. INVESTIGATION</span>
                  <span className="text-slate-500">Inspector assigned</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-amber-800">4. ACTION_REQUIRED</span>
                  <span className="text-slate-500">Corrective remedy issued</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">5. RESOLVED</span>
                  <span className="text-slate-500">Remedy verified & closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Train className="w-4 h-4 text-sky-400" />
              RailGuard
            </div>
            <div className="flex items-center gap-6 text-slate-400">
              <Link href="/track" className="hover:text-white transition-colors">
                Track Case
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Reviewer Portal
              </Link>
            </div>
          </div>
          <div className="pt-6 text-center sm:text-left text-slate-500 text-[11px] leading-relaxed">
            <p>
              RailGuard is an academic research demonstration platform designed for studying railway catering transparency and food quality reporting workflows. All vendor, product, and train references are simulated demonstration data. A scanned packaging QR code confirms record existence in the audit database; it does not substitute for physical anti-counterfeiting measures.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
