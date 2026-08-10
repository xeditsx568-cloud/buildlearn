# Checker Review — TASK-201 (Onboarding wizard UI)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-201-onboarding-wizard`  
**Commit reviewed:** `f631dc7`

---

## Executive summary

TASK-201 delivers the Phase 4 onboarding wizard UI: `(onboarding)` route group
with four steps (goal, experience, quiz shell, path preview), client-side wizard
state via React Context + `sessionStorage`, auth protection for `/onboarding/*`,
and sign-up redirect to `/onboarding/goal`. Path preview uses clearly labelled
stub data; Start learning CTA targets `/roadmap` without implementing that page.

The branch diff against `main` contains **25 files only** (+1046/−30 lines). No
Prisma schema, migrations, API routes, AI integration, profile persistence, quiz
scoring, or TASK-202+ work was introduced.

Lint, typecheck, tests (67/67), and build pass. Build output confirms correct
URLs: `/onboarding/goal`, `/onboarding/experience`, `/onboarding/quiz`,
`/onboarding/path`. No `/roadmap` route was added.

**`.env.example` redirect mismatch is a non-blocking post-merge follow-up** (P2
coordination per FILE_OWNERSHIP and TASK-201 Notes). Application `SignUp`
component correctly uses `SIGN_UP_REDIRECT` (`/onboarding/goal`).

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | All 25 changed files related to TASK-201 | ✅ |
| 2 | Correct `/onboarding/*` URL structure | ✅ |
| 3 | Onboarding shell — stepper, back-only, no app nav | ✅ |
| 4 | Goal screen — validation, chips, Continue gating | ✅ |
| 5 | Experience screen — three levels, radio semantics | ✅ |
| 6 | Quiz shell — skip only, no questions/scoring | ✅ |
| 7 | Path screen — loading/loaded stub, CTA → `/roadmap` | ✅ (see Minor) |
| 8 | Client-side state — minimal Context + sessionStorage | ✅ |
| 9 | Auth routing — protect onboarding, sign-up redirect | ✅ |
| 10 | No regressions to marketing/auth/app routes | ✅ |
| 11 | Tests cover approved requirements | ✅ |
| 12 | lint / typecheck / test / build | ✅ |
| 13 | Aligned with frozen UX (no redesign) | ✅ |
| 14 | `.env.example` — post-merge follow-up, not blocking | ✅ |
| 15 | sessionStorage — acceptable for TASK-201 scope | ✅ |
| 16 | Out-of-scope items excluded | ✅ |

---

## Branch diff vs `main`

```
 src/app/(onboarding)/layout.tsx                    |  24 +++
 src/app/(onboarding)/onboarding/experience/page.tsx |   5 +
 src/app/(onboarding)/onboarding/goal/page.tsx       |   5 +
 src/app/(onboarding)/onboarding/path/page.tsx        |   5 +
 src/app/(onboarding)/onboarding/quiz/page.tsx       |   5 +
 src/app/sign-up/[[...sign-up]]/page.tsx            |   4 +-
 src/components/onboarding/** (9 files)             | 654 +++
 src/lib/auth-routes.ts                             |  23 +-
 src/lib/onboarding/** (3 files)                   | 121 +++
 src/middleware.ts                                  |   4 +-
 tests/unit/auth-redirect.test.tsx                  |  12 +-
 tests/unit/auth-routes.test.ts                     |  81 +-
 tests/unit/onboarding/** (3 files)                 | 132 +++
25 files changed, 1046 insertions(+), 30 deletions(-)
```

No changes to: `prisma/**`, `src/app/api/**` (except pre-existing webhook),
`package.json`, `.github/workflows/**`, `.env.example`, `docs/**`.

---

## Detailed review

### 1. Scope — ✅

All 25 files belong to TASK-201 onboarding UI, auth routing, lib helpers, and
unit tests. No unrelated feature work.

**Confirmed absent:**

- Profile persistence / resume API
- Prisma schema or migrations
- New API routes
- OpenAI / AI path generation
- Placement quiz questions or scoring
- `/roadmap` page implementation
- Lesson player, project creation, dashboard redesign

### 2. Route structure — ✅

Next.js route group `(onboarding)` isolates layout; URL segment `onboarding/`
produces correct paths:

| Expected URL | Build output | Match |
| ------------ | ------------ | ----- |
| `/onboarding/goal` | ✅ | ✅ |
| `/onboarding/experience` | ✅ | ✅ |
| `/onboarding/quiz` | ✅ | ✅ |
| `/onboarding/path` | ✅ | ✅ |

Route nesting `(onboarding)/onboarding/goal/page.tsx` correctly avoids the
earlier pitfall of `(onboarding)/goal` → `/goal`.

**App navigation:** Onboarding layout shows logo link to `/` only — no Dashboard/
Learn/Project/Build nav. Complies with UX §123–127.

### 3. Onboarding shell — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| 4-step indicator | `OnboardingStepper` — dots + "Step N of 4" |
| Back within flow only | `OnboardingBackLink` — hidden on goal step |
| Responsive | `px-6 py-6`, full-width CTAs on mobile (`w-full sm:w-auto`) |
| Touch targets | `min-h-11` on buttons and radio cards |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring` on inputs/buttons |
| Keyboard | Native radio inputs; semantic landmarks (`nav`, `section`) |

### 4. Goal screen — ✅

| Requirement | Implementation |
| ----------- | -------------- |
| Textarea | ✅ with placeholder per UX |
| Min 10 / max 500 | ✅ `validateGoalText`, `maxLength={500}` |
| Example chips | ✅ "A portfolio site", "A bakery landing page", "A blog" |
| Continue disabled until valid | ✅ `disabled={!canContinue}` |
| Validation feedback | ✅ error on submit attempt; frozen copy |
| Continue → experience | ✅ `router.push("/onboarding/experience")` |
| Backend persistence | ✅ None |

### 5. Experience screen — ✅

| Value | Present |
| ----- | ------- |
| `beginner` | ✅ |
| `some_exposure` | ✅ |
| `intermediate` | ✅ |

Radio-group semantics (`role="radiogroup"`, native `<input type="radio">`).
Continue disabled until selection; navigates to `/onboarding/quiz`.

### 6. Quiz screen — ✅

Shell only with placement quiz introduction. Skip link text matches UX intent
("I'm not sure — skip quiz") → `/onboarding/path`. Sets `quizSkipped` in context.
No questions, scoring, or placement logic.

### 7. Path screen — ✅ (minor note)

| State | UI implemented | Runtime reachable |
| ----- | -------------- | ----------------- |
| Loading | ✅ skeleton + frozen copy | ✅ (1.2s stub delay) |
| Error | ✅ Try again + Contact support | ⚠️ Not reachable with stub (always succeeds) |
| Loaded | ✅ stub list + goal summary | ✅ |
| Stub data label | ✅ "Preview uses stub data..." | ✅ |
| Start learning → `/roadmap` | ✅ `ONBOARDING_COMPLETION_ROUTE` | ✅ |
| `/roadmap` page | ✅ Not implemented | ✅ |

No fetch/API/AI calls. `MOCK_PATH_STEPS` in `constants.ts` is static.

### 8. Client-side state — ✅

`OnboardingProvider` stores only:

- `goalText`
- `experienceLevel`
- `quizSkipped`

Persisted to `sessionStorage` key `buildlearn-onboarding`. Hydration pattern:
default state on SSR → `useEffect` reads storage → `hydrated` flag prevents
flash; screens return `null` until hydrated. No Redux/Zustand; minimal and
appropriate for TASK-201.

**sessionStorage (requirement 15):** Tab-scoped storage survives refresh within
the same tab; a new tab starts with empty wizard state. Acceptable for TASK-201
without profile resume — not a blocker. Profile-based resume is explicitly P2
Phase 4 backend work.

Direct URL navigation to later steps without prior input is allowed (empty goal
on path preview) — acceptable for UI-only scope.

### 9. Auth routing — ✅

| Behavior | Implementation |
| -------- | -------------- |
| `/onboarding/*` protected | `isProtectedRoute()` + `auth.protect()` |
| Sign-up redirect | `SIGN_UP_REDIRECT` = `/onboarding/goal` on `<SignUp />` |
| Sign-in redirect | `AUTHENTICATED_HOME` = `/dashboard` (unchanged) |
| Profile resume | ✅ Not implemented |
| Signed-out access | Blocked by middleware |

### 10. Regression check — ✅

| Route class | Still public/protected correctly |
| ----------- | -------------------------------- |
| `/` marketing | Public ✅ |
| `/sign-in`, `/sign-up` | Public ✅ |
| `/dashboard`, `/learn`, `/project`, `/build` | Protected ✅ |
| `/api/webhooks/clerk` | Not in protected prefixes ✅ |

Authenticated user on auth routes still redirects to `/dashboard` — unchanged
from TASK-101; no profile-based onboarding resume added.

### 11. Tests — ✅

| Requirement | Test location |
| ----------- | ------------- |
| Onboarding route protection | `auth-routes.test.ts` |
| Sign-up redirect | `auth-routes.test.ts`, `auth-redirect.test.tsx` |
| Goal validation min/max | `onboarding/validation.test.ts` |
| Experience selection | `onboarding/validation.test.ts` |
| Quiz skip navigation | `onboarding/quiz-skip.test.tsx` |
| Path loading/error/loaded | `onboarding/path-preview.test.tsx` |
| `/roadmap` CTA | `onboarding/path-preview.test.tsx` |

67/67 tests pass across 14 files.

### 12. Verification — ✅

```
pnpm lint       ✅ No ESLint warnings or errors
pnpm typecheck  ✅ Pass
pnpm test       ✅ 67/67 pass
pnpm build      ✅ Pass — /onboarding/* routes present; no /roadmap
```

### 13. UX alignment — ✅

Implementation follows frozen UX §5.3–5.6 and §123–127 without product
redesign. Copy, step order, skip behaviour, loading/error wireframes, and
completion destination (`/roadmap` CTA) align with spec and ADR-020.

### 14. `.env.example` / deployment redirect — ✅ Non-blocking

| Layer | Sign-up redirect |
| ----- | ---------------- |
| Application (`SignUp forceRedirectUrl`) | `/onboarding/goal` ✅ |
| `.env.example` | `/dashboard` (unchanged) |
| `vitest.config.ts` test env | `/dashboard` (test fixture only) |

**Decision: Option A — safe to merge.** Programmer 1 correctly did not modify
`.env.example` (P2-owned per FILE_OWNERSHIP). TASK-201 Notes and TASK-101 review
(I-101-03) document this coordination. **Post-merge / pre-production follow-up:**
P2 or Master updates `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` in
`.env.example` and deployment environments. Runtime sign-up redirect is governed
by the application component; env var alignment prevents Clerk dashboard/config
drift in production.

---

## Findings

### Critical — none

### Major — none

### Minor

| ID | Severity | File/location | Explanation | Required correction |
| -- | -------- | ------------- | ----------- | ------------------- |
| M-201-01 | Minor | `src/lib/onboarding/constants.ts` — `EXAMPLE_GOAL_CHIPS` | Chip "A blog" (6 chars) does not meet 10-char minimum; clicking it leaves Continue disabled until user edits. Frozen UX lists this chip. | **None for merge** — acceptable; user can extend text. Optional polish in follow-up. |
| M-201-02 | Minor | `src/components/onboarding/path-preview-screen.tsx` | Error state UI exists and is tested via `PathPreviewScreenStatic`, but stub flow always transitions loading → loaded; error never shown at runtime. | **None for merge** — UI satisfies acceptance criteria; real error paths arrive Phase 5. Optional: simulate error once for manual QA. |

### Informational (non-blocking)

| ID | Severity | File/location | Note |
| -- | -------- | ------------- | ---- |
| I-201-01 | Info | `.env.example` | `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard` — post-merge P2 coordination before production deploy |
| I-201-02 | Info | `onboarding-provider.tsx` | `sessionStorage` is tab-scoped; new tab = fresh wizard — fine until profile API (P2) |
| I-201-03 | Info | `(onboarding)/layout.tsx` | Logo links to `/` (marketing), not dashboard — complies with "no escape to dashboard" |
| I-201-04 | Info | `docs/TASK_QUEUE.md` | Status still `pending` in queue — Master should update to `review` when directing Checker merge workflow |

---

## Out-of-scope confirmations

| Item | Status |
| ---- | ------ |
| Backend / profile persistence | ✅ Not added |
| Quiz questions / scoring | ✅ Not added |
| AI / path generation backend | ✅ Not added |
| `/roadmap` page | ✅ Not implemented |
| TASK-202+ | ✅ Not started |
| Prisma / migrations | ✅ Unchanged |
| API routes | ✅ No new routes |

---

## Post-merge confirmations

| Item | Status |
| ---- | ------ |
| Branch may merge to `main` | ✅ Yes |
| `.env.example` / deployment redirect update | **Post-merge** coordinated follow-up (P2) before production |
| Operational follow-up before production | Update `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` in deployment env + `.env.example`; live sign-up smoke test to `/onboarding/goal` |
| No backend/profile persistence | ✅ Confirmed |
| No quiz scoring/questions | ✅ Confirmed |
| No AI/path backend | ✅ Confirmed |
| `/roadmap` not implemented | ✅ Confirmed (CTA only) |
| TASK-202+ unstarted | ✅ Confirmed |

---

## Final decision

**APPROVED FOR MERGE**

TASK-201 meets all acceptance criteria within approved scope. Merge
`feature/TASK-201-onboarding-wizard` to `main` after stakeholder confirmation.
Coordinate `.env.example` and deployment Clerk redirect with P2 before production
use. Master should set TASK-201 to `review`/`done` per workflow after merge.
