# AGENTS.md — Backend (apps/api/)

**Scope**: Node.js + Express + Prisma ORM + PostgreSQL. Read root `AGENTS.md` first — **§3 Prisma migration discipline is mandatory**.

## Architecture Overview

```
src/
├── app.ts              # Express app setup
├── server.ts           # HTTP server entry point
├── middleware/         # Auth, error handling, CORS
├── modules/            # Feature-based routing
│   ├── assets/         # Asset CRUD operations
│   ├── assignments/    # Asset-Employee assignments
│   ├── audit/          # Inventory audits
│   ├── auth/           # Authentication & authorization
│   ├── maintenance/    # Maintenance tickets
│   ├── master/         # Master data (orgs, locations, departments)
│   ├── reports/        # Analytics & reporting
│   └── transfers/      # Asset transfers between locations
└── prisma/
    ├── schema.prisma   # Database schema (23+ tables)
    ├── migrations/     # Auto-generated SQL migrations
    └── seed.ts         # Sample data seeding
```

## Request Flow Pattern

`routes/` → `controllers/` → Prisma client. **Routes do NOT query Prisma directly.**

### Example Controller Pattern:
```typescript
// ❌ WRONG - Direct Prisma in route
app.get('/assets', async (req, res) => {
  const assets = await prisma.asset.findMany();
  res.json(assets);
});

// ✅ CORRECT - Controller layer
app.get('/assets', assetController.getAssets);
// Controller handles Prisma queries + business logic
```

## Database Schema Rules

- **23+ tables**: Organizations → Locations → Departments → Employees → Assets → Assignments
- **Every new required field** on tables with existing data needs:
  - `@default(...)` in `schema.prisma`
  - Matching `DEFAULT` in the migration SQL
- **Enum changes**: Add new values, never remove (breaking change)

## Local Development

```bash
# Setup
npm install
npx prisma generate

# Database sync check
npx prisma migrate status     # Must show "No pending migrations"

# Start development server
npm run dev                   # Starts on http://localhost:5000
```

## Production Deployment (Render)

- **Deploy Target**: [https://iam-tfba.onrender.com](https://iam-tfba.onrender.com)
- **Free Tier**: Cold start ~30-60 seconds on first request
- **Database**: NeonDB `morning-frog-89279242` (shared with frontend)
- **Environment Variables**: Set in Render dashboard, not committed to repo

## Data Import Safety

When importing from `Data clear/`:
1. **Create import script**: `src/prisma/import-data-clear.ts`
2. **Use transactions**: Wrap in `prisma.$transaction([...])`
3. **Idempotent operations**: Use `upsert()` instead of `create()`
4. **Validation**: Validate all CSV data before DB operations
5. **Logging**: Console.log progress for monitoring

### Import Order (Foreign Key Dependencies):
```
1. Organizations, Vendors
2. Locations, Departments  
3. Asset Categories, Asset Models
4. Employees (with User accounts)
5. Assets (Office + Store)
6. Asset Assignments
7. Maintenance Records, Transfers
```

## Environment Variables Required

```bash
DATABASE_URL="postgresql://..."     # NeonDB connection
JWT_SECRET="your-secret-key"        # Auth token signing
CORS_ORIGIN="https://iam-api-sandy.vercel.app"  # Frontend URL
PORT=5000                          # Render sets automatically
```

## Backend-Only Boundaries

✅ **Safe to modify**:
- `apps/api/src/` (all TypeScript files)
- `apps/api/prisma/` (schema + migrations)
- `Data/`, `Data clear/` (ETL & data files)
- Root config: `package.json`, `.gitignore`

❌ **Do NOT touch**:
- `apps/web/` (Frontend Next.js code)
- Frontend environment variables
- `vercel.json` (frontend deploy config)

## Testing & Validation

```bash
# Schema validation
npx prisma validate

# Migration drift check  
npx prisma migrate status

# Database introspection
npx prisma db pull

# Generate fresh client
npx prisma generate
```

## Emergency Recovery

If migration fails in production:
1. **Check Render build logs** for exact error message
2. **Do not guess** — read the actual Prisma error
3. **Common issues**:
   - Missing migration file: Re-run `npx prisma migrate dev`
   - Schema drift: Reset development DB, regenerate migrations
   - Cold start timeout: Manually restart Render service