# RailGuard — Approved Design Specification: Railway Operations Control Room

**Status**: APPROVED by Product Owner & Architecture Review  
**Direction**: Direction A — Railway Operations Control Room (Conventional Database-Backed Interactive Architecture)

---

## 1. Core Architectural & Design Decisions

### 1.1 What RailGuard IS:
- A **conventional, fully interactive web application** powered by a rich, realistic, preloaded synthetic demonstration dataset.
- A **professional operational control desk and passenger reporting platform** where all user interactions—submitting complaints, uploading evidence, tracking cases, reviewing dossiers, advancing state transitions, assigning investigators, and mandating corrective remedies—trigger **actual server-side mutations and database writes**.
- An operational dashboard where **statistics, charts, and metrics are dynamically calculated directly from underlying database records** and reflect changes immediately upon mutation.

### 1.2 What RailGuard IS NOT:
- **NO artificial live simulation systems**: No ticking simulation engines fabricating fake train movements, mock background telemetry, or synthetic animated ticker feeds.
- **NO decorative, non-functional controls**: Every button, filter, tab, and form input executes a tangible database query or workflow action.
- **NO generic AI-dashboard aesthetics**: No gratuitous gradients, floating glassmorphism cards, or arbitrary circular progress meters.

---

## 2. Technical Refinements & Governance Invariants

### 2.1 Controlled Authentication & Role Management
- **No Unrestricted Self-Elevation**: Users cannot self-assign administrator or reviewer privileges.
- **Distinct Demonstration Accounts**:
  - `reviewer@railguard.test`: Quality Reviewer (triage, evidence inspection, assignments, findings, corrective actions).
  - `admin@railguard.test`: System Administrator (vendor management, packaging batch registration, audit review, demo data reset).
- **Server-Side RBAC & Authenticated Sessions**: Authentication issues a cryptographically signed, HTTP-only session cookie. Route middleware and server actions enforce permissions server-side. Role switching in demonstration mode requires explicit re-authentication to that specific seeded user account.

### 2.2 Formal Complaint State Machine & Transition Rules
- **State Progression**:
  - `SUBMITTED` $\rightarrow$ `UNDER_REVIEW`, `DUPLICATE`, `REJECTED`
  - `UNDER_REVIEW` $\rightarrow$ `INVESTIGATION`, `NEEDS_INFORMATION`, `REJECTED`
  - `NEEDS_INFORMATION` $\rightarrow$ `UNDER_REVIEW` (passenger response received), `REJECTED` (information expired / unanswered)
  - `INVESTIGATION` $\rightarrow$ `ACTION_REQUIRED` (finding of `VENDOR_FAULT` or `STORAGE_FAULT`), `RESOLVED` (finding of `UNSUBSTANTIATED` or documented `INCONCLUSIVE`), `REJECTED`
  - `ACTION_REQUIRED` $\rightarrow$ `RESOLVED` (verified corrective action outcome)
- **Rejection Documentation**: Every transition to `REJECTED` requires a mandatory structured rejection reason (e.g. `INSUFFICIENT_EVIDENCE`, `OUT_OF_SCOPE`, `DUPLICATE_REPORT`, `UNRESPONSIVE_PASSENGER`).
- **Inconclusive Findings**: When lab/inspector testing cannot substantiate or refute an allegation, the case is concluded with `INCONCLUSIVE` determination, recording specific evidentiary limitations.
- **Controlled Reopening Process**: A `RESOLVED` or `REJECTED` case can be reopened to `UNDER_REVIEW` only by an authorized reviewer or administrator upon receipt of supplementary passenger evidence or supervisory escalation. Reopening appends an immutable audit log detailing the actor and justification.

### 2.3 Corrective Actions Architecture
Corrective actions are modeled as distinct relational database records (`CorrectiveAction`) linked to `Investigation`:
- `id`: UUID (Primary Key)
- `investigationId`: UUID (Foreign Key)
- `actionType`: `WARNING_LETTER`, `FINANCIAL_PENALTY`, `BATCH_RECALL`, `KITCHEN_AUDIT`, `STAFF_RETRAINING`
- `description`: Formal contractual/remedial instruction
- `responsibleParty`: Name and title of contractor manager, base kitchen supervisor, or vendor representative
- `deadline`: Mandatory compliance deadline timestamp
- `status`: `PENDING`, `IN_PROGRESS`, `VERIFIED_COMPLETE`, `OVERDUE`
- `completionEvidence`: Text documentation / reference to vendor rectification report
- `verificationOutcome`: `SATISFACTORY`, `NON_COMPLIANT`, `ESCALATED`
- `verifiedAt`: DateTime of quality team verification
- `verifiedById`: User ID of inspecting reviewer

### 2.4 Secure Private Evidence Storage & Local Demonstration Setup
- **Zero Cloud-Cost Dependency**: The application includes a self-contained, secure private storage adapter storing uploaded evidence files in an isolated server directory outside the public web root (`storage/evidence/`).
- **Access Control**: Evidence images are never served via static public URLs. Files are accessed via an authenticated API proxy (`/api/evidence/[id]`) that validates reviewer/admin session cookies or signed tokens with a 15-minute expiration window.
- **Pluggable Architecture**: S3 / Supabase private storage can be toggled via environment variables without modifying core complaint logic.

### 2.5 Strict Product Verification Terminology
To avoid misleading claims or implying government anti-counterfeiting guarantees, the UI strictly enforces precise terminology:
- **`REGISTERED BATCH`**: The packaging code matches an existing demonstration catering batch record in the database.
- **`EXPIRED BATCH`**: The packaging batch has exceeded its recorded consumption shelf-life window.
- **`RECALLED BATCH`**: The packaging batch has been flagged as recalled by quality control oversight.
- **`UNRECOGNIZED IDENTIFIER`**: The packaging identifier is not present in the demonstration database.
- **Mandatory Disclaimer**: *“A QR code identifies a registered batch record in the demonstration database. It does not prove physical tamper-proofing, anti-counterfeiting integrity, or guaranteed food safety.”*

### 2.6 Data Integrity & Append-Only Audit Trail
- **No Overwriting of History**: Neither complaints nor investigations allow silent editing or overwriting of prior decisions.
- **Immutable Event Log (`ComplaintEvent`)**: Every transition, assignment, finding, and corrective action automatically records:
  - `actorId` & `actorRole` (Quality Reviewer, Admin, Passenger, or System)
  - `previousStatus` & `newStatus`
  - `explanation` / structured justification
  - `isPublic` flag (distinguishing passenger-visible timeline milestones from private internal investigation notes)
  - `createdAt` timestamp

### 2.7 Clear Operational Metrics Definitions
All dashboard statistics and analytics are computed strictly from database records:
- **Total Complaints**: Total count of all non-duplicate complaint records in the selected date range.
- **Open Cases**: Complaints currently in `SUBMITTED`, `UNDER_REVIEW`, `INVESTIGATION`, `NEEDS_INFORMATION`, or `ACTION_REQUIRED`.
- **Urgent Spoilage Cases**: Open cases with category `SPOILAGE` or `FOREIGN_OBJECT` and severity `HIGH` or `CRITICAL`.
- **Overdue Investigations**: Active investigations where elapsed time from assignment exceeds 48 hours without an official finding.
- **Vendor Compliance Rate**: Ratio of complaints resulting in `SATISFACTORY` verified corrective action vs total substantiated vendor fault cases.
- **Average Resolution Time**: Mean duration in days/hours between `Complaint.createdAt` and final `RESOLVED` `ComplaintEvent.createdAt`.

---

## 3. Approved Visual Identity: "Railway Operations Control Room"

### 3.1 Color Palette & Semantic Tokens
- **Base Surfaces & Backgrounds**:
  - Deep Carbon Slate (`#0b0f19`): Primary navigation bar, operational system header, authoritative badges.
  - Technical Steel Slate (`#1e293b`): Secondary sidebars, active tab states, table header backgrounds.
  - Clean Operational Canvas (`#f8fafc` / `#ffffff`): Main content area providing optimal contrast and legibility.
  - Structural Borders (`#e2e8f0` / `#cbd5e1`): Crisp 1px borders delineating table cells, form sections, and dossiers.
- **Operational Status Signals**:
  - **Triage / Under Review** (`#d97706` / `#f59e0b` Amber): Cases awaiting initial reviewer action or information request.
  - **Critical Spoilage / Hazard / Recalled Batch** (`#dc2626` / `#ef4444` Crimson): High-severity hygiene, foreign object, and safety recall alerts.
  - **Active Batch / Resolved Case** (`#059669` / `#10b981` Emerald): Verified registered active batches and verified corrective actions.
  - **Investigation In Progress** (`#0284c7` Steel Blue): Formal inquiry assigned and underway.
  - **Action Required** (`#7c3aed` Violet): Mandated corrective remedies awaiting vendor compliance.

### 3.2 Typography & Tabular Layout
- **Body & Headings**: Clean, neutral, high-legibility sans-serif (`Geist` or `Inter`).
- **Tabular & Operational Data**: Monospaced font (`Geist Mono`) for all train numbers (`12951`), PNR/coach/seat identifiers (`B3-42`), batch codes (`BATCH-NR-2026-04A`), complaint references (`RG-2026-84920`), tracking tokens, FSSAI licenses, and timestamps.
- **Information Density**: High-density operational data tables with compact rows, sortable columns, inline badge pills, and direct case inspection triggers.

---

## 4. Navigation & Page Hierarchy

```text
RailGuard
│
├── / (Public Landing Page)
│   ├── Operational System Header & Demonstration Disclaimer
│   ├── Packaging QR/Batch Lookup Input with 3 Demo Presets
│   ├── Chain of Custody Workflow Cards (Scan -> Document -> Rectify)
│   ├── Allegation vs. Confirmed Finding Due-Process Principle
│   └── Direct Navigation: "Report Issue" | "Track Case" | "Reviewer Access"
│
├── /products/[id] (Public Packaging Batch Verification)
│   ├── Terminology Badges (REGISTERED BATCH | EXPIRED BATCH | RECALLED BATCH | UNRECOGNIZED IDENTIFIER)
│   ├── Product & Authorized Caterer Information
│   ├── Batch Timestamps, FSSAI License & Shelf-Life Window
│   └── Action: "Proceed to Report Issue for this Batch" -> /report?p=[id]
│
├── /report (Mobile-First Passenger Reporting)
│   ├── Batch Metadata Card (Auto-populated if accessed via QR/preset)
│   ├── Issue Category & Severity Selection
│   ├── Journey Details (Train Number/Name, Date, Coach/Seat, Boarding Station)
│   ├── Description & Photo Evidence Upload (up to 3 images, max 5MB each)
│   └── Submission -> Confirmation Screen (Reference Number + Cryptographic Tracking Token)
│
├── /track (Public Passenger Tracking)
│   ├── Dual-Key Verification Lookup (Complaint Ref + Tracking Token)
│   ├── Public Status Progression Bar
│   └── Public Event Timeline (Sanitized, internal notes strictly hidden)
│
├── /login (Demonstration Access Portal)
│   ├── Controlled Login for Seeded Accounts (Reviewer & Admin)
│   └── Demonstration Credentials Documentation & Instructions
│
└── /dashboard (Protected Quality Operations Control Room)
    ├── /dashboard/overview (KPI Counters, Urgent Triage Queue, Alert Banner)
    ├── /dashboard/complaints (Full Interactive Case Table with Multi-Filters)
    ├── /dashboard/complaints/[id] (Split-Pane Case Dossier + State Machine Transitions)
    ├── /dashboard/alerts (Rule-Based Pattern Detection Clusters)
    ├── /dashboard/analytics (Real-Time Category, Vendor, Station & Trend Charts)
    ├── /dashboard/products (Packaging Registry & QR Generator)
    └── /dashboard/admin (Audit History & Protected Demo Data Reset)
```
