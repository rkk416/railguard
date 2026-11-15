# RailGuard — Demonstration & Evaluation Guide
## Academic Demonstration Walkthrough, Seed System & Scenario Reference

> **Welcome to RailGuard: The Living Inspection Register.**  
> This guide outlines the dedicated synthetic demonstration data system, evaluation accounts, and walkthrough scenarios for academic examiners and demonstration reviewers.

---

## 1. Dedicated Demonstration Seeding System

RailGuard provides a deliberate, repeatable, and idempotent demonstration seeding system:

```bash
# Execute idempotent demonstration seeding:
npm run db:seed:demo
# (or shorthand: npm run db:seed)
```

### Seeding Supabase PostgreSQL
To seed your Supabase database from your local machine, provide your connection strings as environment variables:
```bash
# In Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"
$env:DIRECT_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres?sslmode=require"
npm run db:seed:demo

# In macOS / Linux / Bash:
DATABASE_URL="<supabase-session-pooler-url>" DIRECT_URL="<supabase-direct-url>" npm run db:seed:demo
```

### Key Safety Invariants of the Seeder:
1. **Separation from Migrations**: The production deployment build command (`render.yaml`) executes strictly `npx prisma migrate deploy`. It **never** runs `db:seed:demo`. Seeding is always a conscious, separate operation.
2. **Idempotent & Non-Destructive**: Uses PostgreSQL `upsert` and deterministic reference identifiers (`RG-2026-0001` through `RG-2026-0035`). Running the script repeatedly updates existing demo records and creates missing ones; it **never drops, resets, or deletes real application data**.
3. **100% Synthetic & Anonymized**: All passenger emails (`passenger{idx}@demo.railguard.test`), phone numbers (`+91-98765...`), and names are fictional. No real passenger data is ever stored.
4. **Secure Password Handling**: Seeded users contain standard bcrypt-compatible hashes. Passwords are not hardcoded in plaintext.

---

## 2. Demonstration Accounts & Roles

RailGuard implements server-enforced role-based access control (RBAC). Evaluators can switch between roles effortlessly using the top-bar role switcher in the Control Room:

| Role | Account Email | Name & Designation | Permissions & Access Scope |
|---|---|---|---|
| **Quality Reviewer** | `reviewer@railguard.test` | Priya Sharma (Sr. Catering Inspector) | Case triage, status transitions, investigator assignment, findings documentation, issuing corrective actions, alert triage |
| **Administrator** | `admin@railguard.test` | Rajesh Kumar (Chief Quality Director) | Full reviewer privileges + administrative soft deletion + demonstration database reset |

*To access the accounts: either click the designated role pill in the dashboard header or set the session cookie `railguard_session=reviewer@railguard.test` or `admin@railguard.test`.*

---

## 3. Seeded Entities & Record Breakdown

When `npm run db:seed:demo` completes, the following verified baseline records are populated:

| Entity Type | Count | Key Records / Details |
|---|---|---|
| **Users** | 2 | Rajesh Kumar (`ADMIN`), Priya Sharma (`QUALITY_REVIEWER`) |
| **Stations** | 8 | `NDLS` (New Delhi), `MMCT` (Mumbai Central), `HWH` (Howrah), `MAS` (Chennai), `SBC` (Bengaluru), `CNB` (Kanpur), `BSL` (Bhusawal), `PUNE` (Pune) |
| **Trains** | 6 | `12951` (Mumbai Rajdhani), `12004` (Shatabdi), `22436` (Vande Bharat), `12301` (Howrah Rajdhani), `12621` (TN Express), `12137` (Punjab Mail) |
| **Vendors** | 5 | Northern Rail Caterers (`ACTIVE`), Western Gourmet (`ACTIVE`), Southern Hospitality (`UNDER_REVIEW`), Eastern Kitchens (`ACTIVE`), Central Meals (`SUSPENDED`) |
| **Products** | 14 | Meal Trays, Packaged Water, Samosa Boxes, Curd Rice, Fish Curry, Diabetic Khichdi |
| **Packaging Units** | 16 | 10 `ACTIVE` batches, 3 `EXPIRED` batches, 3 `RECALLED` batches |
| **Complaints** | 35 | Realistic distribution across all 8 supported lifecycle statuses |
| **Investigations** | 8 | With documented findings across `VENDOR_FAULT`, `STORAGE_FAULT`, `INCONCLUSIVE` |
| **Corrective Actions**| 5 | Mutually exclusive statuses: `PENDING`, `IN_PROGRESS`, `VERIFIED_COMPLETE`, `NON_COMPLIANT`, `ESCALATED` |
| **Recurring Alerts** | 3 | High-frequency pattern alerts: Spoilage (Northern), Foreign Object (Southern), Temperature (Western) |

---

## 4. Evaluation Walkthrough Scenarios

### Scenario A: Passenger Packaging Verification & Reporting (`/report`)
1. **Navigate to**: `/report`
2. **Scan / Enter Packaging QR Identifier**:
   - `DEMO-THALI-ACTIVE-001` $\rightarrow$ Status: `VERIFIED` (Authorized Caterer: Northern Rail Caterers)
   - `DEMO-BREAKFAST-EXPIRED-003` $\rightarrow$ Status: `EXPIRED` (Batch expired past shelf life)
   - `DEMO-BIRYANI-RECALLED-004` $\rightarrow$ Status: `RECALLED` (Batch subject to recall)
3. **Fill Complaint Allegation**:
   - Issue Category: `FOREIGN_OBJECT` or `SPOILAGE`
   - Perceived Severity: `CRITICAL` or `HIGH`
   - Description: e.g., *"Found foreign plastic fragment inside meal tray curd portion."*
   - Train: Select `12951 — Mumbai Rajdhani Express`
   - Station: Select `NDLS (New Delhi)`
   - Coach: `B4-22`
4. **Attach Evidence Photos**:
   - Upload 1–3 image files (JPEG, PNG, WebP with magic signature validation).
5. **Submit Report**:
   - Observe the generated **Case Reference** (e.g. `RG-2026-XXXX`) and **Secret 32-character Tracking Token**.
   - Notice the security banner: *Raw token is displayed once and never stored in plaintext on servers*.
6. **Proceed to Tracking**:
   - Click "Proceed to Public Tracking Portal". Notice that the URL contains strictly `?ref=...` (no token in query string!). Token is safely cached in browser `sessionStorage` and submitted via POST body.

---

### Scenario B: Public Cryptographic Complaint Tracking (`/track`)
1. **Navigate to**: `/track`
2. **One-Click Presets for Evaluation**:
   - Case `RG-2026-0001` with token `TOKEN-DEMO-RG-2026-0001` (Status: `SUBMITTED`)
   - Case `RG-2026-0007` with token `TOKEN-DEMO-RG-2026-0007` (Status: `UNDER_REVIEW`)
   - Case `RG-2026-0012` with token `TOKEN-DEMO-RG-2026-0012` (Status: `INVESTIGATION`)
   - Case `RG-2026-0026` with token `TOKEN-DEMO-RG-2026-0026` (Status: `RESOLVED`)
   - Case `RG-2026-0031` with token `TOKEN-DEMO-RG-2026-0031` (Status: `REJECTED`)
3. **Audit Information Sanitization**:
   - Verify that passenger contact information is strictly excluded.
   - Verify that internal reviewer notes (`isPublic: false`) are hidden.
   - Evidence photo URLs use `?evidenceToken=...` (short-lived 15m HMAC token) instead of the permanent tracking token.
4. **Anti-Enumeration Test**:
   - Try an invalid token or non-existent reference: observe the uniform timing-defended error message:
     `"Case record not found or invalid tracking credentials provided."`

---

### Scenario C: Railway Operations Control Room (`/dashboard`)
1. **Navigate to**: `/dashboard`
2. **Inspect Real-Time Metrics**:
   - Active Cases, Urgent Spoilage, Overdue Investigations (>48h), Overdue Actions, Resolved Cases, Vendor Compliance Rate ($D$ formula).
3. **Recurring Issue Alerts Panel**:
   - Review active threshold alerts (3+ complaints per vendor/product within 48h).
   - Test alert status updates: click **Acknowledge**, **Investigate**, or **Dismiss**.
4. **Operational Analytics & Quality Trends**:
   - Inspect category distribution percentage meters.
   - Inspect Route Hotspots (`12951 Mumbai Rajdhani`, `12002 Bhopal Shatabdi`).
   - Inspect Station Hotspots and Vendor Contractor Audit Performance table.
5. **Complaint Triage Queue**:
   - Filter by status tabs (`ALL`, `SUBMITTED`, `UNDER_REVIEW`, `INVESTIGATION`, etc.).
   - Search by train number, coach, station, or complaint reference.
   - Sort by date ascending or descending.

---

### Scenario D: Case Detail & Investigation Workflow (`/dashboard/complaints/[id]`)
1. **Click any case** in the triage queue (e.g. `RG-2026-0001`).
2. **Potential Duplicate Correlation**:
   - Notice the duplicate banner if similar complaints occurred on the same train/station within 24h.
3. **Execute Status Transition**:
   - Transition status from `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `INVESTIGATION`.
   - Provide documented justification.
4. **Assign Inspector**:
   - Assign `Priya Sharma` to the case.
5. **Document Investigation Findings**:
   - Enter findings with formal determination (`VENDOR_FAULT`, `STORAGE_FAULT`, `UNSUBSTANTIATED`, `INCONCLUSIVE`).
6. **Issue Corrective Remedy**:
   - Select remedy type (`WARNING_LETTER`, `BATCH_RECALL`, `KITCHEN_AUDIT`, `STAFF_RETRAINING`, `FINANCIAL_PENALTY`).
   - Set deadline and responsible catering vendor.

---

### Scenario E: Demonstration Database Reset (Admin-Only)
1. In the top bar, switch to **Rajesh Kumar (Chief Quality Director)**.
2. In the sidebar, click **Reset Demo DB**.
3. Type `RESET_DEMO_DATABASE` in the confirmation modal.
4. Confirm: the database safely wipes dynamic entries, cleans temporary uploads, and reinstates the pristine 35-complaint baseline in an interactive PostgreSQL transaction.

---

## 5. Verification Commands Quick Reference

```bash
# Run unit & integration test suite (79 tests across 17 files)
npm test

# Run ESLint check (0 errors, 0 warnings)
npm run lint

# Run TypeScript type check (0 errors)
npx tsc --noEmit

# Run Next.js production build (20 routes compiled)
npm run build

# Run idempotent demonstration data seeder
npm run db:seed:demo
```
