# Checker Review — Vercel Prisma Client generation (postinstall)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-10-03  
**Reviewer:** Checker Agent  
**Branch:** `fix/vercel-prisma-generate-lifecycle`  
**Fix commit reviewed:** `b734367`  
**Base:** `main` @ `294d421` (MVP-M2 merged; Neon `20260929140000_lesson_progress` applied via Migrate Deploy #7)

---

## Executive summary

Production build on Vercel failed during Next.js type-check because **`@prisma/client`
was not regenerated** from `prisma/schema.prisma` after a clean install. The published
npm package does not include project-specific enums such as `LessonProgressStatus`.

The fix adds **`"postinstall": "prisma generate"`** to `package.json` — one line,
no product or schema changes. This aligns Vercel’s install → build path with GitHub
CI (which already runs `pnpm db:generate` explicitly).

**No Database Migrate Deploy** is required for this fix. After merge, the next ops
step is **allow Vercel to build/deploy** the new `main` commit.

---

## CI (re-run on `b734367`)

| Check | Result |
| ----- | ------ |
| `pnpm install` (runs `postinstall`) | Pass — `prisma generate` succeeds |
| `LessonProgressStatus` on `@prisma/client` | Pass — `{ started, completed }` |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass (**202/202**) |
| `pnpm build` | Pass |

---

## Review checklist

### 1. Root cause vs Vercel failure

**PASS** — Vercel runs `pnpm install` then `pnpm run build` (`next build`). Without
`prisma generate`, TypeScript sees the default client stub and fails on
`LessonProgressStatus` in `lesson-progress-service.ts`. Local/CI passed because
developers and `.github/workflows/ci.yml` run `pnpm db:generate` before build.

### 2. `postinstall` appropriateness

**PASS** — Standard Prisma + serverless pattern. Runs after dependency install,
before `next build` on Vercel. Uses existing `prisma` CLI (devDependency; installed
during Vercel build). Matches Prisma’s documented Vercel guidance.

### 3. `prisma generate` does not migrate Neon

**PASS** — `generate` reads `prisma/schema.prisma` and writes client artifacts under
`node_modules`. It does **not** run `migrate deploy`, `migrate dev`, or connect to
apply DDL. Migration #7 is already complete; **do not run again** for this fix.

### 4. Success on Vercel install (schema/config)

**PASS** — `postinstall` invokes `prisma generate` (same as `db:generate`). Generation
requires only the schema file; **no live DB connection** is required. Repo already
documented CI compatibility without `DIRECT_URL` for generate (`config-prisma-neon-env.md`).

### 5. No unnecessary production side effects

**PASS** — No new runtime dependencies. `postinstall` runs at build/install time only;
output is generated TypeScript client code. No env var changes, no Neon mutation.

### 6. GitHub Actions remains safe

**PASS** — CI still runs explicit `pnpm db:generate` after install. Duplicate
generate is idempotent and low cost. No workflow change required.

### 7. Scope

**PASS** — Diff is **only** `package.json` (+1 line). No lesson, API, or migration
file changes.

### 8. Clean install without manual generate

**PASS** — Fresh `pnpm install` triggers `postinstall` → client includes
`LessonProgressStatus`, `LessonProgress`, etc. Build/typecheck no longer depends on
a prior manual `pnpm db:generate`.

---

## Non-blocking notes

| ID | Note |
| -- | ---- |
| I-PG-01 | `prisma:generate` still uses `dotenv -e .env.local` for local dev; `postinstall` uses plain `prisma generate` — correct for CI/Vercel. |
| I-PG-02 | Optional future cleanup: remove redundant CI `db:generate` step (not required for merge). |

---

## Verdict

**APPROVED FOR MERGE**

- **`b734367` is safe to merge to `main`.**
- **NO Database Migrate Deploy** required (migration already applied).
- **Next step after merge:** push/merge → Vercel builds `main` with postinstall generate → confirm production deploy succeeds → run **MVP-M2 founder smoke** per `MVP-M2-FINAL.md`.

Checker does **not** merge, redeploy Vercel, or modify implementation code.

---

## Commit reference

| SHA | Summary |
| --- | ------- |
| `b734367` | fix(build): run prisma generate on postinstall for Vercel |
