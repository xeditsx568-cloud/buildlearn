# MVP-M3 — Context-Aware AI Mentor (TASK-203)

> **Status:** Planning (revised post-Checker `f662d3b` — B-M3-01/02/03)  
> **Authoritative main at planning:** `7d09768`  
> **Milestone:** MVP-M3 — one vertical slice on **Lesson 1 only** (`how-websites-work`)  
> **Principles:** ADR-001 (teacher-not-builder), ADR-023 (Beginner Teaching Principle), ADR-006 (Vercel AI SDK abstraction)  
> **Out of scope:** Lessons 2–3, challenges, project workspace, Build Mode, AI path generation, TASK-205, TASK-210, MVP-M4, generic unrestricted chat

---

## 1. Problem statement

MVP-M2 proved the technical loop (player → graders → progress → roadmap unlock).
Founder production smoke on **“Label the page parts”** showed that beginners can be
blocked on **HTML comment syntax** and **where to type in Monaco** without external
help — violating the product thesis (PROJECT_CONTEXT.md, ADR-023).

MVP-M3 delivers an **in-app AI mentor** that understands lesson context and escalates
help progressively so a beginner can finish Lesson 1 without ChatGPT, Google, or another person.

---

## 2. Exact scope

### 2.1 In scope (MVP-M3)

| Area | Scope |
| ---- | ----- |
| **Surface** | Lesson player only: `/learn/lessons/how-websites-work` |
| **Blocks** | `interact`, `exercise`, `quiz` (graded activities); optional read-only mentor on `explain` (concept questions only, same API) |
| **Modes** | Structured mentor actions — not open-ended chat (see §6) |
| **Help levels** | ADR-023 levels **1–4** (map to FR-4.6; FR-4.7 level 5 deferred post-M3) |
| **Context** | Client context (§5.2) + **server-authoritative mentor state** (§5.5) + lesson DB |
| **Provider** | OpenAI via Vercel AI SDK; mock provider for CI |
| **Quotas** | **FR-9.6** requires enforced limits; numeric defaults in §11 (30/month from PRD §3; 10 RPM from ARCHITECTURE — configurable) |
| **Redis (prod)** | **Required** in production for mentor block state + quota/RPM; fail closed **503** if unavailable (§11, §14) |
| **Persistence** | **`hints_used` server-only** increment on billable mentor response; no Prisma conversation tables in M3 |
| **Replay** | UX_SPEC replay not implemented on main @ M2; M3 smoke **N/A** until replay ships (§16). Plan: disable billable mentor when replay added |

### 2.2 Explicitly out of scope

- AI path generation (TASK-204 AI enhancement, Phase 5 path pipelines)
- Project reviewer, challenge tutor, Build Mode tutor (Phase 12 full scope)
- Lesson 1 JSON rewrite (static `hint` / `solutionHint` remain fallbacks)
- `ai_conversations` / `ai_messages` Prisma models (defer until post-M3 analytics need)
- Optional `ai_usage_logs` DB table — **not required for M3 DoD**; use Upstash counters + structured Vercel logs (Master may approve audit migration later)
- Streaming UX is **recommended** but non-streaming JSON acceptable for M3 if Checker agrees (prefer stream for UX_SPEC §5.10)
- Misconception detector pipeline (FR-9.4 partial → post-M3)

### 2.3 Founder acceptance scenario (golden path)

Signed-in beginner on **“Label the page parts”** who fails **Run check** ≥2 times can:

1. Open the AI mentor panel and tap **Get help** (or **Explain this task**).
2. Receive **level 1** plain-language explanation of comments and the three sections to label — **without** pasted full solution.
3. After repeated failure or **Need more help**, receive **level 2** guidance naming **line regions** in their current editor buffer (e.g. “above the line that starts with `<html`”).
4. Escalate to **level 3** with a **partial pattern** (e.g. comment syntax example not applied to all three tags).
5. After sustained struggle, **level 4 rescue** gives enough concrete guidance to proceed, **with explanation of what the fix means** — still not a silent full paste unless level 4 policy allows minimal snippet per prompt rules.

Same mentor shell works on **“Spot the three languages”** interact block for regression.

---

## 3. Task structure (MVP-M3 bundle)

MVP-M3 is **one coherent vertical slice** delivered on a shared integration branch
(e.g. `feature/MVP-M3-lesson-1-mentor`), with two programmer tasks:

| Task ID | Owner | Title |
| ------- | ----- | ----- |
| **TASK-203** | Programmer 2 | AI mentor backend — provider abstraction, context, policy, API, quotas |
| **TASK-203-UI** | Programmer 1 | Lesson 1 mentor UI — panel, stuck detection, API client, layout |

**Checker:** Single MVP-M3 review gate after both tasks integrate (prompt safety + FR-9.6).

**Master:** Coordinates `package.json` deps (`ai`, `@ai-sdk/openai`, optional `@upstash/ratelimit`).

---

## 4. Definition of Done (MVP-M3)

1. **Functional:** Authenticated user on L1 graded blocks can request mentor help in-app; responses use lesson/block context and last grader result.
2. **Teaching policy:** Levels 1–2 never output complete exercise solution for `how-websites-work` exercise; level 3 uses partial patterns only; level 4 may include minimal rescue snippet per prompt contract — verified by unit tests on mock outputs + Checker spot-check.
3. **ADR-023:** Mentor copy avoids assumed jargon; explains errors in plain language (FR-9.3).
4. **Not generic chat:** API rejects or redirects off-topic / “write my code for me” prompts (FR-9.2 Socratic bias at low levels).
5. **Quota (FR-9.6):** Enforced monthly + RPM limits via Upstash in production; **429** when exceeded; **503** when Redis/quota store unavailable in production (UI static fallback).
6. **Auth:** User cannot invoke mentor for another user’s lesson context (IDOR tests); valid `blockIndex` for lesson.
7. **Fallback:** AI or Redis down → static/deterministic lesson help (§14); learner not stranded.
8. **Hints accounting:** **`hints_used` incremented only by mentor route** (server); P1 does not PATCH `hintsUsed`.
9. **Escalation:** Level 4 impossible without **server-recorded failed grader checks after level 3 help** (§7); `need_more_help` alone insufficient (B-M3-01).
10. **Tests:** CI green — help-policy truth table, grader-event + state tests, auth/quota/fallback tests, P1 panel tests.
11. **Production smoke:** §16 checklist passed on Vercel production after merge (separate ops step).

---

## 5. Mentor context payload

### 5.1 Design goals

- **Server is source of truth** for lesson content, **help level**, and **struggle evidence**.
- **Client supplies context only** (editor code, last grader snapshot, UX timing) — not escalation authority.
- **HTTP body cap:** **32 KB** max on all POST `/api/ai/mentor/*` (reject **413**).
- **Minimal tokens:** learner code excerpt max **8 KB** inside body; truncate instructions.

### 5.2 Client context (`MentorHelpRequest`)

Shared Zod schema in `src/lib/ai/mentor-contracts.ts` (P2 defines; P1 imports types only).

```typescript
// CLIENT CONTEXT — does not authorize help level
type MentorHelpRequest = {
  lessonId: "how-websites-work";
  blockIndex: number;
  action:
    | "get_help"
    | "explain_task"
    | "explain_last_check"
    | "need_more_help";
  learnerCode?: string;
  /** Snapshot for prompt only; struggle counts come from server state */
  lastGraderResult?: { passed: boolean; message: string };
  /** UX-only: stuck badge, not used for level cap */
  clientUx?: { secondsOnBlock: number };
  learnerQuestion?: string; // max 280 chars; moderation §13
  recentTurns?: Array<{ role: "user" | "assistant"; content: string }>; // max 6
};
```

**Removed from client (B-M3-02):** `failedChecksSinceLastPass`, `lastHelpLevelDelivered`, `mentorTurnsOnBlock` — server Redis state replaces these.

### 5.3 Grader activity (server struggle evidence)

P1 calls after every **Run check** / **Check my work** (same moment as client grader):

`POST /api/ai/mentor/grader-event`

```typescript
type MentorGraderEventRequest = {
  lessonId: "how-websites-work";
  blockIndex: number;
  passed: boolean;
  message: string; // max 500 chars — grader feedback snapshot
};
```

Server updates Redis block state (§5.5):

- `passed === false` → increment `failedChecksSinceLastPass`
- `passed === true` → reset `failedChecksSinceLastPass` to **0** (and optionally reset help progression for block per product choice: **reset only fail counter**, keep `lastLevelDelivered` for session continuity)

M3 choice: **on pass, reset fail counter only**; on block change, new Redis key → fresh state.

### 5.4 Server-enriched context (`MentorContext`)

Built in `src/ai/mentor/context-builder.ts`:

| Field | Source |
| ----- | ------ |
| `lessonTitle`, `estimatedMinutes` | DB / lesson payload |
| `block` | Parsed block at `blockIndex` (type, title, instructions, starterCode, static hint fields) |
| `objectives` | L1 objective block(s) summary |
| `learningObjective` | First objective block bullets (plain text) |
| `experienceLevel` | `profiles.experience_level` (optional; default beginner tone) |
| `learningGoalText` | Truncated profile goal for examples (optional, ≤120 chars) |
| `effectiveHelpLevel` | From help policy (§7) + **MentorBlockState** |
| `blockState` | Loaded from Redis (§5.5) |
| `graderMessage` | Latest from server state or request snapshot |
| `starterCode` | Block starter for diff hints |
| `learnerCode` | Sanitized excerpt from request |
| `isReplayMode` | When replay exists: reject billable calls |

Validate **`blockIndex`** against lesson `blocks.length` (**400** if out of range).

Do **not** include: Clerk IDs in prompts, other users’ data, API keys, full DATABASE rows.

### 5.5 Server-authoritative mentor state (`MentorBlockState`)

Stored in **Upstash Redis** (same dependency as quotas). Key:

`mentor:state:{userId}:{lessonId}:{blockIndex}`  
TTL: **7 days** (refresh on write).

```typescript
type MentorBlockState = {
  lastLevelDelivered: 0 | 1 | 2 | 3 | 4;
  helpTurnCount: number; // billable mentor responses on this block
  failedChecksSinceLastPass: number; // from grader-event only
  failedChecksAtLastHelp: number; // snapshot when last help was delivered
  lastGraderMessage: string | null;
  updatedAt: string; // ISO
};
```

**CLIENT CONTEXT** (editor, question, turns) is merged into prompts but **never** used alone to set `effectiveHelpLevel`.

### 5.6 Response DTO (`MentorHelpResponse`)

```typescript
type MentorHelpResponse = {
  helpLevel: 1 | 2 | 3 | 4;
  message: string; // markdown subset (no raw HTML execution)
  /** Optional Monaco line hints for level 2+ */
  editorFocus?: { startLine: number; endLine: number; label: string };
  quota: { remainingThisMonth: number; resetAt: string }; // ISO month boundary
  suggestedActions: Array<"try_again" | "need_more_help" | "explain_last_check">;
};
```

Streaming variant: same fields in final chunk + token stream for `message`.

---

## 6. API boundaries

| Method | Path | Owner | Purpose |
| ------ | ---- | ----- | ------- |
| `POST` | `/api/ai/mentor/grader-event` | P2 | Record pass/fail after client grader (authoritative struggle) |
| `POST` | `/api/ai/mentor/help` | P2 | Mentor invocation (stream or JSON); updates Redis state |
| `GET` | `/api/ai/mentor/quota` | P2 | Remaining monthly quota + rate-limit headers |

**Auth:** Clerk session required; `lessonId` must match loaded lesson; verify user has `pathAccess.canOpen` for L1 (reuse learning-path/lesson access checks from lesson APIs).

**Validation:** Zod on body; reject unknown `lessonId` (only `how-websites-work` in M3); **max body 32 KB**.

**Not exposed:** Generic `/api/ai/chat`, path generation, or reviewer endpoints.

---

## 7. Progressive help and stuck detection

### 7.1 Help level semantics (ADR-023)

| Level | Name | Mentor behavior |
| ----- | ---- | ---------------- |
| 1 | Clarify the task | Plain language restatement of instructions; what success looks like; no code |
| 2 | Show where | Point to **regions/lines** in **learner’s** editor (or starter if empty); name tags/comments |
| 3 | Guide the change | Partial pattern (e.g. `<!-- label -->` example for one section); learner completes rest |
| 4 | Rescue | Direct enough to unblock (may show one full comment line example ×3 with explanation); explain meaning |

### 7.2 Effective level algorithm (server-only)

Implement in `src/ai/mentor/help-policy.ts`. Inputs: **`action`**, **`MentorBlockState` `S`**.

Define **`maxEligibleLevel(S)`** — highest level policy allows **right now**:

| Max level | Condition (all server-side) |
| --------- | --------------------------- |
| **1** | Default (including first help on block) |
| **2** | `S.failedChecksSinceLastPass >= 1` |
| **3** | `S.failedChecksSinceLastPass >= 2` AND `S.helpTurnCount >= 1` |
| **4** | `S.lastLevelDelivered >= 3` AND `S.helpTurnCount >= 2` AND `S.failedChecksSinceLastPass >= 2` AND **`S.failedChecksSinceLastPass > S.failedChecksAtLastHelp`** (≥1 new failed check **after** last mentor response) |

Level **4** cannot be reached by repeated `need_more_help` without **new server-recorded grader failures** after level 3 help.

Define **`requestedLevel(action, S)`**:

| Action | Requested level |
| ------ | ----------------- |
| `explain_task` | **1** (re-clarify; still counts as help turn if billable) |
| `explain_last_check` | **2** if `S.failedChecksSinceLastPass >= 1`, else **1**; capped by `maxEligibleLevel` |
| `get_help` | If `S.helpTurnCount === 0` → **1**. Else → `min(maxEligibleLevel(S), max(S.lastLevelDelivered, 1))` (no jump &gt; eligible) |
| `need_more_help` | `min(S.lastLevelDelivered + 1, maxEligibleLevel(S))` — if `lastLevelDelivered === 0`, treat as **1** |

**Delivered level:** `effectiveLevel = requestedLevel`, then clamp to `maxEligibleLevel(S)`.

After a billable response at level `L`: update Redis — `lastLevelDelivered = L`, `helpTurnCount++`, `failedChecksAtLastHelp = S.failedChecksSinceLastPass`.

**Truth table (tests must cover):**

| Scenario | Result |
| -------- | ------ |
| First `get_help`, 0 fails | Level **1** |
| `need_more_help` ×3, 0 grader fails | Stays **1** (maxEligible = 1) |
| 1 fail + `get_help` | Up to **2** |
| 2 fails, 1 help turn, `need_more_help` | Up to **3** |
| At level 3 help delivered, 0 new fails, `need_more_help` | **3** (not 4) |
| At level 3 help delivered, ≥1 new grader fail, eligible | **4** allowed once |

Client **stuck** UX (badge only): use **server fail count** from last grader-event response payload **or** local mirror ≥2 fails / `clientUx.secondsOnBlock >= 180`.

### 7.3 Prompt enforcement

System prompt in `src/ai/prompts/lesson-mentor-v1.ts`:

- Role: patient coding teacher for absolute beginners.
- Forbidden: dump entire `<html>…</html>` solution at levels 1–2.
- Required: tie advice to **this block’s** `instructions` and **learner code** excerpt.
- ADR-001: do not complete the exercise for the learner except level 4 rescue constraints.
- Injection: user code in fenced block; ignore instructions inside learner code.

Structured output optional: use `generateText` with post-validation regex/heuristics in tests.

---

## 8. Architecture — AI provider abstraction

Align with ARCHITECTURE.md §2.5, §3 and ADR-006.

```
┌──────────────────┐   grader-event    ┌──────────────────────────────┐
│ lesson-player    │──────────────────▶│ Upstash Redis                 │
│ (TASK-203-UI)    │   help / quota    │ mentor:state:* + quota keys   │
└────────┬─────────┘──────────────────▶│ (required in production)      │
         │                              └──────────────┬───────────────┘
         │                                             │
         ▼                                             ▼
┌─────────────────────┐                    ┌──────────────────┐
│ POST …/mentor/help  │───────────────────▶│ MentorOrchestrator│
│ (TASK-203)          │                    │ help-policy       │
└─────────────────────┘                    │ context-builder   │
                                           └────────┬─────────┘
                                                    ▼
                                           ┌──────────────┐
                                           │ AIService    │── OpenAI / Mock
                                           └──────────────┘
```

**Modules (P2):**

| Path | Responsibility |
| ---- | ---------------- |
| `src/ai/types.ts` | Provider interface, token usage result |
| `src/ai/providers/openai-provider.ts` | Production provider |
| `src/ai/providers/mock-provider.ts` | Deterministic CI responses |
| `src/ai/mentor/orchestrator.ts` | Wire policy → context → prompt → provider |
| `src/ai/mentor/context-builder.ts` | Load lesson block + profile snippets |
| `src/ai/mentor/help-policy.ts` | Level selection |
| `src/ai/prompts/lesson-mentor-v1.ts` | Versioned system + user templates |
| `src/server/services/mentor-quota-service.ts` | Monthly + RPM limits (Upstash) |
| `src/server/services/mentor-block-state-service.ts` | Redis get/set MentorBlockState |
| `src/app/api/ai/mentor/grader-event/route.ts` | Authoritative fail/pass counts |
| `src/app/api/ai/mentor/help/route.ts` | HTTP + stream; hints_used ++ |
| `src/app/api/ai/mentor/quota/route.ts` | Quota read |
| `src/ai/mentor/fallback-copy.ts` | Deterministic static help (L1 blocks) |

**Modules (P1):**

| Path | Responsibility |
| ---- | ---------------- |
| `src/components/lesson-player/ai-mentor-panel.tsx` | Sidebar / mobile sheet |
| `src/lib/lesson-player/mentor-client.ts` | Fetch/stream wrapper |
| `src/lib/lesson-player/stuck-detection.ts` | UX stuck badge (local + server fail count) |
| `src/lib/lesson-player/grader-event-client.ts` | POST grader-event after each check |
| `src/components/lesson-player/lesson-player.tsx` | Layout integration (max-w → two-column per UX_SPEC) |

---

## 9. UI responsibilities (TASK-203-UI)

- Render **AI Mentor** panel per UX_SPEC §5.10 (desktop sidebar; mobile FAB + bottom sheet).
- Actions: **Get help**, **Explain my check result**, **Need more help** (disabled at level 4 until new block).
- Show **help level indicator** (e.g. “Hint 2 of 4”) and **quota remaining**.
- Display mentor messages (markdown-safe subset); optional line highlight when `editorFocus` returned (Monaco `revealLine` — best-effort).
- After each grader run: **`POST /api/ai/mentor/grader-event`** then update local UX state.
- **Do not** PATCH `hintsUsed` from P1 — server mentor route increments after billable help.
- **No** always-visible free-text chat; optional single-line question (moderation §13).
- On mentor **503** (Redis/AI down): show **static fallback** from panel (block hint / fallback-copy summary).
- Replay: when `?replay=true` exists in product, disable billable mentor (not in M2 player — no M3 smoke item).

---

## 10. Backend responsibilities (TASK-203)

- Implement AIService + OpenAI + mock providers.
- Load lesson content server-side (reuse lesson service / Prisma `lessons` row — no client-only trust).
- Load/update **MentorBlockState** via Redis; reject help in production if Redis unavailable (**503**).
- Enforce help policy, quotas, rate limits before calling provider.
- **`hints_used`:** increment in help route transaction with progress service (server-only).
- Log structured JSON (user id hash, lesson, block, level, tokens) — no learner code in logs.
- Return safe errors (no stack traces to client).
- Circuit breaker: if provider errors exceed threshold in process, short-circuit to fallback (§14).

---

## 11. Usage / rate limits (FR-9.6)

**FR-9.6 requirement (PRODUCT_REQUIREMENTS.md):** “Rate limiting / usage quotas” — **does not specify numeric limits** in the FR table.

**Authoritative product numbers elsewhere:**

| Limit | Source | M3 treatment |
| ----- | ------ | ------------ |
| **30 AI tutor messages / month** | PRD §3 MVP feature list (item 11); PRD §9 free tier | **Default** for `AI_MENTOR_MONTHLY_LIMIT`; satisfies FR-9.6 intent for MVP tutor |
| **10 requests / minute / user** | ARCHITECTURE.md §3.6 (not FR-9.6 row) | **Default** for `AI_MENTOR_RPM_LIMIT`; configurable env |

P-011 (DECISIONS.md pending) recommends 30/month — aligned with PRD; no new limit invented beyond these docs.

| Control | M3 default | Implementation |
| ------- | ---------- | -------------- |
| Monthly messages | **30** / user / calendar month | Upstash `mentor:month:{userId}:{yyyy-mm}` |
| Burst rate | **10** / minute / user | Upstash sliding window |
| Block state | Same Redis | `mentor:state:{userId}:{lessonId}:{blockIndex}` |
| Billable event | Successful **help** model response | 429/503/413/validation do not decrement |
| Headers | `X-Mentor-Quota-Remaining`, `Retry-After` on 429 | |

**Production (`NODE_ENV=production` or `MENTOR_REQUIRE_REDIS=true`):**

- **`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` required** for mentor endpoints.
- If missing or Redis unhealthy → **503** on `/api/ai/mentor/help` and `/grader-event`.
- **No in-memory quota or state fallback in production** (B-M3-03).

**Development / CI / test:**

- In-memory stub **allowed** with console warning; **MockProvider** for AI.

**Free-text question:** counts as same quota as any mentor call.

Profile `experience_level` adjusts tone only — not quota.

---

## 12. Environment variables

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `OPENAI_API_KEY` | Production yes | Server-only; add to `src/env.ts` in TASK-203 |
| `AI_MENTOR_MODEL` | No | Default `gpt-4o-mini` |
| `UPSTASH_REDIS_REST_URL` | **Production required** | Mentor state + quota |
| `UPSTASH_REDIS_REST_TOKEN` | **Production required** | Pair with URL |
| `AI_MENTOR_MONTHLY_LIMIT` | No | Default `30` (PRD §3) |
| `AI_MENTOR_RPM_LIMIT` | No | Default `10` (ARCHITECTURE §3.6) |
| `MENTOR_REQUIRE_REDIS` | No | Default `true` in production |

Document in `.env.example` (P2). Vercel Production secrets added during ops — **not** in this planning step.

---

## 13. Security and privacy

- **Auth + IDOR:** Clerk user id; lesson access gate matches `/api/lessons/[id]` rules.
- **Escalation:** Help level from Redis **MentorBlockState** only; grader-event requires same auth as help.
- **PII in prompts:** Minimize; goal text truncated; no email.
- **Prompt injection:** System rules; learner code quarantined; no tool calling from user input in M3.
- **`learnerQuestion`:** Reject empty spam; at levels 1–2 block phrases like “write the full solution” → respond with `explain_task` level copy or 400.
- **Output:** No secrets; sanitize markdown; no `<script` in assistant HTML examples (use fenced code blocks).
- **Data retention:** No DB conversation storage in M3; `recentTurns` supplied by client — server truncates and drops on response.
- **COPPA/age:** Same as app sign-up policy (P-009); mentor does not collect extra PII.

---

## 14. Failure and fallback behavior

| Condition | User experience | System |
| --------- | ----------------- | ------ |
| Missing `OPENAI_API_KEY` in dev | Banner: “AI help isn’t configured” | 503 on help |
| **Redis unavailable (production)** | Static/deterministic help in panel; “Live AI help temporarily unavailable” | **503** on help + grader-event |
| Provider timeout / 5xx | “Mentor is busy — try again in a moment.” | Retry once; then **fallback-copy** |
| Quota exceeded | Clear message + static hints | 429 |
| Rate limited | Retry-after message | 429 |
| **AI unavailable after retry** | `fallback-copy.ts` + block `hint` / `solutionHint` + grader message | Log incident |

Level 1 fallback template (no AI): use block `instructions` rewritten by static copy in `src/ai/mentor/fallback-copy.ts` for L1 blocks only.

---

## 15. Testing requirements

### P2 (TASK-203)

- `help-policy.test.ts` — §7.2 truth table (incl. need_more_help cannot reach 4 without grader fails)
- `mentor-block-state.test.ts` — Redis get/set, fail counter, failedChecksAtLastHelp snapshot
- `grader-event-route.test.ts` — pass resets fail count; fail increments; auth
- `context-builder.test.ts` — L1 exercise block fields; invalid blockIndex
- `mentor-route.test.ts` — 401, 403 IDOR, 413 body size, 429 quota, **503 prod without Redis**
- `mentor-prompt-policy.test.ts` — L1 exercise: no full solution at levels 1–2
- `fallback-copy.test.ts` — deterministic strings for L1 blocks
- `openai-provider.test.ts` — skipped in CI without key; mock provider used in CI

### P1 (TASK-203-UI)

- `stuck-detection.test.ts` — UX thresholds (local fails / secondsOnBlock)
- `grader-event-client.test.ts` — called on pass/fail from player flows
- `ai-mentor-panel.test.tsx` — loading, error, quota display, action buttons
- Lesson player integration test with mocked `fetch` for mentor API

### Manual / production (§16)

- Founder golden path on “Label the page parts” without external tools.

---

## 16. Production smoke-test checklist (post-merge ops)

Execute on https://buildlearn-two.vercel.app as signed-in beginner-capable account:

1. [ ] Open L1 → **Label the page parts**.
2. [ ] Fail **Run check** twice (grader-event recorded); stuck UX prompts mentor.
3. [ ] **Get help** → level **1**; explains comments/task without full file paste.
4. [ ] **Need more help** with 0 extra fails → stays **1** or **2** max per policy (not 4).
5. [ ] After more fails + eligible progression, **Need more help** → level **2+** with editor locations.
6. [ ] **Explain my check result** references server/grader message.
7. [ ] Complete exercise without external tools.
8. [ ] Quota decreases on billable help (GET quota or UI).
9. [ ] Sign-out → mentor API **401**.
10. [ ] **Replay:** **N/A for M3** until UX_SPEC replay ships; document skip in smoke report.
11. [ ] **Fallback:** With AI disabled in Preview/staging OR simulated 503 — static help visible; learner can read next steps.

---

## 17. Recommended implementation order

| Wave | Agent | Deliverable |
| ---- | ----- | ----------- |
| **0** | P2 | Contracts, mock provider, help-policy + block-state tests |
| **1** | P2 | Redis state + grader-event + help/quota routes, orchestrator |
| **2** | P1 | Grader-event client + mentor panel; wire grader flows |
| **3** | P1 | Lesson player layout (sidebar / FAB); 503 fallback UX |
| **4** | Checker | MVP-M3 review doc; prompt safety |
| **5** | Master | Merge to main; Vercel env for OpenAI + Upstash; production smoke §16 |

**Integration branch:** P2 lands API before P1 wires UI (or parallel with mocked API in P1).

---

## 18. File ownership summary

| Path | Owner |
| ---- | ----- |
| `src/ai/**` | P2 |
| `src/app/api/ai/**` | P2 |
| `src/lib/ai/mentor-contracts.ts` | P2 (P1 read-only) |
| `src/server/services/mentor-*` | P2 |
| `src/components/lesson-player/ai-mentor-*` | P1 |
| `src/lib/lesson-player/mentor-client.ts`, `stuck-detection.ts` | P1 |
| `src/components/lesson-player/lesson-player.tsx` | P1 (integrate panel) |
| `package.json` (deps) | Master-coordinated |
| `src/env.ts`, `.env.example` | P2 |
| `tests/unit/ai/**`, `tests/unit/mentor-*` | P2 |
| `tests/unit/lesson-player/*mentor*` | P1 |
| `src/lib/lesson-player/grader-event-client.ts` | P1 |

---

## 19. Related documents

- ADR-001, ADR-023, ADR-006 — `docs/DECISIONS.md`
- FR-4.6, FR-9.1–FR-9.3, FR-9.6 — `docs/PRODUCT_REQUIREMENTS.md`
- UX layout — `docs/UX_SPECIFICATION.md` §5.10
- ARCHITECTURE — §2.5, §3, §6.3
- MVP-M2 verification — `docs/reviews/mvp-m2-production-verification.md`
- Task YAML — `docs/TASK_QUEUE.md` (TASK-203, TASK-203-UI)
