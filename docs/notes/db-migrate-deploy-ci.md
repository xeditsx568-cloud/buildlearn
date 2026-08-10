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

## References

- Prisma–Neon local CLI note: `docs/notes/prisma-neon-connectivity.md`
- Env template: `.env.example`
