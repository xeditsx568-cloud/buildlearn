# Checker Review — TASK-103 (Concept graph and goal templates)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-103-concept-graph`  
**Commit reviewed:** `9b8507d1b3d9194c963d1a71856036ac3fa45f77`

---

## Executive summary

TASK-103 delivers the Phase 3 curriculum foundation: Prisma models for `concepts`,
`concept_prerequisites`, and `goal_templates`; curated JSON for exactly **24 concepts**
and **5 goal templates** per frozen MVP scope; deterministic/idempotent seed logic;
DAG validation; and focused unit tests. Branch diff against `main` contains **7 files
only** (+829 lines). No routes, auth, UX, or unrelated application changes.

Migration SQL was generated offline via **`prisma migrate diff --from-schema-datamodel
… --to-schema-datamodel … --script`** due to documented local P1001 (same governance
precedent as init-migration BOM recovery). Migration has **no UTF-8 BOM** and matches
the Prisma schema. All CI checks pass (45/45 tests).

**Merge-readiness (critical question):** **Option A** — TASK-103 is safe to merge with
migration and seed **code reviewed**; live Neon migration deploy and `pnpm db:seed`
success are **operational follow-ups**, not merge blockers for this branch — consistent
with TASK-102 and TASK-002 operational precedent.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Only intended 7 files changed | ✅ |
| 2 | Concept, ConceptPrerequisite, GoalTemplate models | ✅ |
| 3 | No extra curriculum entities | ✅ |
| 4 | Naming, relations, composite keys, cascade delete | ✅ |
| 5 | Migration SQL matches schema | ✅ |
| 6 | Migration: Prisma-generated, no BOM, no unrelated DDL | ✅ |
| 7 | Offline `prisma migrate diff` acceptable under P1001 | ✅ |
| 8 | 24 concepts; IDs match PRODUCT_REQUIREMENTS §4 | ✅ |
| 9 | HTML/CSS/JS beginner MVP scope only | ✅ |
| 10 | 5 goal templates; frozen product/UX alignment | ✅ |
| 11 | Prerequisite DAG valid and pedagogically sensible | ✅ |
| 12 | curriculum.ts: deterministic validation, no AI | ✅ |
| 13 | seed.ts: deterministic, idempotent, JSON-sourced | ✅ |
| 14 | Focused integrity tests | ✅ |
| 15 | prisma:generate, lint, typecheck, test, build | ✅ |
| 16 | No unrelated auth/UX/app work | ✅ |

---

## Branch diff vs `main`

```
content/concepts.json                              | 224 +++++++++++++++++++++
content/goal-templates.json                          | 182 +++++++++++++++++
prisma/migrations/20260810170000_.../migration.sql |  35 ++++
prisma/schema.prisma                               |  34 ++++
prisma/seed.ts                                      |  66 +++++-
src/lib/content/curriculum.ts                       | 191 ++++++++++++++++++
tests/unit/concept-graph.test.ts                    |  98 +++++++++
7 files changed, 829 insertions(+), 1 deletion(-)
```

No changes under `src/app/`, `src/middleware.ts`, `src/env.ts`, `.github/workflows/`,
or `package.json`.

---

## Detailed review

### 1. Prisma models — ✅

Aligned with `docs/ARCHITECTURE.md`:

| Model | Fields | Notes |
| ----- | ------ | ----- |
| `Concept` | `id`, `name`, `description`, `domain`, `difficulty`, `tags` | Matches architecture table |
| `ConceptPrerequisite` | composite PK `(concept_id, prerequisite_id)` | Self-referential FKs on `concepts` |
| `GoalTemplate` | `id`, `name`, `matching_keywords`, `concept_ids` | No extra fields beyond architecture |

- `@map` snake_case column names consistent with existing schema
- `onDelete: Cascade` on prerequisite FKs — appropriate for curated graph rows
- No `concept_mastery`, `lessons`, `challenges`, or other Phase 3+ tables (correct scope)

### 2. Migration — ✅

**File:** `prisma/migrations/20260810170000_concept_graph_and_goal_templates/migration.sql`

| Check | Result |
| ----- | ------ |
| UTF-8 BOM | **Absent** (starts `2D 2D 20` = `-- `) |
| Creates only | `concepts`, `concept_prerequisites`, `goal_templates` |
| Modifies users/profiles | **No** |
| FK constraints | Match Prisma schema (`ON DELETE CASCADE`) |

**Offline generation method:** Acceptable. Project docs (`docs/notes/prisma-neon-connectivity.md`)
document local P1001; prior approved recovery used `prisma migrate diff` when
`migrate dev` could not reach Neon. This is Prisma tooling output — not hand-written
manual SQL. Post-merge deploy via **Database Migrate Deploy** workflow remains the
operational apply path.

### 3. Concepts (`content/concepts.json`) — ✅

| Check | Result |
| ----- | ------ |
| Count | **24** |
| IDs | Exact match to `PRODUCT_REQUIREMENTS.md` §4 |
| Domains | `foundations`, `css`, `javascript`, `integration` only |
| Scope | HTML, CSS, JavaScript beginner MVP — no React/backend/Python/DB-as-content |
| Difficulty | 1–3 (within architecture 1–5 range) |
| Tags/descriptions | Sensible, consistent, human-curated |

### 4. Goal templates (`content/goal-templates.json`) — ✅

| ID | Product/UX alignment |
| -- | -------------------- |
| `business-website` | `ARCHITECTURE.md` example; PROJECT_CONTEXT business landing page |
| `portfolio-site` | UX onboarding chip "A portfolio site" |
| `personal-blog` | UX onboarding chip "A blog" |
| `bakery-landing-page` | UX onboarding chip "A bakery landing page" |
| `hobby-creator-site` | PROJECT_CONTEXT Hobbyist Creator persona |

All `conceptIds` resolve to known concepts. Templates share core concepts (e.g.
`css-flexbox` in 4+ templates). Subsets are pedagogically differentiated (e.g.
`personal-blog` omits forms/events/debugging/grid — appropriate for content-focused
goal).

### 5. Prerequisite DAG — ✅

Verified by tests and `validateCurriculumIntegrity`:

- **Acyclic** — cycle detection returns null
- **No self-references**
- **No orphan prerequisite IDs**
- **Pedagogically sensible** — foundations → CSS/JS branches → integration nodes
- Root: `how-web-works`; integration capstones: `debugging-basics`, `project-structure`

### 6. `src/lib/content/curriculum.ts` — ✅

- Zod schemas for JSON shape validation
- Deterministic file loading from `content/`
- Explicit graph validation and DFS cycle detection
- No AI generation, no runtime mutation of curriculum
- Appropriate complexity for seed + test reuse

### 7. `prisma/seed.ts` — ✅

| Property | Implementation |
| -------- | -------------- |
| Deterministic | Loads fixed JSON files |
| Idempotent | `upsert` on concepts/templates; `createMany({ skipDuplicates: true })` on prereqs |
| JSON-sourced only | Via `loadCurriculum()` |
| Prerequisite sync | `deleteMany` then `createMany` from JSON — ensures graph matches source on re-run |
| Validation before write | `validateCurriculumIntegrity()` |

**Note:** Prerequisite `deleteMany()` clears the entire `concept_prerequisites` table.
Acceptable at this stage (table contains only seeded curriculum edges). Not wrapped in
`$transaction` — a mid-seed failure could temporarily leave prerequisites empty until
re-run (minor operational risk).

Neon seed **not executed** during review (per scope).

### 8. Tests — ✅

`tests/unit/concept-graph.test.ts` — 9 tests covering:

- Concept count = 24
- Goal template count = 5
- Canonical concept IDs
- DAG acyclic
- Prerequisite resolution
- Goal template validation
- Full integrity pass
- Frozen goal template IDs
- Shared concepts across templates

No DB integration test for `pnpm db:seed` — acceptable; JSON integrity thoroughly
covered. Live seed verification is operational follow-up.

### 9. Verification — ✅

```
pnpm prisma:generate  ✅
pnpm lint             ✅
pnpm typecheck        ✅
pnpm test             ✅  45/45 (9 new)
pnpm build            ✅
```

Neon migration deploy and seed **not run** (per review scope).

---

## Merge-readiness decision

### Option A vs Option B

| Factor | Assessment |
| ------ | ---------- |
| TASK-103 acceptance: `pnpm db:seed succeeds` | Operational — requires tables exist on target DB |
| Local P1001 | Documented; blocks local `migrate dev`, not code review |
| TASK-102 precedent | **Option A** — merge with operational follow-ups |
| TASK-002 precedent | Code merged before Neon init migration applied |
| Migration file | Present, reviewed, Prisma-generated, BOM-free |
| Seed logic | Reviewed; idempotent; validated pre-write |
| TASK-104 dependency | Requires TASK-103 **complete** — migration + seed operational |

**Decision: Option A — APPROVED FOR MERGE**

The branch delivers complete, reviewed migration + seed **code**. Live Neon execution
(deploy migration, run seed) is an **operational gate before TASK-104**, not a merge
blocker for TASK-103 — mirroring established project governance.

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-T103-01 | Info | `prisma/seed.ts` | `conceptPrerequisite.deleteMany()` is unscoped and not in a transaction; safe now but could be tightened later | None for merge |
| I-T103-02 | Info | Operational | `pnpm db:seed` not verified against live Neon in this review | None — post-merge follow-up |
| I-T103-03 | Info | `package.json` | `db:seed` does not load `.env.local` via dotenv-cli (pre-existing pattern) | None for this task |

---

## Merge authorization

**The branch `feature/TASK-103-concept-graph` may be merged to `main`.**

Explicit confirmations:

- **Branch may merge before live Neon seed execution** — migration and seed code are
  reviewed; operational apply/seed deferred.
- **Migration must be deployed to Neon before TASK-104** — TASK-104 adds `lessons`
  schema depending on TASK-103 tables.
- **Seed must succeed before TASK-104 implementation consumes curriculum data** —
  operational verification of `pnpm db:seed` after migration deploy.
- **TASK-104 must not begin until directed** and until TASK-103 operational follow-up
  is complete.

### Post-merge operational follow-up

1. Merge to `main`
2. **Database Migrate Deploy** — apply `20260810170000_concept_graph_and_goal_templates`
3. Run `pnpm db:seed` against Neon (or approved CI seed mechanism)
4. Verify: 24 rows in `concepts`, 5 in `goal_templates`, prerequisite edges present
5. Only then unblock TASK-104 operationally

Do **not** seed Neon as part of merge workflow unless Master directs.
