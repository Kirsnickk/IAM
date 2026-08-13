# AGENTS.md — Asset Management System

**Multi-agent project governance** — Source of truth for deploy targets, production data, and agent boundaries.

## Reality Check (Updated: 2026-08-13)

- **Frontend**: Deployed on **Vercel** → [https://iam-api-sandy.vercel.app](https://iam-api-sandy.vercel.app)
- **Backend API**: Deployed on **Render** → [https://iam-tfba.onrender.com](https://iam-tfba.onrender.com) (Free tier with cold start)
- **Database**: **NeonDB PostgreSQL** → `morning-frog-89279242` (Production with real asset data)
- **Monorepo Structure**: 
  - `apps/web/` → Next.js 14 frontend
  - `apps/api/` → Node.js Express backend + Prisma ORM
- **Deploy Config**: 
  - Frontend: `vercel.json` (active)
  - Backend: Render dashboard config (active)
  - ❌ `railway.json` is **leftover** — do not edit

## ⚠️ CRITICAL RULE — Prisma Migration Discipline

> **Never edit `apps/api/prisma/schema.prisma` without generating a matching migration.**
> 
> `prisma migrate deploy` only replays files in `apps/api/prisma/migrations/`. It does NOT read `schema.prisma` directly.

### Correct Workflow (Non-negotiable):
1. Edit `apps/api/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <descriptive_name>` → generates `migrations/<timestamp>_<name>/migration.sql`
3. Commit schema change AND migration folder **together** in the same commit
4. For required columns on existing tables: add `@default(...)` in schema + matching `DEFAULT` in SQL

### Pre-push Verification:
```bash
cd apps/api && npx prisma migrate status  # Must say "no drift"
```

## Agent Boundaries

| Domain | Scope | Do NOT Touch |
|--------|-------|--------------|
| **Backend Agent** | `apps/api/`, `prisma/`, `Data/`, `Data clear/` | `apps/web/` |
| **Frontend Agent** | `apps/web/`, UI components, state management | `apps/api/`, `prisma/` |
| **Data Agent** | `Data/`, `Data clear/`, ETL scripts, analytics | Live production DB without confirmation |
| **Deploy Agent** | Root config files, CI/CD, `vercel.json`, Render dashboard | Feature code |

## Environment Safety

- **PRODUCTION**: `DATABASE_URL=postgresql://morning-frog-89279242` → **NEVER** run `prisma migrate reset` or `prisma db push --force-reset`
- **Development**: Use local PostgreSQL or separate Neon branch
- **Staging**: TBD (recommend separate Neon database)

## Pre-Push Checklist

- [ ] `cd apps/api && npm install && npx prisma generate` — no errors
- [ ] `cd apps/api && npx prisma migrate status` — no drift
- [ ] `cd apps/web && npm install && npm run build` — builds successfully
- [ ] No `.env`, secrets, or production DATABASE_URL in commits
- [ ] Commit touches only relevant domain boundaries
- [ ] Commit message describes what changed and why

## Data Import Protocol

When uploading cleaned data from `Data clear/`:
1. **Never directly modify production** — create import script `apps/api/src/prisma/import-data-clear.ts`
2. **Test on development database first**
3. **Get explicit human confirmation before production import**
4. **Log all import operations with rollback instructions**

## Deploy Failure Recovery

1. **DO NOT** push random "fix" commits
2. Check actual error logs:
   - **Render**: Dashboard → iam-tfba → Events → Build Logs
   - **Vercel**: Dashboard → iam-api-sandy → Deployments → Build Logs
3. If Prisma migration error: ensure migration files exist in `/migrations/`
4. If cold start timeout: restart Render service manually
5. Fix root cause, then push

## Current Project Status (2026-08-13)

- ✅ **Data Cleaned**: 6 files ready in `Data clear/` folder
- ✅ **Prisma Schema**: 23+ tables defined, matches business requirements
- 🔄 **Import Ready**: ETL script needed for `Data clear/` → PostgreSQL
- 🔄 **E2E Integration**: Frontend needs `NEXT_PUBLIC_API_URL` + Backend needs `CORS_ORIGIN` sync