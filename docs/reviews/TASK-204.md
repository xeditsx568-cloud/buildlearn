# Checker Review — TASK-204 (Final)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-09-29  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-204-deterministic-path`  
**HEAD reviewed:** `85c3399`  
**Commit chain:** `855f1b4` → `88ea149` → `85c3399`

---

## Executive summary

TASK-204 delivers deterministic learning path generation and persistence,
onboarding handoff, `/api/learning-path`, minimal `/roadmap` and lesson stub,
with prerequisite-safe experience personalization.

All prior blocking findings **B1, B2, B3, B4** and **I1** are **resolved** on
`85c3399`. Lint, typecheck, **178/178** tests, and build pass.

**Migration is approved for Neon** (not applied by Checker). Merge and migrate
per ordering below before production cutover.

---

## CI (final re-run, `85c3399`)

| Check | Result |
| ----- | ------ |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass (**178/178**) |
| `pnpm build` | Pass |

---

## Prior findings — final disposition

| ID | Topic | Status |
| -- | ----- | ------ |
| B1 | First step `how-websites-work` + unlocked | **Resolved** (`88ea149`, tests) |
| B2 | Prerequisite DAG ordering | **Resolved** (`88ea149`) |
| B3 | Atomic onboarding completion + path | **Resolved** (`88ea149`) |
| I1 | One active path per user | **Resolved** (`88ea149` migration + service) |
| B4 | Meaningful multi-step paths (no 1-step collapse) | **Resolved** (`85c3399`) |

---

## Final verification (11 points)

### 1. Meaningful multi-step paths (normal matched goal)

**PASS** — Tests for `business-website` + beginner / some_exposure / intermediate
require `steps.length >= MVP_MIN_MEANINGFUL_PATH_STEPS` (3) and valid prereqs.

### 2. Business-website example step counts

**PASS** (Checker-verified on `85c3399` logic + tests)

Goal: *“I need a bakery landing page for my shop”* → template `business-website`.

| Level | Expected | Verified |
| ----- | -------- | -------- |
| beginner | 6 | Full path after expand/topo/prune |
| some_exposure | 5 | End-drop 1 (`functions-and-logic`) |
| intermediate | 4 | End-drop 2 (+ `javascript-basics`) |

Shared prefix: `how-websites-work` → `your-first-html-page` →
`profile-card-challenge` → `html-structure-semantics` → …

**Note (non-blocking):** Unit tests assert minimum ≥ 3 and ordering, not golden
6/5/4 literals; behavior follows deterministic end-trim constants.

### 3. Required first step

**PASS** — `pinRequiredFirstLesson` + tests for all experience levels.

### 4. Experience personalization (prerequisite-safe)

**PASS** — `applyExperiencePersonalization` only `slice`s from the **path end**,
after full prune + pin; never removes mid-path prerequisites. `MVP_MIN_MEANINGFUL_PATH_STEPS`
(3) caps drops.

### 5. Minimum-path protection vs DAG

**PASS** — End removal preserves prefix order; final `pathStepsRespectPrerequisites`
throws on violation. Trimming dependents from the end cannot introduce “dependent
before prerequisite.”

### 6. Determinism

**PASS** — No LLM; `generated_by: system`; identical-input equality test; template
tie-break by id.

### 7. Onboarding complete only with active path

**PASS** — `patchOwnProfileOnboarding`: `ensureActiveLearningPathForUser(userId, tx)`
before `profile.update` when `onboardingComplete: true`; failure test present.
Path preview UI disables Start until preview POST succeeds.

### 8. Idempotency / concurrent active paths

**PASS** — Partial unique index on `(user_id) WHERE status = 'active'`; transaction
double-check; `P2002` retry (unit-tested). Preview POST may create path before
complete (idempotent ensure on completion).

### 9. API / user isolation

**PASS** — Clerk `auth()` on GET/POST; services scope by session `userId`; no
user id in body; route tests for 401/404/400.

### 10. Unapplied migration safety

**PASS** — `prisma/migrations/20260928120000_learning_paths/migration.sql`:

- Additive enums + tables + indexes + FKs to `users`, `goal_templates`
- Partial unique one active path per user
- No destructive DDL
- **Precondition:** `goal_templates` seeded in Neon (Phase 3)

### 11. Scope boundary

**PASS** — No AI path generation, placement persistence, full lesson player/editor,
dashboard polish, or Build Mode. In-scope M1 glue: minimal `/roadmap`, lesson
placeholder, path preview → real API.

---

## ADR / acceptance mapping

| Source | Result |
| ------ | ------ |
| ADR-022 | Deterministic/template path; no AI dependency |
| ADR-021 | No placement/quiz server persistence in path code |
| TASK-204 AC | Persist paths, DAG, template match, onboarding path, deterministic, first lesson |
| MVP-M1 DoD | Roadmap + persisted path + first lesson openable |

---

## Non-blocking follow-ups

| ID | Item |
| -- | ---- |
| F1 | Add golden tests for business-website 6/5/4 step counts |
| F2 | Prereq expansion limited to concepts with canonical MVP steps |
| F3 | Roadmap UX / step order polish (TASK-205) |
| F4 | Integration test for concurrent DB path creation under load |
| F5 | Document end-trim personalization rules in TASK_QUEUE or ADR note |

---

## Merge → migration → deployment (approved order)

**Do not deploy path-dependent production traffic until migration succeeds.**

1. **Merge** `feature/TASK-204-deterministic-path` → `main` (after founder merge approval).
2. **Neon migrate deploy** — run existing **Database Migrate Deploy** workflow for
   `20260928120000_learning_paths` (includes partial unique index).
3. **Verify DB** — confirm enums/tables/indexes; spot-check no duplicate active paths
   constraint works.
4. **Deploy** application build that includes TASK-204 routes/API (staging first, then
   production per release process).
5. **Production smoke test** (below).

Merge **before** Neon migrate is acceptable only if production/staging is **not**
cut over until step 2 completes.

---

## Production smoke test (required)

Perform once on staging (repeat on production after promote):

1. **New test user** — sign up (or use isolated test account).
2. **Onboarding** — goal (≥10 chars, bakery/business-style) → experience (**beginner**,
   **some_exposure**, **intermediate** in separate runs or accounts) → quiz (skip OK) →
   path preview loads **multi-step** path with **How Websites Work** first.
3. **Start learning** — succeeds; profile `onboardingComplete`; redirect **`/roadmap`**.
4. **Roadmap** — persisted steps match preview; first step **available**; link opens
   **`/learn/lessons/how-websites-work`**.
5. **API auth** — `GET /api/learning-path` returns 401 signed out; returns own path
   signed in; no cross-user access.
6. **Idempotency** — refresh path preview / repeat POST does not create second active
   path (DB: one `active` row per user).

---

## Verdict

**APPROVED FOR MERGE**

Checker does **not** merge or apply migration. Founder/Master merges branch; ops runs
Neon migration before production reliance on path features.

---

## Commit reference

| SHA | Summary |
| --- | ------- |
| `855f1b4` | Initial TASK-204: schema, path service/API, onboarding, roadmap stub |
| `88ea149` | B1/B2/B3/I1: DAG, atomic onboarding, unique active path |
| `85c3399` | B4: prerequisite-safe end-only experience personalization |
