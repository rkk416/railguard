# RailGuard — Production Deployment Guide

This guide details the deployment of RailGuard to **Vercel** with a managed **PostgreSQL 16+** database (e.g. Neon, Supabase, AWS RDS, or Railway).

---

## 1. Prerequisites

- A Next.js-compatible hosting provider (Vercel recommended).
- A hosted PostgreSQL instance (PostgreSQL 16 or 18 wire-compatible).
- Node.js runtime 20.x or 22.x LTS.

---

## 2. Environment Variables Configuration

Configure the following environment variables in your deployment dashboard (e.g., Vercel Project Settings $\rightarrow$ Environment Variables):

| Variable Name | Required | Purpose | Production Example |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | Connection pooled PostgreSQL connection string (PgBouncer/Neon pooled) | `postgresql://user:pass@ep-pool.neon.tech/railguard?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | **Yes** | Non-pooled direct database connection URL used by Prisma migrations | `postgresql://user:pass@ep-direct.neon.tech/railguard?sslmode=require` |
| `SESSION_SECRET` | **Yes** | Secret key for signing sessions and cryptographic tokens | `railguard_sec_9f826b58e062_prod_secret_key` |
| `EVIDENCE_TOKEN_SECRET` | **Yes** | Secret key for HMAC-SHA256 short-lived evidence access tokens (15m TTL) | `railguard_ev_secret_2026_hmac_prod_signing_key` |
| `DEMO_RESET_ADMIN_SECRET` | **Yes** | Secret key for administrative reset bypass authentication | `admin_demo_reset_secure_passphrase_2026` |
| `NODE_ENV` | **Yes** | Runtime environment mode | `production` |

> [!CAUTION]
> Never prefix backend credentials with `NEXT_PUBLIC_`. All database credentials and token signing keys must remain server-side only.

---

## 3. Build & Migration Configuration

In `package.json`, configure the build command to ensure Prisma Client is generated before compilation:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build --webpack"
  }
}
```

### Applying Migrations on Deployment
In Vercel or your CI/CD pipeline, run migrations using the `DIRECT_URL`:

```bash
# Apply version-controlled PostgreSQL migrations
npx prisma migrate deploy

# Seed initial demonstration baseline (if deploying demo instance)
npm run db:seed
```

---

## 4. Local Containerized Deployment (Docker Compose)

For offline or on-premises staging, use the provided `docker-compose.yml`:

```bash
# 1. Start PostgreSQL 16 Alpine container
docker compose up -d postgres

# 2. Apply migrations
npx prisma migrate deploy

# 3. Seed demonstration fixtures
npm run db:seed

# 4. Run application
npm run build
npm start
```

---

## 5. Security & Verification Checklist

- [x] **No plaintext tracking tokens**: Database stores only SHA-256 hashes (`Complaint.trackingTokenHash`).
- [x] **Evidence storage isolation**: Uploads are written to private disk storage (`evidence_storage/uploads/`) and streamed strictly via authenticated proxy `/api/evidence/[id]`.
- [x] **Evidence security headers**: Proxied images return `nosniff`, `no-referrer`, and `no-store` headers.
- [x] **RBAC enforcement**: Quality reviewer actions validate server-side session cookies; admin operations (soft delete, demo reset) require strict `ADMIN` role.
- [x] **Sliding window rate limiting**: Active on `/api/complaints` (10 req/15 min) and `/api/track` (20 req/15 min).
