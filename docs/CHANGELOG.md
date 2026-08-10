## [Unreleased]

### Planning (Phase 4 — TASK-202 task definition)
- **TASK-202 full task definition added** to `docs/TASK_QUEUE.md` — Placement quiz (Programmer 1, Phase 4, P1, status `pending`)
- Question content under `src/lib/onboarding/` (P1-owned); client-side scoring only; placement signals reserved for Phase 5
- Profile persistence and placement quiz backend remain separate P2 Phase 4 work
- `.env.example` / deployment sign-up redirect alignment remains pre-production follow-up (not a TASK-202 blocker)
- Implementation not started; awaiting Checker review of task definition

### Added (Phase 4 — TASK-201)
- **Onboarding wizard UI:** `(onboarding)` route group with goal, experience, quiz shell, and path preview screens
- Client-side wizard state (React Context + `sessionStorage`); stub path preview data
- Auth: `/onboarding/*` protected; sign-up redirect → `/onboarding/goal`; Start learning CTA → `/roadmap`
- Checker review: `docs/reviews/TASK-201.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-201-onboarding-wizard` merged 2026-08-10
- **Pre-production follow-up:** align `.env.example` and deployment `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding/goal` with P2 (not a merge blocker)

### Planning (Phase 4 — TASK-201 task definition)
- **TASK-201 full task definition added** to `docs/TASK_QUEUE.md` — Onboarding wizard UI (Programmer 1, Phase 4, P0, status `pending`)
- **IMPLEMENTATION_PLAN.md Phase 4 updated** — authoritative onboarding completion destination is `/roadmap` (UX spec + ADR-020); profile persistence/resume documented as separate P2 Phase 4 backend dependency, not TASK-201
- **TASK-201 implementation not started** — definition approved and merged; begin on `feature/TASK-201-onboarding-wizard` when Master directs
- Checker review: `docs/reviews/TASK-201-task-definition.md` (APPROVED FOR MERGE)
- Branch: `docs/TASK-201-task-definition` merged 2026-08-10

### Operational (Phase 3 — TASK-104 Neon lesson complete)
- **TASK-104 operational follow-up complete (2026-08-10)**
- Migration `20260810173000_lessons` deployed to Neon successfully via **Database Migrate Deploy**
- **Database Seed** workflow completed successfully
- Neon verified: Lesson 1 **`how-websites-work`** / **How Websites Work**
- **Phase 3 Content Foundation complete** — TASK-103 and TASK-104 fully operational
- **TASK-201 not started** — ready in backlog when Master directs
- Checker review: `docs/reviews/task-104-neon-lesson-complete.md` (APPROVED FOR MERGE)
- Branch: `docs/task-104-neon-lesson-complete` merged 2026-08-10

### Added (Phase 3 — TASK-104)
- **Lesson content schema and Lesson 1 seed:** Prisma `Lesson` model; Zod validation for six block types (objective, explain, interact, exercise, quiz, bridge)
- **Lesson 1:** `how-websites-work` / How Websites Work — curated JSON in `content/lessons/01-how-websites-work.json`
- Migration: `20260810173000_lessons`
- Idempotent seed via `prisma/seed.ts` (`seedLessons`)
- Checker review: `docs/reviews/TASK-104.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-104-lesson-schema` merged 2026-08-10
- **Operational follow-up before tasks consume lesson data:** deploy lessons migration to Neon; run Database Seed; verify Lesson 1 — **not run during merge**

### Operational (Phase 3 — TASK-103 Neon curriculum complete)
- **TASK-103 operational follow-up complete (2026-08-10)**
- Migration `20260810170000_concept_graph_and_goal_templates` deployed to Neon successfully
- **Database Seed** workflow (`.github/workflows/db-seed.yml`) completed successfully
- Neon verified: **24** concepts, **5** goal templates, **36** `concept_prerequisites` edges
- **TASK-104 blocker cleared** — status moved from `blocked` to `pending`; implementation not started
- Checker review: `docs/reviews/task-103-neon-seed-complete.md` (APPROVED FOR MERGE)
- Branch: `docs/task-103-neon-seed-complete` merged 2026-08-10

### Added (Infrastructure — Neon curriculum seed workflow)
- **Manual GitHub Actions workflow:** `.github/workflows/db-seed.yml` — runs approved TASK-103 curriculum seed against Neon via `workflow_dispatch` only
- Requires GitHub Environment **`neon`**, confirmation input **`seed`**, and secrets `DATABASE_URL` + `DIRECT_URL`
- Command: `pnpm db:seed` — seeds 24 concepts and 5 goal templates from committed JSON; idempotent; does not run migrations or alter schema
- Setup note: `docs/notes/db-seed-ci.md`
- Checker review: `docs/reviews/infra-db-seed-workflow.md` (APPROVED FOR MERGE)
- Branch: `infra/db-seed-workflow` merged 2026-08-10
- **Operational follow-up:** run **Database Seed** once; verify row counts — workflow has **not** been run yet; Neon **not seeded** during merge

### Added (Phase 3 — TASK-103)
- **Concept graph and goal templates:** Prisma models `Concept`, `ConceptPrerequisite`, `GoalTemplate`
- **24 curated concepts** and **5 goal templates** from `content/concepts.json` and `content/goal-templates.json` (frozen MVP scope: HTML/CSS/JS)
- Prerequisite DAG validation in `src/lib/content/curriculum.ts`; deterministic/idempotent seed in `prisma/seed.ts`
- Migration: `20260810170000_concept_graph_and_goal_templates`
- Checker review: `docs/reviews/TASK-103.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-103-concept-graph` merged 2026-08-10
- **Operational follow-up before TASK-104:** deploy curriculum migration to Neon; run `pnpm db:seed`; verify 24 concepts + 5 goal templates — **not run during merge**

### Operational (Infrastructure — Neon init migration applied)
- **TASK-002 operational prerequisite complete:** `20250805103100_init` successfully applied to Neon via manual Resolve → Deploy workflow (2026-08-10)
- Neon verified: `_prisma_migrations`, `users`, `profiles` tables present
- Failed migration recovery (BOM fix) completed operationally after prior P3018
- **TASK-103 database blocker cleared** — status moved from `blocked` to `pending`; implementation not started
- Phase 3 (Content Foundation) ready to begin when directed
- Status documentation branch: `docs/task-002-neon-migration-complete` merged 2026-08-10
- Checker review: `docs/reviews/task-002-neon-migration-complete.md` (APPROVED FOR MERGE)

### Fixed (Infrastructure — Init migration BOM recovery)
- **Removed UTF-8 BOM** from `prisma/migrations/20250805103100_init/migration.sql` — root cause of Neon P3018 / PostgreSQL 42601 at byte 1
- **Manual resolve workflow:** `.github/workflows/db-migrate-resolve.yml` — `migrate resolve --rolled-back` for failed migrations (`workflow_dispatch`, confirm **`resolve`**, migration `20250805103100_init` only)
- Recovery runbook added to `docs/notes/db-migrate-deploy-ci.md` (merge fix → resolve → deploy → verify)
- Checker review: `docs/reviews/fix-init-migration-bom-recovery.md` (APPROVED FOR MERGE)
- Branch: `fix/init-migration-bom-recovery` merged 2026-08-10
- **Operational follow-up:** run **Database Migrate Resolve** then **Database Migrate Deploy** — neither workflow run as part of merge; TASK-103 remains blocked

### Added (Infrastructure — Neon migration deploy workflow)
- **Manual GitHub Actions workflow:** `.github/workflows/db-migrate-deploy.yml` — applies committed Prisma migrations to Neon via `workflow_dispatch` only
- Requires GitHub Environment **`neon`**, confirmation input **`deploy`**, and secrets `DATABASE_URL` (pooled) + `DIRECT_URL` (direct)
- Command: `pnpm exec prisma migrate deploy` — does not create or alter migration files
- Setup note: `docs/notes/db-migrate-deploy-ci.md`
- Checker review: `docs/reviews/infra-db-migrate-deploy-workflow.md` (APPROVED FOR MERGE)
- Branch: `infra/db-migrate-deploy-workflow` merged 2026-08-10
- **Operational follow-up:** configure `neon` environment secrets in GitHub; run workflow once to apply `20250805103100_init` — workflow has **not** been run yet

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
