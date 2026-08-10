# Manual Neon curriculum seed (CI)

**Scope:** Run the approved TASK-103 curriculum seed against Neon via GitHub Actions.  
**Does not** create or alter migrations, embed seed data, or run manual SQL.

---

## Workflow

| Item | Value |
| ---- | ----- |
| File | `.github/workflows/db-seed.yml` |
| Trigger | **Manual only** (`workflow_dispatch`) |
| GitHub Environment | **`neon`** |
| Command | `pnpm db:seed` (runs `tsx prisma/seed.ts` via Prisma) |

The workflow runs only when started from the GitHub Actions UI. It is not triggered on push, pull request, or schedule.

When prompted, enter confirmation input exactly: **`seed`**

---

## Required secrets (GitHub Environment `neon`)

| Secret | Neon connection type |
| ------ | -------------------- |
| **`DATABASE_URL`** | **Pooled** URL (`-pooler` host; include `pgbouncer=true` per `.env.example`) |
| **`DIRECT_URL`** | **Direct** URL (non-pooler host) |

Add secrets in GitHub → Settings → Environments → **neon** → Environment secrets. Do not commit real connection strings.

---

## What it seeds

Curated MVP curriculum from committed JSON (TASK-103):

- **24 concepts** from `content/concepts.json`
- **5 goal templates** from `content/goal-templates.json`

Uses the existing idempotent seed in `prisma/seed.ts` (upserts for concepts and goal templates; prerequisite edges rebuilt from JSON). Safe to re-run.

**Prerequisite:** Migration `20260810170000_concept_graph_and_goal_templates` must already be applied to Neon (via **Database Migrate Deploy**).

---

## Post-run verification

After a successful run, confirm in Neon:

- `concepts` row count = **24**
- `goal_templates` row count = **5**
- Prerequisite edges present in `concept_prerequisites`

---

## References

- Migration deploy: `docs/notes/db-migrate-deploy-ci.md`
- Prisma–Neon local CLI note: `docs/notes/prisma-neon-connectivity.md`
- TASK-103 review: `docs/reviews/TASK-103.md`
