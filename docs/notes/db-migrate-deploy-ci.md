# Manual Neon migration deploy (CI)

**Scope:** Apply existing committed Prisma migrations to Neon via GitHub Actions.  
**Does not** create or alter migration files.

---

## Workflow

| Item | Value |
| ---- | ----- |
| File | `.github/workflows/db-migrate-deploy.yml` |
| Trigger | **Manual only** (`workflow_dispatch`) |
| GitHub Environment | **`neon`** |
| Command | `pnpm exec prisma migrate deploy` |

The workflow runs only when started from the GitHub Actions UI. It is not triggered on push or pull request.

When prompted, enter confirmation input exactly: **`deploy`**

---

## Required secrets (GitHub Environment `neon`)

| Secret | Neon connection type |
| ------ | -------------------- |
| **`DATABASE_URL`** | **Pooled** URL (`-pooler` host; include `pgbouncer=true` per `.env.example`) |
| **`DIRECT_URL`** | **Direct** URL (non-pooler host) |

Both are required: `prisma/schema.prisma` declares `url` and `directUrl`. Prisma Migrate uses **`DIRECT_URL`** for migration execution.

Do not commit real connection strings. Add secrets in GitHub → Settings → Environments → **neon** → Environment secrets.

---

## What it applies

Pending migrations from `prisma/migrations/` only — currently:

- `20250805103100_init` — `users`, `profiles`, `ExperienceLevel` enum

Uses `prisma migrate deploy` (not `migrate dev`). Safe to re-run; already-applied migrations are skipped.

---

## Failed migration recovery

Use when a migration failed in Neon (e.g. P3018) and must be marked rolled back before re-deploy.

**Prerequisite:** Fix the migration source in git first (e.g. remove UTF-8 BOM from `migration.sql`), then merge to `main`.

| Step | Action |
| ---- | ------ |
| 1 | Merge the migration fix to `main` |
| 2 | Actions → **Database Migrate Resolve** → migration `20250805103100_init`, confirmation **`resolve`** |
| 3 | Actions → **Database Migrate Deploy** → confirmation **`deploy`** |
| 4 | Verify in Neon: `_prisma_migrations` success row; tables `users`, `profiles` |

| Item | Value |
| ---- | ----- |
| File | `.github/workflows/db-migrate-resolve.yml` |
| Trigger | **Manual only** (`workflow_dispatch`) |
| GitHub Environment | **`neon`** |
| Command | `pnpm exec prisma migrate resolve --rolled-back <migration_name>` |
| Supported migration (this recovery) | **`20250805103100_init`** only |

Does **not** run `migrate deploy`, `migrate dev`, or manual SQL. Run **Resolve** once, then **Deploy** separately.

---

## References

- Prisma–Neon local CLI note: `docs/notes/prisma-neon-connectivity.md`
- Env template: `.env.example`
