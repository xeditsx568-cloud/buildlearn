# Checker Review — MVP-M3 TASK-203 Wave 1 (Mentor APIs & Services)

**Verdict:** CHANGES REQUIRED  
**Date:** 2026-10-03  
**Reviewer:** Checker Agent (independent)  
**Branch:** `feature/MVP-M3-lesson-1-mentor`  
**Wave 0 baseline:** `5aa2b5f` (impl), `f4e87b0` (approved)  
**Wave 1 reviewed:** `230f94d` — `feat(MVP-M3): TASK-203 Wave 1 mentor APIs and services`  
**Planning baseline:** `main` @ `441e1a1`  
**Authoritative plan:** `docs/plans/MVP-M3-TASK-203-ai-mentor.md`  

**Scope:** Wave 1 P2 server slice only. No P1, merge, or production infra changes performed by this review.

---

## Executive summary

Wave 1 delivers the planned mentor API surface (grader-event, help, quota), Redis-backed state/quota factories, orchestrator, context builder, fallback copy, OpenAI provider, prompts, HTTP helpers, and a substantial test expansion (+27 tests, **259/259** pass in Vitest).

Architecture aligns with the approved plan on grader trust, help-policy integration, IDOR gates, strict schemas, and Redis fail-closed behaviour when `NODE_ENV=production` and Upstash env vars are absent.

**Three blockers** prevent approval for P1:

1. **Production can silently use `MockProvider` as “AI”** when `OPENAI_API_KEY` is missing but mentor routes otherwise run (`createAIService` default + `X-Mentor-Response-Source: ai`).
2. **Monthly quota is check-then-increment (TOCTOU)** — concurrent help requests can exceed the configured monthly limit under serverless load.
3. **`pnpm typecheck` fails** on Wave 1 test code (`context-builder.test.ts`).

Fix blockers on the same feature branch; re-submit for Checker Wave 1 re-review. Do not start TASK-203-UI until re-review passes.

---

## Independent validation (`230f94d`)

| Check | Checker result | Notes |
| ----- | -------------- | ----- |
| `pnpm test` | **Pass (259/259)** | Re-run on review branch |
| `pnpm typecheck` | **FAIL** | `tests/unit/ai/context-builder.test.ts(22,22)` — `title` on union including `quiz` |
| `pnpm lint` | Pass | |
| `pnpm build` | Not re-run this review (prior impl reported pass) | Typecheck failure should block merge regardless |

---

## 1. Scope compliance

| Expected Wave 1 deliverable | Present |
| --------------------------- | ------- |
| Redis `MentorBlockStateStore` + factory | **Yes** — `mentor-block-state-service.ts` |
| Quota / RPM service | **Yes** — `mentor-quota-service.ts` |
| `POST …/grader-event` | **Yes** |
| `POST …/help` | **Yes** |
| `GET …/quota` | **Yes** |
| Access / auth services | **Yes** — `mentor-access-service.ts` |
| Orchestrator | **Yes** — `orchestrator.ts` |
| Context builder | **Yes** |
| Deterministic fallback | **Yes** — `fallback-copy.ts` |
| OpenAI provider | **Yes** |
| Prompts | **Yes** — `lesson-mentor-v1.ts` |
| HTTP helpers | **Yes** — `mentor-http.ts`, `mentor-route-response.ts` |
| Tests | **Yes** — 11 new/extended files |
| R-W0-01 doc fix | **Yes** — plan §7.2 `get_help` row updated |

| Out of scope | Absent from `f4e87b0..230f94d` |
| ------------ | ------------------------------ |
| TASK-203-UI / mentor panel | **Yes** — no P1 components |
| Generic chat | **Yes** |
| Lessons 2–3 / TASK-205 / MVP-M4 | **Yes** |
| Prisma schema / migrations | **Yes** |
| Production Upstash/Vercel/OpenAI provisioning | **Yes** |

**Scope: PASS**

---

## 2. Redis / server-authoritative state

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Isolation `user + lesson + block` | **PASS** | `mentor:state:{userId}:{lessonId}:{blockIndex}` |
| TTL 7 days | **PASS** | `STATE_TTL_SECONDS`; refresh on `set` |
| Wave 0 policy compatibility | **PASS** | `applyServerGraderResult` / store helpers unchanged semantically |
| In-memory dev/test only | **PASS** | Warning + only when `requireRedisInProduction === false` and no Upstash URL |
| Production without Upstash cannot use memory | **PASS** | `resolveMentorStoreMode()` throws `MentorServiceUnavailableError` when `getMentorLimitConfig().requireRedisInProduction` and `!isMentorRedisConfigured()` |

### Production environment proof (Vercel-style)

When **`NODE_ENV=production`** (Vercel default) and **`UPSTASH_REDIS_REST_URL` / `TOKEN` are unset**:

- `getMentorLimitConfig()` → `requireRedisInProduction: true` (unless `MENTOR_REQUIRE_REDIS` is explicitly `"false"`).
- `createMentorBlockStateStore()` → throws before `getDevInMemoryStore()`.
- Routes map to **503** via `mentorErrorResponse`.

**Conclusion:** A normal Vercel production deployment **without** Redis env **cannot** instantiate the in-memory state store. **PASS** for default production semantics.

**Footgun (non-blocking):** `MENTOR_REQUIRE_REDIS=false` in production disables mandatory Redis even when `NODE_ENV=production`. Misconfiguration could re-enable in-memory paths. See §12.

**Runtime Redis outage:** Configured client failures may surface as unhandled 500s rather than normalized 503 — non-blocking recommendation.

---

## 3. Grader-event trust boundary

**Pipeline reviewed:** `grader-event/route.ts` → `processMentorGraderEvent` → access → DB lesson/block → `gradeLessonBlockForMentor` → Redis state.

| Step | Result |
| ---- | ------ |
| Clerk auth | **PASS** — 401 without `userId` |
| Lesson/path authorization | **PASS** — `assertMentorLessonAccess` + `assertLessonStepOpenable` |
| Authoritative block from DB | **PASS** — `getLessonPlayerPayload` |
| Strict validation | **PASS** — `.strict()` + `rejectAuthoritativeKeys`; unknown keys → **400** (not stripped) |
| Body size 32 KB | **PASS** — `readMentorJsonBody` before parse |
| Shared grader only | **PASS** — wraps `html-lesson-graders.ts`; no second ruleset |
| Interact starter from block | **PASS** — `gradeInteractBlock(learnerCode, block.starterCode)` |
| State from server pass/fail only | **PASS** — `applyGraderResult(passed, message)` |

**Forgery resistance (tests + code):**

- `passed`, `failed`, counters, `hints_used`, etc. → **400** (`grader-event-route.test.ts`, contracts tests).
- Service tests: real fail increments, real pass resets (`mentor-grader-event-service.test.ts`, trust integration).

**Conclusion:** Grader-event trust boundary **meets B-M3-02-delta intent**. **PASS**

---

## 4. Help policy / orchestrator

| Criterion | Result |
| --------- | ------ |
| Server loads Redis block state | **PASS** |
| Effective level from `help-policy.ts` only | **PASS** — no client level field in schema |
| Structured actions only | **PASS** — Zod enum |
| L4 requires server struggle | **PASS** — unchanged Wave 0 policy; trust integration covers pass spam |
| State update after delivery | **PASS** — `applyBillableHelpDelivered` after response |
| `hints_used` server-only | **PASS** — `incrementHintsUsedForMentorHelp`; client cannot PATCH via mentor body |

**R-W0-01:** Plan §7.2 `get_help` row now matches Wave 0 truth table (0 fails → L1; ≥1 verified fail → up to L2). **PASS**

**Note:** Client `lastGraderResult.passed` remains allowed on help requests for UX snapshot; orchestrator/context **does not** use it for escalation (uses Redis `lastGraderMessage` / state). P1 should treat as display-only — non-blocking documentation for P1.

---

## 5. AI provider — production safety (**BLOCKER**)

**Current factory** (`src/ai/aiservice.ts`):

```typescript
options.provider ?? (env.OPENAI_API_KEY ? "openai" : "mock")
```

**Orchestrator** calls `createAIService()` with no override. On successful `MockProvider.generateText`, `responseSource` stays **`ai`** and the help route sets **`X-Mentor-Response-Source: ai`**.

### Can this happen in production?

**Yes.** Scenario: Vercel **production**, Redis configured, mentor routes reachable, **`OPENAI_API_KEY` missing or empty**. Then:

1. Store/quota use Redis (valid prod path).
2. Help succeeds with MockProvider text containing `[mock:…]`.
3. Response marked as **AI**, not fallback.
4. Monthly quota **consumes** a billable AI slot.

This violates the review criterion: *“A production learner must never receive MockProvider output presented as real mentor AI.”*

| Check | Result |
| ----- | ------ |
| API key server-side | **PASS** |
| Model configurable / bounded | **PASS** — default `gpt-4o-mini`, `maxOutputTokens` |
| Teaching policy outside provider | **PASS** |
| Tests avoid live OpenAI | **PASS** — mocked SDK |
| Production MockProvider safety | **FAIL** — **B-W1-01** |

**Required correction:** In production (`NODE_ENV=production` or explicit mentor prod flag), if `OPENAI_API_KEY` is missing/invalid, do **not** select `MockProvider`. Use explicit unavailable path → deterministic fallback with `X-Mentor-Response-Source: fallback` (or 503 per plan §14 for missing key in prod — team should pick one consistent contract and test it).

---

## 6. Fallback semantics

| Question | Conclusion |
| -------- | ---------- |
| **A. Fallback vs effective level** | **Mostly yes** — `buildFallbackMentorMessage` branches on `helpLevel` 1–3+; not as rich as AI but aligned in intent |
| **B. Climb ladder via provider failures** | **No L4 bypass** — `maxEligibleLevel` still requires server-verified fails and post-L3 new fails; repeated fallback `need_more_help` cannot forge fails |
| **C. Fallback counts as delivered help turn** | **Yes, intentional in code** — `applyBillableHelpDelivered` runs for fallback; matches “learner not stranded” but **not explicitly documented in plan** |
| **D. Monthly quota on fallback** | **Non-consumption is consistent** with plan §11 “Successful **help** model response” billable event |
| **E. RPM on fallback** | **Yes** — `assertCanRequestHelp` runs before AI/fallback |

**Contradictions:** Fallback advancing `helpTurnCount` without quota cost during prolonged AI outage could allow extra escalated **static** levels while policy caps permit — acceptable under §14 static help, but P1 should not hide the static prefix. **Non-blocking:** document fallback = billable turn, non-quota.

**Mock-as-AI path (B-W1-01)** is separate and **not** acceptable fallback semantics.

---

## 7. Quota / rate limiting (**BLOCKER on monthly atomicity**)

| Criterion | Result |
| --------- | ------ |
| Defaults 30 / 10 | **PASS** — `mentor-config.ts` |
| Configurable env | **PASS** |
| Production Redis-backed | **PASS** when Upstash configured |
| User isolation | **PASS** — keys include `userId` |
| RPM | **PASS** — Upstash `Ratelimit.slidingWindow` (atomic) |
| GET quota learner-safe | **PASS** — remaining, limit, resetAt only |
| Redis missing in prod | **503** on quota factory | **PASS** |

### Monthly quota concurrency (**B-W1-02**)

`RedisMentorQuotaService.assertCanRequestHelp`:

1. RPM limit (atomic)
2. **`getStatus`** (read count)
3. If `remaining > 0`, allow request

After AI success, `recordBillableHelp` **`INCR`** — separate step.

Two concurrent requests can both observe `remainingThisMonth === 1` and both proceed, yielding **31+** billable helps for a limit of **30** in serverless/multi-instance deployments.

**Why it matters:** FR-9.6 / plan §11 require enforced monthly limits; TOCTOU is a **meaningful bypass** at month boundary under load.

**Required correction:** Reserve quota atomically before calling the provider (e.g. conditional INCR/Lua script, or increment-first with limit check in one Redis operation). Reject with **429** if reservation fails. Tests should cover concurrent reservation behaviour at minimum via documented pattern.

**In-memory quota service** has the same pattern — acceptable for dev only.

---

## 8. Authorization / IDOR

| Criterion | Result |
| --------- | ------ |
| Unauthenticated → 401 | **PASS** — route tests |
| Locked path → 403 | **PASS** — `assertLessonStepOpenable` |
| Lesson 1 only | **PASS** — `M3_MENTOR_LESSON_ID` gate |
| Invalid `blockIndex` → 400 | **PASS** |
| Profile scoped to auth user | **PASS** — `db.profile.findUnique({ where: { userId } })` |

No cross-user state key in client input. **PASS**

---

## 9. Context / prompt safety

| Criterion | Result |
| --------- | ------ |
| Learner code untrusted | **PASS** — fenced block + system rule to ignore in-code instructions |
| Learner question untrusted | **PASS** — labeled in user prompt |
| Level rules in system prompt | **PASS** — L1–2 no full solution |
| Not generic chat | **PASS** — structured actions; full-solution phrase guard at L1–2 |
| Automated L1–2 solution dump tests | **Partial** — plan lists `mentor-prompt-policy.test.ts`; **not present** (non-blocking) |

**PASS** with test coverage gap noted.

---

## 10. HTTP / size limits

| Criterion | Result |
| --------- | ------ |
| 32 KB cap before unbounded work | **PASS** — `request.text()` then byte count |
| `learnerCode` ≤ 8192 | **PASS** — schema |
| Oversized → 413 | **PASS** — route test |
| Malformed / forbidden → 400 | **PASS** |
| Quota → 429 + `Retry-After` | **PASS** |
| Service unavailable → 503 | **PASS** for missing Redis in prod factory |
| Secret leakage | **PASS** — generic error bodies |

**PASS**

---

## 11. Test quality

Wave 1 adds meaningful coverage: grader service trust, route strict schema, quota service, store factory prod guard, orchestrator fallback, OpenAI mock, integration trust cases.

**Gaps (non-blocking unless noted):**

- No route-level integration test for **503 help/grader** when prod + no Redis (factory tested in isolation only).
- Plan §15 `mentor-prompt-policy.test.ts` not implemented.
- **`pnpm typecheck` failure** — **blocking** (**B-W1-03**).

Do not approve on green tests alone — typecheck regression confirms.

---

## 12. Production configuration contract

| Variable | Semantics | Safety |
| -------- | --------- | ------ |
| `UPSTASH_*` | Required for mentor in prod (default) | **PASS** when unset + `NODE_ENV=production` |
| `OPENAI_API_KEY` | Expected for live AI | **FAIL** — missing key selects MockProvider (**B-W1-01**) |
| `MENTOR_REQUIRE_REDIS` | When `"false"`, disables prod Redis requirement | **Footgun** — can enable in-memory in prod if mis-set; default omits → prod requires Redis |
| Optional limits / model | Sensible | **PASS** |

Production Redis requirement **does not** depend on manually setting `MENTOR_REQUIRE_REDIS=true` — default derives from `NODE_ENV`. **PASS** for happy path.

---

## Blockers

### B-W1-01 — Production MockProvider presented as AI

| Field | Detail |
| ----- | ------ |
| **Severity** | Blocker |
| **Location** | `src/ai/aiservice.ts`, `src/ai/mentor/orchestrator.ts`, `src/app/api/ai/mentor/help/route.ts` |
| **Issue** | Missing `OPENAI_API_KEY` selects `MockProvider`; successful response sets `responseSource: "ai"` and `X-Mentor-Response-Source: ai`. |
| **Why it matters** | Production learners receive CI mock copy as if it were live mentor AI; quota consumed as billable AI. |
| **Required correction** | Never default to `MockProvider` in production. Missing/invalid key → explicit fallback or 503; response source must not be `ai` for mock output. Add tests for prod + no OpenAI key. |

### B-W1-02 — Monthly quota TOCTOU

| Field | Detail |
| ----- | ------ |
| **Severity** | Blocker |
| **Location** | `src/server/services/mentor-quota-service.ts` (`assertCanRequestHelp` + `recordBillableHelp`) |
| **Issue** | Read remaining, then later `INCR` after AI — concurrent requests can exceed monthly limit. |
| **Why it matters** | FR-9.6 enforcement weakened under serverless concurrency. |
| **Required correction** | Atomic reserve-or-reject before provider invocation; align billable semantics with reservation. Document/test. |

### B-W1-03 — Typecheck failure

| Field | Detail |
| ----- | ------ |
| **Severity** | Blocker |
| **Location** | `tests/unit/ai/context-builder.test.ts:22` |
| **Issue** | Accesses `ctx.block.title` without narrowing; quiz block has no `title`. |
| **Why it matters** | CI `pnpm typecheck` fails; reported “typecheck pass” inaccurate. |
| **Required correction** | Narrow block type or assert `exercise` before accessing `title`. |

---

## Non-blocking recommendations

| ID | Item |
| -- | ---- |
| R-W1-01 | Route integration test: prod env + no Upstash → **503** on help and grader-event |
| R-W1-02 | Add `mentor-prompt-policy.test.ts` (plan §15) for L1 exercise levels 1–2 |
| R-W1-03 | Document P1: honor `X-Mentor-Response-Source`; show static prefix for `fallback` |
| R-W1-04 | Disallow `MENTOR_REQUIRE_REDIS=false` when `NODE_ENV=production` (or warn at startup) |
| R-W1-05 | Normalize Redis runtime errors to **503** on mentor routes |
| R-W1-06 | Clarify in plan/docs: fallback help advances state / `hints_used` but not monthly quota |
| R-W1-07 | Parse validation for `AI_MENTOR_MONTHLY_LIMIT` / RPM NaN |

---

## Explicit conclusions (requested)

| Topic | Conclusion |
| ----- | ---------- |
| **1. Production MockProvider safety** | **UNSAFE — BLOCKER B-W1-01** |
| **2. Redis production enforcement** | **PASS** for default Vercel prod without Upstash (503, no silent memory). **Footgun** if `MENTOR_REQUIRE_REDIS=false`. |
| **3. Monthly quota concurrency** | **Not atomic — BLOCKER B-W1-02**. RPM is atomic via Upstash. |
| **4. Fallback state/quota semantics** | **Acceptable** with documented intent: state + hints advance; monthly quota only on AI success; RPM applies; L4 still gated by server fails. |
| **5. Grader-event trust** | **PASS** — strict rejection, shared grader, server-only state. |
| **6. P1 contract readiness** | **Not yet** — fix blockers first. After fixes, contracts (`grader-event`, `help`, `quota`, headers, 429/503) are sufficient for TASK-203-UI to integrate. |

---

## Sign-off

**CHANGES REQUIRED**

Wave 1 implementation is substantially on-plan and grader trust is sound, but **production AI provider selection**, **monthly quota atomicity**, and **typecheck** must be corrected before **APPROVED FOR WAVE 2 / P1**.

Checker stops here — no code fixes, no P1, no merge, no infra changes.

---

# Delta Review — Wave 1 Blocker Fixes (`efcf455`)

**Delta date:** 2026-10-03  
**Reviewer:** Checker Agent (independent)  
**Fix commit:** `efcf455` — `fix(MVP-M3): Wave 1 checker blockers B-W1-01/02/03 and prod Redis`  
**Prior Wave 1 verdict (preserved above):** **CHANGES REQUIRED** @ `230f94d` / review `8f08e89`  

This section records re-review of blocker fixes only. It does **not** replace or rewrite the original findings.

---

## Final verdict (post-delta)

**APPROVED FOR WAVE 2 / P1**

- **B-W1-01 RESOLVED**
- **B-W1-02 RESOLVED**
- **B-W1-03 RESOLVED**
- **Production Redis invariant ACCEPTED**
- Wave 1 backend contracts are stable for **TASK-203-UI**
- **P1 may begin Wave 2** on `feature/MVP-M3-lesson-1-mentor` after this review commit
- **No merge to `main`** is required before P1 unless Master directs otherwise

---

## Independent validation (`efcf455`)

| Check | Result |
| ----- | ------ |
| `pnpm test` | **Pass (269/269)** |
| `pnpm typecheck` | **Pass** |
| `pnpm lint` | **Pass** |
| `pnpm build` | **Pass** |

---

## B-W1-01 — Production MockProvider

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Prod + missing key → no MockProvider | **PASS** | `createAIService()` throws `MentorAIUnavailableError` when `isMentorProductionRuntime()` and no `OPENAI_API_KEY` |
| Orchestrator → fallback | **PASS** | `resolveAIService()` catches unavailable → `null` → inner throw → catch sets `responseSource: "fallback"` |
| Explicit `{ provider: "mock" }` blocked in prod | **PASS** | `assertMockAllowedInRuntime()` |
| Dev/test MockProvider | **PASS** | Non-production default without key returns `MockProvider`; tests in `aiservice-production.test.ts`, `mock-provider.test.ts` |
| Prod + valid key → OpenAI | **PASS** | Lines 39–43 `aiservice.ts` return `OpenAIProvider` (not live-tested; code path clear) |
| No live OpenAI in CI | **PASS** | SDK mocked in `openai-provider.test.ts` |
| No mock labelled `ai` in prod API path | **PASS** | Help route does not inject `deps.aiService`; unavailable → fallback source only |

**Note (non-blocking):** Unit tests may inject `deps.aiService` (including mock) directly into `runMentorHelp`; production HTTP route does not. P1 must not wire mock through the client.

**B-W1-01: RESOLVED**

---

## B-W1-02 — Atomic monthly quota

| Criterion | Result | Evidence |
| --------- | ------ | -------- |
| Lifecycle reserve → AI commit / fallback release | **PASS** | `reserveMonthlyAiQuota` before provider; `monthlyQuotaCommitted` retains slot; catch calls `releaseMonthlyAiQuota` when not committed |
| Redis atomicity | **PASS** | Lua `RESERVE_MONTHLY_QUOTA_SCRIPT` INCR + rollback; `RELEASE_MONTHLY_QUOTA_SCRIPT` guarded DECR |
| 30 / 31st boundary | **PASS** | `mentor-quota-atomic.test.ts` |
| Concurrent boundary | **PASS** | In-memory lock + atomic test (limit 1, two parallel reserves) |
| User isolation | **PASS** | Key includes `userId` |
| Month buckets | **PASS** | `monthQuotaKey(userId)` includes `yyyy-mm` |
| Release restores capacity | **PASS** | Atomic test + orchestrator fallback test (`remainingThisMonth` stays 1 after failed AI with limit 1) |
| No negative counters | **PASS** | In-memory `Math.max(0, used - 1)`; Redis release script skips DECR at ≤0 |
| Fallback does not consume monthly AI quota | **PASS** | Release on fallback; orchestrator test |
| Successful AI consumes one unit | **PASS** | Reservation retained; `getStatus` after commit; orchestrator AI test |
| RPM intact | **PASS** | `assertCanRequestHelp` still uses Upstash limiter before reserve |
| Redis missing in prod | **PASS** | Unchanged `createMentorQuotaService` → 503 |

**Reservation leak on error paths:** Provider failures and `MentorAIUnavailableError` paths release in the AI `catch` before fallback delivery. Throws **after** a successful fallback release but **before** HTTP response (e.g. `stateStore.set` / DB hint increment) do not re-consume monthly quota; worst case is a 500 after fallback text was computed — acceptable. If `releaseMonthlyAiQuota` itself failed against Redis, a slot could theoretically stick until TTL; that is an infra failure mode, not a logic bypass under normal Redis behaviour.

**Non-blocking:** A `try/finally` around post-reserve work would harden against future edits; not required for approval.

**B-W1-02: RESOLVED**

---

## B-W1-03 — Typecheck

| Criterion | Result |
| --------- | ------ |
| Discriminated union narrowing | **PASS** — `expect` + `if (ctx.block.type !== "exercise") throw` before `.title` |
| No unsafe cast | **PASS** |
| Full typecheck | **PASS** — Checker re-run |

**B-W1-03: RESOLVED**

---

## Production Redis invariant

| Criterion | Result |
| --------- | ------ |
| `NODE_ENV=production` always requires Redis backend | **PASS** — `mentorRequiresRedisBackend()` returns `true` regardless of `MENTOR_REQUIRE_REDIS=false` |
| Missing Upstash → no in-memory | **PASS** — factory throws; test in `mentor-block-state-service.test.ts` |
| Flag relaxes non-prod only | **PASS** — `MENTOR_REQUIRE_REDIS=true` optional in dev |
| Dev/test unchanged | **PASS** — memory + warning when not production and no Upstash |

**Production Redis invariant: ACCEPTED**

---

## P1 contract semantics (verified in code)

| Mode | Header | Monthly AI quota | Help state / hints |
| ---- | ------ | ---------------- | ------------------ |
| **AI** | `X-Mentor-Response-Source: ai` | Reserved slot **kept** (`monthlyQuotaCommitted`) | Advanced + `incrementHintsUsedForMentorHelp` |
| **Fallback** | `X-Mentor-Response-Source: fallback` | **Released** via `releaseMonthlyAiQuota` | Still advanced + hints incremented |

**RPM:** Applied in `assertCanRequestHelp` **before** reserve, for both AI and fallback outcomes.

---

## Regression check (delta scope)

No evidence that `efcf455` regressed:

- Grader-event trust, strict schemas, shared grader
- Help-level server authority, IDOR/access, body limits
- R-W0-01 help-policy documentation alignment
- `hints_used` server authority

Grader routes and services were not modified in the fix commit.

---

## Residual non-blocking items (carry-forward from original review)

Original recommendations R-W1-01, R-W1-02, R-W1-03, R-W1-05–R-W1-07 remain optional polish; **R-W1-04 is addressed** by production Redis hardening in `efcf455`.

---

## Delta sign-off

Blocker fixes at **`efcf455`** satisfy the original Wave 1 checker requirements. **APPROVED FOR WAVE 2 / P1.**

Checker stops here — no code fixes, no P1 implementation, no merge.
