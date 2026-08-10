# Checker Review — Init migration BOM recovery

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `fix/init-migration-bom-recovery`  
**Commit reviewed:** `87dbf9a86f472ef81cc42b5dd0377683e9d38507`

---

## Executive summary

This branch prepares recovery from the failed Neon init migration (P3018 / PostgreSQL
42601 at byte 1). It removes the UTF-8 BOM from the existing
`20250805103100_init` migration SQL, adds a separate manual **Database Migrate Resolve**
workflow, and documents the correct recovery order (merge fix → resolve → deploy → verify).

Branch diff against `main`: **3 files**, +82/−1 lines. No Prisma model changes, no new
migration directories, no application code changes, no secrets committed. Byte-level
verification confirms **only the 3-byte BOM was removed**; SQL content is otherwise
identical. Lint, typecheck, and tests pass (36/36).

No GitHub workflow was run during this review. Neon was not mutated by this branch.

**TASK-103 remains blocked** until `20250805103100_init` applies successfully to Neon
after the post-merge resolve + deploy sequence.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Migration change removes only 3-byte UTF-8 BOM | ✅ |
| 2 | SQL content byte-for-byte unchanged aside from BOM | ✅ |
| 3 | LF line endings preserved | ✅ |
| 4 | No Prisma models or application code changed | ✅ |
| 5 | No new migration created | ✅ |
| 6 | Resolve workflow: `workflow_dispatch` only | ✅ |
| 7 | Resolve workflow: environment `neon` | ✅ |
| 8 | Resolve workflow: `permissions: contents: read` | ✅ |
| 9 | Resolve workflow: `DATABASE_URL` + `DIRECT_URL` secrets only | ✅ |
| 10 | Resolve workflow: confirmation must equal `resolve` | ✅ |
| 11 | Resolve workflow: migration input restricted to `20250805103100_init` | ✅ |
| 12 | Resolve workflow: only DB command is `migrate resolve --rolled-back` | ✅ |
| 13 | Resolve workflow: no deploy, dev, or manual SQL | ✅ |
| 14 | Resolve workflow: secrets not echoed | ✅ |
| 15 | Recovery documentation order correct | ✅ |
| 16 | No workflow run confirmed | ✅ |
| 17 | Neon not mutated by branch | ✅ |
| 18 | `pnpm lint`, `pnpm typecheck`, `pnpm test` | ✅ |

---

## Branch diff vs `main`

```
.github/workflows/db-migrate-resolve.yml           | 56 ++++++++++++++++++++++
docs/notes/db-migrate-deploy-ci.md                 | 25 ++++++++++
prisma/migrations/20250805103100_init/migration.sql |  2 +-
3 files changed, 82 insertions(+), 1 deletion(-)
```

No changes under `prisma/schema.prisma`, `src/`, or `package.json`. No new entries under
`prisma/migrations/` beyond the single-line BOM fix in the existing init migration.

---

## Detailed review

### 1. Migration BOM fix — ✅

**File:** `prisma/migrations/20250805103100_init/migration.sql`

| Metric | `main` | Branch |
| ------ | ------ | ------ |
| Size | 897 bytes | 894 bytes |
| First bytes | `EF BB BF` (UTF-8 BOM) | `2D 2D 20` (`-- `) |
| Starts with | U+FEFF + `-- CreateEnum` | `-- CreateEnum` |
| SHA256 (content) | `dd5bb0d0…` (with BOM) | `b7174f1a…` |

**Verification:**

```
branch == main_blob[3:]   True
size delta                3 bytes exactly
CRLF count                0
LF count                  30
```

The branch file is **byte-for-byte identical** to the `main` blob with the leading
`EF BB BF` removed. All SQL statements, quoting, and line breaks are unchanged.

This is the minimal correct fix for PostgreSQL rejecting `\u{feff}` at position 1.
No migration regeneration; no SQL edits.

### 2. Scope boundaries — ✅

| Area | Changed? |
| ---- | -------- |
| Prisma models (`schema.prisma`) | No |
| Application code (`src/`) | No |
| New migration directory | No |
| `package.json` / lockfile | No |
| Existing deploy workflow | No |

Only the existing init migration file, new resolve workflow, and recovery documentation
were touched — aligned with approved recovery preparation scope.

### 3. Resolve workflow — ✅

**File:** `.github/workflows/db-migrate-resolve.yml`

| Requirement | Implementation |
| ----------- | -------------- |
| Trigger | `on: workflow_dispatch` only — no `push`, `pull_request`, or `schedule` |
| Environment | `environment: neon` |
| Permissions | `contents: read` |
| Secrets | `${{ secrets.DATABASE_URL }}`, `${{ secrets.DIRECT_URL }}` at job `env` |
| Confirmation | Step aborts unless `inputs.confirm == 'resolve'` |
| Migration allowlist | Step aborts unless `inputs.migration_name == '20250805103100_init'` |
| DB mutation | Single step: `pnpm exec prisma migrate resolve --rolled-back "${{ inputs.migration_name }}"` |
| Excluded commands | No `migrate deploy`, `migrate dev`, `db execute`, or `psql` |
| Secret exposure | No `echo`, `printenv`, or logging of connection strings |

Setup mirrors the approved deploy workflow: Node from `.node-version`, `pnpm install
--frozen-lockfile`. Validation steps run before checkout — fail-fast on bad inputs.

**Note:** When run post-merge, `migrate resolve --rolled-back` updates
`_prisma_migrations` bookkeeping only. That is intentional and separate from deploy.

### 4. Recovery documentation — ✅

**File:** `docs/notes/db-migrate-deploy-ci.md` — new **Failed migration recovery** section

Documented order:

1. Merge migration source fix to `main`
2. Run **Database Migrate Resolve** (`20250805103100_init`, confirm **`resolve`**)
3. Run **Database Migrate Deploy** (confirm **`deploy`**)
4. Verify `_prisma_migrations`, `users`, `profiles` in Neon

Prerequisite (fix source first) is stated. Resolve and deploy are explicitly separate.
Supported migration name and excluded commands are documented.

### 5. Operational state — ✅

| Assertion | Status |
| --------- | ------ |
| Workflows not run in review | Confirmed — no CI/workflow execution |
| Neon not mutated by branch | Confirmed — branch contains source + workflow definitions only |
| Failed migration on Neon | Pre-existing from prior deploy attempt (outside this branch) |

---

## Checks run

```
Byte-level BOM verification     ✅  Only EF BB BF removed; branch == main[3:]
pnpm lint                       ✅  No ESLint warnings or errors
pnpm typecheck                  ✅
pnpm test                       ✅  36/36 passed
git diff main...HEAD            ✅  3 files; no schema/app/package changes
Secret scan (branch diff)       ✅  No credentials or production hostnames
```

**Workflow execution:** Not run (per review scope).  
**Neon mutation:** None (per review scope).

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-BOM-01 | Info | `prisma/migrations/20250805103100_init/migration.sql` | Migration checksum in `_prisma_migrations` (if recorded on failed attempt) will differ from the fixed file until re-deploy succeeds. Expected after BOM removal; resolve + deploy sequence handles this. | None |
| I-BOM-02 | Info | `.github/workflows/db-migrate-resolve.yml` | Migration allowlist is hardcoded to `20250805103100_init`. Appropriate for this one-time recovery; future failed migrations would need workflow/doc extension. | None for this branch |
| I-BOM-03 | Info | Post-merge ops | Operator should read-only verify Neon has no `users`/`profiles` before resolve, and confirm failed `_prisma_migrations` row exists. Not required in-repo but reduces operator error. | None — optional runbook note later |

---

## Security notes

- No secrets in committed files
- Resolve workflow uses environment-scoped secrets; does not print them
- Read-only repository permissions
- Separate confirmation (`resolve`) and migration allowlist reduce accidental misuse
- Resolve workflow does not run deploy — operator must run deploy as a deliberate second step

---

## Merge authorization

**The branch `fix/init-migration-bom-recovery` may be merged to `main`.**

Explicit confirmations:

- **Resolve workflow must run only after merge** — operators need the BOM-fixed
  `migration.sql` on `main` before re-deploy.
- **Database Migrate Resolve must run before Database Migrate Deploy** on Neon for
  this recovery (clear failed P3018 state, then apply fixed migration).
- **TASK-103 remains blocked** until the init migration applies successfully to Neon.

Recommended post-merge sequence:

1. Merge to `main`
2. Actions → **Database Migrate Resolve** → `20250805103100_init`, confirm **`resolve`**
3. Actions → **Database Migrate Deploy** → confirm **`deploy`**
4. Read-only verify in Neon: success row in `_prisma_migrations`; tables `users`, `profiles`

Do **not** run deploy before resolve on the database that recorded the failed attempt.
