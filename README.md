# RailGuard — The Living Inspection Register

> **A mission-critical railway food quality audit, passenger feedback, and safety intelligence platform engineered with Next.js 16, React 19, Tailwind CSS v4, and Prisma ORM with PostgreSQL.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-blue.svg?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v6-2d3748.svg?style=flat&logo=prisma)](https://www.prisma.io/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-79%20Passed-green.svg?style=flat&logo=vitest)](https://vitest.dev/)

---

## ⚠️ Academic & Demonstration Disclaimer

**RailGuard is an independent academic research and engineering demonstration platform.**
It is **not** affiliated with, endorsed by, or integrated into the Ministry of Railways, Indian Railways, IRCTC (Indian Railway Catering and Tourism Corporation), or proprietary railway production networks. All train numbers, catering licenses, meal batches, barcode identifiers, passenger records, and incident reports are synthetic demonstration fixtures created solely for software evaluation and auditing workflows. Scanning a packaging QR code verifies a registered system record within the demonstration database; it does not constitute an official regulatory endorsement.

---

## 1. System Vision & The Living Inspection Register

RailGuard bridges the gap between on-train passenger dining experiences and central food-safety operations. Moving beyond disconnected comment boxes, RailGuard treats railway food safety as a **Living Inspection Register**:

$$\text{Packaging QR} \longrightarrow \text{Instant Verification} \longrightarrow \text{Tamper-Proof Report} \longrightarrow \text{Audit Timeline} \longrightarrow \text{Quality Investigation} \longrightarrow \text{Pattern Detection}$$

### The Design Philosophy
RailGuard embodies **The Living Inspection Register** visual identity:
- **Heritage & Modernity**: Combines Swiss modernist typography, high-density control-room data grids, and the tactile warmth of historical railway ledger archives.
- **Color Palette**:
  - `Rail Ink` (`#252D2B`): Primary typography and high-contrast control surfaces.
  - `Archive Paper` (`#F0EDE4`): Warm, glare-free background reflecting physical station logbooks.
  - `Signal Red` (`#C65F48`): High-severity alerts, health hazards, and formal rejection notices.
  - `Jade` (`#527C72`): Substantiated findings, successful transitions, and verified seals.
  - `Brass` (`#B28D55`): Warning thresholds, recurring pattern indicators, and audit badges.

---

## 2. Core Functional Modules

1. **Packaging QR Verification (`/products`)**:
   - Passengers or station inspectors scan on-pack QR codes to instantly verify caterer identity, license status, manufacturing batch, and packaging date.
2. **Passenger Reporting Portal (`/report`)**:
   - Frictionless submission with train, coach, seat, meal category, and photographic evidence attachment.
   - Client-side and server-side magic-byte file signature validation (`JPEG`, `PNG`, `WEBP`) up to 5 MB per asset.
   - Generates a permanent human-readable Case Reference (e.g. `RG-2026-XXXX`) and an immutable SHA-256 hashed tracking token.
3. **Public Case Tracking (`/track`)**:
   - Cryptographically protected tracking via HTTP POST payload (never exposing tracking tokens in GET query strings or referrer headers).
   - Uniform timing and generic error responses to prevent case enumeration.
   - 15-minute scoped HMAC-SHA256 tokens for safe evidence preview without exposing raw assets or permanent credentials.
4. **Operations Control Room (`/dashboard`)**:
   - High-density status board for Quality Reviewers and Rail Safety Administrators.
   - State transition engine enforcing allowed lifecycle flows (`SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `ACTION_REQUIRED` $\rightarrow$ `RESOLVED` / `REJECTED`).
   - Append-only immutable investigation logs with internal notes and public passenger notifications.
5. **Safety Intelligence & Pattern Engine**:
   - Automated recurring-issue detection clustering complaints by vendor, train route, station pantry, and meal category.
   - Severity-weighted health-hazard scoring (e.g. foreign objects, spoilage).
   - Duplicate submission suppression within configurable time windows.
6. **Hardened Atomic Demo Reset (`/api/demo/reset`)**:
   - Allows evaluators and reviewers to reset the database to a pristine 35-case audit baseline.
   - Enforces strict server-side admin session verification, CSRF origin checks, and production environment guards (`ALLOW_DEMO_RESET=true`).

---

## 3. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.4.3 | App Router, React Server Components (`RSC`), Server Actions |
| **Runtime** | React 19.3.0 | Modern concurrent rendering, clean client boundaries |
| **Styling** | Tailwind CSS v4 | PostCSS engine, custom CSS design tokens, zero-runtime overhead |
| **Database ORM** | Prisma v6.19.3 | Type-safe queries, migration engine, PostgreSQL provider |
| **Database** | PostgreSQL 16+ | Relational schema, indexing on tokens/refs, transaction safety |
| **Testing** | Vitest v5.0.5 | 79 unit and integration tests across 17 test suites |
| **Validation** | Zod v4.6.7 | Strict schema validation for all API routes and form submissions |
| **Security** | Node Crypto | Constant-time `timingSafeEqual`, SHA-256 token hashing, HMAC streaming |
| **Icons** | Lucide React | Modern geometric icons matching the control-room design |

---

## 4. Security & Compliance Invariants

- **Server-Enforced RBAC**: User identity and roles (`PASSENGER`, `QUALITY_REVIEWER`, `ADMIN`, `VENDOR_REPRESENTATIVE`) are always resolved and verified on the server against the database. Client claims and headers are never trusted.
- **Private Evidence Isolation**: Evidence images are never placed in `/public` or exposed via static public URLs. Files reside in isolated private storage and are streamed exclusively through `/api/evidence/[id]` after verifying an authenticated reviewer session or a valid 15-minute HMAC-SHA256 token.
- **Path Traversal Protection**: Evidence retrieval strictly verifies that resolved filesystem paths do not escape the designated storage directory.
- **Production Guard on Destructive Actions**: Database wipe and reset endpoints are permanently locked out in production unless `ALLOW_DEMO_RESET="true"` is explicitly passed in the server environment.
- **Defense Against Token Enumeration**: Public tracking employs IP-based sliding-window rate limiting, constant-time hash comparisons, and identical response times for nonexistent references vs invalid tokens.

---

## 5. Local Development Setup

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or `v11.x`
- **PostgreSQL**: `v16+` running locally or accessible in the cloud (e.g., Neon, Supabase)

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/railguard.git
   cd railguard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment template:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` to provide your PostgreSQL connection string:
   ```env
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/railguard?schema=public"
   DIRECT_URL="postgresql://postgres:postgres@localhost:5432/railguard?schema=public"
   AUTH_SECRET="your-development-auth-secret-min-32-chars-long"
   SESSION_SECRET="your-session-cookie-secret-min-32-chars-long"
   EVIDENCE_TOKEN_SECRET="your-hmac-evidence-token-secret-min-32-chars-long"
   DEMO_RESET_ADMIN_SECRET="your-admin-reset-key-secret-min-32-chars-long"
   ALLOW_DEMO_RESET="true"
   ```

4. **Initialize and Seed the Database**:
   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Apply migrations
   npm run db:migrate

   # Seed the 35 demonstration cases, vendors, trains, and inspection records
   npm run db:seed
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Demonstration Credentials

For evaluation and testing, the seed script provisions three pre-configured accounts:

| Role | Email Address | Access Scope |
| :--- | :--- | :--- |
| **Administrator** | `admin@railguard.test` | Full platform control, audit logs, recurring alert actions, system reset |
| **Quality Reviewer** | `reviewer@railguard.test` | Case investigations, state transitions, evidence verification |
| **Vendor Representative**| `vendor@railguard.test` | Vendor-scoped corrective action acknowledgments |

*To switch active roles in the local development environment, use the role switcher provided in the dashboard header.*

---

## 7. Verification & Quality Assurance

RailGuard maintains strict quality gates before any code is merged or deployed:

```bash
# 1. Run unit and integration tests (Vitest)
npm test

# 2. Run ESLint checks
npm run lint

# 3. Type check without emitting files
npx tsc --noEmit

# 4. Production build verification
npm run build
```

---

## 8. Production Deployment Guide (Vercel + Neon / Supabase)

RailGuard is fully optimized for zero-configuration deployment to [Vercel](https://vercel.com) paired with a serverless PostgreSQL provider such as [Neon](https://neon.tech) or [Supabase](https://supabase.com).

### Step 1: Provision PostgreSQL
1. Create a serverless PostgreSQL database on **Neon** or **Supabase**.
2. Retrieve the pooled connection string (for `DATABASE_URL`) and direct connection string (for `DIRECT_URL`).

### Step 2: Deploy to Vercel
1. Import your GitHub repository into the Vercel dashboard.
2. In the **Environment Variables** section, configure:
   - `DATABASE_URL`: Your pooled PostgreSQL connection string with `?pgbouncer=true` (or Neon pooled string).
   - `DIRECT_URL`: Direct PostgreSQL connection string without pooler (for migrations).
   - `NEXT_PUBLIC_APP_URL`: Your production URL (e.g. `https://railguard.vercel.app`).
   - `AUTH_SECRET`: Random 32+ character hex or base64 secret (`openssl rand -base64 32`).
   - `SESSION_SECRET`: Random 32+ character string.
   - `EVIDENCE_TOKEN_SECRET`: Random 32+ character string.
   - `DEMO_RESET_ADMIN_SECRET`: Dedicated secret key for administrative automation.
   - `ALLOW_DEMO_RESET`: Set to `"false"` in production.
3. In **Build & Development Settings**:
   - Build Command: `npm run build` (Note: `postinstall: prisma generate` ensures Prisma Client is compiled).
4. Click **Deploy**.

### Step 3: Run Migrations and Seed
From your local terminal connected to the production database:
```bash
DATABASE_URL="<production-db-url>" DIRECT_URL="<production-direct-url>" npx prisma migrate deploy
DATABASE_URL="<production-db-url>" npx tsx prisma/seed.ts
```

---

## 9. Architectural Documentation

Comprehensive architectural specifications and decision records are maintained in `/docs`:

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System boundaries, evidence isolation, and server/client separation.
- [`docs/DATABASE.md`](./docs/DATABASE.md) — Relational schema, entity relationships, and state transition rules.
- [`docs/SECURITY.md`](./docs/SECURITY.md) — Threat models, RBAC enforcement, and rate-limiting specifications.
- [`docs/TESTING.md`](./docs/TESTING.md) — Test matrices, automated suites, and E2E validation procedures.
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Architecture Decision Records (ADRs).
- [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md) — Milestone tracking and verification history.

---

## 10. License

RailGuard is released under the **MIT License**. Created for academic research, food safety analysis, and passenger advocacy evaluation.
