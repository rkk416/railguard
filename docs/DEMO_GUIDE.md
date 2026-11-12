# RailGuard — Demonstration & Evaluation Guide

Welcome to **RailGuard**, a railway food quality audit and passenger feedback platform. This guide outlines the complete evaluation workflow for academic examiners and demonstration reviewers.

---

## 1. Demonstration Accounts & Roles

RailGuard implements server-enforced role-based access control (RBAC). Demonstrators can switch between roles seamlessly using the top-bar role switcher in the Control Room:

| Role | Account Email | Name & Designation | Permissions |
|---|---|---|---|
| **Quality Reviewer** | `reviewer@railguard.test` | Priya Sharma (Sr. Catering Inspector) | Case triage, status transitions, investigator assignment, findings documentation, issuing corrective actions, alert management |
| **Administrator** | `admin@railguard.test` | Rajesh Kumar (Chief Quality Director) | All reviewer capabilities + administrative soft deletion + demonstration database reset |

---

## 2. Walkthrough Scenarios

### Scenario A: Passenger Packaging Verification & Reporting (`/report`)
1. **Navigate to**: `http://localhost:3000/report`
2. **Scan / Enter Packaging QR Identifier**:
   - `DEMO-THALI-ACTIVE-001` $\rightarrow$ Status: `VERIFIED` (Authorized Caterer: Northern Caterers)
   - `DEMO-CURD-EXPIRED-003` $\rightarrow$ Status: `EXPIRED` (Batch expired past shelf life)
   - `DEMO-WATER-RECALLED-004` $\rightarrow$ Status: `RECALLED` (Batch subject to recall)
3. **Fill Complaint Allegation**:
   - Issue Category: `FOREIGN_OBJECT` or `SPOILAGE`
   - Perceived Severity: `CRITICAL` or `HIGH`
   - Description: e.g., *"Found foreign plastic fragment inside meal tray curd portion."*
   - Train: Select `12951 — Mumbai Rajdhani Express`
   - Station: Select `NDLS (New Delhi)`
   - Coach: `B4-22`
4. **Attach Evidence Photos**:
   - Upload 1–3 image files (JPEG, PNG, WebP supported with binary magic signature validation).
5. **Submit Report**:
   - Observe the **Case Reference** (e.g. `RG-2026-XXXX`) and **Secret 32-character Tracking Token**.
   - Notice the security warning: *Raw token is displayed once and never stored in plaintext on servers*.
6. **Proceed to Tracking**:
   - Click "Proceed to Public Tracking Portal". Notice that the URL contains strictly `?ref=...` (no token in query string!). Token is safely cached in browser `sessionStorage` and submitted via POST body.

---

### Scenario B: Public Cryptographic Complaint Tracking (`/track`)
1. **Navigate to**: `http://localhost:3000/track`
2. **One-Click Presets for Evaluation**:
   - Case `RG-2026-0001` with token `TOKEN-DEMO-RG-2026-0001` (Status: `SUBMITTED`)
   - Case `RG-2026-0007` with token `TOKEN-DEMO-RG-2026-0007` (Status: `UNDER_REVIEW`)
   - Case `RG-2026-0012` with token `TOKEN-DEMO-RG-2026-0012` (Status: `INVESTIGATION`)
   - Case `RG-2026-0026` with token `TOKEN-DEMO-RG-2026-0026` (Status: `RESOLVED`)
   - Case `RG-2026-0031` with token `TOKEN-DEMO-RG-2026-0031` (Status: `REJECTED`)
3. **Audit Information Sanitization**:
   - Verify that passenger contact information is completely absent.
   - Verify that internal reviewer notes (`isPublic: false`) are absent.
   - Inspect evidence photo URLs: notice they use `?evidenceToken=...` (short-lived 15m HMAC token) instead of the permanent tracking token.
4. **Anti-Enumeration Test**:
   - Try an invalid token or non-existent reference: observe the uniform timing-defended error message:
     `"Case record not found or invalid tracking credentials provided."`

---

### Scenario C: Railway Operations Control Room (`/dashboard`)
1. **Navigate to**: `http://localhost:3000/dashboard`
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
4. Confirm: the database wipes dynamic entries, cleans temporary uploads, and restores the pristine 35-complaint baseline in an interactive PostgreSQL transaction.

---

## 3. Verification Commands Quick Reference

```bash
# Execute full Vitest suite (79 tests across 17 files)
npm test

# Execute lint check (0 errors, 0 warnings)
npm run lint

# Execute TypeScript typecheck (0 errors)
npx tsc --noEmit

# Execute production build (19 routes compiled)
npm run build
```
