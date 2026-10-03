# Checker Review — MVP-M3 TASK-203 Wave 0 (Mentor Foundations)

**Verdict:** APPROVED FOR WAVE 1  
**Date:** 2026-10-03  
**Reviewer:** Checker Agent (independent)  
**Branch:** `feature/MVP-M3-lesson-1-mentor`  
**Implementation commit:** `5aa2b5f`  
**Planning baseline:** `main` @ `441e1a1`  
**Authoritative plan:** `docs/plans/MVP-M3-TASK-203-ai-mentor.md`  
**Governing:** ADR-001 (teacher-not-builder), ADR-023 (Beginner Teaching Principle), approved TASK-203 plan + checker history  

**Scope of this review:** Wave 0 only. No Wave 1 routes, UI, merge, or production infra changes reviewed or authorized here.

---

## Executive summary

Commit `5aa2b5f` delivers the approved Wave 0 backend foundations: mentor contracts, config stubs, deterministic help policy, `MentorBlockStateStore` abstraction with in-memory dev/test implementation, shared server grader wrapper, `AIService` + deterministic `MockProvider`, optional env schema entries, and six unit test files (30 new tests).

The diff is **16 files, +913 lines**, with **no** mentor API routes, **no** mentor UI, **no** Prisma/schema/migration changes, and **no** production configuration.

Independent validation on `5aa2b5f`:

| Check | Result |
| ----- | ------ |
| `pnpm test` | Pass (**232/232**, including 30 mentor Wave 0 tests) |
| `pnpm exec tsc --noEmit` | Pass |
| `pnpm lint` | Pass |
| `pnpm build` | Pass |

**Wave 0 foundations are accepted.** Programmer 2 may proceed to Wave 1 on the same feature branch after this review document is committed. **No merge to `main` is required** between Wave 0 and Wave 1 unless Master directs otherwise.

---

## 1. Scope compliance

| Expected Wave 0 deliverable | Present | Evidence |
| --------------------------- | ------- | -------- |
| Mentor contracts | **YES** | `src/lib/ai/mentor-contracts.ts` |
| Mentor config | **YES** | `src/lib/ai/mentor-config.ts` |
| Deterministic help policy | **YES** | `src/ai/mentor/help-policy.ts` |
| Block-state abstraction | **YES** | `src/server/services/mentor-block-state-store.ts` |
| In-memory store (dev/test) | **YES** | `InMemoryMentorBlockStateStore` (documented dev/test only) |
| Shared server grader | **YES** | `src/server/services/mentor-grader-service.ts` |
| AIService abstraction | **YES** | `src/ai/types.ts`, `src/ai/aiservice.ts` |
| MockProvider | **YES** | `src/ai/providers/mock-provider.ts` |
| Env/config stubs | **YES** | `src/env.ts` (`mentorServerSchema`), `.env.example` |
| Tests | **YES** | `tests/unit/ai/*` (6 files, 30 tests) |

| Out-of-scope item | Absent? | Evidence |
| ----------------- | ------- | -------- |
| Mentor API routes | **YES** | No matches under `src/app` for mentor or `/api/ai` |
| Mentor UI | **YES** | Not in diff |
| Prisma / schema / migrations | **YES** | Not in diff `441e1a1..5aa2b5f` |
| Production config changes | **YES** | Optional env only; no secrets committed |
| Generic unrestricted chat | **YES** | `AIService.generateText` mentor-shaped; no chat routes |
| TASK-205 / Lessons 2–3 / MVP-M4 | **YES** | Lesson id locked to `how-websites-work` in contracts |

**Scope: PASS**

---

## 2. Help policy (`src/ai/mentor/help-policy.ts`)

Reviewed against approved plan §7.2 (`maxEligibleLevel`, `requestedLevel`, `resolveEffectiveHelpLevel`, `applyBillableHelpDelivered`, `applyServerGraderResult`).

| Requirement | Result | Notes |
| ----------- | ------ | ----- |
| `maxEligibleLevel` ladder (1→4) | **PASS** | Matches §7.2 table; L4 requires L3 delivered, `helpTurnCount >= 2`, `fails >= 2`, and `fails > failedChecksAtLastHelp` |
| Repeated `need_more_help` with 0 verified failures cannot climb | **PASS** | `maxEligibleLevel` stays 1 when `failedChecksSinceLastPass === 0`; tests simulate 3× billable turns capped at 1 |
| 3× `need_more_help` + 0 failures stays L1 | **PASS** | `help-policy.test.ts` |
| L4 requires prior L3 help | **PASS** | `lastLevelDelivered >= 3` in L4 gate |
| L4 requires new failures after last help | **PASS** | Strict inequality vs `failedChecksAtLastHelp`; test blocks 5× `need_more_help` without new fail |
| Pass resets fail counter | **PASS** | `applyServerGraderResult` zeroes `failedChecksSinceLastPass` on pass |
| Billable help snapshot | **PASS** | `applyBillableHelpDelivered` updates `lastLevelDelivered`, `helpTurnCount++`, `failedChecksAtLastHelp` |
| Client cannot determine eligibility | **PASS** | Policy inputs are `MentorHelpAction` + server `MentorBlockState` only |

### First `get_help` with one server-verified failure → effective Level 2

**Implementation:** When `action === "get_help"`, `helpTurnCount === 0`, and `failedChecksSinceLastPass >= 1`, `requestedLevel` returns **2** (then clamped by `maxEligibleLevel`, which is also 2).

**Plan tension:** Normative §7.2 row for `get_help` says: if `helpTurnCount === 0` → **1** (unconditional). The same section’s **truth table** (explicitly “tests must cover”) says:

- First `get_help`, 0 fails → **1**
- **1 fail + `get_help` → up to 2**

Those two rows together imply that the first billable `get_help` **may** deliver L2 when the learner already has one server-verified failure. The unconditional normative row is **underspecified** relative to the truth table and to `maxEligibleLevel` (which allows L2 at `fails >= 1`).

**Checker conclusion:** This behaviour is **acceptable** — it faithfully implements the approved truth table and beginner progression (after a failed check, first help may “show where” at L2). It is **not** a material deviation or blocker. The implementation does **not** accept client-supplied counters; struggle comes only from `MentorBlockState` fields updated via server grader semantics.

**Non-blocking:** Harmonize plan §7.2 normative `get_help` row with the truth table in a future docs-only edit to remove ambiguity.

---

## 3. Server-authoritative state (`mentor-block-state-store.ts`)

| Criterion | Result |
| --------- | ------ |
| Abstraction matches approved state model | **PASS** — uses `MentorBlockState` from contracts; `applyGraderResult` delegates to `applyServerGraderResult` |
| Scoped user + lesson + block | **PASS** — key `${userId}:${lessonId}:${blockIndex}` |
| In-memory clearly dev/test | **PASS** — comment “Dev/test only — not for production (B-M3-03)” |
| No production silent in-memory fallback | **PASS** — no factory wiring in Wave 0; nothing in app imports in-memory store for prod paths |
| B-M3-01 / B-M3-02 transition helpers | **PASS** — grader transitions in policy + store helper; billable transitions exported for Wave 1 orchestrator |
| Wave 1 Redis readiness | **PASS** — minimal `get` / `set` / `applyGraderResult` sufficient; Wave 1 adds Redis impl + factory gated by `getMentorLimitConfig().requireRedisInProduction` |

---

## 4. Shared grader trust

| Criterion | Result |
| --------- | ------ |
| Single deterministic ruleset | **PASS** — `gradeLessonBlockForMentor` calls `gradeInteractBlock`, `gradeExerciseBlock`, `gradeQuizSelection` from `html-lesson-graders.ts` |
| No duplicated grading rules | **PASS** — thin switch on block type |
| Parity tests meaningful | **PASS** — three parity cases assert equality with direct grader calls |
| Existing L1 player grading unchanged | **PASS** — grader module not modified in Wave 0 diff |
| Suitable for future grader-event route | **PASS** |
| Interact uses block/starter context | **PASS in service** — `gradeInteractBlock(learnerCode, block.starterCode)`; Wave 1 route must load authoritative `LessonBlock` from lesson content (carry-forward requirement, not Wave 0 failure) |

---

## 5. Contract / trust boundaries (`mentor-contracts.ts`)

| Criterion | Result |
| --------- | ------ |
| Client not authoritative for counters/eligibility | **PASS** — forbidden keys rejected on help + grader-event schemas |
| Strict request shapes | **PASS** — `.strict()` on help and grader-event requests |
| `hints_used` / server counters not client-writable | **PASS** — listed in `FORBIDDEN_AUTHORITATIVE_KEYS` |

**Wave 1 carry-forward (planning recommendation):** Grader-event route must continue rejecting unknown/forbidden authoritative fields (already enforced by schema). **`lastGraderResult.passed`** on help requests is allowed for UX context; Wave 1 orchestrator must **not** use it to update `MentorBlockState` (server state from grader-event + Redis only).

---

## 6. AI service / MockProvider

| Criterion | Result |
| --------- | ------ |
| Small provider abstraction | **PASS** — `AIService.generateText` with mentor prompts |
| Teaching policy not in provider | **PASS** — policy in `help-policy.ts`; mock returns fixed deterministic text |
| MockProvider deterministic for CI | **PASS** — seed from prompt lengths; no network |
| Tests avoid real OpenAI | **PASS** — mock tests only; factory default `mock` |
| No generic chat architecture | **PASS** |
| `openai` provider not accidentally production-ready | **PASS** — `createAIService({ provider: "openai" })` throws explicit error until Wave 1 |

**Wave 0 safety of OpenAI stub:** Acceptable. No route calls `createAIService` yet; Wave 1 must wire provider selection from env and keep mock for CI.

---

## 7. Config / env

| Criterion | Result |
| --------- | ------ |
| No secrets in repo | **PASS** — `.env.example` placeholders only |
| Mentor vars optional at Wave 0 | **PASS** — `mentorServerSchema` all optional; build not blocked |
| 30/month and 10 RPM as configurable defaults | **PASS** — `getMentorLimitConfig`; comments cite PRD/ARCHITECTURE, not literal FR-9.6 numbers |
| Production Redis requirement not undermined | **PASS** — `requireRedisInProduction` defaults true when `NODE_ENV === production` unless `MENTOR_REQUIRE_REDIS=false` |
| Wave 0 does not permit prod in-memory operation | **PASS** — no runtime store selection yet |

---

## 8. Test quality

| Area | Coverage | Assessment |
| ---- | -------- | ---------- |
| §7.2 truth table | `help-policy.test.ts` (13 tests) | **Strong** — covers 0-fail first help, 1-fail first help, need_more_help caps, L3/L4 gating, pass/fail counters |
| No-failure escalation | Included | **PASS** |
| L4 gating + post-help new failures | Included | **PASS** |
| State transitions / reset | store + policy tests | **Adequate** for Wave 0 |
| Grader parity | `mentor-grader-service.test.ts` | **PASS** |
| MockProvider | 2 tests | **Adequate** |
| Config defaults | `mentor-config.test.ts` | **Minimal but OK** |
| Trust boundaries | `mentor-contracts.test.ts` | **PASS** — strict + forbidden keys |

Tests align with **approved behaviour** (truth table), not merely arbitrary implementation details. Minor gaps are non-blocking (see recommendations).

---

## 9. Wave 1 readiness (interfaces only — not implemented)

Wave 0 exports stable seams for planned P2 Wave 1:

- Redis-backed `MentorBlockStateStore` + factory (503 when Redis required but missing)
- Quota service using `getMentorLimitConfig()`
- `POST /api/ai/mentor/grader-event` — validate with `mentorGraderEventRequestSchema`, grade via `gradeLessonBlockForMentor`, persist via store
- `POST /api/ai/mentor/help` — validate with `mentorHelpRequestSchema`, `resolveEffectiveHelpLevel`, `applyBillableHelpDelivered`, `createAIService`, deterministic fallback copy
- `GET /api/ai/mentor/quota`
- OpenAI provider implementation behind same `AIService` interface

No redesign of help policy or contracts expected for Wave 1 unless new blockers emerge during route wiring.

---

## Blockers

**None.**

---

## Non-blocking recommendations

| ID | Severity | Item | Recommendation |
| -- | -------- | ---- | ---------------- |
| R-W0-01 | Info | Plan §7.2 normative `get_help` row vs truth table | Docs-only harmonization on `main` or plan branch |
| R-W0-02 | Info | `mentorGraderEventRequestSchema` | Wave 1: enforce exactly one of `learnerCode` vs `selectedOptionId` per block type |
| R-W0-03 | Info | `lastGraderResult` on help request | Wave 1: display/context only; never mutate struggle counters |
| R-W0-04 | Info | `getMentorLimitConfig` parsing | Consider validating `AI_MENTOR_*` parse results (reject NaN) in Wave 1 quota service |
| R-W0-05 | Info | Help policy tests | Add explicit cases for `explain_task` and `explain_last_check` during Wave 1 route tests |
| R-W0-06 | Info | `createAIService({ provider: "openai" })` | Optional unit test that assert throws (Wave 1) |

---

## Wave 1 requirements recorded (from this review)

1. Grader-event handler loads lesson block JSON server-side and passes `block.starterCode` into interact grading.
2. Production store factory: Redis when `requireRedisInProduction`; **503** if unavailable — never default to `InMemoryMentorBlockStateStore`.
3. Billable help path must call `applyBillableHelpDelivered` after successful mentor response; server increments `hints_used` (Wave 1 scope per plan).

---

## Sign-off

**APPROVED FOR WAVE 1**

- Wave 0 foundations at `5aa2b5f` are accepted for continuation on `feature/MVP-M3-lesson-1-mentor`.
- First `get_help` with one server-verified failure delivering up to **Level 2** is **acceptable** and consistent with the approved §7.2 truth table.
- Checker stops here; Wave 1 implementation not started by this review.
