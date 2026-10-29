# RailGuard — Architecture Decision Records (ADRs)

---

## ADR-001: Adoption of Next.js 16 App Router for Full-Stack System

### Context
RailGuard requires a unified, maintainable architecture for a single developer / sequential agent workflow. The platform encompasses a high-performance public reporting interface and a secure, state-managed operational quality dashboard.

### Decision
Use Next.js 16 App Router with React 19 Server Components and Route Handlers / Server Actions. Eliminate any need for a separate microservice or external backend server.

### Consequences
- **Positive**: Simplified single-repository deployment, unified TypeScript types across frontend and database queries, direct server-side data fetching with zero client payload overhead.
- **Negative**: Strict adherence required for Server/Client boundaries (`"use client"`).

---

## ADR-002: Pinning Prisma ORM v6 Over Experimental v8 Release Candidate

### Context
Running `npm install prisma` pulled an experimental v8 release candidate CLI ("composer-cli" / "skills") with breaking syntax and altered configuration flags.

### Decision
Explicitly pin `@prisma/client@^6.19.3` and `prisma@^6.19.3`.

### Consequences
- **Positive**: Battle-tested, rock-solid schema migrations, type-safe client generation, and guaranteed compatibility with managed PostgreSQL (Supabase / local).
- **Negative**: Precludes experimental features of v8 that are not needed for RailGuard.

---

## ADR-003: Vitest for Automated Unit and Integration Testing

### Context
The application needs rapid, lightweight automated testing for validation schemas, state transition rules, and recurring pattern detection.

### Decision
Adopt Vitest with native TypeScript and ESM configuration (`vitest.config.mts`), resolving path aliases (`@/*`).

### Consequences
- **Positive**: Ultra-fast execution (<500ms for smoke tests), shared configuration and module resolution with Vite/Next.js conventions.
- **Negative**: Requires careful configuration of `@types/node` when running on recent Node versions.

---

## ADR-004: Private Object Storage Isolation with Presigned URLs for Evidence

### Context
Passengers upload food photographs that may contain sensitive data, metadata, or unverified claims. Public storage buckets or predictable file paths expose the platform to unauthorized harvesting or tampering.

### Decision
Store all uploaded complaint media in private object storage (e.g. Supabase Storage bucket). Access is granted solely through server-generated, short-lived presigned URLs (15-minute expiration) strictly accessible to authenticated quality reviewers.

### Consequences
- **Positive**: Strict confidentiality, zero public scraping, compliance with data privacy principles.
- **Negative**: Requires generating dynamic presigned URLs on case inspection rather than static file links.

---

## ADR-005: Dual-Key Access Model for Passenger Complaint Tracking

### Context
Passengers need to track the status of their complaints without mandatory account creation. However, sequential or easily guessable references (e.g., `RG-1001`, `RG-1002`) allow attackers to enumerate and view other passengers' complaint details.

### Decision
Issue a public-friendly reference (`complaintRef`, e.g., `RG-2026-8491`) alongside a secure, unguessable cryptographic `trackingToken`. Access to the tracking endpoint requires both values, or a signed direct tracking link containing the token.

### Consequences
- **Positive**: Frictionless passenger tracking without registration while preventing complaint enumeration attacks.
- **Negative**: Passengers must retain their tracking link or token.

---

## ADR-006: Server-Enforced Status State Machine and Append-Only Audit History

### Context
Complaints must progress through formal review stages (`SUBMITTED` -> `UNDER_REVIEW` -> `INVESTIGATION` -> `ACTION_REQUIRED` / `RESOLVED` / `REJECTED`). Unchecked client status updates or direct database tampering would compromise audit validity.

### Decision
Enforce all status changes via server-side transition guards. Every transition must automatically insert an immutable record into `ComplaintEvent` capturing actor ID, timestamp, old status, new status, and justification.

### Consequences
- **Positive**: Complete legal/operational defensibility and traceability for railway audit compliance.
- **Negative**: Direct status mutations must route through dedicated service methods rather than raw Prisma update calls.
