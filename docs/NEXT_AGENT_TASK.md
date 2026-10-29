# Next Agent Task Specification & Handoff

---

## 1. Current State Summary

- **Completed Milestones**: Milestone 0 (Foundation) & Milestone 1 (Data Models, Seeding, QR Generation & Product Verification)
- **Target Milestone**: Milestone 2 — Passenger Reporting Flow & Secure Evidence Storage
- **Current Objective**: Build the passenger reporting experience (`/report`), server-side Zod validation, evidence photo upload with format/size restrictions, private object storage interface, and complaint reference + tracking token generation.

---

## 2. Completed Work (Milestones 0 & 1)

1. Initialized Next.js 16 App Router project with TypeScript strict mode, React 19, and Tailwind CSS v4.
2. Configured test runner (`vitest.config.mts`) with `@/*` alias support.
3. Implemented full relational PostgreSQL schema in `prisma/schema.prisma` with 11 models and enums.
4. Created domain TypeScript interfaces in `src/types/index.ts`.
5. Created QR code generator in `src/lib/qr/generator.ts`.
6. Built product verification service in `src/services/productService.ts` distinguishing `VERIFIED`, `EXPIRED`, `RECALLED`, and `UNRECOGNIZED` batches.
7. Built public product verification page (`src/app/products/[id]/page.tsx`) and API handler (`src/app/api/products/[id]/route.ts`).
8. Built landing page (`src/app/page.tsx`) and interactive QR test form (`src/components/passenger/PackagingLookupForm.tsx`).
9. Implemented comprehensive unit tests (`src/tests/product.test.ts` & `src/tests/smoke.test.ts`).
10. Maintained and verified all documentation in `docs/*` and `AGENTS.md`.

---

## 3. Verified Functionality & Actual Test Results

- **Unit & Integration Suite**: `npm test` -> **10/10 tests passed** in 240ms.
- **ESLint**: `npm run lint` -> **Clean** (0 warnings, 0 errors).
- **TypeScript Checking**: `npx tsc --noEmit` -> **Clean** (0 errors).
- **Production Build**: `npm run build` -> **Compiled in 955ms** (prerendered `/`, server-rendered `/products/[id]` & `/api/products/[id]`).
- **Prisma Client Generation**: `npm run db:generate` -> **Generated in 88ms**.

---

## 4. Files Changed in Milestone 1

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/types/index.ts`
- `src/lib/qr/generator.ts`
- `src/services/productService.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/products/[id]/page.tsx`
- `src/components/passenger/PackagingLookupForm.tsx`
- `src/app/page.tsx`
- `src/tests/product.test.ts`
- `next.config.ts`
- `docs/PROJECT_STATUS.md`
- `docs/DEVELOPMENT_LOG.md`
- `docs/NEXT_AGENT_TASK.md`

---

## 5. Technical Decisions & Notes

- **Dynamic Route Optimization**: In Next.js 16, dynamic routes (`/products/[id]`) accessing URL params at request time were configured to be dynamic without conflicting with experimental caching flags.
- **Zero-Trust Mocking**: In `src/tests/product.test.ts`, mocked database responses are typed using Prisma's generated `Prisma.PackagingUnitGetPayload` rather than `any`, adhering strictly to repository rules.

---

## 6. The Next Exact Task (Milestone 2)

**Task**: Implement Passenger Reporting Interface, Zod Validation, Evidence Upload, and Complaint Generation.

**Steps to execute**:
1. Implement Zod validation schema in `src/lib/validation/complaint.ts`:
   - Complaint category (`SPOILAGE`, `FOREIGN_OBJECT`, `HYGIENE_PACKAGING`, `TEMPERATURE`, `PRODUCT_MISMATCH`, `OTHER`)
   - Description (min 15 chars, max 2000 chars)
   - Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
   - Train number (e.g. 5-digit regex or alphanumeric)
   - Journey date (within last 30 days)
   - Coach / Seat information
   - Optional passenger email / phone
2. Implement reference and token generation utility in `src/lib/security/tokens.ts`:
   - Human-readable `complaintRef` (e.g. `RG-2026-XXXXX`)
   - Secure random `trackingToken` (e.g. 32-character hexadecimal/base64url token)
3. Implement private storage abstraction in `src/lib/storage/evidenceStorage.ts`:
   - In-memory / local disk fallback for local development & automated testing
   - Supabase Storage client integration for production private bucket uploads
   - Presigned URL generation for authorized viewing
4. Create photo upload client component in `src/components/passenger/EvidenceUploader.tsx`:
   - Multi-file preview (up to 3 images, $\le 5$MB each, JPEG/PNG/WebP)
   - Client-side size & mime-type validation
5. Create passenger reporting page in `src/app/report/page.tsx`:
   - Auto-populates packaging record if `?p=<qrCode>` is present
   - Displays packaging verification status badge at the top
   - Clear validation feedback and error states
6. Implement Server Action or Route Handler in `src/app/api/complaints/route.ts` executing atomic database transaction:
   - Insert `Complaint` record
   - Insert `ComplaintEvidence` records
   - Insert initial `ComplaintEvent` ("SUBMITTED: Complaint logged by passenger")
7. Add unit tests in `src/tests/complaintValidation.test.ts` testing Zod schemas, reference generation, and submission failure cases.
8. Run `npm test`, `npm run lint`, and `npm run build`.

---

## 7. Acceptance Criteria for Milestone 2

- [ ] Passenger can access `/report` directly or with `?p=<identifier>`.
- [ ] If scanned with a valid/expired/recalled packaging code, the packaging details are shown on the form.
- [ ] Server-side Zod validation rejects invalid descriptions, unsupported file types, and invalid dates.
- [ ] Submitting a valid complaint creates `Complaint`, `ComplaintEvidence`, and initial `ComplaintEvent` records.
- [ ] Generated `complaintRef` and `trackingToken` are returned and displayed on a clean confirmation screen.
- [ ] Unit tests pass with 100% success rate (`npm test`).
- [ ] Production build succeeds without errors (`npm run build`).
