## [Unreleased]

### Added (Phase 2 — TASK-102)
- **Clerk webhook user sync:** `POST /api/webhooks/clerk` with Svix verification via `verifyWebhook`
- Handles `user.created`, `user.updated`, `user.deleted`; Prisma sync to `users` + `profiles`
- `CLERK_WEBHOOK_SIGNING_SECRET` env validation; idempotent soft-delete and re-signup restore
- Checker review: `docs/reviews/TASK-102.md`
- Branch: `feature/TASK-102-clerk-webhook` merged 2026-08-10
- **Pre-production follow-up:** apply init migration to Neon, register Clerk webhook, live sign-up test (see TASK_QUEUE.md)

### Added (Infrastructure — Prisma–Neon configuration)
- **Prisma–Neon env wiring:** `directUrl = env("DIRECT_URL")` for Prisma CLI; pooled `DATABASE_URL` for runtime
- **`dotenv-cli`** and `prisma:pull` / `prisma:migrate` / `prisma:generate` scripts loading `.env.local`
- `.env.example` documents pooled `DATABASE_URL` and direct `DIRECT_URL` placeholders
- Technical note: `docs/notes/prisma-neon-connectivity.md` (local Prisma `db pull` P1001 follow-up before first migration)
- Checker review: `docs/reviews/config-prisma-neon-env.md`
- Branch: `config/prisma-neon-env` merged 2026-08-08

### Fixed (Phase 2 — BUG-101-001)
- **Post-sign-in redirect:** Clerk v7 `forceRedirectUrl` on SignIn/SignUp; migrated env validation to `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` / `SIGN_UP_FORCE_REDIRECT_URL` (supersedes deprecated `AFTER_SIGN_*` vars)
- Reviews: `docs/reviews/BUG-101-001-post-sign-in-redirect.md`, `docs/reviews/BUG-101-001-checker-review.md`

### Added (Phase 2 — TASK-101)
- **TASK-101:** Clerk authentication — `@clerk/nextjs`, `ClerkProvider`, `/sign-in`, `/sign-up`, middleware protecting `(app)` routes
- Phase 2 env validation: `CLERK_*` keys via t3-env
- Route classification helper (`src/lib/auth-routes.ts`) and unit tests
- Checker review: `docs/reviews/TASK-101.md`

### Changed (UX v1.2 — Design Freeze)
- **Replay mode** approved — review-only from Roadmap; no progress changes (ADR-017)
- **Auto-scroll** approved — Roadmap scrolls to current node; respects `prefers-reduced-motion` (ADR-018)
- **Simple daily streak** approved — ≥1 session/day; no freezes/XP/rewards (ADR-019)
- MVP Design Freeze report: `docs/MVP_DESIGN_FREEZE.md`
- Stakeholder approval P-013

### Changed (UX v1.1 — Roadmap revision)
- **Roadmap (`/roadmap`)** designated as primary learning journey — replaces `/learn` list view
- Dashboard refactored to quick overview; Continue Learning → current node player
- Learn routes (`/learn/*`) scoped to active lesson/challenge player only
- Updated: UX_SPECIFICATION.md, PROJECT_CONTEXT.md, PRODUCT_REQUIREMENTS.md, ARCHITECTURE.md

---

## [0.1.0-foundation] — 2026-08-05

Phase 1 — Project Foundation complete. Gate review TASK-006 APPROVED.

### Added
- **TASK-001:** Next.js 15, React 19, TypeScript strict, Tailwind v4, shadcn/ui Button, Vitest
- **TASK-002:** Prisma ORM — `users` and `profiles` schema, initial migration, db client singleton
- **TASK-003:** GitHub Actions CI (lint, typecheck, test, build)
- **TASK-004:** App Router route groups — `(marketing)` at `/`, `(app)` at `/dashboard`, `/learn`, `/project`, `/build`
- **TASK-005:** t3-env validation for `DATABASE_URL` and `NEXT_PUBLIC_APP_URL`
- **TASK-006:** Phase 1 gate review APPROVED

### Infrastructure
- Environment template (`.env.example`) with documented Phase 2+ placeholders
- Five-agent workflow docs, task queue, file ownership matrix
- Checker review reports for TASK-001 through TASK-006

### Planning (included in repository)
- PREP-001 development environment preparation
- Phase 0 planning documentation
- ADR-013 through ADR-016

---

## [0.1.0] — 2026-08-05

### Added
- Development prep complete; Phase 1 ready

## [0.0.0] — 2026-08-04

### Added
- Phase 0 planning documentation
- Git repository initialized
