# Checker Review — MVP-M2 Wave 0 + Wave 1 (Backend)

**Verdict:** APPROVED FOR WAVE 2  
**Date:** 2026-09-29  
**Reviewer:** Checker Agent  
**Branch:** `feature/MVP-M2-lesson-1`  
**HEAD reviewed:** `60bd57f`  
**Scope:** TASK-207 backend slice only (Wave 0 branch + Wave 1 services/APIs/graders/migration file). Wave 2 (TASK-206 player UI) **not** reviewed.

---

## Executive summary

Wave 0–1 delivers authenticated lesson load, user-scoped progress PATCH/GET,
transactional lesson completion with learning-path step complete + next-step
unlock, L1 client graders, shared player contracts, and an **unapplied**
`lesson_progress` migration. Onboarding, path generation, and roadmap UI are
unchanged. No AI, no TASK-205 polish.

Lint, typecheck, **193/193** tests, and production build pass on `60bd57f`.

**Migration is technically approved for a future Database Migrate Deploy** but
**MUST NOT be applied to Neon until Master directs** (post-merge or staged ops).

**Programmer 1 may begin Wave 2** on the same feature branch after this verdict.

---

## CI (re-run on `60bd57f`)

| Check | Result |
| ----- | ------ |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass (**193/193**) |
| `pnpm build` | Pass |

---

## 1. Lesson access security

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Authenticated users only | **PASS** | All three routes call Clerk `auth()`; missing `userId` → **401** (`src/app/api/lessons/**`, `lesson-progress/**`). |
| Locked lessons blocked | **PASS** | `getLessonWithAccessForUser` throws `PathStepLockedError` when `pathAccess.canOpen === false` (locked/skipped step on active path) → **403** on GET lesson. PATCH/complete use `assertLessonStepOpenable` → **403**. |
| No IDOR on progress | **PASS** | All DB access keys progress by `{ userId, lessonId }` from auth, never from client-supplied user id. GET/PATCH/complete upserts and reads scoped to authenticated user. |

**Informational (non-blocking): I-W1-01** — If the user has an **active path** but the requested lesson is **not** a step on that path, `getLessonPathAccess` returns `null` and GET lesson **still returns content** (only explicit locked steps are denied). Completion and progress PATCH still require a matching openable path step. Acceptable for MVP catalog size; consider denying GET when path exists and step is absent (align with FR-3.8 deep-link rules) in a follow-up.

**Informational (non-blocking): I-W1-02** — Acceptance YAML mentions IDOR tests for path unlock; coverage is **implicit** via auth-scoped services and route 401 tests, not an explicit two-user integration test. No cross-user write path found in code review.

---

## 2. Lesson content

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Loaded from database | **PASS** | `lesson-service.ts` → `db.lesson.findUnique` → `parseLessonContent(row.content)` (TASK-104 Zod). |
| Schema validation | **PASS** | `parseLessonContent` from `src/lib/schemas/lesson.ts`; invalid JSON/shape throws at read time (existing lesson-schema tests unchanged). |

---

## 3. Progress

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Scoped to user + lesson | **PASS** | Composite PK `@@id([userId, lessonId])`; APIs bind `userId` from Clerk. |
| Completion requirements vs `blocksCompleted` | **PASS** (MVP contract) | For `how-websites-work`, server enforces block indices **2, 3, 4** (interact, exercise, quiz) and `quizScore === 1` before complete (`assertLessonCompletionPreconditions`). Arbitrary indices alone are insufficient. |
| Client-only grader enforcement on complete | **PASS** (by design) | TASK-207 specifies **client-side** graders; complete API does **not** re-run HTML graders server-side. A crafted POST could mark completion without passing graders; Wave 2 UI should gate the complete action on client grader success. Documented for product integrity, not blocking Wave 2 backend. |

PATCH on already-**completed** progress returns existing row without downgrade (idempotent read path).

---

## 4. Completion transaction

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| `lesson_progress` → completed | **PASS** | Upsert inside `db.$transaction` with `status: completed`, `completedAt` set. |
| Current path step → completed | **PASS** | `completeLessonPathStepInTransaction` updates matching lesson step. |
| Next step → available | **PASS** | Unlocks **only** `orderIndex + 1` when prior status was `locked` (no multi-step skip). |
| Atomic | **PASS** | Progress upsert + path updates share one `$transaction`; `DbClient` accepts `Prisma.TransactionClient`. |
| No partial state on failure | **PASS** | Prisma transaction rollback on throw; path assert runs inside same transaction. |
| Repeated complete safe | **PASS** | If step already `completed`, step update skipped; next unlock skipped when `alreadyCompleted`; progress upsert remains completed (test: `learning-path-step-unlock.test.ts` idempotent case). |

---

## 5. Path integrity

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Cannot complete locked / out-of-path lessons | **PASS** | `assertLessonStepOpenable` requires active path, lesson step present, status not `locked`/`skipped`. Missing path/step → `PathStepNotFoundError` → **403** on complete route. |
| Cannot skip ahead via complete | **PASS** | Only the step matching `lessonId` is completed; unlock is strictly the immediate next index. Later steps remain `locked` until sequential unlock. |

---

## 6. Graders

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Align with L1 JSON | **PASS** | Interact uses starter paragraph from `content/lessons/01-how-websites-work.json` block index 2; quiz `correctOptionId` `"b"` matches JSON block index 4; exercise expects comments before `<html>`, `<head>`, `<body>`. |
| Deterministic | **PASS** | Pure string/regex checks in `html-lesson-graders.ts`. |
| MVP false-positive resistance | **PASS** (reasonable) | Interact rejects unchanged starter and empty `<p>`; exercise requires three comment patterns; quiz exact option id match. |
| No AI grading | **PASS** | No AI SDK or model calls in Wave 1 diff. |

---

## 7. Migration (`20260929140000_lesson_progress`)

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Additive / prod compatible | **PASS** | New enum `LessonProgressStatus`; new table `lesson_progress`; no destructive changes to existing tables. |
| Clerk user IDs | **PASS** | `user_id TEXT` FK → `users(id)` (Clerk string PK, same as `learning_paths.user_id`). |
| Safe for later Migrate Deploy | **PASS** | Standard FK + index on `user_id`; JSONB default `[]` for `blocks_completed`. |
| Applied during review | **N/A** | Correctly **not** applied (no `migrate dev` / deploy run). |

**Ops note:** Until migration runs, Wave 2 local/E2E testing against a DB without `lesson_progress` will fail at runtime on progress APIs — expected; apply via approved workflow when directed.

---

## 8. Scope

| Item | Result |
| ---- | ------ |
| No AI / M3 | **PASS** |
| No TASK-205 polish | **PASS** — lesson page remains placeholder |
| No onboarding/path regression in diff | **PASS** — no edits to onboarding or `learning-path-service` generation |
| Unrelated changes | **PASS** — 14 files, all MVP-M2 Wave 1 |

**Note:** TASK-207 YAML lists `learning-path-service.ts` for unlock helpers; implementation uses dedicated `learning-path-step-service.ts` — acceptable, clearer separation.

---

## Wave 2 readiness

- Shared contracts: `src/lib/lesson-player/contracts.ts`
- Graders: `src/lib/grading/html-lesson-graders.ts`
- APIs: GET lesson, PATCH/GET progress, POST complete
- Player route stub unchanged — Wave 2 wires UI here

---

## Verdict

**APPROVED FOR WAVE 2**

- Migration **`20260929140000_lesson_progress` is approved in principle** but **MUST NOT be applied yet**.
- **Programmer 1 may begin Wave 2 (TASK-206)** on `feature/MVP-M2-lesson-1`.
- Checker does **not** merge, migrate, or implement Wave 2.

---

## Commit reference

| SHA | Summary |
| --- | ------- |
| `60bd57f` | feat(MVP-M2): lesson progress + completion backend (Wave 0–1) |
