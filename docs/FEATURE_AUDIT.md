# RailGuard — Complete Feature Audit & Codebase Inspection

Last Inspected: Phase 1 Deep Audit
Inspector: Lead Architect & Full-Stack Reviewer

---

## 1. Executive Summary

RailGuard was initially scaffolded with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Prisma v6, and Vitest.
A foundational landing page (`/`) and a product verification page (`/products/[id]`) exist and build cleanly.

However, **the application is currently non-operational for end-to-end user journeys**. Primary navigation links (`/report`, `/track`, `/dashboard`) point to routes that do not exist, resulting in Next.js 404 errors. Furthermore, no active database connection exists locally, and the database seeder contains only 4 products and 0 complaints.

Below is the exhaustive feature-by-feature completion audit.

---

## 2. Feature Completion Matrix

| Module | Feature / Component | Status | Detailed Assessment | What Remains To Be Done |
|---|---|---|---|---|
| **Public Landing Page** | Hero & Problem Statement | **WORKING** | Clean visual hierarchy, branding, and explicit prototype disclaimers. | Refine according to approved design direction. |
| **Public Landing Page** | Packaging Lookup Input | **WORKING** | Accepts QR/batch identifier and routes to `/products/[id]`. | Add mobile camera QR scanning fallback. |
| **Public Landing Page** | Demo Preset Buttons | **WORKING** | 3 preset buttons (`DEMO-THALI-ACTIVE-001`, `DEMO-BREAKFAST-EXPIRED-003`, `DEMO-BIRYANI-RECALLED-004`). | Expand presets to include trains, stations, and complaints. |
| **Public Landing Page** | "Track Complaint" Link | **BROKEN** | Points to `/track`, which does not exist (HTTP 404). | Implement `/track` page and lookup logic. |
| **Public Landing Page** | "Reviewer Portal" Link | **BROKEN** | Points to `/dashboard`, which does not exist (HTTP 404). | Implement `/dashboard` and authentication. |
| **Product Identification** | QR Generation Library | **WORKING** | `src/lib/qr/generator.ts` generates URLs, base64 PNG, and SVG vector strings. Verified in unit tests. | Connect to admin batch registration UI. |
| **Product Identification** | Product Verification Service | **PARTIALLY WORKING** | `verifyPackagingUnit()` checks status, expiry, and recall. In tests it passes with mock fixtures, but in live runtime without a DB it catches error and returns `UNRECOGNIZED`. | Add resilient fallback / local database mode. |
| **Product Identification** | Product Page (`/products/[id]`) | **PARTIALLY WORKING** | Renders verification badges (`VERIFIED`, `EXPIRED`, `RECALLED`, `UNRECOGNIZED`), batch details, caterer info. | "Report Issue" button links to `/report?p=...` which is a 404. |
| **Product Identification** | Product API (`/api/products/[id]`) | **WORKING** | Dynamic route returning JSON verification payload. | Fully functional. |
| **Passenger Reporting** | Reporting Route (`/report`) | **NOT IMPLEMENTED** | Route directory does not exist. Clicking "Report Issue" triggers 404. | Create responsive mobile-first reporting form. |
| **Passenger Reporting** | QR / Batch Pre-population | **NOT IMPLEMENTED** | Cannot parse `?p=<code` into the form. | Auto-load packaging metadata if query param exists. |
| **Passenger Reporting** | Form Input Validation (Zod) | **NOT IMPLEMENTED** | Schema file `src/lib/validation/complaint.ts` does not exist. | Create strict Zod schema for category, severity, train, date, description. |
| **Passenger Reporting** | Evidence Photo Uploader | **NOT IMPLEMENTED** | Component does not exist. | Build uploader with client preview, 5MB limit, and format checks. |
| **Passenger Reporting** | Submission API (`/api/complaints`) | **NOT IMPLEMENTED** | Route handler does not exist. | Implement atomic transaction saving Complaint, Evidence, and Event. |
| **Passenger Reporting** | Reference & Token Generation | **NOT IMPLEMENTED** | No generator for `complaintRef` or `trackingToken`. | Implement secure cryptorandom token and ref generator. |
| **Passenger Reporting** | Submission Confirmation | **NOT IMPLEMENTED** | No success screen with printable reference card. | Build confirmation screen with tracking links. |
| **Complaint Tracking** | Tracking Portal (`/track`) | **NOT IMPLEMENTED** | Route does not exist. | Build secure tracking lookup page. |
| **Complaint Tracking** | Dual-Key Authentication | **NOT IMPLEMENTED** | No verification against `complaintRef` + `trackingToken`. | Implement secure query requiring both credentials. |
| **Complaint Tracking** | Segregated Public Timeline | **NOT IMPLEMENTED** | No timeline filtering out private investigation notes. | Render public milestones while stripping internal notes. |
| **Reviewer & Admin Auth** | Login Screen (`/login`) | **NOT IMPLEMENTED** | Route does not exist. | Build demo login with 1-click role switcher. |
| **Reviewer & Admin Auth** | Session & RBAC Enforcement | **NOT IMPLEMENTED** | No cookies/tokens, no middleware. | Implement server-side role resolution and route guards. |
| **Reviewer Dashboard** | Operational KPI Metrics | **NOT IMPLEMENTED** | Route does not exist. | Calculate active cases, urgent spoilage, and overdue investigations from real DB records. |
| **Reviewer Dashboard** | Interactive Complaint Queue | **NOT IMPLEMENTED** | No table or filters. | Build case list with filtering by status, category, vendor, date, train. |
| **Reviewer Dashboard** | Case Dossier (`/dashboard/complaints/[id]`) | **NOT IMPLEMENTED** | No detail view. | Build dossier showing evidence, passenger details, batch info, and event history. |
| **Reviewer Dashboard** | State Machine Transitions | **NOT IMPLEMENTED** | No status transition controls. | Implement server-validated transition buttons. |
| **Reviewer Dashboard** | Evidence Image Inspector | **NOT IMPLEMENTED** | No private image viewer. | Implement presigned/signed image viewer. |
| **Investigation Workflow** | Assignment & Notes | **NOT IMPLEMENTED** | No assignment controls. | Allow assigning reviewers and logging internal notes. |
| **Investigation Workflow** | Findings & Determination | **NOT IMPLEMENTED** | No determination logging. | Record official finding (`VENDOR_FAULT`, `STORAGE_FAULT`, etc.). |
| **Investigation Workflow** | Corrective Action Manager | **NOT IMPLEMENTED** | No corrective action tracking. | Form to issue penalties/audits with deadlines and compliance status. |
| **Recurring Issues** | Pattern Detection Engine | **NOT IMPLEMENTED** | Service does not exist. | Build rule-based detection for repeated vendor, batch, and station issues. |
| **Recurring Issues** | Alert Review Panel | **NOT IMPLEMENTED** | No UI for alerts. | Build alert cards in dashboard with drill-down to linked complaints. |
| **Analytics & Reporting** | Real-time Charts | **NOT IMPLEMENTED** | No chart components or endpoints. | Implement category distribution, time trends, and vendor breakdown. |
| **Database & Seeding** | Relational Models | **WORKING** | 11 models declared in `prisma/schema.prisma`. | Add `Station` and `Train` entities to enrich data model. |
| **Database & Seeding** | Demonstration Seeder | **PARTIALLY WORKING** | `prisma/seed.ts` seeds 2 users, 3 vendors, 4 products, 4 batches. Uses `.create()` (non-idempotent) and has 0 complaints. | Expand to 35+ realistic complaints, 8 stations, 6 trains, and make 100% idempotent. |
| **Database & Seeding** | Demo Reset Functionality | **NOT IMPLEMENTED** | No protected reset endpoint. | Implement `POST /api/demo/reset` for authorized presentation reset. |

---

## 3. Discovered Technical & Architectural Deficiencies

1. **Dead Navigation Routes**: Users clicking "Track Complaint", "Reviewer Portal", or "Report Issue" immediately get 404 errors.
2. **Missing Station & Train Entities**: In real Indian Railways catering audits, issues are tied to boarding stations, pantry loading base kitchens, and specific trains. The current schema stores `trainNumber` as a plain string and has no station representation.
3. **Database Portability Risk**: No local `.env` exists; local PostgreSQL is not running on port 5432. The application needs a zero-config local demo mode (e.g. SQLite or embedded fallback) alongside PostgreSQL support so the presentation runs anywhere without database connection errors.
4. **Non-Idempotent Seeder**: `seed.ts` crashes if executed twice because products are inserted using `create()` instead of `upsert()`.
5. **Private Storage Void**: No storage abstraction exists to handle uploaded complaint photos safely.
