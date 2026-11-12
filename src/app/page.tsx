import Link from "next/link";
import { PackagingLookupForm } from "@/components/passenger/PackagingLookupForm";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--archive-paper)", color: "var(--rail-ink)" }}
    >
      {/* ── Prototype Disclaimer Banner ── */}
      <div
        className="text-center px-4 py-2 text-xs font-mono tracking-wide"
        style={{
          backgroundColor: "var(--rail-ink)",
          color: "var(--archive-paper)",
          opacity: 0.92,
        }}
      >
        <span style={{ color: "var(--brass)" }} className="font-semibold">
          Academic Demonstration Prototype:
        </span>{" "}
        Independent railway food quality study — not affiliated with or endorsed by Indian Railways or IRCTC.
      </div>

      {/* ── Navigation ── */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: "var(--archive-paper)",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded flex items-center justify-center text-white font-bold text-sm font-mono"
              style={{ backgroundColor: "var(--rail-ink)" }}
            >
              RG
            </div>
            <div>
              <span
                className="text-base font-bold tracking-tight font-serif"
                style={{ color: "var(--rail-ink)" }}
              >
                RailGuard
              </span>
              <span
                className="text-[9px] block font-mono uppercase tracking-widest"
                style={{ color: "var(--ink-faint)" }}
              >
                Inspection Register
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
            <Link
              href="/report"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{ color: "var(--signal-red)", border: "1px solid var(--signal-red)" }}
            >
              <AlertCircle className="w-3 h-3" />
              Report Issue
            </Link>
            <Link
              href="/track"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: "transparent",
                color: "var(--ink-muted)",
                border: "1px solid var(--paper-mid)",
              }}
            >
              <Search className="w-3 h-3" />
              Track
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors"
              style={{
                backgroundColor: "var(--rail-ink)",
                color: "var(--archive-paper)",
              }}
            >
              Control Room
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Top route line */}
        <div className="route-line" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Text & CTA */}
            <div className="pb-10 lg:pb-16">
              {/* Stamp */}
              <div className="mb-6 inline-block">
                <span
                  className="stamp"
                  style={{ animationDelay: "0.3s", animation: "stamp-appear 0.5s 0.3s ease both" }}
                >
                  Food Safety Register
                </span>
              </div>

              <h1
                className="font-serif leading-tight tracking-tight"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  color: "var(--rail-ink)",
                  fontWeight: 800,
                }}
              >
                Safe, Quality Meals{" "}
                <span
                  style={{ color: "var(--jade)" }}
                  className="italic"
                >
                  Across Every Journey.
                </span>
              </h1>

              <p
                className="mt-4 text-base leading-relaxed max-w-md"
                style={{ color: "var(--ink-muted)" }}
              >
                Scan packaging QR codes, verify caterer licenses, report hygiene
                or spoilage concerns, and track formal investigations — all in
                one transparent register.
              </p>

              {/* Three prominent actions */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="card-lift flex items-center justify-between gap-3 px-5 py-4 rounded-lg border group"
                  style={{
                    backgroundColor: "var(--rail-ink)",
                    borderColor: "var(--rail-ink)",
                    color: "var(--archive-paper)",
                  }}
                >
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider opacity-70">
                      Verify
                    </div>
                    <div className="font-semibold text-sm mt-0.5">Check Product</div>
                  </div>
                  <Search className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>

                <Link
                  href="/report"
                  className="card-lift flex items-center justify-between gap-3 px-5 py-4 rounded-lg border group"
                  style={{
                    backgroundColor: "var(--signal-red)",
                    borderColor: "var(--signal-red)",
                    color: "white",
                  }}
                >
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider opacity-70">
                      Report
                    </div>
                    <div className="font-semibold text-sm mt-0.5">File an Issue</div>
                  </div>
                  <AlertCircle className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>

                <Link
                  href="/track"
                  className="card-lift flex items-center justify-between gap-3 px-5 py-4 rounded-lg border group"
                  style={{
                    backgroundColor: "var(--archive-paper)",
                    borderColor: "var(--paper-mid)",
                    color: "var(--rail-ink)",
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-mono uppercase tracking-wider"
                      style={{ color: "var(--ink-faint)" }}
                    >
                      Track
                    </div>
                    <div className="font-semibold text-sm mt-0.5">Follow Up</div>
                  </div>
                  <FileText
                    className="w-5 h-5 group-hover:opacity-80 transition-opacity shrink-0"
                    style={{ color: "var(--jade)" }}
                  />
                </Link>
              </div>
            </div>

            {/* Right: Railway Illustration */}
            <div className="relative flex items-end justify-center lg:justify-end pb-0 self-end">
              <RailwayIllustration />
            </div>
          </div>
        </div>

        {/* Bottom route line */}
        <div className="route-line mt-0" />
      </section>

      {/* ── QR / Packaging Lookup ── */}
      <section
        className="py-10"
        style={{
          backgroundColor: "white",
          borderBottom: "1px solid var(--paper-mid)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <span
              className="text-xs font-mono uppercase tracking-widest font-semibold"
              style={{ color: "var(--jade)" }}
            >
              Packaging Verification
            </span>
            <h2
              className="text-xl font-bold font-serif mt-1"
              style={{ color: "var(--rail-ink)" }}
            >
              Scan or Enter a Batch Code
            </h2>
          </div>
          <PackagingLookupForm />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span
              className="text-xs font-mono uppercase tracking-widest font-semibold"
              style={{ color: "var(--jade)" }}
            >
              End-to-End Workflow
            </span>
            <h2
              className="text-2xl font-bold font-serif mt-1"
              style={{ color: "var(--rail-ink)" }}
            >
              How RailGuard Works
            </h2>
            <p
              className="text-sm mt-2 leading-relaxed"
              style={{ color: "var(--ink-muted)" }}
            >
              A structured chain of custody bridging passenger feedback with
              formal quality oversight.
            </p>
          </div>

          {/* Route-line process diagram */}
          <div className="relative">
            {/* Connecting line */}
            <div
              className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5"
              style={{ backgroundColor: "var(--paper-mid)" }}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
              {[
                {
                  num: "01",
                  title: "Scan & Verify",
                  body: "Scan the QR code on pantry meal packaging to check caterer license, batch validity, and expiry.",
                  color: "var(--jade)",
                },
                {
                  num: "02",
                  title: "Document Issue",
                  body: "Report spoilage, foreign objects, or hygiene concerns with photos, train number, and location.",
                  color: "var(--brass)",
                },
                {
                  num: "03",
                  title: "Investigate",
                  body: "Authorised reviewers triage evidence, assign inspectors, and record formal determination.",
                  color: "var(--signal-red)",
                },
                {
                  num: "04",
                  title: "Corrective Action",
                  body: "Vendor remedies are issued and tracked. Passenger receives a public status update.",
                  color: "var(--rail-ink)",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="card-lift relative p-5 rounded-lg border"
                  style={{
                    backgroundColor: "white",
                    borderColor: "var(--paper-mid)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center font-mono font-bold text-sm text-white mb-4"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.num}
                  </div>
                  <h3
                    className="font-semibold text-sm mb-1.5"
                    style={{ color: "var(--rail-ink)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Transparency Principles ── */}
      <section
        className="py-14 border-t border-b"
        style={{
          backgroundColor: "white",
          borderColor: "var(--paper-mid)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span
                className="text-xs font-mono uppercase tracking-widest font-semibold"
                style={{ color: "var(--jade)" }}
              >
                Fairness & Due Process
              </span>
              <h2
                className="text-2xl font-bold font-serif mt-1 leading-snug"
                style={{ color: "var(--rail-ink)" }}
              >
                Allegation ≠ Finding
              </h2>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                A passenger report is logged as an{" "}
                <strong style={{ color: "var(--rail-ink)" }}>allegation</strong>{" "}
                pending review. Only formal inspection by authorised safety teams
                constitutes a{" "}
                <strong style={{ color: "var(--rail-ink)" }}>confirmed finding</strong>.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  {
                    title: "Cryptographic Tracking Token",
                    body: "Protects passenger privacy and prevents enumeration of case records.",
                  },
                  {
                    title: "Isolated Private Evidence",
                    body: "Food photographs are stored privately with time-limited access — never publicly scraped.",
                  },
                  {
                    title: "Algorithmic Pattern Detection",
                    body: "Recurring complaints trigger automatic supervisory alerts without uncalibrated vendor blacklisting.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "var(--jade)", opacity: 0.15 }}
                    />
                    <CheckCircle2
                      className="w-5 h-5 shrink-0 mt-0.5 -ml-8"
                      style={{ color: "var(--jade)" }}
                    />
                    <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                      <strong style={{ color: "var(--rail-ink)" }}>{item.title}:</strong>{" "}
                      {item.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Progression Register */}
            <div
              className="rounded-lg border p-6"
              style={{
                backgroundColor: "var(--archive-paper)",
                borderColor: "var(--paper-mid)",
              }}
            >
              <div
                className="flex items-center gap-2 text-sm font-semibold mb-5 pb-4 border-b"
                style={{ color: "var(--rail-ink)", borderColor: "var(--paper-mid)" }}
              >
                <TrendingUp className="w-4 h-4" style={{ color: "var(--jade)" }} />
                Investigation Status Progression
              </div>
              <div className="space-y-2">
                {[
                  {
                    status: "SUBMITTED",
                    label: "Passenger report logged",
                    dot: "var(--ink-faint)",
                  },
                  {
                    status: "UNDER_REVIEW",
                    label: "Quality reviewer triage",
                    dot: "var(--brass)",
                  },
                  {
                    status: "INVESTIGATION",
                    label: "Inspector assigned",
                    dot: "var(--jade)",
                  },
                  {
                    status: "ACTION_REQUIRED",
                    label: "Corrective remedy issued",
                    dot: "var(--signal-red)",
                  },
                  {
                    status: "RESOLVED",
                    label: "Remedy verified & closed",
                    dot: "var(--jade)",
                  },
                ].map((s, i) => (
                  <div
                    key={s.status}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded border register-row"
                    style={{
                      backgroundColor: "white",
                      borderColor: "var(--paper-mid)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.dot }}
                      />
                      <span
                        className="font-mono text-xs font-semibold"
                        style={{ color: "var(--rail-ink)" }}
                      >
                        {i + 1}. {s.status}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="mt-auto py-10"
        style={{
          backgroundColor: "var(--rail-ink)",
          color: "var(--archive-paper)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b"
            style={{ borderColor: "rgba(240,237,228,0.1)" }}
          >
            <div>
              <div className="font-bold font-serif text-lg" style={{ color: "var(--archive-paper)" }}>
                RailGuard
              </div>
              <div className="text-xs font-mono mt-0.5" style={{ color: "var(--brass)" }}>
                The Living Inspection Register
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(240,237,228,0.6)" }}>
              <Link href="/track" className="hover:text-white transition-colors">
                Track Case
              </Link>
              <Link href="/report" className="hover:text-white transition-colors">
                Report Issue
              </Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Reviewer Portal
              </Link>
            </div>
          </div>
          <div
            className="pt-6 text-xs leading-relaxed"
            style={{ color: "rgba(240,237,228,0.45)" }}
          >
            RailGuard is an independent academic research demonstration platform for
            studying railway catering transparency and food quality reporting workflows. All
            vendor, product, train, and station references are simulated demonstration data.
            Not affiliated with or endorsed by Indian Railways or IRCTC.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Inline Railway Landscape Illustration ── */
function RailwayIllustration() {
  return (
    <div
      className="relative w-full max-w-sm lg:max-w-md"
      aria-hidden="true"
      role="presentation"
    >
      <svg
        viewBox="0 0 480 320"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        style={{ maxHeight: "340px" }}
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8e4d8" />
            <stop offset="100%" stopColor="#f0ede4" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8d4c0" />
            <stop offset="100%" stopColor="#b8c8b0" />
          </linearGradient>
          <linearGradient id="trainBody" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2d3b38" />
            <stop offset="100%" stopColor="#354442" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="480" height="220" fill="url(#sky)" />

        {/* Sun */}
        <circle cx="400" cy="55" r="30" fill="#f0d090" opacity="0.5" />
        <circle cx="400" cy="55" r="20" fill="#e8c060" opacity="0.6" />

        {/* Clouds — drifting */}
        <g style={{ animation: "cloud-drift 8s ease-in-out infinite alternate" }}>
          <ellipse cx="130" cy="60" rx="45" ry="18" fill="white" opacity="0.7" />
          <ellipse cx="155" cy="52" rx="30" ry="14" fill="white" opacity="0.8" />
          <ellipse cx="108" cy="58" rx="25" ry="12" fill="white" opacity="0.6" />
        </g>
        <g style={{ animation: "cloud-drift 11s ease-in-out 1s infinite alternate-reverse" }}>
          <ellipse cx="310" cy="40" rx="38" ry="15" fill="white" opacity="0.55" />
          <ellipse cx="332" cy="34" rx="24" ry="11" fill="white" opacity="0.6" />
        </g>

        {/* Distant mountains / hills */}
        <polygon points="0,180 80,100 160,180" fill="#9fb8a8" opacity="0.5" />
        <polygon points="60,180 170,90 280,180" fill="#8fa898" opacity="0.45" />
        <polygon points="200,180 320,80 440,180" fill="#7f9888" opacity="0.4" />
        <polygon points="340,180 430,110 480,180" fill="#8fa898" opacity="0.3" />

        {/* Ground / field */}
        <rect x="0" y="210" width="480" height="110" fill="url(#ground)" />

        {/* Field texture stripes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <rect
            key={i}
            x={i * 96}
            y="215"
            width="80"
            height="8"
            fill="#b0c0a4"
            opacity="0.4"
            rx="1"
          />
        ))}

        {/* Trees - left side */}
        {[30, 55, 20].map((h, i) => (
          <g key={i} transform={`translate(${20 + i * 28}, ${200 - h})`}>
            <rect x="-3" y={h} width="6" height="20" fill="#8a7055" />
            <ellipse cx="0" cy={h - 10} rx="14" ry={h * 0.6} fill="#5a7a60" opacity="0.85" />
          </g>
        ))}

        {/* Trees - right side */}
        {[40, 25, 50].map((h, i) => (
          <g key={i} transform={`translate(${400 + i * 28}, ${200 - h})`}>
            <rect x="-3" y={h} width="6" height="20" fill="#8a7055" />
            <ellipse cx="0" cy={h - 10} rx="14" ry={h * 0.6} fill="#5a7a60" opacity="0.85" />
          </g>
        ))}

        {/* Railway track base */}
        <rect x="0" y="232" width="480" height="12" fill="#c8b890" />

        {/* Track rails */}
        <rect x="0" y="233" width="480" height="2.5" fill="#a89870" rx="1" />
        <rect x="0" y="241" width="480" height="2.5" fill="#a89870" rx="1" />

        {/* Track sleepers */}
        {Array.from({ length: 24 }, (_, i) => (
          <rect
            key={i}
            x={i * 20 + 2}
            y="231"
            width="12"
            height="14"
            fill="#8a7050"
            opacity="0.5"
            rx="1"
          />
        ))}

        {/* Train — animated gentle float */}
        <g
          style={{
            animation: "float-gentle 4s ease-in-out infinite",
            transformOrigin: "240px 220px",
          }}
        >
          {/* Engine body */}
          <rect x="85" y="186" width="140" height="46" fill="url(#trainBody)" rx="4" />

          {/* Engine nose */}
          <rect x="220" y="192" width="30" height="34" fill="#2d3b38" rx="2" />
          <polygon points="250,196 270,206 270,218 250,222" fill="#354442" />

          {/* Windows */}
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={100 + i * 38}
              y="194"
              width="26"
              height="20"
              fill="#a0c8d8"
              rx="3"
              opacity="0.9"
            />
          ))}

          {/* Accent stripe */}
          <rect x="85" y="208" width="140" height="4" fill="var(--jade)" opacity="0.8" />
          <rect x="85" y="213" width="140" height="2" fill="var(--brass)" opacity="0.6" />

          {/* Cabin / cab */}
          <rect x="62" y="196" width="30" height="36" fill="#3a4a46" rx="2" />
          <rect x="66" y="200" width="20" height="14" fill="#80b0c0" rx="2" opacity="0.8" />

          {/* Chimney / horn */}
          <rect x="72" y="184" width="8" height="14" fill="#2d3b38" rx="2" />

          {/* Carriages */}
          <rect x="-60" y="194" width="90" height="38" fill="#354844" rx="4" />
          {[0, 1].map((i) => (
            <rect
              key={i}
              x={-50 + i * 36}
              y="200"
              width="26"
              height="18"
              fill="#90c0cc"
              rx="2"
              opacity="0.8"
            />
          ))}
          <rect x="-60" y="216" width="90" height="3" fill="var(--jade)" opacity="0.6" />

          {/* Wheels */}
          {[-40, -10, 60, 100, 160, 200].map((x) => (
            <circle key={x} cx={x} cy="234" r="10" fill="#1a2420" stroke="#8a9890" strokeWidth="2" />
          ))}
        </g>

        {/* Animated route line above train */}
        <line
          x1="0"
          y1="178"
          x2="480"
          y2="178"
          stroke="var(--jade)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.35"
          className="route-svg-line"
        />

        {/* Station marker dots */}
        {[80, 240, 400].map((x) => (
          <g key={x}>
            <circle cx={x} cy="178" r="4" fill="var(--archive-paper)" stroke="var(--jade)" strokeWidth="1.5" />
            <circle cx={x} cy="178" r="1.5" fill="var(--jade)" />
          </g>
        ))}

        {/* Inspection seal overlay — top right corner */}
        <g transform="translate(355, 20)">
          <circle cx="40" cy="40" r="36" fill="none" stroke="var(--jade)" strokeWidth="1.5" opacity="0.4" />
          <circle cx="40" cy="40" r="30" fill="none" stroke="var(--jade)" strokeWidth="0.8" opacity="0.3" />
          <text
            x="40"
            y="36"
            textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="7"
            fill="var(--jade)"
            opacity="0.6"
            fontWeight="600"
          >
            RAILGUARD
          </text>
          <text
            x="40"
            y="47"
            textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="5.5"
            fill="var(--jade)"
            opacity="0.5"
          >
            FOOD SAFETY
          </text>
          <text
            x="40"
            y="56"
            textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace"
            fontSize="5"
            fill="var(--jade)"
            opacity="0.45"
          >
            CERTIFIED AUDIT
          </text>
        </g>
      </svg>
    </div>
  );
}
