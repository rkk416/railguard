<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RailGuard — Agent Guidelines & Repository Context

Welcome to **RailGuard**, a railway food quality audit and passenger feedback platform.
This repository is engineered to support sequential AI agents collaborating over an iterative 14-day development cycle.

---

## 1. Golden Rules for All Agents

1. **Context Continuity**: The repository (`AGENTS.md` and `docs/`) is the single source of truth—never assume access to prior chat context.
2. **Sequential Discipline**: Work in strict sequence:
   $$\text{DISCOVER} \rightarrow \text{PLAN} \rightarrow \text{IMPLEMENT} \rightarrow \text{VERIFY} \rightarrow \text{DOCUMENT} \rightarrow \text{HAND OFF}$$
3. **Never Overwrite Working Code**: Inspect existing code before making changes. Preserve all unrelated comments and types.
4. **Server-Enforced Security**: Never trust frontend state or client-supplied claims for roles, statuses, or vendor IDs.
5. **No Hallucinated Claims or Tests**: Report exact command execution outputs and test results. Never claim a test passed if it was unexecuted or failed.
6. **Preserve Next.js Agent Block**: The `<!-- BEGIN:nextjs-agent-rules -->` block above must never be removed.

---

## 2. Technology Stack & Key Libraries

- **Framework**: Next.js 16 App Router (React 19, TypeScript strict mode)
- **Styling**: Tailwind CSS v4, Lucide React icons, `clsx` + `tailwind-merge`
- **Database ORM**: Prisma v6 with PostgreSQL provider
- **Validation**: Zod (all API route payloads and server actions)
- **Testing**: Vitest (`vitest.config.mts`) for unit and integration testing
- **QR Utilities**: `qrcode` library
- **Storage**: Private object storage abstraction (Supabase Storage / S3-compatible) with signed URL access

---

## 3. Directory Structure

```text
railguard/
├── docs/                      # Agent continuity and architectural specifications
│   ├── PROJECT_STATUS.md      # Current milestone, bugs, and verified work
│   ├── NEXT_AGENT_TASK.md     # Immediate task handoff and acceptance criteria
│   ├── ARCHITECTURE.md        # Technical architecture and server/client boundary
│   ├── DATABASE.md            # PostgreSQL schema, entity relations, audit policy
│   ├── FEATURES.md            # Functional module breakdown
│   ├── DEVELOPMENT_LOG.md     # Chronological log of changes and decisions
│   ├── DECISIONS.md           # Architecture Decision Records (ADRs)
│   ├── TESTING.md             # Testing strategy and run instructions
│   ├── SECURITY.md            # Security, RBAC, evidence isolation, rate-limiting
│   └── ROADMAP.md             # 14-day roadmap and milestone sequence
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema definition
│   ├── migrations/            # Version-controlled migrations
│   └── seed.ts                # Demonstration data seeder
├── public/
│   └── images/                # Static public assets
├── src/
│   ├── app/                   # Next.js App Router pages and route handlers
│   │   ├── page.tsx           # Public landing page
│   │   ├── report/            # Passenger QR reporting flow
│   │   ├── track/             # Public complaint tracking by reference + token
│   │   ├── products/          # Product verification view
│   │   ├── dashboard/         # Protected quality reviewer & admin dashboard
│   │   └── api/               # Server route handlers & webhooks
│   ├── components/            # Reusable UI components
│   │   ├── ui/                # Base design system primitives (shadcn-compatible)
│   │   ├── passenger/         # Passenger-facing reporting & tracking components
│   │   └── dashboard/         # Reviewer dashboard, metrics, case tables, charts
│   ├── lib/                   # Shared utilities & server integrations
│   │   ├── auth/              # Server-side auth & RBAC session resolution
│   │   ├── db/                # Prisma client singleton (src/lib/db/prisma.ts)
│   │   ├── storage/           # Private object storage & signed URL generator
│   │   └── validation/        # Zod schemas for forms and API payloads
│   ├── services/              # Server business logic (audit events, recurring rules)
│   ├── types/                 # Domain TypeScript interfaces and types
│   └── tests/                 # Vitest unit and integration test suites
├── AGENTS.md                  # This file
├── .env.example               # Sanitized environment variable template
├── .gitignore                 # Git ignore rules (protects credentials and builds)
├── next.config.ts             # Next.js runtime configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── vitest.config.mts          # Vitest testing configuration
```

---

## 4. Coding Conventions & Standards

- **Server Components by Default**: Pages and layout components are React Server Components (`RSC`) unless state, event handlers (`onClick`, `onChange`), or browser APIs are required.
- **Client Components Explicit**: Add `"use client"` directive strictly at the top of client boundary components.
- **Data Mutation**: Use Server Actions or Route Handlers with explicit Zod schema parsing.
- **Prisma Client**: Always import from `@/lib/db/prisma`, never instantiate `new PrismaClient()` in ad-hoc route files.
- **Type Safety**: Strictly avoid `any`. Use TypeScript types defined in `@/types` or inferred from Zod/Prisma.
- **Path Aliasing**: Always use `@/*` to reference `src/*`.

---

## 5. Security Invariants

1. **RBAC Verification**: Validate user role and permissions in server code on every protected action. Client-side menu hiding is purely cosmetic.
2. **Private Evidence Isolation**: Evidence images must never be placed in `public/` or served via static public URLs. Use signed URLs with limited expiration.
3. **No Secret Leaks**: Never prefix sensitive backend variables with `NEXT_PUBLIC_`.
4. **Input Sanitization**: Validate string lengths, file mime-types, file magic numbers, and numeric ranges.
5. **Demonstration Clarification**: Always clearly label simulated vendor/product data with demonstration notices.

---

## 6. Standard Commands

```bash
# Development server
npm run dev

# Production build & type check
npm run build

# Run lint checks
npm run lint

# Run unit & integration test suite
npm test

# Vitest interactive watch mode
npm run test:watch

# Generate Prisma client
npm run db:generate

# Execute database migrations
npm run db:migrate

# Seed demonstration records
npm run db:seed
```

---

## 7. Mandatory Protocol for Next Agents

When picking up a task:
1. Read `AGENTS.md`.
2. Read `docs/PROJECT_STATUS.md` and `docs/NEXT_AGENT_TASK.md`.
3. Verify the existing build and tests (`npm test && npm run build`).
4. Execute the planned task within the designated milestone scope.
5. Run tests, linting, and build verification.
6. Update `docs/PROJECT_STATUS.md`, `docs/DEVELOPMENT_LOG.md`, and `docs/NEXT_AGENT_TASK.md`.
