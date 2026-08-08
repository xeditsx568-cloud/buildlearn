# Checker Review — TASK-102 (Clerk webhook user sync)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-08  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-102-clerk-webhook`  
**Commit reviewed:** `db3da132a0859916a4881203204d0a90d6242b78`

---

## Executive summary

TASK-102 delivers a Svix-verified Clerk webhook at `POST /api/webhooks/clerk` with
Prisma-backed sync for `user.created`, `user.updated`, and `user.deleted`. The
implementation is scoped, security-conscious, idempotent, and aligned with existing
`User` / `Profile` models and soft-delete decisions (ADR-013, TASK-002 review).
No Prisma schema changes, no unrelated features, no secrets committed. All CI
checks pass (36/36 tests).

**Merge-readiness (critical question):** **Option A** — TASK-102 is safe to merge
despite the local Prisma CLI P1001 and despite the init migration not yet being
applied to Neon. This branch consumes existing models only; migration application
and live webhook verification are **operational follow-ups**, not merge blockers
for this task.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Webhook route implementation | ✅ |
| 2 | `verifyWebhook` correct for `@clerk/nextjs@7.6.5` | ✅ |
| 3 | Endpoint public; protected by signature not auth middleware | ✅ |
| 4 | `user.created` / `user.updated` / `user.deleted` handling | ✅ |
| 5 | Create/update/delete matches project decisions | ✅ |
| 6 | Idempotency | ✅ |
| 7 | Out-of-order handling safe and intentional | ✅ |
| 8 | Re-signup restores via `user.created`; updates skip soft-deleted | ✅ |
| 9 | No invented user/profile fields | ✅ |
| 10 | Prisma usage / transaction safety | ✅ |
| 11 | `CLERK_WEBHOOK_SIGNING_SECRET` env + CI + tests; no secrets | ✅ |
| 12 | Tests cover signature, routing, sync, duplicates, failures | ✅ |
| 13 | `prisma:generate`, lint, typecheck, test, build | ✅ |
| 14 | No unrelated scope creep | ✅ |
| — | No Prisma schema/model changes | ✅ |
| — | No new migration files | ✅ |

---

## Requirements coverage (TASK-102)

| Requirement | Result |
| ----------- | ------ |
| `user.created` creates `users` + `profiles` row | ✅ `syncUserCreated` upserts both in `$transaction` |
| `user.deleted` soft-deletes (`deleted_at`) | ✅ `syncUserDeleted` via `updateMany` |
| Webhook signature verified (Svix) | ✅ `verifyWebhook` from `@clerk/nextjs/webhooks` |
| Idempotent on duplicate events | ✅ Upserts + conditional `updateMany` |
| Integration test with mock Clerk/Svix payload | ✅ Route + handler + service unit tests |
| Security-critical signature validation | ✅ 400 on verification failure; handler not invoked |

TASK_QUEUE YAML lists `user.created` and `user.deleted` only; `user.updated` was
included in the approved task brief and aligns with Clerk webhook best practices.

---

## Detailed review

### 1. Webhook route — ✅

`src/app/api/webhooks/clerk/route.ts`:

- Uses `verifyWebhook(req, { signingSecret: env.CLERK_WEBHOOK_SIGNING_SECRET })`
  with `NextRequest` — correct for Clerk v7.6.5
- Separates verification errors (400) from handler errors (500) — enables Clerk
  retries on transient DB failures while rejecting bad signatures
- Filters to user lifecycle events before dispatching
- Returns 200 for unsupported verified events (no-op) — acceptable

### 2. Signature verification — ✅

Clerk v7 `verifyWebhook` reads Svix headers and validates via `standardwebhooks`
(bundled in `@clerk/backend@3.15.1`). Explicit `signingSecret` from t3-env is
preferred over implicit `process.env` lookup — consistent with project env validation.

Env var name `CLERK_WEBHOOK_SIGNING_SECRET` matches Clerk v7 official naming
(supersedes commented `CLERK_WEBHOOK_SECRET` in old `.env.example`).

### 3. Public endpoint / middleware — ✅

`src/middleware.ts` only calls `auth.protect()` for `isProtectedAppRoute()`.
Existing `auth-routes.test.ts` (unchanged on branch) confirms
`/api/webhooks/clerk` is **not** protected. Webhook security relies on Svix
signature verification — correct pattern per ARCHITECTURE.md §6.6 and TASK-101 review.

### 4. Event handling — ✅

| Event | Implementation | Fields synced |
| ----- | -------------- | ------------- |
| `user.created` | `syncUserCreated` | `id`, `email`; creates empty `Profile` |
| `user.updated` | `syncUserUpdated` | `email` only (active users) |
| `user.deleted` | `syncUserDeleted` | `deletedAt` soft-delete |

No extra profile fields (`displayName`, `experienceLevel`, etc.) are written —
correct MVP scope.

### 5. Project decision alignment — ✅

| Decision | Implementation |
| -------- | -------------- |
| ADR-013: `users.id` = Clerk string ID | Primary key upserted from `user.id` |
| TASK-002: soft-delete via `deleted_at` | `updateMany` sets `deletedAt`; no hard delete |
| TASK-002 review: restore on re-signup | `syncUserCreated` update sets `deletedAt: null` |
| ARCHITECTURE §5.2: 1:1 User–Profile | Profile created alongside user in transaction |

### 6. Idempotency — ✅

- **`user.created`:** `upsert` on User and Profile — duplicate deliveries safe
- **`user.updated`:** `update` by id — repeated updates idempotent
- **`user.deleted`:** `updateMany` where `deletedAt: null` — second delete no-ops

### 7. Out-of-order handling — ✅

| Scenario | Behaviour | Intentional? |
| -------- | --------- | ------------ |
| `user.updated` before `user.created` | Creates user via `syncUserCreated` | ✅ Yes — tested |
| `user.updated` after soft-delete | No-op (skipped) | ✅ Yes — tested |
| `user.deleted` before `user.created` | Delete no-ops; create succeeds later | ✅ Safe |
| `user.created` after soft-delete | Restores user (`deletedAt: null`) | ✅ Per TASK-002 review |
| `user.deleted` when user missing | `updateMany` count 0 — no error | ✅ Idempotent |

### 8. Prisma usage — ✅

- `syncUserCreated` wraps User + Profile upserts in `db.$transaction` — atomic
- `syncUserUpdated` / `syncUserDeleted` use single-statement operations — appropriate
- No raw SQL; parameterized Prisma queries throughout
- **No changes** to `prisma/schema.prisma` or `prisma/migrations/`

### 9. Environment / secrets — ✅

| Location | Status |
| -------- | ------ |
| `src/env.ts` | `CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1)` in server schema |
| `.env.example` | `whsec_REPLACE_ME` placeholder only |
| `.github/workflows/ci.yml` | Dummy `whsec_ci_dummy_secret_for_build_only` |
| `vitest.config.ts` | Same dummy secret |
| `tests/unit/env.test.ts` | Phase 2 schema includes webhook secret |
| `.env.local` | Not tracked |
| Commit scan | No real secrets |

### 10. Tests — ✅

| Test file | Coverage |
| --------- | -------- |
| `clerk-webhook-route.test.ts` | Signature rejection (400), valid routing (200), unsupported events, handler failure (500) |
| `clerk-webhook-handler.test.ts` | Event dispatch for created/updated/deleted; missing delete id |
| `user-service.test.ts` | Email extraction, create/update/delete sync, duplicates, out-of-order update, soft-deleted skip |

20 new tests; 36 total pass. Tests use mocks (per TASK_QUEUE spec: "mock Clerk/Svix
payload") — no live DB or Clerk API required for merge gate.

---

## Merge-readiness determination

### Question: A (merge safe) or B (blocked until migration + live test)?

**Decision: A — APPROVED FOR MERGE**

### Rationale

1. **No new schema dependency.** TASK-102 adds zero Prisma model/migration changes.
   It consumes the TASK-002 `users` / `profiles` schema already on `main`.

2. **TASK_QUEUE acceptance criteria satisfied without live DB.** Required test is
   "Integration test with mock Clerk/Svix payload" — delivered. Live Neon integration
   is not listed as a merge gate.

3. **Precedent.** TASK-002 merged with migration SQL committed but
   `prisma migrate dev against Neon` marked pending. Same pattern applies: code
   merges first; migration applied when CLI connectivity permits.

4. **P1001 is a local Prisma schema-engine issue**, documented in
   `docs/notes/prisma-neon-connectivity.md`. Native `pg` connects; Neon is healthy.
   This does not invalidate the webhook code.

5. **Runtime dependency is operational, not a code defect.** Webhooks will fail at
   runtime until the existing `20250805103100_init` migration is applied — expected
   and documented. That is follow-up work, not a reason to block this PR.

### What is NOT required before merge

- Applying init migration to Neon on the developer machine
- Live end-to-end webhook test against Neon
- Resolving local Prisma CLI P1001

### What IS required before production/staging use

1. Apply existing init migration to Neon (`pnpm prisma:migrate` from an environment
   where Prisma CLI connects, or CI)
2. Configure Clerk Dashboard webhook pointing to `/api/webhooks/clerk` with
   `user.created`, `user.updated`, `user.deleted` events
3. Set `CLERK_WEBHOOK_SIGNING_SECRET` in deployment env
4. Verify one sign-up creates `users` + `profiles` rows in Neon

---

## Checks run

```
pnpm prisma:generate  ✅
pnpm lint             ✅  No ESLint warnings or errors
pnpm typecheck        ✅
pnpm test             ✅  36/36 passed
pnpm build            ✅  /api/webhooks/clerk listed as dynamic route
git diff main...HEAD  ✅  11 files, +526/−2; no prisma/ changes
```

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ------------- | ------------------- |
| I-102-01 | Info | `tests/unit/user-service.test.ts` | No explicit test that `syncUserCreated` clears `deletedAt` on re-signup (update branch) | None — code path verified by inspection; optional post-merge test |
| I-102-02 | Info | `src/server/services/user-service.ts` — `syncUserUpdated` | Silently no-ops when email missing (vs throw on create) | None — reasonable; updates without email are not actionable |
| I-102-03 | Info | `tests/unit/user-service.test.ts` | `user.deleted` before `user.created` not explicitly tested | None — safe by `updateMany` no-op + later upsert |
| I-102-04 | Info | Operational | Live webhook + migration verification deferred | Document in post-merge checklist (see below) — not a merge blocker |

---

## Security notes

- Webhook endpoint rejects unverified requests before any DB access
- Signing secret validated at build/runtime via t3-env; never exposed to client
- No secrets in committed files
- Soft-delete preserves rows; no hard delete of user data

---

## Merge authorization

**The branch `feature/TASK-102-clerk-webhook` may be merged to `main`.**

**Despite local Prisma P1001:** Merge is approved because TASK-102 requires no new
migrations and all task acceptance criteria are met with mocked integration tests.

**Operational follow-up before production use:**

1. Apply init migration to Neon (from CI or environment where Prisma CLI connects)
2. Register Clerk webhook endpoint and signing secret
3. Run one live sign-up / delete cycle to confirm DB sync

**TASK-103 and later tasks must not begin until directed.**

---

## Post-merge recommendations

1. Master Agent: update `docs/TASK_QUEUE.md` — mark TASK-102 done after merge
2. Apply `20250805103100_init` migration to Neon when Prisma CLI connectivity resolved
3. Add optional integration test against test DB in CI when Postgres service is available (future enhancement)
4. Consider explicit unit test for re-signup `deletedAt` restoration (I-102-01)
