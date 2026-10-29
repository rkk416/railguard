# Next Agent Task Specification & Handoff

---

## 1. Current State Summary

- **Current Milestone**: Milestone 0 — Foundation & Setup (Completed)
- **Target Milestone**: Milestone 1 — Data and Product Registration
- **Current Objective**: Establish PostgreSQL data models in `prisma/schema.prisma`, seed realistic demonstration vendors/products/packaging units, implement server-side product lookup logic, and build QR code generation utility.

---

## 2. Completed Work (Milestone 0)

1. Initialized Git repository and configured `.gitignore`.
2. Bootstrapped Next.js 16 App Router application with React 19, TypeScript strict mode, and Tailwind CSS v4.
3. Created target `src/` modular directory hierarchy.
4. Installed and pinned stable dependencies:
   - `prisma` & `@prisma/client` (`^6.19.3`)
   - `zod` (`^4.6.7`)
   - `vitest` (`^5.0.5`)
   - `qrcode` & `@types/qrcode`
   - `lucide-react`, `clsx`, `tailwind-merge`, `tsx`
5. Configured `vitest.config.mts` for automated testing with `@/*` alias support.
6. Configured Prisma client singleton in `src/lib/db/prisma.ts`.
7. Created `.env.example` with sanitized placeholders.
8. Authored complete documentation suite (`AGENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, etc.).

---

## 3. Verified Functionality & Actual Test Results

- **Vitest**: `npm test` -> 2 tests passed (Smoke test & cn utility), duration 408ms.
- **ESLint**: `npm run lint` -> Exited with code 0 (no warnings or errors).
- **TypeScript & Turbopack Build**: `npm run build` -> Compiled in 3.1s, static routes generated without errors.
- **Prisma Generator**: `npm run db:generate` -> Prisma Client v6.19.3 generated successfully in 39ms.

---

## 4. Files Changed / Created

- `package.json` & `package-lock.json`
- `tsconfig.json` & `next.config.ts`
- `eslint.config.mjs`
- `vitest.config.mts`
- `AGENTS.md`
- `.env.example` & `.gitignore`
- `prisma/schema.prisma`
- `src/lib/utils.ts`
- `src/lib/db/prisma.ts`
- `src/tests/smoke.test.ts`
- `docs/*` (All documentation specifications)

---

## 5. Unresolved Problems / Blockers

- None. Environment is stable and operational.

---

## 6. Important Technical Decisions

- **Stable Prisma 6 vs 8 RC**: Prisma 8 RC has breaking experimental CLI behaviors ("composer-cli" / "skills"). Prisma 6.19.3 is stable, reliable, and perfectly suited for PostgreSQL production workloads.
- **Vitest configuration**: Named `vitest.config.mts` with ESM path resolution to prevent Node CommonJS/ESM peer conflict warnings.
- **Strict Role-Based Server Architecture**: Client components must never hold database logic or privileged role verification.

---

## 7. The Next Exact Task (For Next Step / Milestone 1)

**Task**: Implement PostgreSQL Data Models, Seeding, and Product QR Verification Service.

**Steps to execute**:
1. Expand `prisma/schema.prisma` with core entities:
   - `User` (id, email, name, role [PASSENGER, QUALITY_REVIEWER, ADMIN], createdAt)
   - `Vendor` (id, name, code, contactEmail, status, createdAt)
   - `Product` (id, vendorId, name, category, fssaiLicense, createdAt)
   - `PackagingUnit` (id, productId, batchNumber, packagingDate, expiryDate, qrCodeIdentifier, status, createdAt)
   - `Complaint` (id, complaintRef, trackingToken, packagingUnitId, category, description, trainNumber, journeyDate, coach, contactInfo, status, createdAt)
   - `ComplaintEvidence` (id, complaintId, storagePath, mimeType, fileSizeBytes, uploadedAt)
   - `ComplaintEvent` (id, complaintId, actorId, previousStatus, newStatus, explanation, isPublic, createdAt)
   - `Investigation` (id, complaintId, investigatorId, findings, notes, isCompleted, createdAt, updatedAt)
   - `CorrectiveAction` (id, investigationId, actionDescription, assignedTo, deadline, status, createdAt)
   - `RecurringIssueAlert` (id, vendorId, productId, category, triggerCount, timeWindowHours, reason, status, createdAt)
2. Generate Prisma Client (`npm run db:generate`).
3. Create `prisma/seed.ts` with demonstration IRCTC/railway pantry caterers, verified products (e.g., standard meal trays, packaged drinking water, breakfast boxes), and valid sample QR codes.
4. Implement `src/lib/qr/generator.ts` to generate QR codes with standard query parameters (`?p=<packaging_uuid>`).
5. Implement `src/services/productService.ts` for secure product verification by packaging identifier.
6. Add unit tests in `src/tests/product.test.ts` verifying valid, inactive, and unrecognised packaging lookups.

---

## 8. Acceptance Criteria

- [ ] `prisma/schema.prisma` contains all required relational models and indexes without syntax errors.
- [ ] `npm run db:generate` succeeds.
- [ ] `prisma/seed.ts` compiles cleanly with `tsx`.
- [ ] Product service correctly distinguishes valid, expired/inactive, and non-existent packaging units.
- [ ] Unit tests pass for QR generation and product lookup (`npm test`).
- [ ] Build passes (`npm run build`).
