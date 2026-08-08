# Checker Review — Prisma–Neon environment configuration

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-08  
**Reviewer:** Checker Agent  
**Branch:** `config/prisma-neon-env`  
**Commit reviewed:** `6d6bd6f7e208aed00696e1ba8e4fa9973ee52c87`

---

## Executive summary

This branch delivers Prisma–Neon environment wiring only: pooled `DATABASE_URL` for runtime,
direct `DIRECT_URL` for Prisma CLI, `dotenv-cli` loading of `.env.local`, helper scripts,
`.env.example` documentation, and a technical note for the local schema-engine P1001 issue.
No Prisma models changed, no migrations added, no application code touched, no secrets
committed. All verification checks pass. **Approved for merge to `main`.**

The remaining local `db pull` P1001 is documented and does not block merging this
configuration; it must be re-tested before the first migration.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")` in datasource | ✅ |
| 2 | No Prisma model or unrelated schema changes | ✅ |
| 3 | `prisma:*` scripts narrowly scoped; load `.env.local` via `dotenv-cli` | ✅ |
| 4 | `dotenv-cli` addition justified and maintainable | ✅ |
| 5 | `.env.example` placeholders only; pooled vs direct clearly distinguished | ✅ |
| 6 | `.env.local` not tracked or staged | ✅ |
| 7 | Technical note accurate; Neon not described as unavailable | ✅ |
| 8 | Local P1001 does not make merge unsafe (documented pre-migration follow-up) | ✅ |
| 9 | No new migration files or DB schema changes in branch diff | ✅ |
| 10 | `prisma:generate`, lint, typecheck, test | ✅ |
| 11 | Full branch inspected for secrets | ✅ |
| — | No application code changes | ✅ |
| — | TASK-102 not started | ✅ |

---

## Requirements coverage

| Requirement | Result |
| ----------- | ------ |
| Pooled `DATABASE_URL` for runtime | ✅ Documented in `.env.example`; datasource `url` unchanged in role |
| Direct `DIRECT_URL` for Prisma CLI | ✅ `directUrl` added; documented in `.env.example` |
| `dotenv-cli` loads `.env.local` for Prisma scripts | ✅ `prisma:pull`, `prisma:migrate`, `prisma:generate` |
| No Prisma model changes | ✅ Only datasource block changed in `schema.prisma` |
| No database tables created | ✅ Confirmed (0 public tables; no migration diff) |
| Technical note for local P1001 | ✅ `docs/notes/prisma-neon-connectivity.md` |

---

## Detailed review

### 1. Prisma datasource — ✅

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Matches [Prisma + Neon recommended configuration](https://www.prisma.io/docs/orm/overview/databases/neon):
pooled URL for the query engine at runtime, direct URL for introspection and migrations.

`User` and `Profile` models, enums, and field mappings are identical to `main`.

### 2. Package scripts — ✅

| Script | Command | Scope |
| ------ | ------- | ----- |
| `prisma:pull` | `dotenv -e .env.local -- prisma db pull` | Introspection with local env |
| `prisma:migrate` | `dotenv -e .env.local -- prisma migrate dev` | Migrations with local env |
| `prisma:generate` | `dotenv -e .env.local -- prisma generate` | Client gen with local env |

Existing `db:*` scripts are unchanged (CI continues to use `pnpm db:generate` with
job-level `DATABASE_URL` only). Verified: `prisma generate` succeeds without
`DIRECT_URL` set — CI is not broken by the new `directUrl` field.

### 3. `dotenv-cli` dependency — ✅

Prisma CLI reads `.env` by default, not `.env.local`. Next.js projects conventionally
store secrets in `.env.local`. `dotenv-cli@11.0.0` is a minimal, well-maintained dev
dependency that avoids duplicating env files or shell-specific export logic. Appropriate
for this repo.

### 4. `.env.example` — ✅

- Placeholder credentials only (`user:pass`, `ep-example`, `REPLACE_ME` Clerk keys)
- No real Neon hostnames, passwords, or API keys
- Pooled URL uses `-pooler` hostname + `pgbouncer=true`
- Direct URL uses non-pooler hostname + `connect_timeout=30`
- Required-vars comment updated to include `DIRECT_URL`

### 5. Secrets and `.env.local` — ✅

- `.env.local` listed in `.gitignore`
- Not tracked (`git ls-files .env.local` empty)
- Full branch diff scanned: no real credentials, no `npg_*` tokens, no production hostnames

### 6. Technical note — ✅

`docs/notes/prisma-neon-connectivity.md` correctly states:

- Native `pg` connectivity to Neon succeeds (PostgreSQL 18.4, `neondb`, 0 public tables)
- Prisma CLI `db pull` returns P1001 locally on the developer machine
- Issue is isolated to the local Prisma schema-engine / network path
- Neon responds normally to standard PostgreSQL clients
- Re-test before first migration; do not assume Neon is down when `pg` works

Wording does **not** imply Neon is unavailable.

### 7. Migrations and schema — ✅

Branch diff vs `main`: no changes under `prisma/migrations/`. Pre-existing migration
SQL on `main` is untouched; this branch does not apply migrations.

### 8. Local P1001 and merge safety — ✅

The P1001 failure affects **local Prisma schema-engine introspection only**. It does not
invalidate the configuration changes:

- Native connectivity is verified
- `prisma:generate` succeeds (client generation does not require DB connection)
- Lint, typecheck, and tests pass
- Recommended Neon URL shape and `directUrl` wiring are correct per Prisma docs

**Merge is safe.** Before running `pnpm prisma:migrate` or applying the initial migration,
re-test `pnpm prisma:pull -- --print` on the target machine or in CI.

---

## Checks run

```
pnpm prisma:generate  ✅  (via prisma:generate script, Node 20)
pnpm lint             ✅  No ESLint warnings or errors
pnpm typecheck        ✅
pnpm test             ✅  16/16 passed
pnpm db:generate      ✅  (without DIRECT_URL — CI compatibility confirmed)
git diff main...HEAD  ✅  5 files, +103/−5, no migrations
```

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-CNE-01 | Info | `package.json` — `db:*` vs `prisma:*` scripts | Legacy `db:generate` / `db:migrate` do not load `.env.local`. Local Neon work should use `prisma:*` scripts. CI correctly uses `db:generate`. | None — document in CONTRIBUTING or pre-migration note if confusion arises |
| I-CNE-02 | Info | `src/env.ts` | `DIRECT_URL` is not validated by t3-env (only `DATABASE_URL` is). Acceptable: `DIRECT_URL` is consumed by Prisma CLI via `dotenv-cli`, not by the Next.js app at build time. | None for this branch; consider adding when migrations become routine |

---

## Security notes

- No secrets in committed files
- `.env.local` remains gitignored
- `.env.example` uses dummy values only
- No client-exposed database URLs

---

## Merge authorization

**The configuration branch `config/prisma-neon-env` may be merged to `main`.**

**Follow-up before first migration:** Re-test `pnpm prisma:pull -- --print` locally or
in CI. The documented local P1001 on the developer machine does not block this merge.

**TASK-102** (Clerk webhook / user sync) may begin only after this branch is merged and
the merge workflow is complete.

---

## Post-merge recommendations

1. Re-test Prisma CLI (`prisma:pull`, then `prisma:migrate`) before applying the initial
   migration to Neon.
2. If P1001 persists locally, run migrations from CI or another network where schema-engine
   connects successfully.
3. Optionally add `DIRECT_URL` to `.github/workflows/ci.yml` when migration steps are added
   to CI (not required for `db:generate` today).
