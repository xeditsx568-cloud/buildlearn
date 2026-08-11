# Checker Review — TASK-211 (Profile & onboarding persistence API)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-11  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-211-profile-onboarding-api`  
**Commit reviewed:** `fff27fe`

---

## Executive summary

TASK-211 adds the ADR-021 profile persistence layer: `OnboardingStep` enum,
nullable `profiles.onboarding_step`, and authenticated `GET`/`PATCH`
`/api/profile` for the four approved onboarding fields only. Clerk session
identity binds all reads and writes; webhook remains the sole User/Profile
creation path.

The branch diff against `main` contains **7 files only** (+671 lines). All
changes are TASK-211 scoped. No frontend integration, resume routing, placement
persistence, AI/OpenAI, or TASK-203+ work was introduced.

`pnpm prisma:generate`, lint, typecheck, tests (109/109), and build pass.
Neon migration deploy was **not** run (per review scope).

**Merge-readiness decision: Option A — safe to merge now.** Migration code is
reviewed and committed; live Neon apply is an **operational follow-up before
TASK-212/TASK-213 consume `onboardingStep` in deployed environments** —
mirroring TASK-103/TASK-104 precedent.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Exactly 7 expected files changed; no unrelated work | ✅ |
| 2 | Prisma schema — `OnboardingStep` enum + nullable column | ✅ |
| 3 | Migration — offline-generated, minimal, BOM-free, valid SQL | ✅ |
| 4 | GET `/api/profile` — Clerk auth, own profile, safe 404 | ✅ |
| 5 | PATCH `/api/profile` — strict allowlist, no IDOR, no creation | ✅ |
| 6 | Validation — goal 10–500, enums, boolean, malformed handling | ✅ |
| 7 | Service layer — thin routes, centralized Prisma, partial updates | ✅ |
| 8 | ADR-021 alignment — persist only approved fields | ✅ |
| 9 | Step-transition primitives for TASK-213 | ✅ |
| 10 | Tests — meaningful coverage per task definition | ✅ |
| 11 | prisma:generate / lint / typecheck / test / build | ✅ |
| 12 | Out-of-scope items excluded | ✅ |
| 13 | Merge with migration committed but not deployed (Option A) | ✅ |

---

## Branch diff vs `main`

```
 prisma/migrations/20260811120000_onboarding_step/migration.sql |   5 +
 prisma/schema.prisma                                            |   8 +
 src/app/api/profile/route.ts                                    |  64 +++
 src/lib/onboarding/onboarding-step.ts                           |  27 ++
 src/server/services/profile-service.ts                          | 138 +++++++
 tests/unit/profile-route.test.ts                                | 172 ++++++++
 tests/unit/profile-service.test.ts                              | 257 ++++++++++++
 7 files changed, 671 insertions(+)
```

**Confirmed absent from diff:** onboarding UI components, middleware,
auth-routing changes, placement quiz modules, OpenAI/AI services, `/roadmap`
page, `.env.example`, `package.json`, docs (except this review), TASK-212/213
implementation.

---

## Detailed review

### 1. Scope — ✅

All 7 changed files match the approved TASK-211 file list in
`docs/TASK_QUEUE.md`. No unrelated frontend, auth-routing, quiz persistence,
AI, or roadmap work.

### 2. Prisma schema — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| `OnboardingStep` enum values | `goal`, `experience`, `quiz`, `path` |
| `Profile.onboardingStep` nullable | `OnboardingStep?` with `@map("onboarding_step")` |
| Project conventions | Snake_case DB mapping; enum mirrors `ExperienceLevel` pattern |
| No speculative fields | Only enum + one column added |

### 3. Migration — ✅

**File:** `prisma/migrations/20260811120000_onboarding_step/migration.sql`

```sql
CREATE TYPE "OnboardingStep" AS ENUM ('goal', 'experience', 'quiz', 'path');
ALTER TABLE "profiles" ADD COLUMN "onboarding_step" "OnboardingStep";
```

| Requirement | Result |
| ----------- | ------ |
| Offline Prisma mechanism (P1001 precedent) | Commit message documents `prisma migrate diff`; matches TASK-103/104 offline pattern |
| Creates only enum + column | ✅ No other DDL |
| Does not alter existing fields unnecessarily | ✅ Additive only |
| No UTF-8 BOM | ✅ First bytes `45,45,32` (`-- `) |
| Valid PostgreSQL/Neon SQL | ✅ Standard Prisma enum + nullable column add |

**Neon deploy:** Not executed in this review (explicit requirement).

### 4. GET `/api/profile` — ✅

**File:** `src/app/api/profile/route.ts`

| Requirement | Result |
| ----------- | ------ |
| Requires Clerk authentication | ✅ `auth()` → 401 when `userId` absent |
| Uses authenticated Clerk user ID only | ✅ `getOwnProfileOnboarding(userId)` |
| Returns own-profile onboarding data only | ✅ `ProfileOnboardingRecord`: `userId`, `learningGoalText`, `experienceLevel`, `onboardingStep`, `onboardingComplete` |
| No arbitrary target user | ✅ No path/query userId parameter |
| Missing profile → safe response | ✅ `ProfileNotFoundError` → 404 |
| Soft-deleted user → safe response | ✅ `findActiveProfile` checks `user.deletedAt` → 404 |

`displayName`, `goalSummary`, and placement fields are not exposed.

### 5. PATCH `/api/profile` — ✅

| Requirement | Result |
| ----------- | ------ |
| Requires authentication | ✅ 401 without Clerk session |
| Strict allowlist | ✅ Zod `.strict()` on four fields only |
| Unknown fields rejected | ✅ e.g. `userId` in body → validation error |
| Empty PATCH rejected | ✅ `"At least one onboarding field is required"` |
| No userId accepted for targeting | ✅ Route passes Clerk `userId` only to service |
| No IDOR path | ✅ No `:userId` route segment or query override |
| No profile/user creation | ✅ `findActiveProfile` + `profile.update` only; 404 if missing |

### 6. Validation — ✅

**File:** `src/server/services/profile-service.ts`

| Field | Rule | Implementation |
| ----- | ---- | -------------- |
| `learningGoalText` | 10–500 chars when supplied | `z.string().min(10).max(500)` |
| `experienceLevel` | `beginner`, `some_exposure`, `intermediate` | `z.nativeEnum(ExperienceLevel)` |
| `onboardingStep` | `goal`, `experience`, `quiz`, `path` | `z.enum(ONBOARDING_STEP_VALUES)` |
| `onboardingComplete` | boolean only | `z.boolean()` |
| Malformed JSON | Route-level catch | ✅ `"Invalid JSON body"` → 400 |
| Malformed field types | Zod safeParse | ✅ Aggregated message → 400 |

**Note:** Server validation counts raw string length (no trim). Client goal
validation in `validation.ts` trims before min-length check. Minor behavioral
delta acceptable for TASK-211; TASK-213 may align trim policy when wiring UI.

### 7. Service layer — ✅

| Requirement | Result |
| ----------- | ------ |
| Thin route handlers | ✅ Auth, JSON parse, delegate to service |
| Prisma logic centralized | ✅ `profile-service.ts` |
| Partial updates preserve unspecified fields | ✅ Prisma `update` with partial `data`; tested |
| Soft-deleted users cannot update | ✅ Shared `findActiveProfile` gate |
| No speculative repository abstraction | ✅ Direct `db` usage matches `user-service.ts` |

### 8. ADR-021 alignment — ✅

**Persists (TASK-211 only):**

| Field | Status |
| ----- | ------ |
| `learningGoalText` | ✅ PATCH allowlist |
| `experienceLevel` | ✅ PATCH allowlist |
| `onboardingComplete` | ✅ PATCH allowlist |
| `onboardingStep` | ✅ New enum + PATCH allowlist |

**Does NOT persist:**

| Item | Status |
| ---- | ------ |
| Raw placement answers | ✅ Not in schema or API |
| Placement score / `placementResult` | ✅ Not in schema or API |
| Quiz skip/completed state | ✅ Not in schema or API |
| `goalSummary` writes | ✅ Not in PATCH allowlist |

### 9. Step-transition support — ✅

API accepts independent PATCH of each field. TASK-213 can compose ADR-021 §5
transitions without TASK-211 enforcing them server-side:

| Future event (TASK-213) | Supported primitives |
| ----------------------- | -------------------- |
| Goal save → experience | PATCH `{ learningGoalText, onboardingStep: "experience" }` |
| Experience save → quiz | PATCH `{ experienceLevel, onboardingStep: "quiz" }` |
| Quiz skip/complete → path | PATCH `{ onboardingStep: "path" }` |
| Start learning completion | PATCH `{ onboardingComplete: true, onboardingStep: "path" }` |

`ONBOARDING_STEP_ROUTES` in `onboarding-step.ts` mirrors ADR-021 §2 route map
for TASK-212 consumption — within expected file scope.

### 10. Tests — ✅

**`tests/unit/profile-service.test.ts`** (17 tests)

| Requirement | Covered |
| ----------- | ------- |
| Valid onboarding field updates | ✅ |
| Goal min/max length | ✅ |
| Invalid experience | ✅ |
| Invalid onboardingStep | ✅ |
| Invalid onboardingComplete | ✅ |
| Unknown fields (`userId`) | ✅ |
| Empty PATCH payload | ✅ |
| GET own profile fields | ✅ |
| Missing profile (GET) | ✅ |
| Soft-deleted user (GET) | ✅ |
| PATCH each allowed field | ✅ (4 tests) |
| Partial update payload | ✅ |
| Missing profile (PATCH) | ✅ |

**`tests/unit/profile-route.test.ts`** (7 tests)

| Requirement | Covered |
| ----------- | ------- |
| Unauthenticated GET | ✅ |
| Unauthenticated PATCH | ✅ |
| Clerk identity binding (GET) | ✅ |
| Clerk identity binding (PATCH) | ✅ |
| No arbitrary userId in PATCH execution | ✅ |
| Validation error → 400 | ✅ |
| Missing profile → 404 (GET/PATCH) | ✅ |

**Regression suite:** All pre-existing tests pass (auth-routes, clerk-webhook,
onboarding validation/quiz/scoring, auth-redirect) — 109/109 total.

### 11. Verification — ✅

```
pnpm prisma:generate  ✅
pnpm lint             ✅  No ESLint warnings or errors
pnpm typecheck        ✅
pnpm test             ✅  109/109 passed
pnpm build            ✅  `/api/profile` present in build output
```

**Neon migration deploy:** Not run (per review scope).

### 12. Out-of-scope confirmations — ✅

| Item | Status |
| ---- | ------ |
| Neon migration deployed | ✅ Not deployed |
| Placement persistence | ✅ Not added |
| Onboarding resume routing (TASK-212) | ✅ Not added |
| UI profile integration (TASK-213) | ✅ Not added |
| AI / OpenAI | ✅ Not added |
| TASK-203+ | ✅ Not started |
| User/Profile creation via API | ✅ Not added |
| `goalSummary` writes | ✅ Not added |

---

## Critical merge-readiness question

### Option A vs Option B

| Factor | Assessment |
| ------ | ---------- |
| TASK-103 precedent | **Option A** — merge with migration code reviewed; Neon apply deferred |
| TASK-104 precedent | **Option A** — merge before live Neon migration; ops gate before consumers |
| TASK-002 precedent | Code merged before init migration applied to Neon |
| Migration file | Present, offline Prisma diff, BOM-free, additive-only |
| Local P1001 | Documented project constraint; blocks local `migrate dev`, not code review |
| Next consumers | TASK-212 (resume routing), TASK-213 (UI integration) require column in target DB |
| Runtime impact pre-deploy | Merged code calling `/api/profile` against undeployed Neon will fail on `onboarding_step` until migration applied — acceptable; no production deploy in this phase without ops follow-up |

**Decision: Option A — APPROVED FOR MERGE**

The branch delivers complete, reviewed migration + API **code**. Live Neon
execution is an **operational gate before TASK-212/TASK-213 operational
verification against deployed DB**, not a merge blocker for TASK-211.

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| — | — | — | No minor defects blocking merge | — |

### Informational (non-blocking)

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-T211-01 | Info | `profile-service.ts` vs `validation.ts` | Server goal min-length uses raw string; client trims before min check | None for merge — optional TASK-213 alignment |
| I-T211-02 | Info | `profile-route.test.ts` | Malformed JSON handling implemented in route but not route-tested | None for merge — optional follow-up |
| I-T211-03 | Info | `profile-service.test.ts` | Soft-deleted user blocked on GET; PATCH uses same `findActiveProfile` but lacks explicit PATCH soft-delete test | None for merge |
| I-T211-04 | Info | `docs/TASK_QUEUE.md` | TASK-211 status still `pending` on `main` | Master Agent workflow update after merge |
| I-T211-05 | Info | Operational | Live Neon migration not verified in this review | Post-merge ops follow-up (see below) |

---

## Merge authorization

**The branch `feature/TASK-211-profile-onboarding-api` may be merged to `main`.**

Explicit confirmations:

- **Branch may merge before live Neon migration deploy** — migration SQL is
  reviewed and committed; operational apply deferred per Option A precedent.
- **Neon migration deploy is post-merge operational work** — apply
  `20260811120000_onboarding_step` via Database Migrate Deploy before
  TASK-212/TASK-213 consume `onboardingStep` in deployed/staging environments.
- **TASK-212 and TASK-213 must not start operationally against Neon until the
  migration is available** where DB-backed resume/integration is required.
  Implementation may proceed in parallel locally with migrated dev DB.
- **TASK-203 remains blocked** until Phase 4 minimum DoD (TASK-211–213) is complete.

### Post-merge operational follow-up

1. Merge to `main`
2. **Database Migrate Deploy** — apply `20260811120000_onboarding_step` to Neon
3. Verify: `OnboardingStep` enum exists; `profiles.onboarding_step` nullable column present
4. Only then unblock TASK-212/TASK-213 operational verification against Neon
5. Master should update TASK-211 status per workflow after merge

Do **not** deploy Neon migration as part of merge workflow unless Master directs.

---

## Final decision

**APPROVED FOR MERGE**

TASK-211 meets all acceptance criteria within approved ADR-021 scope. Merge
`feature/TASK-211-profile-onboarding-api` to `main` after Master Agent
confirmation. Neon migration deploy remains separate operational follow-up
before downstream Phase 4 tasks consume `onboardingStep` in production.
