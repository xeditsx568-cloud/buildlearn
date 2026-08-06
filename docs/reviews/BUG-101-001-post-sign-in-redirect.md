# Bug Fix Report — Post-sign-in redirect (TASK-101)

**ID:** BUG-101-001  
**Date:** 2026-08-06  
**Author:** Bug Fixer Agent  
**Branch:** `fix/clerk-post-auth-redirect`  
**Status:** Ready for Checker review — **do not merge**

---

## Summary

After successful Clerk sign-in, users remained on `/sign-in` instead of redirecting to `/dashboard`. Middleware correctly redirected authenticated users on subsequent navigation, but the client-side Clerk flow did not redirect post-authentication.

---

## Root cause

**Clerk SDK v7 (`@clerk/nextjs@7.6.5`) no longer honors the deprecated environment variables `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`.**

TASK-101 configured those deprecated vars in `src/env.ts`, `.env.example`, and CI, but `<SignIn />` and `<SignUp />` were rendered without explicit redirect props. Clerk v7 requires either:

- `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`, or
- Component-level `forceRedirectUrl` prop

Without either, Clerk completes authentication client-side but does not navigate away from the auth page. Middleware only redirects on the next server request (e.g., clicking “Sign in” again).

---

## Fix applied

1. **`forceRedirectUrl={AUTHENTICATED_HOME}`** on `<SignIn />` and `<SignUp />` — immediate client-side redirect to `/dashboard` after auth
2. **Migrated env validation** from deprecated `AFTER_SIGN_*` to Clerk v7 `SIGN_*_FORCE_REDIRECT_URL` in `src/env.ts`, `.env.example`, CI, and Vitest config
3. **Middleware unchanged** — existing redirect for signed-in users visiting auth routes preserved

---

## Files changed

| File | Change |
| ---- | ------ |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Add `forceRedirectUrl` |
| `src/app/sign-up/[[...sign-up]]/page.tsx` | Add `forceRedirectUrl` |
| `src/env.ts` | Clerk v7 force redirect env vars |
| `.env.example` | Updated redirect var names |
| `.github/workflows/ci.yml` | Updated CI env |
| `vitest.config.ts` | Updated test env |
| `tests/unit/env.test.ts` | Updated Phase 2 schema fixture |
| `tests/unit/auth-redirect.test.tsx` | **New** — redirect prop tests |
| `docs/reviews/BUG-101-001-post-sign-in-redirect.md` | This report |

**Not changed:** `src/middleware.ts`, `ClerkProvider`, route protection logic

---

## Tests added

| Test | Coverage |
| ---- | -------- |
| `auth-redirect.test.tsx` | `AUTHENTICATED_HOME` is `/dashboard`; SignIn/SignUp receive `forceRedirectUrl="/dashboard"` |
| `env.test.ts` | Updated for force redirect env vars |

---

## Verification

```
pnpm lint       ✅
pnpm typecheck  ✅
pnpm test       ✅ (16 tests)
pnpm build      ✅
```

---

## Manual verification checklist

- [ ] Sign in at `/sign-in` → immediate redirect to `/dashboard`
- [ ] Sign up at `/sign-up` → redirect to `/dashboard`
- [ ] Visit `/sign-in` while signed in → middleware redirect to `/dashboard`
- [ ] Unauthenticated `/dashboard` → redirect to `/sign-in`

---

## Phase 4 note

Sign-up redirect remains `/dashboard` per project decision. When TASK-201 adds onboarding, update `forceRedirectUrl` on `<SignUp />` and `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` to `/onboarding/goal`.

---

## Checker review

Awaiting Checker approval before merge to `main`.
