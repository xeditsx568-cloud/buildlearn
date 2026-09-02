# Checker Review — TASK-212 (Onboarding resume & auth routing)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-09-02  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-212-onboarding-resume-routing`  
**Commit reviewed:** `09b1922`

---

## Executive summary

TASK-212 implements ADR-021 profile-aware onboarding resume routing: a pure
resume resolver, middleware route gating via TASK-211 profile reads, and
sign-in server redirects for authenticated users. The branch diff against
`main` contains **7 files only** (+501/−9 lines). All changes are TASK-212
scoped.

The implementation is **READ + ROUTE only** — no profile writes, no TASK-213
UI integration, no Prisma/schema/migration changes, and no Neon mutations.

Lint, typecheck, tests (**136/136**), and build pass. Middleware uses an
internal same-origin `fetch('/api/profile')` with cookie forwarding and an early
`/api/` bypass to avoid recursion — a valid Edge-safe pattern for this stack
where Prisma cannot run in middleware.

**Approved for merge to `main`.** TASK-213 must not begin until after TASK-212
merge when Master directs.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Branch diff scoped to TASK-212; no unrelated work | ✅ |
| 2 | READ + ROUTE only — no writes or TASK-213 work | ✅ |
| 3 | ADR-021 resolver rules including never-infer-path | ✅ |
| 4 | Route guards — app, onboarding, auth, public | ✅ |
| 5 | Middleware architecture safe for Next.js + Clerk | ✅ |
| 6 | Sign-in profile-aware routing | ✅ |
| 7 | Missing / soft-deleted profile handling intentional | ✅ |
| 8 | lint / typecheck / test / build | ✅ |
| 9 | Meaningful test coverage | ✅ |
| 10 | TASK-101/201/202/211 regressions | ✅ |
| 11 | No Prisma migration required | ✅ |

---

## Branch diff vs `main`

```
 src/app/sign-in/[[...sign-in]]/page.tsx |  29 ++++-
 src/lib/auth-routes.ts                  |   9 +
 src/lib/onboarding/onboarding-resume.ts |  95 +++++++++++++
 src/middleware.ts                       |  67 +++++++++-
 tests/unit/auth-redirect.test.tsx       |  79 ++++++++++-
 tests/unit/auth-routes.test.ts          |  26 ++++
 tests/unit/onboarding-resume.test.ts    | 205 +++++++++++++++++++++++++
 7 files changed, 501 insertions(+), 9 deletions(-)
```

**Note:** `docs/TASK_QUEUE.md` lists `src/lib/onboarding/onboarding-step.ts`
as a TASK-212 file; no changes were required — existing ADR-021 route map is
sufficient. Acceptable.

**Confirmed absent from diff:** Prisma schema/migrations, profile PATCH logic,
onboarding UI components/provider, API route changes, workflows, `.env*`,
package.json, TASK-213 work, AI/OpenAI, TASK-203+.

---

## Detailed review

### 1. Scope — READ + ROUTE only — ✅

| Out-of-scope item | Status |
| ----------------- | ------ |
| Profile / onboarding field writes | ✅ Not present |
| User/Profile creation | ✅ Not present |
| TASK-213 provider hydration / API integration | ✅ Not present |
| Prisma schema / migrations | ✅ Unchanged |
| Neon mutations | ✅ Not performed |
| AI / OpenAI | ✅ Not present |

Middleware and sign-in page consume profile data only via GET semantics
(internal fetch → TASK-211 `GET /api/profile`; sign-in →
`getOwnProfileOnboarding()`).

### 2. ADR-021 resolver — ✅

**File:** `src/lib/onboarding/onboarding-resume.ts`

| Rule | Implementation |
| ---- | -------------- |
| `onboardingComplete = true` → `/dashboard` | ✅ `resolveOnboardingResumeRoute`, `resolveAuthenticatedDestination` |
| Stored `goal` → `/onboarding/goal` | ✅ via `ONBOARDING_STEP_ROUTES` |
| Stored `experience` → `/onboarding/experience` | ✅ |
| Stored `quiz` → `/onboarding/quiz` | ✅ |
| Stored `path` → `/onboarding/path` | ✅ |
| Null step, no goal → goal | ✅ `hasLearningGoal` + inference |
| Null step, goal, no experience → experience | ✅ |
| Null step, goal + experience → quiz | ✅ |
| **Never infer `/onboarding/path`** | ✅ Path only when `onboardingStep === "path"`; tested |

Blank/whitespace goal text treated as missing — consistent with safe inference.

### 3. Route guards — ✅

**File:** `getOnboardingRouteGuardRedirect()` + `src/middleware.ts`

| Scenario | Behavior |
| -------- | -------- |
| Incomplete user on app route (`/dashboard`, `/learn`, `/project`, `/build`) | Redirect to resume route |
| Complete user on `/onboarding/*` | Redirect to `/dashboard` |
| Incomplete user on correct resume onboarding route | No redirect (loop-safe) |
| Incomplete user on wrong onboarding step | Redirect to resume route |
| Signed-out user on protected route | `auth.protect()` preserved |
| Marketing/public (`/`, `/privacy`, `/terms`) | Unaffected — `requiresOnboardingResumeRouting` false |
| Sign-up redirect | Unchanged — `SIGN_UP_REDIRECT = /onboarding/goal` |
| Signed-in user on `/sign-in` or `/sign-up` | Profile-aware redirect via middleware |

**Pre-existing note:** `/roadmap` is not in `PROTECTED_APP_ROUTE_PREFIXES`
(page not implemented — TASK-205). ADR-021 §6 lists the four `(app)` routes
guarded here. Not a TASK-212 regression.

### 4. Middleware architecture — ✅ (with documented trade-offs)

**Pattern:** Edge middleware → `fetch(new URL("/api/profile", req.url))` with
forwarded `cookie` header → TASK-211 API (Node/Prisma) → resume decision.

| Concern | Assessment |
| ------- | ---------- |
| Edge runtime supports `fetch` | ✅ Standard Next.js middleware capability |
| URL construction | ✅ `new URL("/api/profile", req.url)` resolves correctly for local dev and production host |
| Cookie/auth forwarding | ✅ Session cookies forwarded; TASK-211 `auth()` validates Clerk identity |
| API re-entry / recursion | ✅ Early return for `pathname.startsWith("/api/")` before profile fetch |
| API routes excluded from resume routing | ✅ `/api/*` bypasses gating logic |
| Redirect recursion | ✅ Guard compares `pathname !== guardRedirect`; resume route allows pass-through |
| DB reads only where intended | ✅ Prisma runs in API route handler and sign-in server component only |
| Extra request per gated navigation | ⚠️ One internal fetch per authenticated auth/app/onboarding hit — acceptable MVP trade-off |
| Safer alternative in codebase | Server layouts could gate but were out of TASK-212 file scope; fetch-via-API is the minimal Edge-safe approach |

**Error handling (`fetchOnboardingResumeInput`):**

| Response | Behavior |
| -------- | -------- |
| 401 | Default incomplete input → infer `/onboarding/goal` |
| 404 (missing/soft-deleted profile) | Default incomplete input → infer `/onboarding/goal` |
| 500 / network error | Default incomplete input → infer `/onboarding/goal` |

Fail-open toward onboarding start is **conservative for access control**
(incomplete users cannot reach app routes without a successful profile read;
complete users temporarily mis-routed to onboarding during API outage). Acceptable
for MVP; documented as informational finding.

### 5. Sign-in routing — ✅

**File:** `src/app/sign-in/[[...sign-in]]/page.tsx`

| Scenario | Behavior |
| -------- | -------- |
| Signed-out | Renders `SignIn` with `forceRedirectUrl={AUTHENTICATED_HOME}` |
| Signed-in, complete | Server `redirect` → `/dashboard` |
| Signed-in, incomplete | Server `redirect` → stored/inferred resume route |
| Missing profile | `ProfileNotFoundError` → default input → `/onboarding/goal` |

Post-sign-in flow: Clerk redirects to `/dashboard` → middleware fetches profile
→ incomplete users redirected to resume route. No sign-in redirect loop observed.

Sign-in page is now dynamic (`ƒ` in build output) — expected for server auth.

### 6. Missing / soft-deleted profile — ✅

Both middleware (404 → default input) and sign-in page (`ProfileNotFoundError`)
route to `/onboarding/goal`. Consistent with:

- TASK-211 convention: missing/soft-deleted profile → 404 from profile service
- ADR-021 inference: no goal → goal step
- Webhook remains profile creation source; lag/missing row safely starts onboarding

Soft-deleted users retain Clerk session but cannot read profile — routed to
onboarding rather than app shell. Acceptable per existing TASK-211 security model.

### 7. Tests — ✅

**`tests/unit/onboarding-resume.test.ts` (21 tests):**

| Requirement | Covered |
| ----------- | ------- |
| Complete → dashboard | ✅ |
| All stored steps | ✅ |
| Inference goal / experience / quiz | ✅ |
| Never infer path | ✅ |
| Completed user blocked from onboarding | ✅ |
| Incomplete user blocked from app routes | ✅ |
| Wrong onboarding step redirect | ✅ |
| Loop prevention on resume route | ✅ |
| Missing/soft-deleted default | ✅ |

**`tests/unit/auth-routes.test.ts` (+3):** `requiresOnboardingResumeRouting`,
`isAuthRoute` regression

**`tests/unit/auth-redirect.test.tsx` (+3):** sign-in profile-aware redirects;
sign-up redirect unchanged

**Gap (informational):** No HTTP/integration test for middleware
`fetch('/api/profile')` wiring — resolver and route-classification logic are
well covered; runtime fetch behavior relies on architecture review and build.

### 8. Regression checks — ✅

| Area | Result |
| ---- | ------ |
| TASK-101 signed-out protection | ✅ `auth.protect()` preserved |
| TASK-101 marketing public | ✅ Unaffected routes skip resume logic |
| TASK-201 onboarding routes protected | ✅ Still in `isProtectedRoute` |
| TASK-201 sign-up → goal | ✅ Sign-up page unchanged |
| TASK-202 quiz/onboarding UI | ✅ All 9 quiz-skip tests pass |
| TASK-211 profile API | ✅ Unchanged; 17 service + 7 route tests pass |
| Webhook/user sync | ✅ 4 handler + 4 route tests pass |

### 9. Verification — ✅

```
pnpm lint       ✅  No ESLint warnings or errors
pnpm typecheck  ✅
pnpm test       ✅  136/136 passed
pnpm build      ✅  Middleware 90.8 kB; /sign-in dynamic
```

Neon not mutated during review. No workflows run.

---

## Findings

### Critical

None.

### Major

None.

### Minor

None.

### Informational (non-blocking)

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-T212-01 | Info | `src/middleware.ts` | Profile API errors (500/network) fail-open to incomplete default → `/onboarding/goal`; complete users may briefly see onboarding during outage | None for merge — conservative access posture |
| I-T212-02 | Info | `src/middleware.ts` | Each authenticated auth/app/onboarding navigation triggers one internal `/api/profile` fetch | None for merge — acceptable MVP cost |
| I-T212-03 | Info | Tests | Middleware fetch wiring not integration-tested; pure resolver coverage is strong | Optional follow-up: middleware integration test when Clerk session fixtures exist |
| I-T212-04 | Info | `src/lib/auth-routes.ts` | `/roadmap` not gated (page not implemented; ADR-021 §6 lists four app routes) | None for TASK-212 — TASK-205 scope |
| I-T212-05 | Info | `docs/TASK_QUEUE.md` | `onboarding-step.ts` listed but unchanged — existing route map sufficient | None |

---

## Merge authorization

**The branch `feature/TASK-212-onboarding-resume-routing` may be merged to `main`.**

Explicit confirmations:

- **TASK-212 may merge** — ADR-021 resume routing implemented; verification passes
- **TASK-213 has NOT started** — no provider/API UI integration
- **TASK-213 may begin only after approved TASK-212 merge** when Master directs
- **TASK-203 remains blocked** until Phase 4 minimum DoD complete
- **No Prisma migration required**
- **Neon was not mutated during review**
- **No profile writes implemented**

Do **not** begin TASK-213 or TASK-203 as part of merging this branch.

---

## Final decision

**APPROVED FOR MERGE**

TASK-212 meets acceptance criteria within approved ADR-021 scope. Merge
`feature/TASK-212-onboarding-resume-routing` to `main` after Master Agent
confirmation.
