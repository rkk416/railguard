# RailGuard — Feature Specifications

---

## Module A: Public Landing Page

- **Brand & Persona**: Clean, professional railway audit aesthetic, authoritative, accessible, mobile-first responsive.
- **Key Sections**:
  - Hero with dual action: "Report Food Issue" (QR scanner / entry) & "Track Existing Complaint".
  - "How RailGuard Works" 3-step visual guide (Scan Packaging -> Submit Evidence -> Track Resolution).
  - Transparency & Verification explanation (distinction between verified registered batches and copy protection).
  - Official Demonstration Disclaimer (explicit notice of simulated data; non-affiliated prototype).
  - Privacy and passenger protection notice.

---

## Module B: QR-Based Product Identification

- **Scanning / URL Handling**: QR codes encode a URL such as `https://railguard.app/report?p=<qrCodeIdentifier>`.
- **Packaging Record Lookup**: Fetches product name, catering vendor name, FSSAI license, packaging date, and batch number.
- **Verification Badging**:
  - *Verified Registered Batch*: Green badge with batch and packaging metadata.
  - *Unregistered / Unknown Identifier*: Warning banner notifying the passenger that this specific batch code is not in the demonstration registry, but permitting manual complaint filing.
  - *Expired / Recalled Batch*: Red alert informing user of preexisting recall notice.

---

## Module C: Passenger Complaint Submission

- **Frictionless Submission**: No passenger account or login required.
- **Form Fields**:
  - Packaging Reference (auto-filled if scanned via QR).
  - Issue Category (Spoilage, Foreign Object, Packaging/Hygiene, Freshness/Temperature, Product Mismatch, Other).
  - Severity level assessment.
  - Incident details (Train number, Journey Date, Coach / Seat / Location).
  - Detailed description text area.
  - Photo Evidence uploader (up to 3 images, max 5MB each, JPEG/PNG/WebP).
  - Optional Passenger Contact (Email / Phone) for resolution notifications.
- **Validation**: Strict server-side Zod validation with friendly client feedback.
- **Output**: Generates human-readable `complaintRef` (e.g., `RG-2026-9814`) and a cryptographic `trackingToken`.

---

## Module D: Secure Evidence Storage

- **Private Isolation**: Photographs are stored outside web-accessible roots.
- **Presigned URLs**: Access to image files requires an authenticated session and is served via time-limited presigned URLs (e.g., 15 minutes).
- **Metadata Scrubbing**: Storage layer extracts only necessary dimensions and byte counts, avoiding retention of sensitive EXIF location metadata unless voluntarily provided.

---

## Module E: Complaint Management & Audit Trail

- **Standardized Status Lifecycle**: `SUBMITTED`, `UNDER_REVIEW`, `INVESTIGATION`, `ACTION_REQUIRED`, `NEEDS_INFORMATION`, `RESOLVED`, `REJECTED`, `DUPLICATE`.
- **Transition Validation**: Server-side state machine prohibits illegal jumps (e.g., cannot resolve directly from `SUBMITTED` without review).
- **Immutable Event Log**: Every status update records user, timestamp, previous status, next status, and explanation.

---

## Module F: Investigation Workflow

- **Investigator Assignment**: Authorized quality reviewer claims or assigns a complaint to an investigator.
- **Findings Documentation**: Notes observations, laboratory test results, vendor statements, or storage temperature logs.
- **Determination Categories**: Vendor Fault, Storage / Pantry Car Fault, Unsubstantiated, Inconclusive.
- **Corrective Action Mandates**: Track formal penalties, warnings, or kitchen audits with due dates.

---

## Module G: Recurring-Issue Detection

- **Rule-Based Engine**: Identifies patterns without black-box ML.
  - *Rule 1*: $\ge 3$ complaints against the same vendor in 48 hours for the same category.
  - *Rule 2*: $\ge 2$ complaints against the same product batch number.
  - *Rule 3*: $\ge 3$ complaints on the same train number within 7 days.
- **Alert Records**: Groups related complaints into a consolidated `RecurringIssueAlert` for supervisor inspection.
- **Deduplication**: Prevents repeated alerts for the same underlying cluster.

---

## Module H: Quality Dashboard

- **Operational KPI Cards**: Total Active Cases, Urgent Spoilage Cases, Overdue Investigations, Resolution Rate.
- **Trend Charts**: Complaint volume over time, category breakdowns, vendor distribution.
- **Interactive Case Queue**: Search by reference, filter by category, vendor, status, or train.
- **Detailed Case View**: Photographic evidence viewer, journey details, event timeline, action forms.

---

## Module I: Passenger Complaint Tracking

- **Secure Lookup**: Accessible at `/track` using `complaintRef` + `trackingToken`.
- **Public Timeline**: Shows passenger-facing milestones (e.g., "Report Received", "Under Investigation", "Corrective Action Imposed", "Resolved").
- **Privacy Protection**: Internal reviewer notes, vendor internal correspondence, and investigator names remain strictly private.
