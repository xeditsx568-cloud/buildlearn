# Checker Review — TASK-202 (Placement quiz)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-202-placement-quiz`  
**Commit reviewed:** `e53d93a`

---

## Executive summary

TASK-202 replaces the TASK-201 `/onboarding/quiz` placeholder with a full
5-question curated placement quiz: one MCQ per screen, internal progress dots,
answer gating, skip-to-path behaviour, and deterministic client-side scoring
stored in the existing onboarding React Context + `sessionStorage` stack.

The branch diff against `main` contains **9 files only** (+766/−35 lines). All
changes are TASK-202 related. No backend/API routes, profile persistence, Prisma
schema/migrations, Neon writes, AI/OpenAI, path-preview modifications, or
TASK-203+ work was introduced.

Lint, typecheck, tests (85/85), and build pass. Path preview components are
unchanged and do not consume `placementResult`.

**Merge-readiness decision: Option A — safe to merge now within the approved P1
boundary.** Client-only placement scoring and `sessionStorage` persistence are
explicitly in scope per the approved TASK-202 task definition
(`docs/reviews/TASK-202-task-definition.md`). Backend/profile persistence
remains separate Programmer 2 Phase 4 work and is not required before merge.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Exactly 9 intended files changed; all TASK-202 related | ✅ |
| 2 | Question data — 5 MCQs, deterministic IDs, HTML/CSS/JS scope | ✅ |
| 3 | Scoring — pure deterministic function, no side effects | ✅ |
| 4 | Onboarding state — quiz fields, complete/skip, legacy hydration | ✅ |
| 5 | Quiz UI — one-at-a-time, progress, answer gating, completion | ✅ |
| 6 | Skip — available throughout, correct copy, clears state, → path | ✅ |
| 7 | Completion — stores answers/result, navigates to path | ✅ |
| 8 | Path preview — stub unchanged; no placement consumption | ✅ |
| 9 | TASK-201 regression — goal/experience/path/shell/auth intact | ✅ |
| 10 | Tests — meaningful coverage per task definition | ✅ |
| 11 | Accessibility / responsive — radio semantics, mobile layout | ✅ |
| 12 | lint / typecheck / test / build | ✅ |
| 13 | Out-of-scope items excluded | ✅ |
| 14 | Client-only merge acceptable per governance | ✅ (Option A) |

---

## Branch diff vs `main`

```
 src/components/onboarding/onboarding-provider.tsx |  71 +++++++-
 src/components/onboarding/quiz-shell-screen.tsx   | 205 ++++++++++++++++++++--
 src/lib/onboarding/placement-quiz-questions.ts    |  65 +++++++
 src/lib/onboarding/placement-quiz.ts              |  12 ++
 src/lib/onboarding/placement-scoring.ts           |  67 +++++++
 src/lib/onboarding/types.ts                       |  36 ++++
 tests/unit/onboarding/placement-quiz.test.ts      |  51 ++++++
 tests/unit/onboarding/placement-scoring.test.ts   | 114 ++++++++++++
 tests/unit/onboarding/quiz-skip.test.tsx          | 180 +++++++++++++++++--
 9 files changed, 766 insertions(+), 35 deletions(-)
```

**Confirmed absent from diff:** `prisma/**`, `src/app/api/**`, `package.json`,
`.env.example`, `.github/workflows/**`, path-preview components, auth routes,
middleware, goal/experience screens, docs (except this review).

---

## Detailed review

### 1. Scope — ✅

All 9 changed files match the approved TASK-202 file list in
`docs/TASK_QUEUE.md`. No unrelated feature work.

**Confirmed absent:**

- Profile persistence / onboarding resume API
- Prisma schema or migrations
- New API routes
- OpenAI / AI question generation
- Real path generation or roadmap node changes
- `/roadmap` page implementation
- `.env.example` changes
- TASK-203+ work

### 2. Question data — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| Exactly 5 questions | `PLACEMENT_QUIZ_QUESTIONS` — 5 entries; `PLACEMENT_QUIZ_QUESTION_COUNT === 5` |
| Deterministic unique IDs | `placement-q1-html-structure` … `placement-q5-js-variables` |
| Multiple-choice only | 4 options per question; radio UI |
| Beginner HTML/CSS/JS scope | Domains: html (2), css (2), javascript (1) |
| No React/backend/DB learning content | Content covers HTML structure, links, CSS color/flexbox, JS variables |
| No runtime AI generation | Static TypeScript module under `src/lib/onboarding/` |
| Valid correctOptionId | Each question's `correctOptionId` matches an option `id` (tested) |
| Domain labels minimal | `"html" \| "css" \| "javascript"` only |

Question distractors appropriately separate HTML, CSS, and JS concerns at
beginner level. No mastery structures introduced.

### 3. Scoring — ✅

`scorePlacementQuiz(questions, answers)` in `placement-scoring.ts`:

| Requirement | Result |
| ----------- | ------ |
| Pure deterministic function | ✅ No I/O, no mutations |
| `totalCorrect` | ✅ Counts matching `correctOptionId` |
| `totalQuestions` | ✅ `questions.length` |
| `percentage` | ✅ `Math.round((totalCorrect / totalQuestions) * 100)` |
| Domain summary minimal | ✅ `{ domain, correct, total }[]` per domain |
| Zero correct | ✅ Tested |
| Partial correct | ✅ Tested (3/5 → 60%) |
| All correct | ✅ Tested (5/5 → 100%) |
| Missing answers | ✅ Treated as incorrect; partial-answer test covers sparse arrays |
| Empty inputs | ✅ Returns zeros |
| No path-generation logic | ✅ No consumers beyond provider state |

Unknown or wrong `selectedOptionId` values safely score as incorrect.

### 4. Onboarding state — ✅

Extended `OnboardingState` and `OnboardingProvider`:

| Field / method | Behaviour |
| -------------- | --------- |
| `quizAnswers` | Stored on completion |
| `quizCompleted` | `true` on completion; `false` on skip |
| `quizSkipped` | `true` on skip; `false` on completion |
| `placementResult` | Computed on completion; `null` on skip |
| `completeQuiz(answers)` | Scores, sets completed/skipped flags, persists answers + result |
| `markQuizSkipped()` | Sets skipped, clears answers/result/completed |

**Legacy hydration:** `normalizeOnboardingState` defaults missing TASK-202
fields (`quizCompleted: false`, `quizAnswers: []`, `placementResult: null`).
TASK-201 payloads hydrate safely.

**Corrupted storage:** `readStoredState` wraps `JSON.parse` in try/catch and
falls back to `defaultState` — onboarding does not crash.

**Existing fields:** `goalText` and `experienceLevel` setters unchanged;
normalization preserves them.

### 5. Quiz UI — ✅

`QuizShellScreen` + `PlacementQuizView`:

| Requirement | Implementation |
| ----------- | -------------- |
| One question at a time | `currentQuestionIndex` state; single prompt rendered |
| Starts question 1 | `useState(0)` |
| 5 total questions | Driven by `getPlacementQuizQuestions()` |
| Progress dots | `<nav aria-label="Quiz progress">` with 5 dots + aria labels |
| Question N of 5 | Text label updates with index |
| Radio semantics | `role="radiogroup"` + `aria-labelledby`; native `<input type="radio">` |
| Next disabled until answer | `nextDisabled = selectedOptionId === null` |
| Answers retained forward | `answers` array accumulates; dedupes by `questionId` |
| Final action | Last question label: `Complete quiz →` |
| No route-per-question | Single `/onboarding/quiz` route; index in component state |

Onboarding shell stepper remains step 3 of 4 (shell files unchanged).

### 6. Skip — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| Available every question | Skip button in `PlacementQuizView` footer on all steps |
| Approved copy | `I'm not sure — skip quiz` (matches UX §5.5 and TASK-201) |
| Skip state | `markQuizSkipped()` |
| Navigation | `router.push("/onboarding/path")` |
| Clears stale data | Answers cleared, `placementResult: null`, `quizCompleted: false` |

### 7. Completion — ✅

On final **Complete quiz →**:

1. Builds full `QuizAnswer[]` (5 entries when all questions answered)
2. Calls `completeQuiz(updatedAnswers)`
3. Computes deterministic `placementResult`
4. Sets `quizCompleted: true`, `quizSkipped: false`
5. Navigates to `/onboarding/path`

**Path preview:** `path-preview-screen.tsx` and `path-preview-view.tsx` are
**unchanged**. No reference to `placementResult`, `quizAnswers`, or
`quizCompleted`. Stub `MOCK_PATH_STEPS` preview remains score-agnostic per
task definition (Phase 5 consumption deferred).

### 8. TASK-201 regression — ✅

| Area | Status |
| ---- | ------ |
| `/onboarding/goal` | Unchanged |
| `/onboarding/experience` | Unchanged |
| `/onboarding/path` | Unchanged |
| Onboarding shell / stepper / back link | Unchanged |
| Sign-up redirect | Unchanged |
| Auth protection | Unchanged (`auth-routes.test.ts` still passes) |
| Start learning → `/roadmap` | Unchanged (`path-preview.test.tsx` passes) |
| Path stub states | Unchanged |

Existing onboarding tests (`validation.test.ts`, `path-preview.test.tsx`,
`auth-redirect.test.tsx`, `auth-routes.test.ts`) all pass.

### 9. Tests — ✅

| Requirement | Test location |
| ----------- | ------------- |
| Exact count = 5 | `placement-quiz.test.ts` |
| Unique/stable IDs | `placement-quiz.test.ts` |
| MCQ validity | `placement-quiz.test.ts` |
| 0 / partial / full score | `placement-scoring.test.ts` |
| Percentage calculation | `placement-scoring.test.ts` |
| Domain summary | `placement-scoring.test.ts` |
| One-at-a-time UI | `quiz-skip.test.tsx` |
| Next answer gating | `quiz-skip.test.tsx` |
| Progress indicator | `quiz-skip.test.tsx` |
| Skip copy | `quiz-skip.test.tsx` |
| Completion state shape | `quiz-skip.test.tsx` |
| Legacy sessionStorage normalization | `quiz-skip.test.tsx` |
| TASK-201 path/skip regression | `path-preview.test.tsx` (unchanged, passing) |

85/85 tests pass across 16 files (+18 net vs TASK-201 baseline of 67).

Tests use `renderToStaticMarkup` + static view helpers — consistent with
TASK-201 patterns; no new E2E framework introduced.

### 10. Accessibility / responsive — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| Radio group semantics | `role="radiogroup"` + `aria-labelledby` on prompt |
| Keyboard usable options | Native radio inputs inside `<label>` wrappers |
| Labels associated | Prompt `id`; radiogroup `aria-labelledby`; label wraps input + text |
| Focus visible | `focus-within:ring-2 focus-within:ring-ring` (matches experience screen) |
| Touch targets | `min-h-11` on buttons and option labels |
| Mobile layout | `flex-col` default; `sm:flex-row` for button row — matches onboarding screens |

Quiz progress dots include `aria-label` per dot; current step uses
`aria-current="step"`.

### 11. Verification — ✅

```
pnpm lint       ✅ No ESLint warnings or errors
pnpm typecheck  ✅ Pass
pnpm test       ✅ 85/85 pass
pnpm build      ✅ Pass — /onboarding/quiz bundle updated (3.69 kB); no new routes
```

---

## Merge-readiness: client-only placement state

**Question:** Can TASK-202 merge with placement results stored only in
client/`sessionStorage` while backend persistence remains separate P2 work?

**Decision: Option A — safe to merge now within the approved P1 boundary.**

Authority:

- Approved TASK-202 task definition (`docs/reviews/TASK-202-task-definition.md`)
  explicitly scopes P1 work to client-side quiz UI and deterministic scoring in
  `sessionStorage`; profile persistence and placement quiz backend are P2.
- `docs/TASK_QUEUE.md` TASK-202 Notes: placement signals reserved for Phase 5
  (TASK-204); TASK-202 does not change stub path preview.
- `docs/IMPLEMENTATION_PLAN.md` Phase 4: profile API and placement quiz
  backend/API deferred — not TASK-202.

Backend persistence is **not** required before merge.

---

## Findings

### Critical — none

### Major — none

### Minor

| ID | Severity | File/location | Explanation | Required correction |
| -- | -------- | ------------- | ----------- | ------------------- |
| — | — | — | No minor defects blocking merge | — |

### Informational (non-blocking)

| ID | Severity | File/location | Note |
| -- | -------- | ------------- | ---- |
| I-202-01 | Info | `quiz-skip.test.tsx` | Skip/completion tests validate state normalization and static UI; no runtime test asserts `markQuizSkipped()` + `router.push` wiring. Acceptable given TASK-201 static-test pattern. | Optional follow-up: add interaction test if RTL added later |
| I-202-02 | Info | `onboarding-provider.tsx` | `placementResult` hydrated from sessionStorage without schema validation; safe today because no consumer reads it except future Phase 5 work | Optional: validate shape on read when profile API integrates |
| I-202-03 | Info | `quiz-shell-screen.tsx` | Revisiting `/onboarding/quiz` via Back after completion resets local question index while provider retains `quizCompleted: true`; edge case outside acceptance criteria | None for merge |
| I-202-04 | Info | `docs/TASK_QUEUE.md` | TASK-202 status still `pending` on `main` — Master should set `review`/`in_progress` per workflow when directing merge | Master Agent action |

---

## Out-of-scope confirmations

| Item | Status |
| ---- | ------ |
| Backend / profile persistence | ✅ Not added |
| Placement quiz API | ✅ Not added |
| AI / OpenAI | ✅ Not added |
| Real path generation | ✅ Not added |
| Path preview score consumption | ✅ Not added |
| `/roadmap` page | ✅ Not implemented |
| TASK-203+ | ✅ Not started |
| Prisma / migrations / Neon writes | ✅ Unchanged |
| `.env.example` | ✅ Unchanged |
| API routes | ✅ No new routes |

---

## Post-merge confirmations

| Item | Status |
| ---- | ------ |
| Branch may merge to `main` | ✅ Yes |
| Client-only scoring/state acceptable | ✅ Yes — per approved TASK-202 definition |
| Backend/profile persistence remains separate P2 work | ✅ Confirmed |
| Path preview remains intentionally unchanged | ✅ Confirmed |
| TASK-203+ unstarted | ✅ Confirmed |

---

## Final decision

**APPROVED FOR MERGE**

TASK-202 meets all acceptance criteria within approved scope. Merge
`feature/TASK-202-placement-quiz` to `main` after Master Agent confirmation.
Placement results in client/`sessionStorage` are sufficient for this phase;
profile persistence and placement backend remain separate P2 Phase 4 work.
Master should update TASK-202 status per workflow after merge.
