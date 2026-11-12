# RailGuard — 14-Day Implementation Roadmap

---

## Overview

This roadmap defines the sequential progression of RailGuard over an iterative 14-day development cycle. Each milestone builds on verified previous foundations.

---

## Milestone Schedule

### Milestone 0 — Foundation & Tooling (Days 1–2) — [COMPLETED]
- [x] Initial inspection and Git repository setup.
- [x] Next.js 16 App Router initialization with TypeScript strict mode, React 19, Tailwind CSS v4.
- [x] Core dependencies installed and pinned (`prisma` v6.19.3, `zod`, `vitest`, `qrcode`, `lucide-react`, `clsx`, `tailwind-merge`).
- [x] `src/` directory hierarchy configured (`app`, `components`, `lib`, `services`, `types`, `tests`).
- [x] Vitest runner and path alias configuration (`vitest.config.mts`).
- [x] Prisma client singleton (`src/lib/db/prisma.ts`) and baseline `prisma/schema.prisma`.
- [x] `.env.example` and secure `.gitignore`.
- [x] Baseline smoke test verifying runner and path alias resolution.
- [x] Complete repository and agent documentation (`AGENTS.md`, `docs/*`).

### Milestone 1 — Data & Product Registration (Days 3–4) — [COMPLETED]
- [x] Implement full relational Prisma schema in `prisma/schema.prisma`:
  - Entities: `User`, `Station`, `Train`, `Vendor`, `Product`, `PackagingUnit`, `Complaint`, `ComplaintEvidence`, `Investigation`, `ComplaintEvent`, `CorrectiveAction`, `RecurringIssueAlert`.
- [x] Implement database seeder (`prisma/seed.ts`) with realistic demonstration caterers, pantry products, active packaging batches, stations, and trains.
- [x] Build server-side product lookup service (`src/services/productService.ts`).
- [x] Build packaging QR code generator utility (`src/lib/qr/generator.ts`).
- [x] Build public product verification view (`/products/[id]`).
- [x] Unit tests for valid, expired, and unrecognised packaging lookups (`src/tests/product.test.ts`).

### Milestone 2 — Passenger Reporting Flow (Days 5–6) — [COMPLETED]
- [x] Mobile-first responsive passenger reporting form (`/report?p=<qrCode>`).
- [x] Zod schema validation for passenger submissions (`src/app/api/complaints/route.ts`).
- [x] Client photo upload component with preview and size/format validation.
- [x] Evidence upload handler with binary signature checks and private storage abstraction.
- [x] Unique complaint reference generator (`RG-YYYY-XXXX`) and cryptographic tracking token generation.
- [x] Submission confirmation view with savable tracking token and one-time notice.
- [x] Unit & integration tests for complaint submission and upload validation (`src/tests/complaintSubmission.test.ts`).

### Milestone 3 — Authentication & Operational Dashboard (Days 7–8) — [COMPLETED]
- [x] Secure server-enforced authentication and session handling (`src/lib/auth/session.ts`).
- [x] Role-based access control guards for reviewer and admin operations.
- [x] Control Room dashboard overview page with operational KPIs (Active Cases, Urgent Spoilage, Overdue Investigations, Overdue Actions, Compliance Rate).
- [x] Interactive case table with multi-parameter filtering (status, category, search, sorting, pagination).
- [x] Permitted status transition controls for case reviewers.
- [x] Unit tests for RBAC enforcement and unauthorized route interception (`src/tests/rbacPermissions.test.ts`).

### Milestone 4 — Investigation Workflow & Passenger Tracking (Days 9–10) — [COMPLETED]
- [x] Case detail view (`/dashboard/complaints/[id]`) with authenticated evidence streaming proxy.
- [x] Investigator assignment and official findings documentation with determination enums.
- [x] Corrective action tracking with deadlines, responsible vendor, and compliance status.
- [x] Append-only event history logging on every state mutation (`ComplaintEvent` records).
- [x] Public passenger tracking portal (`/track`) requiring `complaintRef` + `trackingToken` via POST body.
- [x] Segregated timeline view strictly hiding internal reviewer notes and contact details.

### Milestone 5 — Recurring-Issue Rules & Operational Analytics (Days 11–12) — [COMPLETED]
- [x] Rule-based recurring issue detection engine (`src/services/recurringAlertService.ts`):
  - Threshold alerts for vendors, batches, and categories (3+ cases in 48h).
- [x] Supervisor recurring-issue alerts review panel in dashboard (`RecurringAlertsPanel.tsx`).
- [x] Operational analytics & trend visualizations (`OperationalAnalyticsView.tsx`).
- [x] Duplicate complaint correlation and flagging logic (`duplicateDetectionService.ts`).

### Milestone 6 — Testing, Hardening & Deployment (Days 13–14) — [COMPLETED]
- [x] Full end-to-end user journey verification (`scripts/e2eAcceptanceAudit.ts`).
- [x] Security audit: Rate limiting, short-lived evidence token auth, security headers, anti-enumeration error masking.
- [x] Performance profiling and production build verification (`npm run build`).
- [x] Deployment guide for Vercel + managed PostgreSQL (`docs/DEPLOYMENT.md`).
- [x] Demonstration walk-through guide and final project handoff report (`docs/DEMO_GUIDE.md`).

### Final Delivery — The Living Inspection Register (Design System & Error Resolution) — [COMPLETED]
- [x] Unified aesthetic direction: **The Living Inspection Register** (Swiss modernist typography + Indian railway heritage).
- [x] Color palette: Rail Ink (`#252D2B`), Archive Paper (`#F0EDE4`), Signal Red (`#C65F48`), Jade (`#527C72`), Brass (`#B28D55`).
- [x] Distinctive scenic railway journey hero illustration with animated route line, passing train, drifting clouds, and certified inspection seal.
- [x] Database resilience: Graceful error boundaries preventing unhandled `PrismaClientInitializationError` when PostgreSQL is offline.
- [x] Complete error audit across all 19 App Router routes and API handlers.
- [x] Verified full suite: `npm test` (79/79 pass), `npm run lint` (0 errors), `npx tsc --noEmit` (0 errors), `npm run build` (19 routes compiled).
