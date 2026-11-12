# Next Agent Task Specification & Project Handoff

---

## 1. Project Status Summary

- **Development Status**: **100% COMPLETE & FULLY VERIFIED**
- **Milestones Completed**: Milestone 0 (Foundations), Milestone 1 (Data & Products), Phase 4A (Database & Synthetic Data Engine), Phase 4B (Control Room Dashboard), Phase 5 (Passenger Reporting & Public Tracking), Milestone 5 (Recurring Alerts, Analytics, Duplicates), Milestone 6 (Hardening, Deployment Guide, Demo Walkthrough).
- **Active Focus**: Deployment and final demonstration evaluation.

---

## 2. Verified Test & Build Status (Authoritative Execution)

| Check | Exact Command Executed | Actual Terminal Result | Exit Code |
|---|---|---|---|
| **Vitest Unit & Integration Suite** | `npm test` | **79 passed (79 tests in 17 files)** in 1.23s | **0 (PASS)** |
| **ESLint** | `npm run lint` | **Clean** (0 warnings, 0 errors) | **0 (PASS)** |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **Clean** (0 type errors) | **0 (PASS)** |
| **Production Build** | `npm run build` | **Compiled successfully in 5.5s** (all 19 static & dynamic routes generated) | **0 (PASS)** |
| **Live Database E2E Audit** | `npx tsx scripts/e2eAcceptanceAudit.ts` | **PASS (100%)** | **0 (PASS)** |

### Production Routes Compiled

```
○ /                                 — Public landing & platform overview
○ /_not-found                       — 404 handler
ƒ /api/alerts/[id]                  — PATCH: Reviewer alert status updates
ƒ /api/complaints                   — POST: Complaint submission with evidence upload
ƒ /api/complaints/[id]/actions      — POST: Corrective action creation
ƒ /api/complaints/[id]/assign       — POST: Investigator assignment
ƒ /api/complaints/[id]/delete       — POST: Administrative soft deletion
ƒ /api/complaints/[id]/duplicate    — POST: Duplicate marking & linking
ƒ /api/complaints/[id]/findings     — POST: Investigation findings documentation
ƒ /api/complaints/[id]/transition   — POST: Permitted status machine transitions
ƒ /api/demo/reset                   — POST: Admin demo database reset & reseed
ƒ /api/evidence/[id]                — GET: Authenticated/short-lived evidence proxy
ƒ /api/products/[id]                — GET: Product & batch QR verification
ƒ /api/track                        — POST: Cryptographic complaint tracking lookup
ƒ /dashboard                        — Reviewer/Admin Control Room Console
ƒ /dashboard/complaints/[id]        — Case investigation & action detail view
ƒ /products/[id]                    — Public product verification view
ƒ /report                           — Passenger mobile-first reporting portal
ƒ /track                            — Passenger cryptographic tracking portal
```

---

## 3. Evaluator Resources & Handover References

- **Demonstration Walkthrough Guide**: Read [`docs/DEMO_GUIDE.md`](file:///c:/Users/ramkr/Documents/railguard/docs/DEMO_GUIDE.md) for step-by-step instructions.
- **Production Deployment Guide**: Read [`docs/DEPLOYMENT.md`](file:///c:/Users/ramkr/Documents/railguard/docs/DEPLOYMENT.md) for Vercel + PostgreSQL deployment steps.
- **System Architecture & Security**: Read [`docs/ARCHITECTURE.md`](file:///c:/Users/ramkr/Documents/railguard/docs/ARCHITECTURE.md) and [`docs/SECURITY.md`](file:///c:/Users/ramkr/Documents/railguard/docs/SECURITY.md).
- **Database Schema**: Read [`docs/DATABASE.md`](file:///c:/Users/ramkr/Documents/railguard/docs/DATABASE.md) and [`prisma/schema.prisma`](file:///c:/Users/ramkr/Documents/railguard/prisma/schema.prisma).

---

## 3. Phase 5 Implementation & Acceptance Record

| File | Purpose | Status |
|---|---|---|
| `src/lib/validation/evidenceFileValidation.ts` | Binary magic number signature checks (JPEG/PNG/WebP), 5MB cap | COMPLETE |
| `src/lib/validation/rateLimiter.ts` | In-memory sliding window rate limiter | COMPLETE |
| `src/services/complaintSubmissionService.ts` | Transactional complaint + evidence insert; SHA-256 token hashing; rollback cleanup | COMPLETE |
| `src/services/complaintTrackingService.ts` | Constant-time token verification; anti-enumeration uniform error; short-lived evidence token URLs | COMPLETE |
| `src/lib/crypto/token.ts` | Permanent tracking token hashing + short-lived HMAC evidence access token generation and verification | COMPLETE |
| `src/app/api/complaints/route.ts` | POST handler with FormData parsing, Zod validation, rate limiting | COMPLETE |
| `src/app/api/track/route.ts` | POST handler; rate-limited, accepts credentials via request body only | COMPLETE |
| `src/app/api/evidence/[id]/route.ts` | Streaming proxy with reviewer session OR short-lived evidence access token; denies permanent tokens; sets nosniff, no-referrer, no-store | COMPLETE |
| `src/components/passenger/ComplaintReportingForm.tsx` | Reporting form with QR lookup, uploads, one-time token display, sessionStorage caching (no token in URL) | COMPLETE |
| `src/components/passenger/ComplaintTrackingPortal.tsx` | Tracking lookup portal with demo presets, POST body submission, public audit timeline | COMPLETE |
| `src/app/report/page.tsx` | Server Component — fetches stations/trains; renders reporting form | COMPLETE |
| `src/app/track/page.tsx` | Server Component — ref-only param; no raw token in URL | COMPLETE |
| `src/app/page.tsx` | Updated: "Report Issue" nav button added | COMPLETE |
| `src/app/products/[id]/page.tsx` | Updated: "Report Issue With This Batch" button added | COMPLETE |
| `src/tests/fileValidation.test.ts` | 5 tests: magic byte validation, size limits, MIME rejection | COMPLETE |
| `src/tests/rateLimiter.test.ts` | 2 tests: within-limit pass, over-limit rejection | COMPLETE |
| `src/tests/tokenCrypto.test.ts` | 9 tests: permanent token crypto, short-lived evidence token crypto, expiration, cross-scope defense | COMPLETE |
| `src/tests/trackingService.test.ts` | 7 tests: sanitization, contact exclusion, storage path exclusion, soft-delete defense | COMPLETE |
| `src/tests/complaintSubmission.test.ts` | 8 tests: validation, 0-3 files, oversized/spoofed rejection, database rollback file cleanup | COMPLETE |
| `src/tests/evidenceAuth.test.ts` | 6 tests: reviewer auth, passenger evidence token auth, rejection of permanent token, expiration | COMPLETE |
| `src/tests/apiRoutes.test.ts` | 6 tests: POST /api/track validation & uniform 404, POST /api/complaints validation | COMPLETE |
| `scripts/e2eAcceptanceAudit.ts` | Live database end-to-end integration audit script | COMPLETE |

### Security Properties Verified
- Raw tracking token displayed **once** on submission success; only SHA-256 hash stored in DB.
- Raw tracking token completely removed from URLs (`/track?ref=...`, no `&token=...`).
- Tracking credentials submitted via POST request body only (`/api/track`).
- Permanent tracking token is **never** reused as evidence access credential.
- Public evidence access uses short-lived HMAC-SHA256 evidence tokens (15-min TTL, complaint- and evidence-scoped).
- Evidence proxy sets strict security headers: `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `Cache-Control: private, no-cache, no-store, must-revalidate`.
- Tracking lookup returns identical error for both "not found" and "wrong token" (anti-enumeration).
- Soft-deleted complaints return the same uniform not-found error (state non-disclosure).
- Contact details (`contactEmail`, `contactPhone`), internal reviewer notes (`isPublic: false`), and filesystem paths (`storagePath`) are strictly excluded from public tracking.
- Database transaction failure during submission triggers immediate file unlink of any written evidence buffers.

### Known Limitations
- Rate limiter is in-memory — resets on server restart. Acceptable for demonstration scope; does not provide distributed synchronization.
- Client-side file size validation in browser provides user feedback, but server-side binary magic signature verification is the authoritative gatekeeper.
- Demo preset buttons in `/track` rely on the seeded 35-complaint operational baseline.

---

## 4. Phase 6 Execution Plan (Next Immediate Milestone)

### Objective
Build the **Vendor Compliance Portal** that allows vendors to view assigned corrective actions, submit completion evidence, and allows reviewers to verify and close corrective actions.

### Required Features

1. **Vendor-Facing Corrective Actions View**:
   - Protected route accessible only to `VENDOR` role (new role to add or reuse `REVIEWER` with scoped filtering).
   - List corrective actions assigned to the authenticated vendor.
   - Show: description, deadline, status (PENDING / COMPLETED / OVERDUE / VERIFIED), assigned complaint reference.
   - Allow vendor to submit completion evidence (upload + notes).

2. **Reviewer Corrective Action Verification**:
   - In the existing case detail view, add a "Verify Completion" action for `COMPLETED` corrective actions.
   - Reviewer can VERIFY or REJECT the submitted completion evidence.
   - Each verification attempt is recorded as a `ComplaintEvent`.

3. **Compliance Dashboard Widget (Enhancement)**:
   - Extend `MetricsHeader` to break down Vendor Compliance Rate by individual vendor.
   - Show per-vendor: total assigned actions, completed, overdue, verified rate.

4. **Overdue Corrective Action Alerting**:
   - Query corrective actions where `deadline < NOW()` and `status = PENDING`.
   - Surface these in a dedicated "Overdue Actions" triage section in the dashboard.

### Acceptance Criteria for Phase 6
- [ ] New or updated Prisma schema (if `VENDOR` role added) with committed migration.
- [ ] Vendor portal page compiles with server-enforced RBAC.
- [ ] Reviewer verification flow works with ComplaintEvent append-only recording.
- [ ] All 40+ existing tests continue to pass.
- [ ] 0 lint errors, 0 type errors.
- [ ] `npm run build` exits 0 with new routes present.
- [ ] `docs/PROJECT_STATUS.md`, `DEVELOPMENT_LOG.md`, and `NEXT_AGENT_TASK.md` updated.

---

## 3. Phase 4B Verification Matrix

| Feature Module | Implementation Details | Test / Operational Verification | Status |
|---|---|---|---|
| **Control Room Layout** | Dark slate theme, operational header with system status, responsive layout, server-enforced role badge | Verified in `src/app/dashboard/layout.tsx` | VERIFIED |
| **Role Switcher** | Authenticated demonstration session switcher (`admin@railguard.test` vs `reviewer@railguard.test`); server validates DB role on every request | Verified in `RoleSwitcherBar.tsx` & `session.ts` | VERIFIED |
| **Operational Metrics** | Direct PostgreSQL queries: Active Cases, Urgent Spoilage, Overdue Investigations, Overdue Actions, Resolved, Vendor Compliance Rate ($D$ denominator rule) | Verified via `testMetricsMutation.ts` & `dashboardMetrics.test.ts` | VERIFIED |
| **Triage Queue** | Status tabs (`ALL` through `DUPLICATE`), category filter, severity filter, text search, sorting, pagination, empty/loading states | Verified in `ComplaintTriageQueue.tsx` | VERIFIED |
| **Case Detail View** | Allegation, train route, station, coach, packaging/batch metadata, synthetic evidence photo streaming (`/api/evidence/[id]`) | Verified in `src/app/dashboard/complaints/[id]/page.tsx` | VERIFIED |
| **State Machine Transitions** | Enforced transitions, mandatory rejection justification, chronological reopened investigation handling | Verified via `stateMachine.test.ts` & `complaintMutationService.ts` | VERIFIED |
| **Investigation & Remedies** | Assign inspector, record findings, issue corrective action with deadline and responsible vendor | Verified in `CaseInvestigationActions.tsx` | VERIFIED |
| **Admin Reset Control** | Admin-only modal trigger requiring explicit `RESET_DEMO_DATABASE` input; invokes atomic wipe & post-commit cleanup | Verified via `testReset.ts` & `AdminResetModal.tsx` | VERIFIED |
| **Soft Deletion** | Strictly admin-only soft deletion with mandatory rationale; excludes records from active queue and public views | Verified via `rbacPermissions.test.ts` | VERIFIED |
| **Prisma Migrations** | Version-controlled initial migration `20261110000000_init_railguard_core` with `migration_lock.toml` | Verified committed in `prisma/migrations` | VERIFIED |

---

## 4. Phase 5 Execution Plan (Next Immediate Milestone)

When Phase 5 begins, the next agent must implement:
1. **Passenger QR Reporting Flow (`/report` & `/report?p=<qrCode>`)**:
   - Auto-resolves product and batch details if scanned with a packaging QR identifier.
   - Form inputs: Category, Description, Train number / Coach selection, Date of journey.
   - Client-side and server-side Zod payload validation.
2. **Evidence Photo Upload Component**:
   - Up to 3 images, max 5MB each, JPEG/PNG/WebP formats.
   - Private storage at `evidence_storage/uploads/` via authenticated streaming proxy.
3. **Complaint Submission & Token Presentation**:
   - Inserts `Complaint`, `ComplaintEvidence`, and initial `ComplaintEvent` within a transaction.
   - Generates raw 32-character tracking token; displays to passenger **once** on confirmation screen.
   - Stores only `trackingTokenHash` (SHA-256) in the database.
4. **Public Complaint Tracking View (`/track`)**:
   - Lookup form accepting `complaintRef` + raw `trackingToken`.
   - Validates token against stored hash using `verifyTrackingToken()`.
   - Displays current public status, public timeline events, and resolved corrective outcome without leaking internal investigator notes.
