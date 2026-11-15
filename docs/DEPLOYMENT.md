# RailGuard — Production Deployment Guide
## Render Blueprint + Supabase PostgreSQL + Supabase Storage

> **Complete architectural and operational instructions for deploying RailGuard as a single Node.js Web Service on Render, powered by Supabase PostgreSQL and private Supabase Object Storage.**

---

## 1. Architecture Overview

RailGuard is architected to deploy as a unified, zero-redundancy platform:

```
[ Passenger / Inspector Browser ]
                │
                ▼
  ┌────────────────────────────────────────────────────────┐
  │  Render Web Service (Node.js 22 LTS, Singapore)        │
  │  ─────────────────────────────────────────────         │
  │  • Next.js 16 App Router (React 19 Server Components)   │
  │  • Integrated API Route Handlers                       │
  │  • Server-Enforced RBAC & Token Cryptography           │
  │  • Automatic Health Check Probe (/api/health)          │
  └─────────────┬───────────────────────────┬──────────────┘
                │                           │
                │ Prisma Client             │ Native HTTPS Fetch
                │ (Session Pooler)          │ (Service Role Auth)
                ▼                           ▼
  ┌───────────────────────────┐  ┌──────────────────────────┐
  │ Supabase PostgreSQL       │  │ Supabase Storage         │
  │ ───────────────────       │  │ ────────────────         │
  │ • Port 5432 Pooler        │  │ • Private Bucket:        │
  │ • 11 Relational Tables    │  │   railguard-evidence     │
  │ • Append-Only Audit Logs  │  │ • Encrypted Evidence     │
  └───────────────────────────┘  └──────────────────────────┘
```

---

## 2. Step 1: Supabase Setup (PostgreSQL + Storage)

### A. Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New project**.
2. Select an organization, name the project (e.g., `railguard-prod`), and choose a region close to your deployment (e.g. `Singapore (ap-southeast-1)`).
3. Generate and **save a strong Database Password**.

### B. Retrieve Database Connection Strings
1. In the Supabase Dashboard, navigate to:
   `Project Settings` $\rightarrow$ `Database` $\rightarrow$ `Connection string` $\rightarrow$ `URI`.
2. **Session Pooler (`DATABASE_URL`)**:
   - Select the **Session** mode (IPv4 compatible, Port 5432).
   - The connection string format is:
     ```text
     postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
     ```
   - *This URI will be provided to Render as `DATABASE_URL`.*
3. **Direct Connection (`DIRECT_URL`)**:
   - Select the **Direct** connection mode (Port 5432).
   - The connection string format is:
     ```text
     postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
     ```
   - *This URI is used by Prisma for running migrations and will be provided to Render as `DIRECT_URL`.*

### C. Create Private Storage Bucket
1. In the Supabase Dashboard, click **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name the bucket: `railguard-evidence`.
4. **IMPORTANT**: Keep the **Public bucket** toggle **DISABLED** (bucket must be private).
5. Click **Save bucket**.

### D. Retrieve API Credentials
1. In the Supabase Dashboard, navigate to:
   `Project Settings` $\rightarrow$ `API`.
2. Copy the **Project URL** (e.g. `https://[PROJECT_REF].supabase.co`) $\rightarrow$ use for `SUPABASE_URL`.
3. Under **Project API keys**, reveal and copy the **`service_role`** key (Secret) $\rightarrow$ use for `SUPABASE_SERVICE_ROLE_KEY`.
   *(Do NOT use the public `anon` key).*

---

## 3. Step 2: Render Blueprint Deployment

### A. Push Code to GitHub
Ensure your repository is pushed to your personal GitHub account:
```bash
git push -u origin master
```

### B. Launch Blueprint on Render
1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button at the top and select **Blueprint**.
3. Connect your GitHub account and select your `railguard` repository.
4. Render will automatically parse the `render.yaml` file from the repository root.
5. In the Blueprint instance setup screen, Render will list:
   - **Service Name**: `railguard`
   - **Environment**: `Node`
   - **Plan**: `Free`
   - **Region**: `Singapore`
   - **Build Command**: `npm install && npx prisma migrate deploy && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### C. Provide Environment Secrets
Render will automatically generate cryptographic secrets for `SESSION_SECRET`, `EVIDENCE_TOKEN_SECRET`, and `DEMO_RESET_ADMIN_SECRET`.

You only need to paste the following 5 values when prompted:

| Environment Variable | Source from Supabase / Render | Secret? |
|---|---|---|
| `DATABASE_URL` | Supabase $\rightarrow$ Settings $\rightarrow$ Database $\rightarrow$ Session Pooler URI | **Yes** |
| `DIRECT_URL` | Supabase $\rightarrow$ Settings $\rightarrow$ Database $\rightarrow$ Direct Connection URI | **Yes** |
| `SUPABASE_URL` | Supabase $\rightarrow$ Settings $\rightarrow$ API $\rightarrow$ Project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase $\rightarrow$ Settings $\rightarrow$ API $\rightarrow$ `service_role` secret key | **Yes** |
| `NEXT_PUBLIC_APP_URL` | Render canonical URL (e.g. `https://railguard.onrender.com`) | No |

*(Note: `SUPABASE_STORAGE_BUCKET` is preset to `railguard-evidence` and `ALLOW_DEMO_RESET` is preset to `false`).*

6. Click **Apply**.
7. Render will execute:
   - Dependency installation (`npm install`)
   - Schema migration against Supabase (`npx prisma migrate deploy`)
   - Prisma Client compilation (`prisma generate`)
   - Next.js production build (`next build --webpack`)
   - Web service launch (`npm start`)

---

## 4. Step 3: Seed Demonstration Baseline (Optional)

If you wish to populate the newly migrated Supabase database with the realistic 35-complaint demonstration dataset, run the seed script from your local machine targeting Supabase:

```bash
# In your local railguard repository terminal:
DATABASE_URL="<your-supabase-session-pooler-url>" DIRECT_URL="<your-supabase-direct-url>" npm run db:seed
```

The script will seed:
- 2 administrative and reviewer user accounts
- 8 Indian Railways stations
- 6 passenger express trains
- 5 licensed pantry caterers
- 14 certified food products
- 16 batch units with verification QR codes
- 35 realistic complaint cases across all operational stages

---

## 5. Step 4: Verification & Smoke Test

Once Render marks the service **Live**:

1. **Health Check**:
   Open: `https://<your-service-name>.onrender.com/api/health`
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "railguard",
     "database": "connected",
     "timestamp": "2026-11-16T..."
   }
   ```

2. **Homepage**:
   Navigate to `https://<your-service-name>.onrender.com`. Verify the Living Inspection Register interface and hero illustration render cleanly.

3. **Product Verification**:
   Scan or input a demo packaging code (e.g. `QR-MEAL-2026-001`). Verify batch details and catering license display.

4. **Incident Submission**:
   Submit a test complaint at `/report` with an attached image. Verify that:
   - Submission completes and returns a reference (e.g., `RG-2026-XXXX`).
   - The image is securely uploaded to private Supabase Storage (`railguard-evidence`).
   - Image preview streams properly via authenticated URL at `/track`.

5. **Operations Dashboard**:
   Navigate to `/dashboard`. Verify active KPIs, recurring alert panels, and complaint triage queues.

---

## 6. Manual Inputs Checklist (Quick Reference)

Keep this checklist handy during Render Blueprint deployment:

| Variable | Value to Enter | Where to Copy From |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require` | Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Connection String (Session Pooler) |
| `DIRECT_URL` | `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres?sslmode=require` | Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Connection String (Direct URI) |
| `SUPABASE_URL` | `https://[ref].supabase.co` | Supabase Dashboard $\rightarrow$ Project Settings $\rightarrow$ API $\rightarrow$ Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase Dashboard $\rightarrow$ Project Settings $\rightarrow$ API $\rightarrow$ `service_role` (Secret) |
| `NEXT_PUBLIC_APP_URL` | `https://[your-service].onrender.com` | Render Service Header URL |

---

## 7. Free-Tier Operational Characteristics

RailGuard has been optimized to run reliably within free tier limits:

| Platform / Service | Free Tier Allowance | Operational Behavior in RailGuard |
|---|---|---|
| **Render Web Service** | Free Plan (0.1 CPU, 512 MB RAM) | Instances spin down after 15 minutes of inactivity. First request after spin-down takes ~30–50 seconds to cold boot. Subsequent requests respond instantly. |
| **Supabase PostgreSQL** | 500 MB database, 2 projects free | Connection pooling via Session Pooler (port 5432) ensures Prisma does not exhaust connections. Data size for demo dataset is ~5 MB. |
| **Supabase Storage** | 1 GB storage, 2 GB bandwidth/month | Files are limited to 5 MB each (max 3 per report). Streamed exclusively on demand with `no-store` headers to minimize egress. |
