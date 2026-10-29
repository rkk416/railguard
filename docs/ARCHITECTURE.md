# RailGuard — Architecture Specification

---

## 1. System Overview

RailGuard is a full-stack railway food quality audit and passenger feedback platform built on **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

The system addresses two primary stakeholders:
1. **Passengers (Mobile-first public interface)**: Scan QR codes on authorized food packaging, verify product records, submit structured hygiene/spoilage complaints with photographs, and track resolution timelines securely.
2. **Quality Reviewers & Administrators (Desktop operational dashboard)**: Monitor incoming allegations, examine photographic evidence, assign investigations, record official findings, track corrective actions, and analyze automated recurring-issue alerts.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph Passenger["Passenger (Mobile First)"]
        A1["QR Scan on Packaging"] --> A2["Verify Product Record (/products/:id)"]
        A2 --> A3["Submit Complaint Form (/report?p=...)"]
        A3 --> A4["Upload Photo Evidence"]
        A3 --> A5["Receive Complaint Ref + Token"]
        A5 --> A6["Track Resolution Timeline (/track)"]
    end

    subgraph AppServer["Next.js 16 App Server"]
        B1["Public Route Handlers & RSC"]
        B2["Zod Schema Validation Engine"]
        B3["Server Actions / Business Logic"]
        B4["Auth & RBAC Middleware"]
        B5["Recurring Pattern Detection Service"]
        B6["Storage Service (Signed URLs)"]
    end

    subgraph OperationalReviewer["Quality Reviewer & Admin"]
        C1["Secure Dashboard (/dashboard)"]
        C2["Evidence Inspector (Signed URLs)"]
        C3["Investigation & Finding Workflow"]
        C4["Corrective Action Tracker"]
        C5["Recurring-Issue Alerts & Analytics"]
    end

    subgraph StorageLayer["Data & Evidence Infrastructure"]
        D1[("PostgreSQL Database via Prisma")]
        D2[("Private Object Storage - Supabase / S3")]
    end

    A2 -->|GET| B1
    A3 -->|POST| B2
    B2 --> B3
    B3 -->|Write Complaint & Event| D1
    A4 -->|Stream Upload| B6
    B6 -->|Encrypted Blob| D2

    C1 -->|Authenticated Session| B4
    B4 --> C2 & C3 & C4 & C5
    C3 -->|Update Status & History| D1
    C2 -->|Request Short-Lived URL| B6
    B6 -->|Generate Presigned URL| D2
    B5 -->|Scan Trends| D1
```

---

## 3. Server vs. Client Boundary

To optimize performance and eliminate client-side credential exposure:

| Component Type | Primary Location | Responsibility |
|---|---|---|
| **Server Components (RSC)** | `src/app/**/page.tsx`, `src/app/**/layout.tsx` | Data fetching, database access, session resolution, initial HTML rendering, zero bundle bloat |
| **Client Components (`"use client"`)** | `src/components/passenger/*`, `src/components/dashboard/*`, `src/components/ui/*` | Form interactivity, camera/file upload previews, interactive search/filtering, modal dialogs, charts |
| **Server Actions / Route Handlers** | `src/app/api/*`, `src/services/*` | Zod validation, authenticated database transactions, private storage communication |

---

## 4. Distinction Between Allegation and Finding

A foundational architectural requirement is the strict separation between:
1. **Allegation (Passenger Complaint)**: Unverified passenger report regarding food quality, packaging condition, or foreign objects.
2. **Investigation**: Formal inquiry initiated by an authorized quality reviewer, recording timestamps, assigned personnel, and reviewer observations.
3. **Confirmed Finding**: Official substantiated determination (e.g., "Vendor Packaging Defect", "Temperature Non-Compliance", "Unsubstantiated / Inconclusive").
4. **Corrective Action**: Contractual or operational remedy imposed on the vendor (e.g., penalty, batch recall, process audit).

---

## 5. Evidence Isolation Architecture

Photographic evidence presents privacy, tampering, and bandwidth concerns:
- **Never public**: Images are stored in a private object storage bucket (e.g. Supabase Storage / S3).
- **Authorized access only**: Images are only retrievable through short-lived (e.g., 15-minute) presigned URLs generated server-side for authenticated reviewers.
- **File Validation**: Image uploads undergo MIME-type inspection, extension validation, and maximum size limits (5MB per image, max 3 images).

---

## 6. Audit Trail & Immutability

Every complaint status change automatically appends a row to the `ComplaintEvent` table:
- Previous status and new status
- Actor user ID (or System)
- Timestamp
- Reason / explanation
- `isPublic` flag (distinguishing passenger-visible timeline updates from internal investigation notes)

Complaint events are append-only. No deletion or editing of event history is permitted.
