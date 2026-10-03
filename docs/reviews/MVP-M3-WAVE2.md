# Checker Review — MVP-M3 TASK-203 Wave 2 (TASK-203-UI Mentor Panel)

**Verdict:** CHANGES REQUIRED  
**Date:** 2026-10-03  
**Reviewer:** Checker Agent (independent)  
**Branch:** `feature/MVP-M3-lesson-1-mentor`  
**Wave 2 reviewed:** `f657068` — `feat(MVP-M3): TASK-203-UI Wave 2 lesson mentor panel`  
**Wave 1 baseline (approved for P1):** `7c8aaf3` (delta on `efcf455` blocker fixes)  
**Planning baseline:** `main` @ `441e1a1`  
**Authoritative plan:** `docs/plans/MVP-M3-TASK-203-ai-mentor.md`  

**Governing:** ADR-001 (teacher-not-builder), ADR-023 (progressive beginner teaching), approved TASK-203 plan, existing UX/product requirements.

**Scope:** Independent Wave 2 UI review only. No code fixes, merge, or production infrastructure changes performed by this review.

---

## Executive summary

Wave 2 wires a structured BuildLearn help panel into Lesson 1 (`how-websites-work`): desktop sidebar + mobile FAB/sheet, grader-event sync on check actions, UX-only stuck prompts, Monaco line reveal from server `editorFocus`, and client tests for panel actions, grader-event shape, mentor HTTP headers, and stuck detection.

The implementation is directionally aligned with the approved plan (no generic chat, no client help levels, no client `passed` on grader-event, best-effort grader sync, AI vs fallback labelling via `X-Mentor-Response-Source`).

**Two blockers** prevent approval for founder smoke or merge:

1. **Mentor panel content is not scoped to the current block** — navigating blocks (Back/Continue) resets lesson-player counters but **does not clear** in-panel help text; in-flight help can land on the wrong block.
2. **Grader-event async responses are not block-guarded** — a late `/grader-event` response can update `serverFailCount` after the learner has moved to another block, skewing stuck presentation.

Fix blockers on the same feature branch; re-submit for Checker re-review. Automated tests are green but do not cover these race paths.

---

## Independent validation (`f657068`)

| Check | Checker result |
| ----- | -------------- |
| `pnpm test` (full) | **Pass (279/279)** |
| `pnpm test tests/unit/lesson-player` | **Pass (19/19 in 7 files)** |
| `pnpm typecheck` | **Pass** |
| `pnpm lint` | **Pass** |
| `pnpm build` | **Pass** |

---

## 1. Primary acceptance — beginner without external help

**Question:** Could a genuine beginner complete “Label the page parts” using only BuildLearn help (founder smoke benchmark)?

| Criterion | Assessment |
| --------- | ---------- |
| Plain-language entry | **Partial** — panel intro and action labels avoid AI jargon; primary CTA “Get help with this step” is clear. |
| What is an HTML comment? | **Depends on backend** — UI can display server message + `editorFocus` label; Wave 2 does not embed lesson-specific copy. |
| Where to type / “above `<html>`” | **Mechanism present** — `editorFocus` drives Monaco `revealLine` + inline “around line N” copy; quality depends on AI/fallback content, not proven in UI tests. |
| What to try next | **Partial** — `suggestedActions` exposes `need_more_help` and static “Try a small change…” when `try_again` is suggested; hierarchy is reasonable (one primary + two outlines + conditional fourth). |
| Blockers to trust | **Fail** — stale help from a prior block or wrong-block line focus undermines the teaching flow exactly when beginners use Back/Continue or slow networks. |

**Conclusion:** Wave 2 provides the **shell** for the founder golden path but **does not prove** the learner can succeed without ChatGPT. That requires live AI/fallback quality **and** block-safe UI state. Stale-panel bugs are disqualifying for the primary acceptance bar until fixed.

---

## 2. UI placement / complexity

| Check | Result |
| ----- | ------ |
| Integrated vs bolt-on chatbot | **Pass (intent)** — titled “BuildLearn help”, structured actions, teacher framing in intro. |
| Exercise visually primary | **Pass** — main column `flex-1 min-w-0`; mentor in sidebar or sheet overlay. |
| Editor usable width | **Pass with caveat** — `max-w-6xl` row: main column ≈ 912px − 288px sidebar − gaps ≈ **~600px** content at 1024px viewport; acceptable for beginner HTML at `lg+`. Below `lg`, full width until sheet open. |
| Beginner overwhelm | **Mostly pass** — no chat box; 3–4 buttons max; stuck banner is gentle. |
| Help trigger obvious | **Pass mobile** (FAB “Get help”); **Pass desktop** (persistent sidebar on graded/explain blocks). |
| Mobile sheet vs controls | **Pass** — sheet `max-h-[75vh]`, FAB `bottom-20` leaves footer room; backdrop dismisses. |
| Desktop sticky | **Pass** — `lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]`. |

**Note:** Mentor appears on `explain` blocks as well as interact/exercise/quiz — wider than exercise-only; acceptable for L1 scaffolding, slightly increases visual noise on read-only steps.

---

## 3. Help actions

| Action exposed | **Yes** — `get_help`, `explain_task`, `explain_last_check` (if last grader message), `need_more_help` (only if prior response `suggestedActions` includes it). |
| Generic chat | **Absent** |
| Client help level | **Absent** |
| Client authoritative counters | **Absent** on grader-event; help uses server `quota` in response |
| Client authoritative pass/fail | **Absent** on grader-event; `lastGraderResult.passed` on help request is UX snapshot only (Wave 1 approved pattern) |

**Hierarchy:** Primary `get_help` (default variant), secondary outlines, `explain_last_check` gated on failed/passed check feedback, `need_more_help` deferred until server suggests it — **good** for avoiding four synonymous “help” buttons up front.

**Gap:** `helpTurnsOnBlock` is hard-coded `0` in `shouldShowStuckHelpPrompt` call — stuck banner ignores prior help turns (presentation only; server still authoritative).

---

## 4. Grader-event integration

| Path | Sends `POST /api/ai/mentor/grader-event` |
| ---- | ---------------------------------------- |
| Interact check | **Yes** — `{ learnerCode }` |
| Exercise check | **Yes** — `{ learnerCode }` |
| Quiz check | **Yes** — `{ selectedOptionId }` when option selected |
| Quiz with no selection | **No** — local feedback only (correct) |

| Trust rule | Result |
| ---------- | ------ |
| No client `passed` in body | **Pass** — `grader-event-client.test.ts` |
| Local grader immediate | **Pass** — sync is fire-and-forget |
| Network failure does not break lesson | **Pass** — `.catch()` swallow |
| Duplicate events per click | **Low risk** — one sync per explicit check click |
| Block association on late response | **Fail** — see B-W2-02 |

---

## 5. Stuck detection

| Rule | Result |
| ---- | ------ |
| Presentation only | **Pass** — `stuck-detection.ts` documents UX-only; no help level selection |
| Does not unlock `need_more_help` | **Pass** — only server `suggestedActions` |
| Slow readers | **Pass** — requires ≥2 local or server fails, or ≥180s on block |
| 180s timing | **Weak** — `secondsOnBlock` computed once per render; timer does not tick unless re-render (fail/check/navigation). Unlikely to false-positive slow readers; 180s prompt may rarely appear without fails |

Duplicate stuck messaging: inline banner in main column **and** panel prompt when `showStuckPrompt && !message` — slightly redundant, non-blocking.

---

## 6. Golden path — “Label the page parts”

**File:** `tests/unit/lesson-player/label-page-parts-golden-path.test.ts`

**What it actually proves:**

- Exercise block index 3 in L1 fixture.
- Local grader fails twice on empty-ish HTML.
- `shouldShowStuckHelpPrompt` true at 2 local fails.
- **Mocked** `postMentorHelp` returns comment/line copy.
- Local grader passes on fixture “passCode”.

**What it does NOT prove:**

- `LessonPlayer` mount, button clicks, or panel rendering.
- Real API, fallback copy, or `editorFocus` → Monaco integration.
- Founder questions A–F in the **real** UI reading order.
- Block navigation with mentor state.

**Conclusion:** Golden path test is a **wiring sketch**, not golden-path UI proof. Acceptable as a unit stub; **not** a substitute for founder smoke.

---

## 7. Monaco line focus

| Check | Result |
| ----- | ------ |
| Structured `editorFocus.startLine` | **Pass** — no parsing of AI prose |
| Server validation | **Partial** — Zod `min(1)` only; no max vs document length |
| Invalid line handling | **Gap** — client calls `revealLineInCenter` / `setPosition` without clamping; Monaco usually tolerates, but accessibility focus on empty doc could confuse |
| Modifies learner code | **Pass** — reveal/focus only |
| Wrong block editor | **Fail** — late help callback can call `onEditorFocus` after `blockIndex` changed (B-W2-01) |
| `revealLine` reset on block change | **Pass** — parent sets `editorRevealLine` null in block `useEffect` |

---

## 8. AI vs fallback UX

| Source | UI label |
| ------ | -------- |
| `ai` | “BuildLearn help” |
| `fallback` | “Step-by-step guide (offline help)” |

| Check | Result |
| ----- | ------ |
| Fallback never claims AI | **Pass** |
| “Offline help” accuracy | **Misleading (non-blocking R-W2-01)** — learner may be online while provider/Redis is down; prefer product language e.g. “Step-by-step guide (built-in)” |
| Infrastructure leakage | **Pass** — no OpenAI/Redis/HTTP codes in learner copy |

---

## 9. Quota UX

| Behaviour | Result |
| --------- | ------ |
| Always-visible counter | **Present** — “Help requests left this month: N” whenever quota fetch succeeds |
| ADR-023 simplicity | **Concern (R-W2-02)** — continuous counter may discourage help-seeking; plan §9 also mentioned level indicator (not implemented). Prefer show-when-low/exhausted or de-emphasized styling |
| 429 exhausted | **Pass** — `quota_exhausted` → `mentorQuotaExhaustedCopy()` points to page hints |
| RPM 429 | **Pass** — distinct copy with optional retry seconds |
| 503 | **Partial** — status only, no inline fallback body (see §10) |
| Network error | **Pass** — `mentorNetworkErrorCopy()` |

---

## 10. Fallback / 503 semantics

| Scenario | UI behaviour |
| -------- | ------------- |
| HTTP 200 + `X-Mentor-Response-Source: fallback` | Full message body + fallback label — **correct** |
| HTTP 503 on `/help` | `setMessage(null)`, `mentorUnavailableCopy()` status — **no** deterministic fallback paragraph in panel |

Plan §9: “On mentor **503** … show **static fallback** from panel.” Current copy directs learner to “hint on this page” (`mentorUnavailableCopy`) which is **graceful but thinner** than panel static fallback. Does not pretend a server mentor body occurred — **pass** on honesty, **gap** vs plan depth.

When Redis is down, grader-event also 503 — local grader and page hints still work; **server fail count may stay 0**, so stuck prompt relies more on **local** fail count — acceptable degradation.

---

## 11. Duplicate / race protection

| Check | Result |
| ----- | ------ |
| Help disabled while loading | **Pass** — `loadingAction` gates all buttons |
| Double-click duplicate billable calls | **Pass** — second click no-ops while loading |
| Block change during in-flight help | **Fail** — B-W2-01 |
| Stale grader-event | **Fail** — B-W2-02 |
| Quota fetch on block change | **Low risk** — may complete for prior block but only updates quota display |
| Unmount | **Not explicitly aborted** — low severity if block guards added |

**No automated tests** for block-change stale response or grader race.

---

## 12. MVP-M2 regression

| Area | Result |
| ---- | ------ |
| Objective / explain / interact / exercise / quiz / bridge | **No intentional regression observed** |
| Monaco / preview / Check My Work | **Unchanged core paths** |
| Pass invalidation on edit | **Unchanged** (`pass-state` tests still pass) |
| Progress / Back / Continue / completion / roadmap | **Unchanged**; mentor layout additive |
| Known M2 edge: Back → Continue resets editor without onChange while pass state persists | **Not worsened by mentor**; still present |

---

## 13. Accessibility

| Check | Result |
| ----- | ------ |
| Keyboard open/close mobile help | **Partial** — FAB and Close button keyboard activatable; **no Escape** to dismiss sheet |
| Focus trap in sheet | **Absent** |
| Focus return after close | **Not implemented** |
| Live regions | **Present** — quota `aria-live="polite"`, status `role="status"` |
| FAB semantics | **Partial** — `aria-haspopup="dialog"` but sheet is not `role="dialog"` |
| Desktop reading order | **Pass** — main article then aside in DOM |
| Loading copy | **Pass** — “Finding the best way to explain…” |

Non-blocking a11y improvements recommended (R-W2-03).

---

## 14. Responsive review

Checker did not run browser matrix; inferred from Tailwind:

| Width | Assessment |
| ----- | ---------- |
| `< lg` | Full-width lesson; mentor via FAB + 75vh sheet |
| `lg` (~1024) | ~600px main column — Monaco 300px height, workable |
| `xl+` | More main column space — comfortable |

**Risk:** At minimum `lg` width with sidebar open, preview + editor stack vertically in main column — still usable for L1 HTML snippets.

---

## 15. Test quality (Wave 2 files)

| File | Coverage value |
| ---- | ---------------- |
| `stuck-detection.test.ts` | Policy thresholds |
| `grader-event-client.test.ts` | No `passed` in POST body |
| `mentor-client.test.ts` | Fallback header, quota_exhausted error |
| `ai-mentor-panel.test.tsx` | Static HTML: actions present, non-L1 hidden |
| `label-page-parts-golden-path.test.ts` | Mocked help + local grader only |

**Gaps (meaningful):**

- Block index change clears panel message
- In-flight help ignored after navigation
- Grader-event callback block guard
- Duplicate help request / loading gate (behaviour untested)
- 503 / network error UI render
- `LessonPlayer` integration / Monaco revealLine
- Race tests

---

## Blockers (must fix before re-review)

### B-W2-01 — Stale mentor panel state across blocks and in-flight help

| Field | Detail |
| ----- | ------ |
| **Severity** | **Blocker** |
| **Components** | `src/components/lesson-player/ai-mentor-panel.tsx`, `lesson-player.tsx` |
| **Issue** | `message`, `statusText`, and `loadingAction` live in panel state. Parent `useEffect` on `blockIndex` resets fail counts and closes mobile sheet but **does not reset panel content**. Completing a step and continuing shows prior step’s help. In-flight `postMentorHelp` resolves with `blockIndex` from request time but UI is already on a new block — wrong text, `need_more_help`, and `onEditorFocus` apply to wrong context. |
| **Learner impact** | Beginner follows instructions for the **wrong exercise** or jumps cursor on wrong starter code — directly contradicts ADR-023 and founder smoke benchmark. |
| **Required correction** | Reset panel display state on `blockIndex` change (key remount or explicit clear). Ignore or discard help responses when `blockIndex` / request epoch no longer matches active block. Same guard before `onEditorFocus`. |

### B-W2-02 — Unguarded grader-event async updates

| Field | Detail |
| ----- | ------ |
| **Severity** | **Blocker** |
| **Components** | `src/components/lesson-player/lesson-player.tsx` (`syncServerGraderEvent`) |
| **Issue** | `syncMentorGraderEvent` callback always calls `setServerFailCount(result.blockState.failedChecksSinceLastPass)` with no check that `blockIndex` still equals the request’s block. |
| **Learner impact** | Stuck prompts and inline stuck copy may appear on a **new** block after slow network, or fail to reflect current block server state — confusing “why am I seeing hints here?” |
| **Required correction** | Capture `blockIndex` at send time; apply state update only if still current (or merge via block-scoped state map). |

---

## Non-blocking recommendations

| ID | Area | Recommendation |
| -- | ---- | ---------------- |
| R-W2-01 | Copy | Replace “offline help” with built-in / step-by-step wording that does not imply the learner lost internet. |
| R-W2-02 | Quota UX | Show monthly remaining only when low or exhausted, or move to secondary text per ADR-023. |
| R-W2-03 | A11y | Escape closes sheet; focus trap + return focus to FAB; consider `role="dialog"` + `aria-modal` on sheet. |
| R-W2-04 | 503 UX | Surface deterministic block hint snippet in panel when `/help` returns 503 (plan §9), not only status line. |
| R-W2-05 | Monaco | Clamp `revealLine` to document line count after mount. |
| R-W2-06 | Tests | Add integration tests for block-change stale help and grader callback guard. |
| R-W2-07 | Stuck timer | Optional interval or derive stuck 180s on interaction ticks if product wants time-based prompt without fails. |
| R-W2-08 | Dual stuck banners | Consider single stuck surface (main OR panel) to reduce noise. |

---

## Explicit conclusions (requested)

| # | Topic | Conclusion |
| - | ----- | ---------- |
| 1 | **Beginner usability** | Structure and copy are beginner-oriented, but **block-unsafe panel state** breaks trust before content quality can be judged. |
| 2 | **Golden-path adequacy** | Automated golden path **does not validate UI**; founder smoke is required and **should wait** until B-W2-01/02 are fixed. |
| 3 | **Grader-event trust/integration** | Request shape and fire-and-forget pattern **correct**; **async block association fails**. |
| 4 | **Stale-response/race safety** | **Fails** — help and grader paths need block epoch guards. |
| 5 | **Fallback/503 behaviour** | 200+fallback **good**; 503 **honest but thin** vs plan static panel fallback. |
| 6 | **Quota UX** | Functional; **always-on counter** is a teaching-friction concern (non-blocking). |
| 7 | **Responsive/editor usability** | **Acceptable** at common laptop widths with sidebar. |
| 8 | **Accessibility** | Baseline labels/live regions OK; sheet dialog pattern **incomplete** (non-blocking). |
| 9 | **MVP-M2 regression safety** | **No new regression** attributed to mentor beyond layout width. |
| 10 | **Readiness for founder smoke** | **Not ready** until blockers B-W2-01 and B-W2-02 are resolved and re-checked. Do not treat 279/279 tests as substitute for human smoke after fixes. |

---

## Founder smoke script (post-fix)

When blockers are fixed, run human production-like smoke:

1. Open Lesson 1 → “Label the page parts.”
2. Intentionally fail checks; use only BuildLearn help (no external tools).
3. Validate understanding of comments, placement, line focus, and next steps.
4. Request `need_more_help`; complete exercise and lesson; confirm roadmap unlock.

---

## Checker actions

- Review only; **no code**, merge, Upstash, `OPENAI_API_KEY`, Vercel, Neon, or Lessons 2–3 / TASK-205 changes.

**Next step for implementer:** Fix B-W2-01 and B-W2-02 on `feature/MVP-M3-lesson-1-mentor`, add targeted tests, request Checker delta re-review.
