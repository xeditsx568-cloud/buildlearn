# Checker Review — MVP-M3 / TASK-203 planning (documentation)

**Verdict:** CHANGES REQUIRED  
**Date:** 2026-10-03  
**Reviewer:** Checker Agent  
**Branch:** `docs/mvp-m3-task-203-plan`  
**Planning commit reviewed:** `4df77a4`  
**Primary plan:** `docs/plans/MVP-M3-TASK-203-ai-mentor.md`  
**Scope:** Planning/docs only — no product code, no merge, no production ops

---

## Executive summary

The MVP-M3 plan is **strong on scope discipline**, **Lesson 1 vertical slice (ADR-022)**,
**founder golden path (“Label the page parts”)**, **AIService/mock split**, and **P1/P2
task boundaries**. It aligns with **ADR-001** and **ADR-023** intent and cites **FR-9.6**
(30/month, 10 RPM) consistently with PRODUCT_REQUIREMENTS.md and P-011 recommendation.

**Blocking gaps** remain in **§7.2 help policy** (learners can escalate to level 4 without
genuine struggle) and **quota enforcement in production** (Upstash treated as optional).
**Server-authoritative mentor progression state** is not specified, so client signals can
forge escalation. These must be corrected in the plan (and TASK_QUEUE YAML notes) before
Master merges the docs branch or authorizes `feature/MVP-M3-lesson-1-mentor`.

---

## Authoritative requirements cross-check

| Requirement | Assessment |
| ----------- | ---------- |
| **ADR-001** teacher-not-builder | **PASS (intent)** — prompts forbid full dumps at L1–2; level 4 rescue bounded. Implementation must enforce via policy + tests, not prompts alone. |
| **ADR-023** Beginner Teaching Principle | **PARTIAL** — levels 1–4 semantics and golden path match founder need; **policy bypass** fails “detect struggle before escalating.” |
| **FR-9.6** usage limits | **PARTIAL** — limits documented; **production fail-open risk** if Upstash omitted on Vercel. |
| **ADR-022** vertical slice | **PASS** — L1 only; TASK-205/M4/L2–3 excluded; coherent TASK-203 + TASK-203-UI bundle. |

---

## Review checklist (12 areas)

### 1. Scope discipline — PASS

- Plan and TASK_QUEUE restrict surface to `how-websites-work`, structured actions, no generic `/api/ai/chat`.
- TASK-205, MVP-M4, lessons 2–3, path AI, reviewer pipelines explicitly out of scope.
- Optional mentor on `explain` blocks is still L1-only; acceptable if prompts stay concept-only.

**Note (non-blocking):** Backlog table row says “Plan approved — await Master go” before Checker sign-off; update wording after plan fix.

### 2. Progressive help — FAIL (blocking)

Level semantics (§7.1) match ADR-023: clarify → where → guide → rescue.

**Bypass:** §7.2 allows `need_more_help` → `min(4, lastHelpLevelDelivered + 1)` with **no**
tie to `failedChecksSinceLastPass`, time-on-block, or **server** mentor turn count. Sequence:
one `get_help` (level 1) + three `need_more_help` → **level 4 without any failed Run check**.

**Also:** `get_help` autoLevel uses client `failedChecksSinceLastPass`; a client can send `6`
and receive level 4 on the first billable call.

See **B-M3-01**, **B-M3-02**.

### 3. Beginner usability — PASS (conditional on policy fix)

Golden path (§2.3) covers comments, placement, grader feedback, and escalation for
**“Label the page parts.”** Level 1–3 descriptions are sufficient for a first-time coder
**if** policy prevents immediate rescue.

Level 4 allowing three comment-line examples is appropriate **rescue** for this exercise
(ADR-023 final fallback), not a silent full-file paste.

Static `solutionHint` + fallback (§14) supports AI-outage case.

### 4. Context architecture — PASS (minor gaps)

Server-enriched context (§5.3) includes lesson, block, objectives, instructions, starter
code, learner code, grader message, profile tone fields, and computed `effectiveHelpLevel`.

**Gaps (non-blocking):**

- Plan should require **Zod validation of `blockIndex`** against lesson block count (403/400).
- **`expected outcome`** is implied via grader + instructions, not a dedicated field; acceptable for M3 if prompts include grader rules for L1 exercise.

Client signals remain **advisory** until B-M3-02 is addressed.

### 5. AI architecture — PASS

- AIService + OpenAI + mock providers appropriate for first slice (ADR-006).
- No premature Anthropic/multi-pipeline orchestrator beyond mentor.
- Contracts in `mentor-contracts.ts` (P2-owned) sensible.
- Streaming optional for M3 — acceptable deferral vs UX_SPEC §5.10 (non-blocking: prefer stream in Wave 3 if low cost).

**Non-blocking:** §7.2 dead term `(mentorTurnsOnBlock > 0 ? 0 : 0)` should be removed or replaced with real logic in the plan.

### 6. Security — PASS (conditional)

- Clerk auth, lesson access reuse, IDOR tests specified.
- Prompt injection: fenced learner code, no tools — adequate for M3.
- Payload caps (~8 KB code, 280 char question, 6 turns) — add explicit **max JSON body size** in plan (non-blocking **R-M3-04**).
- `recentTurns` from client — truncate/drop; no secrets client-side — OK.

Conditional on server-side progression (B-M3-02) to prevent abuse of level 4.

### 7. Quotas — PARTIAL (blocking for production)

30/month and 10 RPM match FR-9.6 and ARCHITECTURE.md §3.6.

**Issue:** §11 and §12 treat Upstash as **“Prod recommended”** with in-memory fallback when
env missing. On Vercel serverless, in-memory limits **do not** enforce global per-user quotas
(FR-9.6 / cost abuse).

See **B-M3-03**.

**Non-blocking:** P-011 is still “pending” in DECISIONS.md but recommendation matches plan — no new silent product decision if plan cites P-011 / PRD.

### 8. Persistence — PASS

Reusing `lesson_progress.hints_used` is sufficient for M3 DoD and FR-4.6 hint accounting.

Avoiding `ai_conversations` / `ai_messages` is reasonable; **short-lived Redis mentor
state** (progression + optional turn count) is not a Prisma schema change — plan should
document this under §8/§11 when fixing B-M3-02.

No hidden Prisma requirement identified.

**Non-blocking:** Resolve single writer for `hints_used` (server-only increment in mentor route) — plan already prefers server; make exclusive in TASK-203 acceptance criteria.

### 9. P1/P2 ownership — PASS

TASK-203 vs TASK-203-UI file lists are clear; Wave 0 contracts before UI integration stated.

**Non-blocking:** Update `FILE_OWNERSHIP.md` during implementation to add `src/lib/ai/` (P2) — task `Files` lists suffice for PR gate today.

Shared touch: `lesson-player.tsx` (P1 only) — OK.

### 10. Testing — PASS (minor additions)

Plan includes help-policy, context-builder, route auth/quota, mock policy, UI stuck/panel tests.

**Missing (non-blocking):**

- Explicit **fallback-copy** / orchestrator fallback tests (§14).
- **help-policy tests** for B-M3-01 scenarios once plan corrected.
- **Server progression state** tests once Redis policy added.

Level 1/2 no-leak tests via `mentor-prompt-policy.test.ts` — adequate if augmented with exercise-specific fixtures for “Label the page parts.”

### 11. Production readiness — PASS (conditional)

§16 checklist validates stuck UX, progression, grader explanation, completion without
external tools, quota, auth — aligned with DoD, not API-only smoke.

**Non-blocking:**

- Item 9 (replay): replay not present in codebase on `7d09768`; checklist correctly says “if enabled” — either implement minimal replay gating in M3 or mark item **N/A until replay ships**.
- Item 10 optional — promote static fallback verification when AI key missing in **Preview** only, or document ops-only.

### 12. Complexity — PASS

Deferring conversation DB, ai_usage_logs, streaming mandate, misconception detector, and
multi-surface tutor is appropriate for first AI slice.

Adding **Redis mentor progression keys** (small) is necessary complexity for B-M3-02, not gold-plating.

---

## Blocking issues

### B-M3-01 — `need_more_help` bypasses teaching progression

| Field | Detail |
| ----- | ------ |
| **Severity** | Critical |
| **Affected** | `docs/plans/MVP-M3-TASK-203-ai-mentor.md` §7.2; `docs/TASK_QUEUE.md` TASK-203 acceptance criteria |
| **Why it matters** | Violates ADR-023 (“detect struggle before escalating”). Learners can reach **level 4 rescue** without failed checks or time stuck — same failure mode as using ChatGPT for the answer. |
| **Required correction** | Amend §7.2 and TASK-203 notes: `need_more_help` may increase level by **at most 1** and resulting level must be **`min(4, lastHelpLevelDelivered + 1, autoLevelCap)`**, where `autoLevelCap` is computed from **server-authoritative** struggle signals (see B-M3-02). Additionally: **first billable mentor response on a block cannot exceed level 2** unless `failedChecks >= 2` (server-validated or server-tracked). Document exemplar table in plan (0 failures → max L1 on get_help; need_more_help capped at L2 until ≥2 failures). |

### B-M3-02 — Client-forged struggle signals

| Field | Detail |
| ----- | ------ |
| **Severity** | Major |
| **Affected** | `docs/plans/MVP-M3-TASK-203-ai-mentor.md` §5.2, §7.2, §10 |
| **Why it matters** | `failedChecksSinceLastPass` and `lastHelpLevelDelivered` are client-supplied; malicious or modified clients can force **level 4 on first request**. Help policy cannot be authoritative while trusting these fields. |
| **Required correction** | Specify **server-side mentor session state** per `(userId, lessonId, blockIndex)` in **Redis** (same Upstash instance as quotas): e.g. `mentorTurns`, `maxHelpLevelDelivered`, optional `lastAutoLevelCap`. Increment `mentorTurns` on each successful billable response. Compute `effectiveHelpLevel` using **server state + validated client hints** (client failedChecks capped to `<= mentorTurns * 2 + constant` or ignored for cap — prefer server-only cap from mentorTurns and time-on-block not trusted from client). Update §5.2 signals to mark client fields **advisory**. Add tests: forged high failedChecks cannot exceed cap. |

### B-M3-03 — Production quota store not mandatory

| Field | Detail |
| ----- | ------ |
| **Severity** | Major |
| **Affected** | `docs/plans/MVP-M3-TASK-203-ai-mentor.md` §11, §12, §14; TASK-203 env acceptance |
| **Why it matters** | FR-9.6 requires enforceable limits. In-memory fallback on Vercel **does not** provide per-user monthly/RPM enforcement across instances — cost and abuse risk. |
| **Required correction** | State: **Production** mentor endpoints **require** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`; if missing in production, return **503** (mentor unavailable) with UI fallback (§14), **not** unbounded AI calls. Dev/CI may use in-memory limiter with warning. Add to DoD §4 and TASK-203 acceptance criteria. |

---

## Non-blocking recommendations

| ID | Area | Recommendation |
| -- | ---- | ---------------- |
| **R-M3-01** | TASK_QUEUE | Change backlog “Plan approved” to “Plan defined — Checker approved pending” after fixes. |
| **R-M3-02** | FILE_OWNERSHIP | Add `src/lib/ai/**` → P2 when implementation starts. |
| **R-M3-03** | hints_used | TASK-203: server-only increment in mentor route; P1 must not PATCH hintsUsed independently. |
| **R-M3-04** | Security | Document max request body size (e.g. 32 KB) on POST `/api/ai/mentor/help`. |
| **R-M3-05** | Testing | Add `fallback-copy.test.ts` and golden “Label the page parts” prompt fixtures. |
| **R-M3-06** | Smoke §16 | Clarify replay item N/A until `?replay=true` exists, or scope minimal replay gate into TASK-203-UI. |
| **R-M3-07** | §7.2 | Remove no-op `mentorTurnsOnBlock > 0 ? 0 : 0` from autoLevel formula; publish full truth table. |
| **R-M3-08** | Moderation | Define simple server rules for `learnerQuestion` (block “write full solution for me” at L1–2 or force action=`explain_task`). |
| **R-M3-09** | DECISIONS | Cross-reference P-011 / P-006 in plan env section as approved recommendations, not new scope. |

---

## Diff vs `main` (planning branch)

```
 docs/CHANGELOG.md                       |   6 +
 docs/IMPLEMENTATION_PLAN.md             |  20 +-
 docs/PROJECT_CONTEXT.md                 |   4 +-
 docs/README.md                          |   3 +-
 docs/TASK_QUEUE.md                      | 116 +++++++--
 docs/plans/MVP-M3-TASK-203-ai-mentor.md | 438 ++++++++++++++++++++++++++++++++
 6 files changed, 566 insertions(+), 21 deletions(-)
```

No `src/**`, `prisma/**`, or workflow changes — **PASS** for docs-only discipline.

---

## Verdict

**CHANGES REQUIRED**

Master must **not** merge `docs/mvp-m3-task-203-plan` to `main` until **B-M3-01**, **B-M3-02**, and **B-M3-03** are reflected in `docs/plans/MVP-M3-TASK-203-ai-mentor.md` and TASK-203 acceptance criteria (and optionally IMPLEMENTATION_PLAN § MVP-M3 notes).

After corrections and a quick Checker re-review (or Master acceptance of listed fixes):

- Merge docs plan to `main`.
- Authorize implementation branch **`feature/MVP-M3-lesson-1-mentor`** (TASK-203 Wave 0 → TASK-203-UI).

Checker does **not** merge.

---

## Re-review trigger

Update plan commit on same or follow-up docs branch; Checker re-run checklist items **2**, **7**, and **10** only.

---

# Delta re-review — revised plan (2026-10-03)

**Verdict:** CHANGES REQUIRED  
**Reviewer:** Checker Agent (independent)  
**Branch:** `docs/mvp-m3-task-203-plan`  
**Revised planning commit reviewed:** `11d0ba6`  
**Prior review:** `f662d3b` (CHANGES REQUIRED — preserved above)  
**Scope:** Delta only — no product code, no merge

---

## Executive summary (delta)

Revision `11d0ba6` **fully resolves B-M3-01** (help progression / `need_more_help` bypass) and **B-M3-03** (production Upstash fail-closed, FR-9.6 sourcing). **B-M3-02 is partially resolved:** escalation fields moved off the help request into Redis, but **struggle evidence still trusts client-reported `passed` on `grader-event`**, so a authenticated client can **fabricate failed checks** and satisfy Level 4 eligibility without honest Run check struggle. One **remaining plan blocker** before **APPROVED FOR IMPLEMENTATION**.

---

## B-M3-01 — Help progression — RESOLVED

| Criterion | Result |
| --------- | ------ |
| Repeated `need_more_help` alone cannot reach Level 4 | **PASS** — `maxEligibleLevel` caps at **1** when `failedChecksSinceLastPass === 0`; truth table row: `need_more_help` ×3, 0 fails → stays **1** |
| Level 4 requires server-observed struggle | **PASS (policy logic)** — requires `failedChecksSinceLastPass > failedChecksAtLastHelp` plus L3 prior |
| Level 4 requires prior Level 3 help | **PASS** — `lastLevelDelivered >= 3` |
| Fails after previous help before rescue | **PASS** — strict inequality vs `failedChecksAtLastHelp` |
| Client help payload cannot force escalation | **PASS** — removed from `MentorHelpRequest` |
| Genuinely stuck beginner can reach rescue | **PASS** — documented path: fails → L1 help → escalation to L2/L3 → new fail after L3 → L4 |

**Beginner friction (L2/L3):** Level **2** after **one** server-recorded fail; Level **3** after **two** fails and **one** help turn — reasonable for “Label the page parts” (not over-gated). No accidental lock-out of L2/L3 identified.

**B-M3-01:** **Resolved** in plan `11d0ba6`.

---

## B-M3-02 — Server-authoritative state — PARTIAL (one blocker remains)

| Criterion | Result |
| --------- | ------ |
| Escalation state in Redis (`MentorBlockState`) | **PASS** |
| Client cannot set `lastLevelDelivered`, `helpTurnCount`, counters in help request | **PASS** |
| `grader-event` authenticated + lesson/block scoped | **PASS (specified)** — same auth as help; blockIndex validation |
| `hints_used` server-only | **PASS** — DoD + TASK-203 |
| Pass resets fail counter | **PASS** — §5.3 |
| Replay mode | **PASS (deferred)** — smoke N/A until replay exists |

### Remaining issue — fabricated grader events (BLOCKER)

§5.3 `MentorGraderEventRequest` accepts **`passed: boolean` from the client** and increments `failedChecksSinceLastPass` without requiring the server to **re-run** L1 graders (`gradeInteractBlock`, `gradeExerciseBlock`, etc.) on submitted code.

**Attack:** Authenticated user POSTs `grader-event` with `passed: false` repeatedly (no UI), then walks help policy to **Level 4** — undermining B-M3-01’s intent for anyone scripting the API (and weakening “server-observed struggle” claims).

This is **not** fixed by moving counters off the help request alone. The original B-M3-02 correction is **incomplete** until struggle evidence is **server-verified**.

### B-M3-02-delta — Server must verify grader outcomes on `grader-event`

| Field | Detail |
| ----- | ------ |
| **Severity** | Major (blocks APPROVED FOR IMPLEMENTATION) |
| **Affected** | `docs/plans/MVP-M3-TASK-203-ai-mentor.md` §5.3, §6, §10, §15; `docs/TASK_QUEUE.md` TASK-203 acceptance criteria |
| **Why it matters** | Level 4 eligibility can be manufactured without genuine failed Run checks; “server-authoritative” struggle is illusory. |
| **Required correction (plan only)** | (1) **`learnerCode` required** on `grader-event` for `interact` / `exercise` blocks (quiz: server compares selected option if/when quiz events are recorded). (2) Server loads block metadata and runs **the same shared grading functions** as the player (`src/lib/grading/html-lesson-graders.ts`). (3) **Increment fail counter only when server grader fails**; on pass, reset per §5.3. (4) Ignore or overwrite client `passed` with server result (client `message` optional hint only). (5) Add tests: forged `passed: false` with passing code does not increment fails; failing code does. (6) Optional defense-in-depth: rate-limit `grader-event` per user/block (non-substitute for server grade). |

**B-M3-02:** **Not fully resolved** until **B-M3-02-delta** is documented.

---

## B-M3-03 — Production Redis / quotas — RESOLVED

| Criterion | Result |
| --------- | ------ |
| Production requires Upstash | **PASS** — §11, §12, `MENTOR_REQUIRE_REDIS` |
| No production in-memory fallback | **PASS** |
| Missing/unhealthy Redis → fail closed | **PASS** — **503** on help + grader-event |
| UI 503 + static/deterministic help | **PASS** — §14, `fallback-copy.ts`, TASK-203-UI |
| Dev/CI isolated from prod | **PASS** — in-memory/mock explicit |
| Quota/RPM shared across instances | **PASS** — Upstash keys |

**FR-9.6 clarification (§11):**

| Item | Assessment |
| ---- | ---------- |
| FR-9.6 row has no numeric limits | **Correctly stated** |
| 30/month from PRD §3 / §9 / P-011 context | **Correctly labeled as default env** |
| 10 RPM from ARCHITECTURE §3.6 | **Correctly not attributed to FR-9.6 row** |
| Internal consistency | **PASS** across plan + TASK_QUEUE |

**B-M3-03:** **Resolved** in plan `11d0ba6`.

---

## Non-blocking cleanup (revision `11d0ba6`) — verified

| Item | Status |
| ---- | ------ |
| Server-only `hints_used` | **Done** |
| `FILE_OWNERSHIP` `src/lib/ai/` | **Done** |
| `fallback-copy.test.ts` in plan | **Done** |
| Replay smoke N/A | **Done** (§16 item 10) |
| 32 KB body / 413 | **Done** |
| Dead autoLevel wording removed | **Done** |
| Tracking “Checker re-review pending” | **Done** (TASK_QUEUE header) |

**Remaining non-blocking (carry to implementation):**

- **R-M3-08** — `learnerQuestion` moderation rules (plan §13 mentions; expand in TASK-203 if needed).
- **R-M3-09** — Optional explicit P-006 cross-ref in plan env section.
- **Streaming** — still optional for M3; prefer before production polish.
- **I-M2-02 alignment** — server grader verification on grader-event satisfies related trust gap for mentor slice.

---

## Scope / complexity (delta) — PASS

Revision does not expand beyond Lesson 1 mentor slice; no new Prisma tables; no TASK-205 / L2–3 / M4 / generic chat. Added `grader-event` + Redis state is proportional to M3.

---

## Delta verdict

**CHANGES REQUIRED**

| Blocker | Status |
| ------- | ------ |
| B-M3-01 | **Resolved** (`11d0ba6`) |
| B-M3-02 | **Open** — **B-M3-02-delta** (server-verify grader on `grader-event`) |
| B-M3-03 | **Resolved** (`11d0ba6`) |

Master must **not** merge the docs branch or authorize `feature/MVP-M3-lesson-1-mentor` until the plan (and TASK-203 acceptance criteria) include **B-M3-02-delta** corrections. Checker does **not** merge and does **not** edit the plan in this pass.

---

## Re-review trigger (second delta)

After plan commit addressing **B-M3-02-delta** only; Checker re-run §5.3, §15 tests list, and TASK-203 YAML.
