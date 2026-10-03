# MVP-M3 — Context-Aware AI Mentor (TASK-203)

> **Status:** Planning (Master-defined)  
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
| **Context** | Full mentor context payload (§5) assembled server-side from client signals + lesson content |
| **Provider** | OpenAI via Vercel AI SDK; mock provider for CI |
| **Quotas** | FR-9.6 / ARCHITECTURE.md §3.6 — **30 mentor messages / user / calendar month**, **10 requests / user / minute** |
| **Persistence** | Increment existing `lesson_progress.hints_used` on each billable mentor response; no new conversation tables for M3 |
| **Replay** | Mentor disabled or read-only canned copy when `?replay=true` (no quota burn, no progress writes) |

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
5. **Quota:** 31st message in a month returns **429** with user-visible remaining quota on prior calls; rate limit returns **429** with retry guidance.
6. **Auth:** User cannot invoke mentor for another user’s lesson context (IDOR tests).
7. **Fallback:** If AI unavailable, UI shows static block hints + grader message + friendly degradation (§14).
8. **Hints accounting:** `hints_used` increments on server after successful mentor response (synced via existing PATCH progress or server-side update in mentor route).
9. **Tests:** CI green — mocked provider policy tests, API auth/quota tests, P1 component tests for panel states.
10. **Production smoke:** §16 checklist passed on Vercel production after merge (separate ops step — not part of this planning commit).

---

## 5. Mentor context payload

### 5.1 Design goals

- **Server is source of truth** for lesson content and effective help level.
- **Client supplies ephemeral signals** (editor code, grader output, attempt counters).
- **Minimal tokens:** cap editor excerpt (~8 KB), truncate instructions, no full roadmap/profile beyond experience level.

### 5.2 Request DTO (`MentorHelpRequest`)

Shared Zod schema in `src/lib/ai/mentor-contracts.ts` (P2 defines; P1 imports types only).

```typescript
// Conceptual shape — implement with Zod in TASK-203
type MentorHelpRequest = {
  /** Fixed for M3 */
  lessonId: "how-websites-work";
  blockIndex: number;
  /** Client action — not free-form chat in M3 */
  action:
    | "get_help"           // next help per policy
    | "explain_task"       // force level-1 framing
    | "explain_last_check" // interpret graderFeedback
    | "need_more_help";    // user-initiated +1 level ( capped at 4 )
  /** Current editor buffer for interact/exercise; omit for quiz */
  learnerCode?: string;
  /** Last client grader result from html-lesson-graders */
  lastGraderResult?: { passed: boolean; message: string };
  /** Client session signals (server validates ranges) */
  signals: {
    failedChecksSinceLastPass: number;
    secondsOnBlock: number;
    mentorTurnsOnBlock: number;
    lastHelpLevelDelivered: 0 | 1 | 2 | 3 | 4;
  };
  /** Optional short learner question (max 280 chars), must pass moderation */
  learnerQuestion?: string;
  /** Last N turns (max 6) for continuity — roles user|assistant only */
  recentTurns?: Array<{ role: "user" | "assistant"; content: string }>;
};
```

### 5.3 Server-enriched context (`MentorContext`)

Built in `src/ai/mentor/context-builder.ts`:

| Field | Source |
| ----- | ------ |
| `lessonTitle`, `estimatedMinutes` | DB / lesson payload |
| `block` | Parsed block at `blockIndex` (type, title, instructions, starterCode, static hint fields) |
| `objectives` | L1 objective block(s) summary |
| `learningObjective` | First objective block bullets (plain text) |
| `experienceLevel` | `profiles.experience_level` (optional; default beginner tone) |
| `learningGoalText` | Truncated profile goal for examples (optional, ≤120 chars) |
| `effectiveHelpLevel` | Computed by help policy (§7) — **not** trusted from client alone |
| `graderMessage` | From request or default “not yet submitted” |
| `starterCode` | Block starter for diff hints |
| `learnerCode` | Sanitized excerpt from request |
| `isReplayMode` | From query or header — reject billable calls |

Do **not** include: Clerk IDs in prompts, other users’ data, API keys, full DATABASE rows.

### 5.4 Response DTO (`MentorHelpResponse`)

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
| `POST` | `/api/ai/mentor/help` | P2 | Primary mentor invocation (stream or JSON) |
| `GET` | `/api/ai/mentor/quota` | P2 | Remaining monthly quota + rate-limit headers |

**Auth:** Clerk session required; `lessonId` must match loaded lesson; verify user has `pathAccess.canOpen` for L1 (reuse learning-path/lesson access checks from lesson APIs).

**Validation:** Zod on body; reject unknown `lessonId` (only `how-websites-work` in M3).

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

### 7.2 Effective level algorithm (server)

Inputs: `signals.failedChecksSinceLastPass`, `signals.secondsOnBlock`, `signals.mentorTurnsOnBlock`, `action`, `lastHelpLevelDelivered`.

Baseline rules (implement in `src/ai/mentor/help-policy.ts`):

- **`explain_task`** → deliver level **1** (even if prior level higher).
- **`get_help`** → `min(4, max(1, autoLevel))` where  
  `autoLevel = 1 + floor(failedChecks / 2) + (mentorTurnsOnBlock > 0 ? 0 : 0)`  
  plus: if `failedChecks >= 4` or `secondsOnBlock >= 600` → at least **3**; if `failedChecks >= 6` or `mentorTurnsOnBlock >= 3` → at least **4**.
- **`need_more_help`** → `min(4, lastHelpLevelDelivered + 1)`.
- **`explain_last_check`** → level **1–2** tone; must reference `graderMessage` verbatim concepts; no full solution unless already at level 4 session.

Client **stuck** flag (UI badge): `failedChecksSinceLastPass >= 2` OR `secondsOnBlock >= 180` — prompts user to open mentor.

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
┌──────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│ lesson-player    │────▶│ POST /api/ai/mentor │────▶│ MentorOrchestrator│
│ (TASK-203-UI)    │     │ (TASK-203)          │     │ help-policy       │
└──────────────────┘     └─────────────────────┘     │ context-builder   │
                                                      │ prompt assembly   │
                                                      └────────┬─────────┘
                                                               │
                      ┌────────────────────────────────────────┼────────────────────────┐
                      ▼                                        ▼                        ▼
               ┌─────────────┐                          ┌──────────────┐         ┌──────────────┐
               │ AIService   │                          │ QuotaLimiter │         │ MockProvider │
               │ interface   │                          │ (Upstash)    │         │ (CI/tests)   │
               └──────┬──────┘                          └──────────────┘         └──────────────┘
                      │
               ┌──────▼──────┐
               │ OpenAIProvider │  Vercel AI SDK @ai-sdk/openai
               └─────────────┘
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
| `src/server/services/mentor-quota-service.ts` | Monthly + RPM limits |
| `src/app/api/ai/mentor/help/route.ts` | HTTP + stream |
| `src/app/api/ai/mentor/quota/route.ts` | Quota read |

**Modules (P1):**

| Path | Responsibility |
| ---- | ---------------- |
| `src/components/lesson-player/ai-mentor-panel.tsx` | Sidebar / mobile sheet |
| `src/lib/lesson-player/mentor-client.ts` | Fetch/stream wrapper |
| `src/lib/lesson-player/stuck-detection.ts` | Pure functions for signals |
| `src/components/lesson-player/lesson-player.tsx` | Layout integration (max-w → two-column per UX_SPEC) |

---

## 9. UI responsibilities (TASK-203-UI)

- Render **AI Mentor** panel per UX_SPEC §5.10 (desktop sidebar; mobile FAB + bottom sheet).
- Actions: **Get help**, **Explain my check result**, **Need more help** (disabled at level 4 until new block).
- Show **help level indicator** (e.g. “Hint 2 of 4”) and **quota remaining**.
- Display mentor messages (markdown-safe subset); optional line highlight when `editorFocus` returned (Monaco `revealLine` — best-effort).
- Track per-block session state in React (ref + state): failed checks increment on failed grader; reset on block change or pass.
- Call `patchLessonProgress` with updated `hintsUsed` when API returns success (or rely on server PATCH in mentor route — pick one pattern in implementation; server increment preferred for integrity).
- **No** always-visible free-text chat; optional single-line question field attached to `get_help`.
- Replay mode: hide mentor or show “Review mode — AI help disabled.”

---

## 10. Backend responsibilities (TASK-203)

- Implement AIService + OpenAI + mock providers.
- Load lesson content server-side (reuse lesson service / Prisma `lessons` row — no client-only trust).
- Enforce help policy, quotas, rate limits before calling provider.
- Log structured JSON (user id hash, lesson, block, level, tokens) — no learner code in logs.
- Return safe errors (no stack traces to client).
- Circuit breaker: if provider errors exceed threshold in process, short-circuit to fallback (§14).

---

## 11. Usage / rate limits (FR-9.6)

| Control | M3 value | Implementation |
| ------- | -------- | ---------------- |
| Monthly messages | **30** / user | Upstash key `mentor:month:{userId}:{yyyy-mm}` INCR with TTL |
| Burst rate | **10** / minute / user | Upstash sliding window |
| Billable event | Successful model response | Failed validation / 429 does not decrement |
| Response headers | `X-Mentor-Quota-Remaining`, `Retry-After` on 429 | |

**Free-text question:** counts as same quota as any mentor call.

**Dev:** if Upstash env missing, use in-memory limiter with loud `console.warn` (CI uses mock + in-memory).

Profile `experience_level` adjusts tone only — not quota.

---

## 12. Environment variables

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `OPENAI_API_KEY` | Production yes | Server-only; add to `src/env.ts` in TASK-203 |
| `AI_MENTOR_MODEL` | No | Default `gpt-4o-mini` |
| `UPSTASH_REDIS_REST_URL` | Prod recommended | Rate + monthly quota |
| `UPSTASH_REDIS_REST_TOKEN` | Prod recommended | Pair with URL |
| `AI_MENTOR_MONTHLY_LIMIT` | No | Default `30` |
| `AI_MENTOR_RPM_LIMIT` | No | Default `10` |

Document in `.env.example` (P2). Vercel Production secrets added during ops — **not** in this planning step.

---

## 13. Security and privacy

- **Auth + IDOR:** Clerk user id; lesson access gate matches `/api/lessons/[id]` rules.
- **PII in prompts:** Minimize; goal text truncated; no email.
- **Prompt injection:** System rules; learner code quarantined; no tool calling from user input in M3.
- **Output:** No secrets; sanitize markdown; no `<script` in assistant HTML examples (use fenced code blocks).
- **Data retention:** No DB conversation storage in M3; `recentTurns` supplied by client — server truncates and drops on response.
- **COPPA/age:** Same as app sign-up policy (P-009); mentor does not collect extra PII.

---

## 14. Failure and fallback behavior

| Condition | User experience | System |
| --------- | ----------------- | ------ |
| Missing `OPENAI_API_KEY` in dev | Banner: “AI help isn’t configured” | 503 on API |
| Provider timeout / 5xx | “Mentor is busy — try again in a moment.” | Retry once; then fallback |
| Quota exceeded | Clear message + static hints | 429 |
| Rate limited | Retry-after message | 429 |
| **AI unavailable after retry** | Show block static `hint` / `solutionHint` + last grader message + link to re-read `explain` blocks | Log incident |

Level 1 fallback template (no AI): use block `instructions` rewritten by static copy in `src/ai/mentor/fallback-copy.ts` for L1 blocks only.

---

## 15. Testing requirements

### P2 (TASK-203)

- `help-policy.test.ts` — escalation table cases
- `context-builder.test.ts` — L1 exercise block fields present
- `mentor-route.test.ts` — 401 unauthenticated, 403 wrong lesson/wrong user, 429 quota
- `mentor-prompt-policy.test.ts` — mock provider responses checked for forbidden full-solution patterns at levels 1–2
- `openai-provider.test.ts` — skipped in CI without key; mock provider used in CI

### P1 (TASK-203-UI)

- `stuck-detection.test.ts` — signal thresholds
- `ai-mentor-panel.test.tsx` — loading, error, quota display, action buttons
- Lesson player integration test with mocked `fetch` for mentor API

### Manual / production (§16)

- Founder golden path on “Label the page parts” without external tools.

---

## 16. Production smoke-test checklist (post-merge ops)

Execute on https://buildlearn-two.vercel.app as signed-in beginner-capable account:

1. [ ] Open L1 → navigate to **Label the page parts**.
2. [ ] Fail check twice; mentor suggests opening help (stuck UX).
3. [ ] **Get help** returns on-topic level 1 — no full solution paste.
4. [ ] **Need more help** escalates; level 2 references editor locations.
5. [ ] **Explain my check result** references grader message text.
6. [ ] Complete exercise without leaving BuildLearn.
7. [ ] Quota decreases (inspect via GET quota or UI counter).
8. [ ] Sign-out → mentor API returns 401.
9. [ ] Replay mode (if enabled on completed lesson) does not burn quota / mutate progress.
10. [ ] With invalid API key simulation in preview only — fallback static hint visible (optional staging test).

---

## 17. Recommended implementation order

| Wave | Agent | Deliverable |
| ---- | ----- | ----------- |
| **0** | P2 | `mentor-contracts.ts`, env schema stubs, mock provider, help-policy tests |
| **1** | P2 | Context builder, orchestrator, `/api/ai/mentor/*`, quota service |
| **2** | P1 | Mentor panel + client; wire signals from existing grader flows |
| **3** | P1 | Lesson player layout (sidebar / FAB); `hintsUsed` sync |
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

---

## 19. Related documents

- ADR-001, ADR-023, ADR-006 — `docs/DECISIONS.md`
- FR-4.6, FR-9.1–FR-9.3, FR-9.6 — `docs/PRODUCT_REQUIREMENTS.md`
- UX layout — `docs/UX_SPECIFICATION.md` §5.10
- ARCHITECTURE — §2.5, §3, §6.3
- MVP-M2 verification — `docs/reviews/mvp-m2-production-verification.md`
- Task YAML — `docs/TASK_QUEUE.md` (TASK-203, TASK-203-UI)
