# Checker Review — TASK-002

**Verdict:** APPROVED  
**Date:** 2026-08-05  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-002-prisma-schema`

---

## Summary

TASK-002 delivers a minimal, well-normalized schema for `users` and `profiles` only. Aligns with ADR-013/016. No forbidden scope. Approved for merge after timestamptz fix applied.

---

## Requirements coverage

| Criterion | Result |
| --------- | ------ |
| users.id String (Clerk ID) | ✅ |
| users email, created_at, deleted_at | ✅ |
| profiles with experience enum + goal fields | ✅ |
| Prisma client from @/server/db | ✅ |
| db:* scripts | ✅ |
| .env.example DATABASE_URL | ✅ |
| Unit test | ✅ |
| No auth/Clerk/API/extra tables | ✅ |
| prisma migrate dev against Neon | ⏳ Pending DATABASE_URL (migration SQL committed) |

---

## Detailed review

### 1. Prisma schema quality — ✅
Clean models, proper `@map` for snake_case columns, enum for experience level.

### 2. Database normalization — ✅
Correct 1:1 User–Profile split. No redundant data.

### 3. Naming consistency — ✅
camelCase in Prisma, snake_case in PostgreSQL. Matches PROJECT_CONTEXT `some_exposure`.

### 4. Future scalability — ✅
String PK propagates cleanly to future `user_id` FKs. Profile fields support onboarding (Phase 4) without migration.

### 5. Indexes and constraints — ✅ (minor note)
- `users.email` UNIQUE — sufficient for MVP
- PKs on both tables — correct

### 6. Foreign keys — ✅
`profiles.user_id` → `users.id` with explicit constraint.

### 7. Cascade behavior — ✅
`ON DELETE CASCADE` on profile FK. Appropriate for 1:1; soft-delete path preserves rows.

### 8. Prisma best practices — ✅
Next.js singleton via `globalThis`. Appropriate log levels.

### 9. Migration quality — ✅ (fixed)
SQL matches schema. Timestamptz corrected to match ARCHITECTURE.md.

### 10. Security — ✅
No credentials in repo. DATABASE_URL via env only.

### 11. Rewrite risk — Low
Schema is minimal. Clerk ID as PK is stable for Clerk-based auth (ADR-013).

---

## Clerk User ID as primary key

**Assessment: Correct for this architecture.**

| Pros | Cons |
| ---- | ---- |
| No mapping table | Vendor lock-in to Clerk ID format |
| Webhook upsert by ID is trivial | Auth provider change requires migration |
| Stable, opaque, globally unique | — |

Alternative (internal UUID + clerk_id column) adds complexity without MVP benefit. Documented in ADR-013.

---

## Checks run

```
pnpm db:generate  ✅
pnpm typecheck    ✅
pnpm test         ✅ (2 tests)
pnpm build        ✅
```

---

## Checker fixes applied

1. **`prisma/schema.prisma`** — `@db.Timestamptz(3)` on DateTime fields; Clerk ID comment on `User.id`
2. **`prisma/migrations/.../migration.sql`** — `TIMESTAMPTZ(3)` instead of `TIMESTAMP(3)`
3. **`docs/ARCHITECTURE.md`** — corrected `users.id` / `profiles.user_id` to String; fixed enum values

---

## Post-merge recommendations

1. Apply migration when Neon configured: `pnpm db:migrate`
2. TASK-102 webhook: on soft-delete, consider restoring user row rather than creating duplicate email
3. Add partial index on `users(deleted_at)` if soft-delete queries become hot path (post-MVP)
4. Migrate `package.json#prisma` seed config to `prisma.config.ts` before Prisma 7
