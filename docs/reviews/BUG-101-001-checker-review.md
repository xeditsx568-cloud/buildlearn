# Checker Review — BUG-101-001 (Post-sign-in redirect)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-06  
**Reviewer:** Checker Agent  
**Branch:** `fix/clerk-post-auth-redirect`  
**Commit reviewed:** `bf6c87a`

---

## Executive summary

BUG-101-001 fixes a confirmed post-authentication redirect failure where users remained on `/sign-in` after successful Clerk sign-in. Root cause analysis is accurate: Clerk v7 deprecates `NEXT_PUBLIC_CLERK_AFTER_SIGN_*` env vars; the fix adds `forceRedirectUrl` props and migrates env validation to `SIGN_*_FORCE_REDIRECT_URL`. Change set is minimal (9 files, +157/−17), scoped exclusively to this bug. All CI checks pass. **Approved for merge to `main`.**

---

## Bug confirmation

| Observed | Expected | Fixed by |
| -------- | -------- | -------- |
| User stays on `/sign-in` after successful auth | Immediate redirect to `/dashboard` | `forceRedirectUrl={AUTHENTICATED_HOME}` on SignIn/SignUp |
| Middleware redirects on subsequent visit | Same — preserved | Middleware unchanged |
| Sign-up should go to `/dashboard` (Phase 4 deferred) | `/dashboard` | Same `AUTHENTICATED_HOME` constant |

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Clerk v7 redirect root cause accurate | ✅ |
| 2 | `forceRedirectUrl` supported by `@clerk/nextjs@7.6.5` | ✅ (typecheck + build pass; Clerk docs confirm) |
| 3 | Fix minimal; no unrelated auth changes | ✅ |
| 4 | Sign-in/sign-up use `AUTHENTICATED_HOME` constant | ✅ |
| 5 | Middleware behaviour unchanged | ✅ (no diff vs `main`) |
| 6 | Env migration consistent across all config files | ✅ |
| 7 | Deprecated `AFTER_SIGN_*` no longer required by app | ✅ |
| 8 | No secrets or `.env.local` committed | ✅ |
| 9 | Redirect tests meaningful | ✅ |
| 10 | Bug-fix report accurate | ✅ |
| — | Branch contains only bug-related changes | ✅ |

---

## Root cause verification

**Accurate.** Clerk v7 (`@clerk/nextjs@7.6.5`) prioritizes:

- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`, or
- Component `forceRedirectUrl` prop

TASK-101 configured deprecated `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL`. Without force redirect configuration, Clerk completes auth client-side but does not navigate. Middleware redirect on line 14–15 of `src/middleware.ts` only fires on the next server request — matching reported behaviour exactly.

---

## Implementation review

### Sign-in / sign-up pages — ✅

```tsx
<SignIn forceRedirectUrl={AUTHENTICATED_HOME} />
<SignUp forceRedirectUrl={AUTHENTICATED_HOME} />
```

- Uses shared `AUTHENTICATED_HOME` from `@/lib/auth-routes` (`/dashboard`)
- No hardcoded duplicate strings in page components
- `ClerkProvider` and `middleware.ts` unchanged — correct minimal scope

### Middleware — ✅ (unchanged)

```14:20:src/middleware.ts
  if (isAuthRoute(pathname) && userId) {
    return NextResponse.redirect(new URL(AUTHENTICATED_HOME, req.url));
  }

  if (isProtectedAppRoute(pathname)) {
    await auth.protect();
  }
```

Signed-in users visiting auth routes still redirect via middleware. Protected routes remain protected.

### Environment migration — ✅

| File | Deprecated removed | Force redirect added |
| ---- | ------------------ | -------------------- |
| `src/env.ts` | ✅ | ✅ |
| `.env.example` | ✅ | ✅ |
| `.github/workflows/ci.yml` | ✅ | ✅ |
| `vitest.config.ts` | ✅ | ✅ |
| `tests/unit/env.test.ts` | ✅ | ✅ |

No remaining application references to `NEXT_PUBLIC_CLERK_AFTER_SIGN_*` as required variables (comments in `src/env.ts` document migration only).

### Security — ✅

- Commit `bf6c87a` contains only placeholder/dummy keys in `.env.example` and CI (pre-existing pattern)
- `.env.local` not in commit
- No real secrets in diff

---

## Tests

| File | Tests | Assessment |
| ---- | ----- | ---------- |
| `tests/unit/auth-redirect.test.tsx` | 3 new | Mocks Clerk components; verifies `forceRedirectUrl="/dashboard"` passed to SignIn/SignUp |
| `tests/unit/env.test.ts` | Updated | Force redirect env vars in Phase 2 schema |

Tests are focused and meaningful for a unit-level fix. Full E2E redirect flow deferred to manual QA (documented in bug report checklist).

---

## Branch scope

**9 files changed** — all directly related to BUG-101-001:

- 2 auth page fixes
- 1 env schema migration
- 3 config/test env updates
- 1 env test update
- 1 new redirect test
- 1 bug-fix report

No middleware, ClerkProvider, route protection, webhook, or TASK-102 work included.

---

## Checks run (`fix/clerk-post-auth-redirect` @ `bf6c87a`)

```
pnpm lint        ✅
pnpm typecheck   ✅
pnpm test        ✅ (16/16)
pnpm build       ✅
```

---

## Findings

### Informational (non-blocking)

| ID | Severity | Location | Note |
| -- | -------- | -------- | ---- |
| I-BUG-01 | Info | `docs/reviews/TASK-101.md` | Still references deprecated `AFTER_SIGN_*` vars — update on merge (Master) |
| I-BUG-02 | Info | `docs/CHANGELOG.md` | Not updated in branch — add entry on merge |
| I-BUG-03 | Info | Developer `.env.local` | Must migrate from `AFTER_SIGN_*` to `SIGN_*_FORCE_REDIRECT_URL` (not committed; documented in bug report) |
| I-BUG-04 | Info | Phase 4 | `SignUp` `forceRedirectUrl` and env var will need update for `/onboarding/goal` — already documented |

**No Critical, Major, or Minor blocking issues.**

---

## Final decision

**APPROVED FOR MERGE**

BUG-101-001 meets all acceptance criteria. Merge `fix/clerk-post-auth-redirect` to `main` after stakeholder confirmation. TASK-102 remains unblocked but should not begin until directed.

---

## Post-merge recommendations

1. Update `docs/CHANGELOG.md` with BUG-101-001 entry
2. Update `docs/reviews/TASK-101.md` env var references to force redirect names
3. Notify developers to migrate local `.env.local` from deprecated `AFTER_SIGN_*` to `SIGN_*_FORCE_REDIRECT_URL`
