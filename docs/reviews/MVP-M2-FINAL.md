# Checker Review — MVP-M2 (Final)

> **Current verdict (after delta review):** **APPROVED FOR MERGE** — see
> [§ Delta review — B1 fix (`301dd19`)](#delta-review--b1-fix-301dd19) below.
> The original **CHANGES REQUIRED** record at [§ Verdict (initial)](#verdict-initial)
> is preserved for history.

**Initial verdict:** CHANGES REQUIRED  
**Initial review date:** 2026-09-29  
**Delta review date:** 2026-09-29  
**Reviewer:** Checker Agent  
**Branch:** `feature/MVP-M2-lesson-1`  
**Initial HEAD reviewed:** `f6c6245`  
**Delta HEAD reviewed:** `301dd19`  
**Implementation commits:** `60bd57f` (Wave 1), `f6c6245` (Wave 2), `301dd19` (B1 fix)  
**Prior:** [MVP-M2-WAVE1.md](./MVP-M2-WAVE1.md) — APPROVED FOR WAVE 2

---

## Executive summary

MVP-M2 delivers the intended vertical slice architecture: DB-backed Lesson 1,
authenticated progress APIs, transactional completion + path unlock, Monaco +
iframe preview, and a block-based player wired to deterministic graders. CI is
green. Onboarding, path generation, and webhook/profile architecture are
untouched in the MVP-M2 diff.

**One blocking UI grading issue** remains: after a learner passes interact,
exercise, or quiz, **editing code or changing a quiz option does not invalidate
the stored “passed” state**, so **Continue** (and potentially **Complete
lesson**) can stay enabled while the current answers would fail graders. This
conflicts with final review criterion §3 (including I-W1-02 intent) and must be
fixed before merge.

Migration `20260929140000_lesson_progress` remains **structurally approved** for
post-merge Database Migrate Deploy (not applied by Checker).

---

## CI (re-run on `f6c6245`)

| Check | Result |
| ----- | ------ |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass (**196/196**) |
| `pnpm build` | Pass |

---

## ADR-022 & MVP-M2 definition of done

| Criterion | Status |
| --------- | ------ |
| Deterministic path first (no AI path dependency) | **PASS** — no AI in diff |
| Sign up → onboarding → roadmap → complete L1 in-app | **PASS** (happy path); **blocked** on grading invalidation edge case |
| Progress saved; next step unlocks | **PASS** — Wave 1 transaction + player calls complete API |
| Editor + preview + client grading | **PASS** with **B1** gap on re-edit |
| TASK-205 polish deferred | **PASS** |

---

## 1. Lesson player

| Item | Result |
| ---- | ------ |
| Six block types rendered from DB payload | **PASS** — `lesson-player.tsx` branches on `objective`, `explain`, `interact`, `exercise`, `quiz`, `bridge`; content loaded via `getLessonWithAccessForUser` → `parseLessonContent` (TASK-104). |
| Sequential navigation | **PASS** — Back / Continue; progress bar “Block N of M”. |
| Cannot skip forward past ungraded blocks | **PASS** — `canAdvanceFromBlock` disables Continue until graded indices in `blocksCompleted` (+ quiz score for quiz). |
| Cannot bypass graded activities (forward-only happy path) | **PASS** |
| Re-edit after pass without re-check | **FAIL** — see **B1** |

---

## 2. Monaco + preview

| Item | Result |
| ---- | ------ |
| Client-safe / no SSR breakage | **PASS** — `dynamic(..., { ssr: false })` in `monaco-html-editor.tsx`; build succeeds. |
| Starter HTML | **PASS** — `syncEditorToBlock` sets `starterCode` from block on index change. |
| Edit → preview | **PASS** — `editorCode` bound to Monaco and `HtmlPreview` `srcDoc`. |
| No server-side execution of learner HTML | **PASS** — preview is browser-only iframe. |
| Dependencies | **PASS** — only `@monaco-editor/react` + `monaco-editor` added to `package.json`. |

---

## 3. Grading (incl. I-W1-02)

| Item | Result |
| ---- | ------ |
| Uses approved graders | **PASS** — imports from `@/lib/grading/html-lesson-graders`. |
| Interact / exercise / quiz gate Continue | **PASS** when `blocksCompleted` accurate |
| Complete only on bridge when all graded + quiz | **PASS** — `canCompleteLesson` + button only on bridge |
| Normal path to Complete without activities | **PASS** — button hidden until requirements met **if** `blocksCompleted` reflects reality |
| Pass state after failing edit/answer change | **FAIL — B1** |

### B1 (blocking): Stale “passed” state after learner edits code or quiz

**Location:** `src/components/lesson-player/lesson-player.tsx`

**Behavior:** On successful check, `markBlockPassed` adds the block index to
`blocksCompleted` (and sets `quizScore` for quiz). **`onChange` on the Monaco
editor and quiz radio does not remove that index or reset `quizScore`.**
`canAdvanceFromBlock` only consults `blocksCompleted` / `quizScore`, not live
grader output.

**Repro (code review):**

1. On interact, pass “Check my work” → Continue enables.
2. Revert paragraph to starter text (or otherwise fail the grader).
3. Continue remains enabled; learner can reach bridge and **Complete lesson**
   without re-passing interact (same pattern for exercise; quiz if user selects
   a wrong option after a prior pass + check without clearing state).

**Why blocking:** Final review §3 and I-W1-02 require the UI not to treat
activities as satisfied when the **current** submission would fail graders.
Server trust of `blocksCompleted` makes UI enforcement the primary integrity
control for MVP-M2.

**Expected fix direction (Programmer, not Checker):** On editor/quiz change for
the active graded block, clear that block from `blocksCompleted`, reset quiz
score when quiz selection changes, clear stale pass feedback, and PATCH progress
(or defer PATCH until next pass). Optionally require a fresh passing check
before Continue while on that block.

---

## 4. Progress + resume

| Item | Result |
| ---- | ------ |
| Started via PATCH | **PASS** — `useEffect` → `patchLessonProgress({ status: "started" })`. |
| blocksCompleted / quizScore on pass | **PASS** — `markBlockPassed` → PATCH. |
| Resume index | **PASS** — `getInitialBlockIndex` → first graded block not in `blocksCompleted`, else bridge. |
| Resume beyond incomplete required activity | **PASS** — cannot jump index forward except via Continue (gated). |
| User scoping | **PASS** — server uses Clerk `userId`; client calls same-origin APIs with session cookies. |

**Note:** Until Neon has `lesson_progress`, progress PATCH/complete returns errors
in production — expected pre-migration.

---

## 5. Completion + roadmap

| Item | Result |
| ---- | ------ |
| Complete uses POST `/api/lessons/[lessonId]/complete` | **PASS** — `api-client.ts` + `handleCompleteLesson`. |
| Transactional path (Wave 1) | **PASS** — reviewed in WAVE1; unchanged in `f6c6245`. |
| Redirect `/roadmap` + refresh | **PASS** — `router.push` + `router.refresh()`. |
| Roadmap reflects statuses | **PASS** — existing `/roadmap` lists `step.status`; unlock is server-side. |
| Repeat complete | **PASS** — completed lessons redirect to roadmap on GET; path step idempotent. |

End-to-end code path: **UI complete** → API → `$transaction` (progress completed,
step completed, next `available`) → redirect → roadmap reads updated steps.

---

## 6. Locked lessons & I-W1-01

| Item | Result |
| ---- | ------ |
| Locked step cannot use player | **PASS** — `getLessonWithAccessForUser` → `PathStepLockedError`; page shows “Lesson locked” + roadmap link (no `LessonPlayer`). |
| Normal flow from roadmap | **PASS** — Open links only for non-locked steps. |
| I-W1-01 (lesson not on path, `pathAccess === null`) | **Still non-blocking** — With player shipped, GET lesson could still return content for authenticated users when the lesson is not on the active path. **Completion and PATCH remain path-gated.** Normal learners use roadmap links; does not block MVP-M2 merge once **B1** is fixed. |

---

## 7. Security

| Item | Result |
| ---- | ------ |
| Authentication | **PASS** — routes + server page require Clerk user. |
| IDOR on progress | **PASS** — composite key from auth `userId`. |
| Path ownership on mutate | **PASS** — `assertLessonStepOpenable` on PATCH/complete. |
| iframe preview | **PASS** — `sandbox="allow-scripts"` + `srcDoc`; scripts run in isolated iframe, not parent DOM (aligned with ARCHITECTURE MVP note). |
| XSS — learner HTML | **Contained** in iframe; parent not executing learner HTML. |
| XSS — curriculum explain | **Low risk** — `ExplainBody` uses `dangerouslySetInnerHTML` for seeded TASK-104 content only (bold markup); not learner-controlled. |
| Production deploy blockers | **None** beyond **B1** product-integrity issue (not a platform CVE). |

Crafted POST complete with forged `blocksCompleted` remains possible (Wave 1
design); not introduced by Wave 2.

---

## 8. Migration `20260929140000_lesson_progress`

| Item | Result |
| ---- | ------ |
| Additive | **PASS** |
| Clerk `TEXT` user FK | **PASS** |
| Safe for Migrate Deploy after merge | **PASS** — unchanged from WAVE1 review |
| Applied during review | **No** |

Deploy order after merge + **B1** fix: merge → **Database Migrate Deploy** for
this migration → deploy app → founder smoke (below).

---

## 9. Regression / scope

| Area | Result |
| ---- | ------ |
| Onboarding | **PASS** — no changes in MVP-M2 commits |
| Deterministic path generation | **PASS** — `learning-path-service` untouched |
| Clerk webhook / profile | **PASS** |
| TASK-205 roadmap | **PASS** — minimal roadmap unchanged |
| AI / MVP-M3 | **PASS** — no AI modules or routes |

---

## 10. Test coverage

| Layer | Coverage |
| ----- | -------- |
| Graders | Unit tests |
| Navigation gating | `lesson-player-navigation.test.ts` |
| Progress service / path unlock / API auth | Unit tests |
| Full browser E2E | **Not present** |

**Assessment:** Absence of Playwright/Cypress E2E is **acceptable for MVP-M2**
given unit/service/API coverage **once B1 is fixed** and founder smoke test is
run post-migration. TASK-206 YAML mentioned component flow tests; navigation
tests partially satisfy gating logic but do not cover stale-pass regression —
add a focused unit test when fixing **B1**.

---

## Blocking vs non-blocking

| ID | Severity | Summary |
| -- | -------- | ------- |
| **B1** | **Blocking** | Graded pass not invalidated on code/quiz change; Continue/Complete can proceed with failing current answers. |
| I-M2-01 | Info | I-W1-01 path membership on GET lesson — harden later. |
| I-M2-02 | Info | Server does not re-run graders on complete (by design). |
| I-M2-03 | Info | Add unit test for invalidation when fixing B1. |
| I-M2-04 | Info | Pre-migration envs: progress APIs fail until table exists. |

---

## Verdict (initial)

**CHANGES REQUIRED**

Fix **B1** on `feature/MVP-M2-lesson-1`, re-run CI, and request Checker
re-review (or delta review) before merge.

*(Superseded by delta review below — historical record retained.)*

---

## Delta review — B1 fix (`301dd19`)

**Fix commit:** `301dd19` — `fix(MVP-M2): invalidate lesson pass state after edits`  
**Scope of delta:** 3 files only (`pass-state.ts`, `lesson-player.tsx`, pass-state tests). No Wave 1 or unrelated MVP-M2 changes.

### CI (re-run on `301dd19`)

| Check | Result |
| ----- | ------ |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass (**202/202**) |
| `pnpm build` | Pass |

### B1 resolution

| Check | Result |
| ----- | ------ |
| **B1 fully resolved** | **YES** |

### 1. Interact / exercise (delta)

| Requirement | Result |
| ----------- | ------ |
| Invalidate on HTML edit after pass | **PASS** — `handleEditorChange` → `shouldInvalidateEditorOnChange` → `invalidatePassForCurrentBlock`. |
| Remove from `blocksCompleted` | **PASS** — `invalidateGradedBlockPass` / `removeBlockFromCompleted`. |
| PATCH persisted state | **PASS** — `persistProgress(nextBlocks, nextQuizScore)` with cleared index. |
| Clear stale grader feedback | **PASS** — `setGraderFeedback(null)` in invalidation. |
| Continue disabled | **PASS** — `canAdvanceFromBlock` false when index absent from `blocksCompleted`. |
| Re-check required | **PASS** — `markBlockPassed` only on successful grader run. |

First keystroke after pass triggers one invalidation PATCH; further edits while not passed do not re-trigger (`shouldInvalidateEditorOnChange` false).

### 2. Quiz (delta)

| Requirement | Result |
| ----------- | ------ |
| Invalidate on answer change after pass | **PASS** — `handleQuizOptionChange` + `shouldInvalidateQuizOnSelectionChange` (requires prior pass and `previousOption !== nextOption`). |
| Remove quiz from `blocksCompleted` | **PASS** |
| Reset `quizScore` | **PASS** — `quizScore: null` on quiz block invalidation; Wave 1 PATCH accepts `null` (`quizScore !== undefined` branch). |
| PATCH + Continue gating | **PASS** — quiz Continue requires index in `blocksCompleted` **and** `quizScore === 1`. |

### 3. Edge cases (delta)

| Case | Result |
| ---- | ------ |
| Edits before pass | **PASS** — no invalidation PATCH (`shouldInvalidateEditorOnChange` false). |
| Failing → failing edits | **PASS** — normal; no spurious pass. |
| Re-pass after invalidation | **PASS** — `markBlockPassed` re-adds index without duplicates. |
| Async PATCH ordering | **PASS** (reasonable) — React state updated synchronously before `await persistProgress`; stale pass not re-enabled by in-flight pass PATCH under normal single-tab use. *(Theoretical race if pass PATCH completes after invalidation PATCH is out of scope for MVP-M2.)* |
| Back / Continue | **PASS** — navigation logic unchanged; invalidation tied to editor/quiz handlers on current block. |
| Back then forward resets editor without `onChange` | **Info (I-M2-05)** — `syncEditorToBlock` reloads starter while `blocksCompleted` may still list the block; learner can Continue without editing. Distinct from B1 (“edit after pass”); **non-blocking** follow-up. |

### 4. Tests (`lesson-player-pass-state.test.ts`)

**PASS** — Tests assert B1 outcomes (invalidation → `canAdvanceFromBlock` false) for interact and quiz, plus predicate guards for pre-pass edits. Not merely internal implementation trivia.

### 5. Regression from fix

No new blockers identified. I-M2-01–I-M2-04 from initial review remain non-blocking.

---

## Final verdict (post-delta)

**APPROVED FOR MERGE**

- **B1 is resolved** on `301dd19`.
- **Complete MVP-M2 vertical slice** (`60bd57f` + `f6c6245` + `301dd19`) is approved for merge to `main`.
- Migration **`20260929140000_lesson_progress`** remains **approved for Database Migrate Deploy after merge** (Checker did not apply it).
- **Non-blocking follow-ups:** I-M2-01 (I-W1-01 GET path membership), I-M2-02 (server grader trust), I-M2-04 (pre-migration DB), I-M2-05 (back-nav editor reset vs pass flag), optional E2E later.

Checker does **not** merge, migrate, deploy, or modify product code.

---

## After merge + migration (founder production smoke — run when approved)

Use an isolated test account (or fresh sign-up):

1. **Sign up / sign in** → complete onboarding → **Start learning** → `/roadmap`.
2. **Roadmap** — first step **How Websites Work** **available**; later steps **locked**.
3. **Open** Lesson 1 from roadmap → player loads six block types from real content.
4. **Step through** objective → explain → interact: edit paragraph, **Check**, pass, **Continue**.
5. **Exercise** — add comments, pass check, **Continue**.
6. **Quiz** — select correct option, pass check, **Continue**.
7. **Bridge** — **Complete lesson** → redirect **/roadmap**.
8. **Roadmap** — Lesson 1 step **completed**; next step **available** (not locked).
9. **Re-open** Lesson 1 URL → redirects or locked/completed handling (no duplicate broken state).
10. **Locked lesson** — open a locked step URL directly → “Lesson locked”, no player.
11. **Refresh mid-lesson** — resume at first incomplete graded block; completed checks preserved.
12. **Regression** — repeat onboarding path preview still multi-step; profile not reset.

**B1 regression check (add after fix):** Pass interact, revert code to starter, confirm **Continue** disables until re-pass.

---

## Commit reference

| SHA | Summary |
| --- | ------- |
| `60bd57f` | Wave 1 — progress + completion backend |
| `f6c6245` | Wave 2 — lesson player UI |
| `d25c57d` | Initial final review doc (CHANGES REQUIRED) |
| `301dd19` | B1 fix — invalidate pass state after edits |
| *(delta)* | Review doc updated — APPROVED FOR MERGE |
