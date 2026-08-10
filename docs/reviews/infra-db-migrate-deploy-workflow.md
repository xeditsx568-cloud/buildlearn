# Checker Review — Manual Neon migration deploy workflow

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `infra/db-migrate-deploy-workflow`  
**Commit reviewed:** `6fc7129933b33e86fee8085154f68da3d5e5e020`

---

## Executive summary

This branch adds a **manual-only** GitHub Actions workflow to apply existing committed
Prisma migrations to Neon via `prisma migrate deploy`, plus setup documentation. The
branch diff against `main` contains **two files only** (95 lines added): the workflow
and a technical note. No application code, Prisma schema, migration SQL, or
`package.json` changes are included. No secrets or real Neon hostnames are committed.
Lint, typecheck, and tests pass (36/36).

The workflow has **not** been run as part of this review. GitHub Environment **`neon`**
and its secrets must be configured manually after merge.

**TASK-103 remains blocked** until the init migration (`20250805103100_init`) is
successfully applied to Neon via this workflow (or equivalent manual deploy).

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Trigger is `workflow_dispatch` only | ✅ |
| 2 | No `push`, `pull_request`, schedule, or automatic triggers | ✅ |
| 3 | Uses GitHub Environment **`neon`** | ✅ |
| 4 | Manual confirmation input must equal **`deploy`** | ✅ |
| 5 | Permissions least-privilege: `contents: read` | ✅ |
| 6 | DB credentials from `secrets.DATABASE_URL` and `secrets.DIRECT_URL` only | ✅ |
| 7 | No secret values or real Neon hostnames committed | ✅ |
| 8 | Secrets not echoed or exposed in workflow logs | ✅ |
| 9 | Node loaded from `.node-version` | ✅ |
| 10 | pnpm setup and `pnpm install --frozen-lockfile` correct | ✅ |
| 11 | Only DB mutation: `pnpm exec prisma migrate deploy` | ✅ |
| 12 | Cannot create migrations or run `migrate dev` | ✅ |
| 13 | No application, schema, migration SQL, or package.json changes | ✅ |
| 14 | Documentation accurate for env, secrets, and manual execution | ✅ |
| 15 | Wrong-database risk assessed (see below) | ✅ Acceptable for this stage |
| 16 | `pnpm lint`, `pnpm typecheck`, `pnpm test` | ✅ |

---

## Branch diff vs `main`

```
.github/workflows/db-migrate-deploy.yml | 46 +++++++++++++++++++++++++++++++
docs/notes/db-migrate-deploy-ci.md      | 49 +++++++++++++++++++++++++++++++++
2 files changed, 95 insertions(+)
```

No other files differ from `main`.

---

## Requirements coverage

| Requirement | Result |
| ----------- | ------ |
| Manual trigger only | ✅ `on: workflow_dispatch` with no other `on` keys |
| GitHub Environment `neon` | ✅ `environment: neon` on the migrate job |
| Confirmation input `deploy` | ✅ Guard step aborts when `inputs.confirm != 'deploy'` |
| Least-privilege permissions | ✅ Job-level `permissions: contents: read` |
| Pooled `DATABASE_URL` secret | ✅ Documented; wired via `${{ secrets.DATABASE_URL }}` |
| Direct `DIRECT_URL` secret | ✅ Documented; wired via `${{ secrets.DIRECT_URL }}` |
| Apply existing migrations only | ✅ `prisma migrate deploy`; no `migrate dev` |
| No scope creep | ✅ Workflow + docs only |

---

## Detailed review

### 1. Trigger and automation — ✅

`.github/workflows/db-migrate-deploy.yml`:

```yaml
on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "deploy" to apply pending migrations to Neon'
        required: true
```

No `push`, `pull_request`, `schedule`, `repository_dispatch`, or other automatic
triggers. The workflow cannot run unless a user explicitly starts it from the Actions UI.

### 2. Confirmation gate — ✅

The first step enforces the confirmation input:

```yaml
- name: Confirm manual trigger
  if: inputs.confirm != 'deploy'
  run: |
    echo "Aborted: confirmation input must be exactly 'deploy'."
    exit 1
```

When the input is wrong, the job fails before checkout or dependency install. When
correct, the step is skipped and execution continues. The echoed message contains no
secrets.

### 3. GitHub Environment and secrets — ✅

- Job declares `environment: neon` — secrets resolve from the **`neon`** environment,
  not repository-level secrets (unless overridden by org policy).
- `DATABASE_URL` and `DIRECT_URL` are injected only via `${{ secrets.* }}` at job `env`.
- No hard-coded connection strings, Neon hostnames (`ep-*`), or `npg_*` tokens in the
  committed diff.
- GitHub Actions masks secret values in logs by default; the workflow does not `echo`,
  `printenv`, or otherwise print these variables.

### 4. Permissions — ✅

```yaml
permissions:
  contents: read
```

No `write`, `packages`, `id-token`, or other elevated scopes. Sufficient for checkout
and running Prisma CLI.

### 5. Node and pnpm setup — ✅

Matches the established pattern in `.github/workflows/ci.yml`:

- `pnpm/action-setup@v4` (reads `packageManager: pnpm@9.15.0` from `package.json`)
- `actions/setup-node@v4` with `node-version-file: .node-version` and `cache: pnpm`
- `pnpm install --frozen-lockfile`

No `package.json` changes on this branch; lockfile integrity is preserved from `main`.

### 6. Database mutation scope — ✅

Single database command:

```yaml
- name: Deploy pending migrations
  run: pnpm exec prisma migrate deploy
```

No `prisma migrate dev`, `db push`, `db seed`, raw `psql`, or migration-creation steps.
`prisma migrate deploy` applies committed SQL under `prisma/migrations/` only and is
idempotent for already-applied migrations.

A `prisma generate` step is intentionally omitted — not required for `migrate deploy`
(migration engine applies SQL directly).

### 7. Documentation — ✅

`docs/notes/db-migrate-deploy-ci.md` accurately describes:

- Manual `workflow_dispatch` execution only
- GitHub Environment **`neon`**
- **`DATABASE_URL`** = pooled Neon connection (`-pooler`, `pgbouncer=true`)
- **`DIRECT_URL`** = direct Neon connection (non-pooler)
- Confirmation input **`deploy`**
- Current pending migration `20250805103100_init`
- Distinction from `migrate dev`

Cross-references to `.env.example` and `docs/notes/prisma-neon-connectivity.md` are
appropriate.

### 8. Wrong-database risk — ✅ (acceptable for this stage)

| Control | Effect |
| ------- | ------ |
| Manual `workflow_dispatch` only | No accidental deploy on push/merge |
| Input must equal `deploy` | Reduces mis-clicks and scripted mistakes |
| `environment: neon` | Secrets scoped to a named environment; supports optional protection rules |
| `migrate deploy` only | Cannot create or rewrite migration history |
| Idempotent deploy | Re-runs skip applied migrations |

**Residual risk:** If the **`neon`** environment secrets point at the wrong database
(e.g. staging URL pasted into production environment), the workflow will apply migrations
to that target. The `deploy` confirmation does not validate the target — it only
confirms operator intent.

**Assessment:** Protections are **sufficient for this stage** (first init migration to
a single Neon project). Recommended post-merge hardening (optional, not merge-blocking):

- Add **required reviewers** on the `neon` environment before workflow runs are allowed
- Document the expected Neon project/branch name in the environment description
- Verify secrets once after configuration with a dry checklist before first run

---

## Checks run

```
pnpm lint       ✅  No ESLint warnings or errors
pnpm typecheck  ✅
pnpm test       ✅  36/36 passed
git diff main...HEAD  ✅  2 files, +95 lines, no migrations or app changes
Secret scan (branch diff)  ✅  No credentials or production hostnames
```

**Workflow execution:** Not run (per review scope).

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-DMD-01 | Info | `.github/workflows/db-migrate-deploy.yml` | No `concurrency` group — simultaneous manual runs could overlap. `migrate deploy` is idempotent, so impact is low. | None — optional `concurrency: group: neon-migrate-deploy` if overlap becomes a concern |
| I-DMD-02 | Info | GitHub (post-merge) | Environment protection rules (required reviewers, deployment branches) are not defined in-repo; they must be configured in GitHub Settings. | None for merge — configure manually after merge |
| I-DMD-03 | Info | `docs/notes/db-migrate-deploy-ci.md` | Does not list post-run verification steps (e.g. confirm `_prisma_migrations`, `users`, `profiles` in Neon). | None — optional doc enhancement |

---

## Security notes

- No secrets in committed files
- Connection strings supplied only via GitHub Environment secrets at runtime
- Workflow logs do not print `DATABASE_URL` or `DIRECT_URL`
- Read-only repository permissions; no artifact or deployment write access
- Workflow cannot modify migration files or create new migrations

---

## Merge authorization

**The branch `infra/db-migrate-deploy-workflow` may be merged to `main`.**

Explicit confirmations:

- **The workflow itself has not been run** during this review.
- **GitHub Environment `neon` and secrets (`DATABASE_URL`, `DIRECT_URL`) must be
  configured manually after merge** (Settings → Environments → neon → Environment secrets).
- **TASK-103 remains blocked** until the existing init migration
  (`20250805103100_init`) is successfully applied to Neon.

---

## Post-merge operator checklist

1. Create GitHub Environment **`neon`** (if not already present).
2. Add environment secrets:
   - **`DATABASE_URL`** — pooled Neon URL
   - **`DIRECT_URL`** — direct Neon URL
3. Optionally enable required reviewers on the `neon` environment.
4. Actions → **Database Migrate Deploy** → Run workflow → enter **`deploy`**.
5. Verify in Neon: `_prisma_migrations` row for `20250805103100_init`, tables
   `users` and `profiles` present.
6. Only then consider TASK-103 operationally unblocked (subject to Master direction).
