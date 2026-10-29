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

### Milestone 1 — Data & Product Registration (Days 3–4) — [NEXT]
- [ ] Implement full relational Prisma schema in `prisma/schema.prisma`:
  - Entities: `User`, `Vendor`, `Product`, `PackagingUnit`, `Complaint`, `ComplaintEvidence`, `Investigation`, `ComplaintEvent`, `CorrectiveAction`, `RecurringIssueAlert`.
- [ ] Implement database seeder (`prisma/seed.ts`) with realistic demonstration caterers, pantry products, and active packaging batches.
- [ ] Build server-side product lookup service (`src/services/productService.ts`).
- [ ] Build packaging QR code generator utility (`src/lib/qr/generator.ts`).
- [ ] Build public product verification view (`/products/[id]`).
- [ ] Unit tests for valid, expired, and unrecognised packaging lookups (`src/tests/product.test.ts`).

### Milestone 2 — Passenger Reporting Flow (Days 5–6)
- [ ] Mobile-first responsive passenger reporting form (`/report?p=<qrCode>`).
- [ ] Zod schema validation for passenger submissions (`src/lib/validation/complaint.ts`).
- [ ] Client photo upload component with preview and size/format validation.
- [ ] Evidence upload handler and private storage abstraction (`src/lib/storage/*`).
- [ ] Unique complaint reference generator (`RG-YYYY-XXXXX`) and cryptographic tracking token generation.
- [ ] Submission confirmation view with printable/savable tracking card.
- [ ] Unit & integration tests for complaint submission and upload validation.

### Milestone 3 — Authentication & Operational Dashboard (Days 7–8)
- [ ] Secure server-enforced authentication and session handling (`src/lib/auth/*`).
- [ ] Role-based access control middleware for `/dashboard/*` routes.
- [ ] Reviewer dashboard overview page with operational KPIs (Active Cases, Urgent Spoilage, Overdue Investigations).
- [ ] Interactive case table with multi-parameter filtering (status, category, vendor, date).
- [ ] Initial status transition controls for case reviewers.
- [ ] Unit tests for RBAC enforcement and unauthorized route interception.

### Milestone 4 — Investigation Workflow & Passenger Tracking (Days 9–10)
- [ ] Case detail view (`/dashboard/complaints/[id]`) with presigned evidence image viewer.
- [ ] Investigator assignment and official findings documentation.
- [ ] Corrective action tracking with deadlines and compliance status.
- [ ] Append-only event history logging on every state mutation.
- [ ] Public passenger tracking portal (`/track`) requiring `complaintRef` + `trackingToken`.
- [ ] Segregated timeline view hiding internal reviewer notes.

### Milestone 5 — Recurring-Issue Rules & Operational Analytics (Days 11–12)
- [ ] Rule-based recurring issue detection engine (`src/services/recurringIssueService.ts`):
  - Threshold alerts for vendors, batches, and specific categories.
- [ ] Supervisor recurring-issue alerts review panel in dashboard.
- [ ] Operational trend charts (category distribution, complaint volume over time) using Recharts.
- [ ] Duplicate complaint flagging logic.

### Milestone 6 — Testing, Hardening & Deployment (Days 13–14)
- [ ] Full end-to-end user journey verification.
- [ ] Security audit: Rate limiting, header security, CSRF protection, error masking.
- [ ] Performance profiling and build optimization.
- [ ] Deployment runbook for Vercel + managed PostgreSQL (Supabase).
- [ ] Demonstration walk-through script and final project handoff report.
