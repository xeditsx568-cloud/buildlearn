# Checker Review — TASK-213 (Onboarding UI profile integration)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-09-15  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-213-onboarding-profile-integration`  
**Commit reviewed:** `4e9c74c`

---

## Executive summary

TASK-213 connects the TASK-201/202 onboarding UI to the TASK-211 profile API:
a focused client helper (`onboarding-client.ts`), provider hydration that merges
persisted goal/experience over sessionStorage while preserving quiz session data,
and step/completion PATCH flows on goal, experience, quiz, and path screens.

The branch diff against `main` contains **8 files only** (+675/−43 lines). All
changes are TASK-213 scoped. No Prisma schema/migrations, Neon access, Clerk
metadata mutation, AI/path generation, `/roadmap` implementation, or TASK-203+
work was introduced.

Lint, typecheck, tests (**154/154**), and build pass. ADR-021 persistence
boundary is respected in all PATCH call sites — only the four approved fields
are sent; placement/quiz client state is never written to `/api/profile`.
Completion navigates to `/roadmap` only after a successful completion PATCH.

**Approved for merge to `main`.** TASK-203 must not begin until TASK-213 is
merged and Phase 4 is formally closed in tracking docs.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Branch diff scoped to TASK-213; no unrelated work | ✅ |
| 2 | ADR-021 — persist only four approved fields | ✅ |
| 3 | Profile API client — GET/PATCH, no client userId, errors handled | ✅ |
| 4 | Hydration — profile authoritative for goal/experience; quiz session preserved | ✅ |
| 5 | Goal / experience / quiz / path persistence contracts | ✅ |
| 6 | Duplicate-submit protection (with noted limitation) | ✅ |
| 7 | Error/retry UX; no silent advance; UX preserved | ✅ |
| 8 | TASK-212 interaction — no duplicated resume routing | ✅ |
| 9 | Tests — meaningful coverage with noted UI gap | ✅ |
| 10 | lint / typecheck / test / build | ✅ |
| 11 | TASK-101/201/202/211/212 regressions | ✅ |
| 12 | No Prisma migration required | ✅ |

---

## Branch diff vs `main`

```
 src/components/onboarding/experience-screen.tsx    |  46 ++-
 src/components/onboarding/goal-screen.tsx          |  43 ++-
 src/components/onboarding/onboarding-provider.tsx  |  32 +-
 src/components/onboarding/path-preview-screen.tsx  |  38 ++-
 src/components/onboarding/path-preview-view.tsx    |  38 ++-
 src/components/onboarding/quiz-shell-screen.tsx    |  70 +++-
 src/lib/onboarding/onboarding-client.ts            |  92 ++++++
 tests/unit/onboarding/onboarding-profile-integration.test.ts | 359 +++++++++++++++++++++
 8 files changed, 675 insertions(+), 43 deletions(-)
```

**Note:** `docs/TASK_QUEUE.md` lists seven implementation paths; `path-preview-view.tsx`
was additionally modified to support an optional `onStartLearning` button handler
while preserving static `<a href="/roadmap">` for existing tests — acceptable.

**Confirmed absent from diff:** Prisma schema/migrations, `src/app/api/profile`
changes, middleware/resume logic changes, OpenAI/AI services, `/roadmap` page,
`.env*`, `package.json`, TASK-203+, direct Neon/Clerk metadata mutation.

Neon was **not** mutated during review. No database migration workflows were run.

---

## Detailed review

### 1. Scope — TASK-213 only — ✅

| Out-of-scope item | Status |
| ----------------- | ------ |
| Prisma schema / migrations | ✅ Unchanged |
| Direct Neon access | ✅ Not present |
| Clerk metadata mutation | ✅ Not present |
| AI / OpenAI / real path generation | ✅ Not present |
| `/roadmap` page implementation | ✅ Not present |
| TASK-203 / Phase 5 | ✅ Not present |
| TASK-212 resume routing duplication | ✅ Middleware/resolver untouched |

---

### 2. ADR-021 persistence boundary — ✅

**Writes (all call sites):**

| Screen | PATCH payload |
| ------ | ------------- |
| Goal continue | `{ learningGoalText, onboardingStep: "experience" }` |
| Experience continue | `{ experienceLevel, onboardingStep: "quiz" }` |
| Quiz complete / skip | `{ onboardingStep: "path" }` only |
| Start learning | `{ onboardingComplete: true, onboardingStep: "path" }` |

**Never sent to `/api/profile` (verified via code review + tests):**

- `quizAnswers`, `placementResult`, placement scores, domain scores
- `quizSkipped`, `quizCompleted`
- No object spread of full `OnboardingState` into PATCH bodies

TASK-211 server `patchProfileOnboardingSchema` remains `.strict()` — extra keys
would be rejected if ever sent; client payloads are minimal literals.

---

### 3. Profile API client — ✅

**File:** `src/lib/onboarding/onboarding-client.ts`

| Requirement | Implementation |
| ----------- | -------------- |
| `GET /api/profile` | ✅ `fetchProfileOnboarding()` |
| `PATCH /api/profile` | ✅ `patchProfileOnboarding(payload)` |
| No client-supplied userId | ✅ Payload type excludes userId; only response includes `userId` |
| Explicit API errors | ✅ `ProfileClientError` + JSON `error` when available |
| TASK-211 validation boundary | ✅ Routes unchanged; server Zod allowlist enforced |
| Schema duplication | ✅ Lightweight client types aligned with API shape; no unsafe casts in components |

---

### 4. Hydration — ✅

**File:** `src/components/onboarding/onboarding-provider.tsx`

Flow: read `sessionStorage` → `fetchProfileOnboarding()` →
`mergeProfileIntoOnboardingState(stored, profile)` → set `hydrated: true`.

| Requirement | Result |
| ----------- | ------ |
| Profile authoritative for `goalText` | ✅ `profile.learningGoalText ?? stored.goalText` |
| Profile authoritative for `experienceLevel` | ✅ `profile.experienceLevel ?? stored.experienceLevel` |
| Session cannot overwrite newer persisted goal/experience on load | ✅ Profile non-null fields win over stored |
| Quiz/placement remain client-only | ✅ Not merged from profile; preserved from `stored` |
| Does not fight TASK-212 | ✅ No client resume resolver; `onboardingStep` not used to redirect |
| No pre-hydration submit | ✅ Goal/experience/quiz/path screens return `null` until `hydrated` |
| Profile fetch failure | ✅ Falls back to sessionStorage; still marks hydrated |

**Note:** `onboardingStep` and `onboardingComplete` are not stored in provider
context — resume position is enforced by TASK-212 middleware/sign-in logic.
This matches the instruction not to duplicate TASK-212 routing (see I-T213-03).

**Race consideration:** After hydration, `writeStoredState` syncs merged state
back to sessionStorage — aligned with profile-backed goal/experience without
clobbering quiz fields.

---

### 5. Goal persistence — ✅

**File:** `src/components/onboarding/goal-screen.tsx`

- Existing `validateGoalText` (10–500) unchanged; invalid continue shows validation error
- Successful continue sends trimmed goal + `onboardingStep: "experience"`
- `router.push("/onboarding/experience")` only after PATCH resolves
- Failure: stays on page, `SAVE_ERROR_MESSAGE`, goal preserved, retry enabled
- `disabled={!canContinue \|\| saving}`; chips disabled while saving

---

### 6. Experience persistence — ✅

**File:** `src/components/onboarding/experience-screen.tsx`

- PATCH `{ experienceLevel, onboardingStep: "quiz" }` with enum values from
  `EXPERIENCE_OPTIONS` (`beginner`, `some_exposure`, `intermediate`)
- Navigate to `/onboarding/quiz` only after success
- Same error/saving/disabled pattern as goal

---

### 7. Quiz persistence — ✅

**File:** `src/components/onboarding/quiz-shell-screen.tsx`

- `proceedToPath` PATCHes `{ onboardingStep: "path" }` only
- `completeQuiz` / `markQuizSkipped` run **after** successful PATCH (client state only)
- TASK-202 scoring/questions unchanged; static test helper preserved
- Skip and final Next disabled while `saving`

---

### 8. Path completion — ✅

**Files:** `path-preview-screen.tsx`, `path-preview-view.tsx`

- PATCH `{ onboardingComplete: true, onboardingStep: "path" }`
- `router.push(ONBOARDING_COMPLETION_ROUTE)` → **`/roadmap`** after success only
- Failure: remains on path, alert error, no local completion flag
- Stub/mock path preview unchanged; no AI generation

---

### 9. Duplicate-submit protection — ✅ (see I-T213-02)

All persistence handlers guard with `if (saving) return` and set `saving` true
before `await patchProfileOnboarding`. Buttons disable while saving.

Protection is **sufficient for normal UX**; same-event-loop double activation
before re-render could theoretically issue two PATCHes (non-blocking).

---

### 10. Error handling and UX — ✅

- User-facing save errors on goal, experience, quiz, and path
- No navigation on PATCH failure
- Entered/selected values retained
- Error cleared on retry input / new attempt where implemented
- Visual structure/copy matches TASK-201/202 patterns (Saving… labels, alert roles)

---

### 11. TASK-212 interaction — ✅

| Transition | Middleware expectation after PATCH |
| ---------- | ----------------------------------- |
| Goal → experience | Profile `onboardingStep = experience` matches `/onboarding/experience` |
| Experience → quiz | `onboardingStep = quiz` |
| Quiz → path | `onboardingStep = path` (explicit; ADR-021 never-infer-path satisfied) |
| Complete → `/roadmap` | `/roadmap` not in `requiresOnboardingResumeRouting` — no erroneous guard redirect |

TASK-213 does not modify `middleware.ts`, `onboarding-resume.ts`, or auth route
classification. PATCH-then-navigate ordering avoids wrong-step redirects after
successful persistence.

---

### 12. Tests — ✅ (with informational gap)

**File:** `tests/unit/onboarding/onboarding-profile-integration.test.ts` — **18 tests**

Covers: hydration merge precedence, GET/PATCH client, exact PATCH payloads,
failure/no-navigate contracts, placement exclusion, completion destination,
duplicate-submit contract, TASK-201 validation import, TASK-202 scoring used
only to assert exclusion from PATCH body.

**Regression suite:** 154/154 pass including `onboarding-resume.test.ts` (21),
`profile-route.test.ts`, `profile-service.test.ts`, `validation.test.ts`,
`quiz-skip.test.tsx`, `path-preview.test.tsx`.

**Gap:** Tests exercise the client helper and mirrored `persistThenNavigate`
pattern rather than RTL tests on `GoalScreen` / provider `useEffect` fetch.
Implementation wiring was verified by direct code review (see I-T213-01).

---

### 13. Verification

| Command | Result |
| ------- | ------ |
| `pnpm lint` | ✅ Pass |
| `pnpm typecheck` | ✅ Pass |
| `pnpm test` | ✅ **154/154** pass (20 files) |
| `pnpm build` | ✅ Pass |

---

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Informational (non-blocking)

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-T213-01 | Info | `tests/unit/onboarding/onboarding-profile-integration.test.ts` | New tests validate client helper, merge function, and navigation contracts via helpers; no component-level tests assert screen `onClick` → `patchProfileOnboarding` or provider hydration `useEffect` | None for merge — optional follow-up: RTL tests with mocked `fetch` on goal/experience screens |
| I-T213-02 | Info | All screen `saving` guards | Duplicate protection uses React `useState` only; two activations before re-render could double-PATCH (usually idempotent) | None for merge — optional `useRef` in-flight lock if product requires hard guarantee |
| I-T213-03 | Info | `onboarding-provider.tsx` | `onboardingStep` / `onboardingComplete` not held in context; TASK-212 owns resume routing | None — aligns with ADR-021 and TASK-213 notes |
| I-T213-04 | Info | `path-preview-view.tsx` | Extra file vs TASK_QUEUE list; enables PATCH-before-navigate while static tests keep `href="/roadmap"` | None |

---

## Merge authorization

**The branch `feature/TASK-213-onboarding-profile-integration` may be merged to `main`.**

Explicit confirmations:

- **TASK-213 may merge** — onboarding UI wired to TASK-211 profile API per ADR-021
- **Phase 4 minimum DoD is satisfied by this implementation**, subject to merge
  and Master tracking closure (TASK_QUEUE / CHANGELOG / README updates after merge)
- **TASK-203 must NOT begin** until TASK-213 is merged and Phase 4 is formally closed
- **No Prisma migration is required** for TASK-213
- **Neon was not mutated during review**
- **`/roadmap` remains an accepted pre-existing gap** (completion CTA targets it; page not implemented)
- **Placement data is not persisted** to the profile API
- **No AI/path generation implemented**
- **TASK-212 resume routing unchanged** — no conflict introduced

Do **not** merge as part of this Checker session unless Master directs. Do **not**
begin TASK-203 or Phase 5 work.

---

## Final decision

**APPROVED FOR MERGE**

TASK-213 meets acceptance criteria within approved ADR-021 scope. Merge
`feature/TASK-213-onboarding-profile-integration` to `main` after Master Agent
confirmation and tracking-doc closure.
