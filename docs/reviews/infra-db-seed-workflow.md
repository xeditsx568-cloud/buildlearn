# Checker Review — Manual Neon curriculum seed workflow

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `infra/db-seed-workflow`  
**Commit reviewed:** `681f15d9edcfd5e6e11ba36bcd698399ded6a868`

---

## Executive summary

This branch adds a **manual-only** GitHub Actions workflow to run the approved TASK-103
curriculum seed against Neon via `pnpm db:seed`, plus setup documentation. The branch
diff against `main` contains **two files only** (110 lines added): the workflow and a
technical note. No application code, Prisma schema, migration SQL, `prisma/seed.ts`, or
`package.json` changes are included. No secrets or real Neon hostnames are committed.
Lint, typecheck, and tests pass (45/45).

The workflow has **not** been run as part of this review. Neon has **not** been seeded.

**Critical safety assessment:** The existing `prisma/seed.ts` (unchanged on this branch)
is **safe to execute against Neon as-is** at the current project stage. Prerequisite
`deleteMany()` is intentional idempotent sync over a table that holds only curriculum
edges; concepts and goal templates use upserts. This matches the TASK-103 review
(I-T103-01). No workflow or seed changes are required before live execution.

**TASK-104 remains blocked** until the seed succeeds and **24 concepts + 5 goal
templates** are verified in Neon.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Trigger is `workflow_dispatch` only | ✅ |
| 2 | No `push`, `pull_request`, schedule, or automatic triggers | ✅ |
| 3 | Uses GitHub Environment **`neon`** | ✅ |
| 4 | Permissions least-privilege: `contents: read` | ✅ |
| 5 | DB credentials from `secrets.DATABASE_URL` and `secrets.DIRECT_URL` only | ✅ |
| 6 | No secret values or real Neon hostnames committed | ✅ |
| 7 | Secrets not echoed or exposed in workflow logs | ✅ |
| 8 | Manual confirmation input must equal **`seed`** | ✅ |
| 9 | Node loaded from `.node-version` | ✅ |
| 10 | `pnpm install --frozen-lockfile` | ✅ |
| 11 | Prisma Client generated before seed (`pnpm prisma:generate`) | ✅ |
| 12 | Seed command is project-defined `pnpm db:seed` | ✅ |
| 13 | No migrations, manual SQL, embedded curriculum, or seed code changes | ✅ |
| 14 | `prisma/seed.ts` not changed by this branch | ✅ |
| 15 | Documentation accurate (manual-only, env, secrets, idempotency) | ✅ |
| 16 | Branch contains only the two expected files | ✅ |
| 17 | `pnpm lint`, `pnpm typecheck`, `pnpm test` | ✅ |

---

## Branch diff vs `main`

```
.github/workflows/db-seed.yml | 49 ++++++++++++++++++++++++++++++++++
docs/notes/db-seed-ci.md      | 61 +++++++++++++++++++++++++++++++++++++++++++
2 files changed, 110 insertions(+)
```

No other files differ from `main`. `prisma/seed.ts` is identical to `main`.

---

## Requirements coverage

| Requirement | Result |
| ----------- | ------ |
| Manual trigger only | ✅ `on: workflow_dispatch` with no other `on` keys |
| GitHub Environment `neon` | ✅ `environment: neon` on the seed job |
| Confirmation input `seed` | ✅ Guard step aborts when `inputs.confirm != 'seed'` |
| Least-privilege permissions | ✅ Job-level `permissions: contents: read` |
| Pooled `DATABASE_URL` secret | ✅ Documented; wired via `${{ secrets.DATABASE_URL }}` |
| Direct `DIRECT_URL` secret | ✅ Documented; wired via `${{ secrets.DIRECT_URL }}` |
| Existing seed command only | ✅ `pnpm db:seed` → `prisma db seed` → `tsx prisma/seed.ts` |
| No scope creep | ✅ Workflow + docs only |

---

## Detailed review

### 1. Trigger and automation — ✅

`.github/workflows/db-seed.yml`:

```yaml
on:
  workflow_dispatch:
    inputs:
      confirm:
        description: 'Type "seed" to run the curated curriculum seed against Neon'
        required: true
```

No `push`, `pull_request`, `schedule`, `repository_dispatch`, or other automatic
triggers.

### 2. Confirmation gate — ✅

The first step enforces the confirmation input:

```yaml
- name: Confirm manual trigger
  if: inputs.confirm != 'seed'
  run: |
    echo "Aborted: confirmation input must be exactly 'seed'."
    exit 1
```

When the input is wrong, the job fails before checkout or dependency install. The
echoed message contains no secrets.

### 3. GitHub Environment and secrets — ✅

- Job declares `environment: neon` — secrets resolve from the **`neon`** environment.
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

No elevated scopes. Sufficient for checkout and running Prisma/seed CLI.

### 5. Node, pnpm, and Prisma setup — ✅

Matches the established pattern in `.github/workflows/db-migrate-deploy.yml` and
`.github/workflows/ci.yml`:

- `pnpm/action-setup@v4`
- `actions/setup-node@v4` with `node-version-file: .node-version` and `cache: pnpm`
- `pnpm install --frozen-lockfile`
- `pnpm prisma:generate` before seed (required because `pnpm db:seed` runs
  `tsx prisma/seed.ts`, which imports `@prisma/client`)

`prisma generate` does not require a live database connection; job-level env vars are
available if needed. No `.env.local` is committed or required.

### 6. Seed command scope — ✅

Single data mutation command:

```yaml
- name: Seed curriculum data
  run: pnpm db:seed
```

`package.json` defines `"db:seed": "prisma db seed"` and `"prisma": { "seed": "tsx prisma/seed.ts" }`.

The workflow does **not** run:

- `prisma migrate deploy` / `migrate dev` / `db push`
- Manual SQL or `psql`
- Inline curriculum JSON
- Any modification to `prisma/seed.ts`

Curriculum data is loaded from committed `content/concepts.json` and
`content/goal-templates.json` at runtime by the existing seed implementation.

### 7. `prisma/seed.ts` safety for Neon execution — ✅

**Branch change:** None. Seed logic is the TASK-103-approved implementation on `main`.

| Operation | Behavior | Neon safety (current stage) |
| --------- | -------- | --------------------------- |
| Concept upsert | 24 concepts by stable `id` | ✅ Idempotent; updates in place |
| `conceptPrerequisite.deleteMany()` | Clears entire `concept_prerequisites` table | ✅ Safe — table holds only curriculum DAG edges; no user/lesson FKs yet |
| `createMany` prerequisites | Rebuilds edges from JSON | ✅ Restores graph after delete |
| Goal template upsert | 5 templates by stable `id` | ✅ Idempotent |

**`deleteMany` assessment:** Unscoped and not wrapped in a transaction (I-T103-01). At
MVP stage this is acceptable: `concept_prerequisites` contains only seeded prerequisite
edges. A mid-seed failure could temporarily leave prerequisites empty until re-run;
concepts and goal templates would remain upserted. Re-running the workflow is safe and
restores the full graph. No merge-blocking change required.

**Prerequisite:** Migration `20260810170000_concept_graph_and_goal_templates` must
already be applied (confirmed deployed per review context).

### 8. Documentation — ✅

`docs/notes/db-seed-ci.md` accurately describes:

- Manual `workflow_dispatch` execution only
- GitHub Environment **`neon`**
- **`DATABASE_URL`** (pooled) and **`DIRECT_URL`** (direct) required
- Confirmation input **`seed`**
- Seeds **24 concepts** and **5 goal templates** from TASK-103 JSON
- Idempotent / safe to re-run
- Post-run verification counts
- Prerequisite curriculum migration deploy

Cross-references to migration deploy docs and TASK-103 review are appropriate.

### 9. Wrong-database risk — ✅ (acceptable for this stage)

| Control | Effect |
| ------- | ------ |
| Manual `workflow_dispatch` only | No accidental seed on push/merge |
| Input must equal `seed` | Reduces mis-clicks |
| `environment: neon` | Secrets scoped to named environment |
| Upsert-based seed | Re-runs update rather than duplicate |
| No migration steps | Cannot alter schema from this workflow |

**Residual risk:** If **`neon`** environment secrets point at the wrong database, seed
data would be written to that target. The `seed` confirmation validates operator intent
only, not the target database.

**Assessment:** Protections are **sufficient for this stage** (single Neon project,
curriculum-only tables). Optional post-merge hardening: required reviewers on `neon`
environment (same as migrate workflow I-DMD-02).

---

## Checks run

```
pnpm lint       ✅  No ESLint warnings or errors
pnpm typecheck  ✅
pnpm test       ✅  45/45 passed
git diff main...HEAD  ✅  2 files, +110 lines, no app/schema/seed changes
Secret scan (branch diff)  ✅  No credentials or production hostnames
```

**Workflow execution:** Not run (per review scope).  
**Neon seed:** Not run (per review scope).

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-DS-01 | Info | `.github/workflows/db-seed.yml` | No `concurrency` group — simultaneous manual runs could overlap. Seed is upsert-based and idempotent; `deleteMany` on prerequisites is brief. Impact is low. | None — optional `concurrency: group: neon-seed` if overlap becomes a concern |
| I-DS-02 | Info | GitHub (post-merge) | Environment protection rules (required reviewers) are not defined in-repo; configure in GitHub Settings if desired. | None for merge |
| I-DS-03 | Info | `prisma/seed.ts` (pre-existing) | `conceptPrerequisite.deleteMany()` is unscoped and not transactional (I-T103-01). Safe at current stage; could be tightened in a future task if non-curriculum rows are added. | None for this branch |
| I-DS-04 | Info | Operational | Live `pnpm db:seed` against Neon not verified in this review; post-merge follow-up. | None — run workflow after merge |

---

## Security notes

- No secrets in committed files
- Connection strings supplied only via GitHub Environment secrets at runtime
- Workflow logs do not print `DATABASE_URL` or `DIRECT_URL`
- Read-only repository permissions
- Workflow cannot modify migrations, schema, or seed source code

---

## Merge authorization

**The branch `infra/db-seed-workflow` may be merged to `main`.**

Explicit confirmations:

- **The workflow has not been run** during this review.
- **Neon has not been seeded** during this review.
- **After merge**, Actions → **Database Seed** → Run workflow → enter confirmation
  **`seed`** (requires **`neon`** environment secrets already configured from prior
  migration workflows).
- **TASK-104 remains blocked** until seed succeeds and **24 concepts + 5 goal
  templates** are verified in Neon.

---

## Post-merge operator checklist

1. Confirm migration `20260810170000_concept_graph_and_goal_templates` is applied
   (already deployed per current verified state).
2. Confirm GitHub Environment **`neon`** has **`DATABASE_URL`** and **`DIRECT_URL`**.
3. Actions → **Database Seed** → Run workflow → enter **`seed`**.
4. Verify in Neon:
   - `concepts` count = **24**
   - `goal_templates` count = **5**
   - Prerequisite edges in `concept_prerequisites`
5. Only then consider TASK-104 operationally unblocked (subject to Master direction).
