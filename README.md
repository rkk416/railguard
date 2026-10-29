# RailGuard — Railway Food Quality Audit Platform

> **A professional passenger food-feedback and quality audit platform designed to enable rapid issue reporting via packaging QR codes, evidence verification, structured investigation, and automated pattern detection.**

---

## ⚠️ Demonstration Disclaimer

RailGuard is an independent research and engineering audit prototype. **It is not affiliated with, endorsed by, or integrated into Indian Railways, IRCTC, or proprietary railway backend systems.** All vendors, caterers, meal batches, and packaging identifiers presented within this application are simulated demonstration records created solely for audit and evaluation purposes. Scanning a QR code verifies a registered system record; it does not, by itself, guarantee the physical integrity of packaging.

---

## 1. System Overview

RailGuard establishes a transparent feedback loop between railway passengers and food safety quality teams:

$$\text{Register Product} \rightarrow \text{Generate QR} \rightarrow \text{Scan Packaging} \rightarrow \text{Verify Record} \rightarrow \text{Submit Complaint} \rightarrow \text{Store Evidence} \rightarrow \text{Investigate} \rightarrow \text{Record Action} \rightarrow \text{Track Resolution} \rightarrow \text{Analyse Patterns}$$

### Core Distinctions
- **Allegation**: An unverified passenger report.
- **Investigation**: Formal inquiry by authorized quality personnel.
- **Confirmed Finding**: Official substantiated determination.
- **Corrective Action**: Contractual or operational remedy imposed on a vendor.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router with React 19)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4, Lucide React
- **Database & ORM**: PostgreSQL with Prisma ORM v6
- **Schema Validation**: Zod
- **Testing**: Vitest (`vitest.config.mts`)
- **QR Code Generation**: `qrcode`
- **Object Storage**: Private bucket architecture (Supabase / S3-compatible) with presigned URLs

---

## 3. Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `10+` or `11+`
- PostgreSQL instance (local or hosted e.g. Supabase)

### Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url> railguard
   cd railguard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Update `DATABASE_URL` with your PostgreSQL connection string.

4. **Initialize Database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 4. Verification & Testing

```bash
# Run unit & integration test suite
npm test

# Run Vitest interactive watch mode
npm run test:watch

# Run linter
npm run lint

# Compile production build
npm run build
```

---

## 5. Repository Documentation

Comprehensive architectural and operational documentation is maintained under `docs/`:

- [**`AGENTS.md`**](./AGENTS.md) — Protocols, security invariants, and coding conventions for AI agents
- [**`docs/PROJECT_STATUS.md`**](./docs/PROJECT_STATUS.md) — Current milestone status, verified tests, and known issues
- [**`docs/NEXT_AGENT_TASK.md`**](./docs/NEXT_AGENT_TASK.md) — Immediate next agent handoff and acceptance criteria
- [**`docs/ARCHITECTURE.md`**](./docs/ARCHITECTURE.md) — System architecture, boundaries, and evidence isolation
- [**`docs/DATABASE.md`**](./docs/DATABASE.md) — Relational schema, ERD, state transitions, and audit trails
- [**`docs/FEATURES.md`**](./docs/FEATURES.md) — Functional specifications for all nine modules
- [**`docs/DEVELOPMENT_LOG.md`**](./docs/DEVELOPMENT_LOG.md) — Chronological log of engineering milestones
- [**`docs/DECISIONS.md`**](./docs/DECISIONS.md) — Architecture Decision Records (ADRs)
- [**`docs/TESTING.md`**](./docs/TESTING.md) — Test strategy and critical test matrix
- [**`docs/SECURITY.md`**](./docs/SECURITY.md) — Role-based access control and evidence protection
- [**`docs/ROADMAP.md`**](./docs/ROADMAP.md) — 14-day development plan across 7 milestones
