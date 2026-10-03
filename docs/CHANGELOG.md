## [Unreleased]

### Planning (MVP-M3 — TASK-203 / TASK-203-UI)
- **Context-aware AI mentor** formal spec for Lesson 1 only — `docs/plans/MVP-M3-TASK-203-ai-mentor.md`
- **TASK-203** (P2): AIService, mentor API, ADR-023 help policy, FR-9.6 quotas (Upstash; no conversation DB in M3)
- **TASK-203-UI** (P1): lesson player mentor panel, stuck detection, structured actions (not generic chat)
- **Revision (post-Checker `f662d3b`):** server Redis mentor state, grader-event API, help-policy anti-bypass, production Upstash required (503 fail-closed)
- Checker review: `docs/reviews/mvp-m3-task-203-plan-checker.md` (CHANGES REQUIRED — addressed in plan revision)
- Implementation **not started** — await Checker re-review and Master go

### Fixed (production — Vercel Prisma client)
- **`postinstall`: `prisma generate`** — clean install on Vercel regenerates Prisma Client from `prisma/schema.prisma` (fixes missing `LessonProgressStatus` type error on build)
- Checker review: `docs/reviews/fix-vercel-prisma-generate-postinstall.md` (APPROVED FOR MERGE)
- Branch: `fix/vercel-prisma-generate-lifecycle` merged to `main` **2026-10-03** (`b734367`, review `c70a65d`)
- **No migration** for this fix — `20260929140000_lesson_progress` already on Neon (Migrate Deploy **#7**)

### Operational (MVP-M2 — production verified 2026-10-03)
- **Founder smoke passed** on https://buildlearn-two.vercel.app — full L1 loop, complete/unlock, roadmap statuses (see `docs/reviews/mvp-m2-production-verification.md`)
- **Neon `20260929140000_lesson_progress`:** Migrate Deploy **#7** (do not re-run)
- **Vercel:** green @ `main` `a370ee7`; postinstall Prisma generate operational
- **Founder finding:** beginner exercise UX gap on L1 “Label the page parts” — **ADR-023** (Beginner Teaching Principle); informs MVP-M3, not M2 rollback
- **TASK-205** remains deferred per ADR-022

### Added (MVP-M2 — TASK-206 / TASK-207)
- **Lesson 1 player:** block-based UI for `how-websites-work` (objective → bridge), Monaco + iframe preview, deterministic client graders, pass invalidation on edit (B1 fix)
- **Progress API:** `GET`/`PATCH` `/api/lesson-progress/[lessonId]`, `GET` `/api/lessons/[lessonId]`, `POST` `/api/lessons/[lessonId]/complete` (auth-scoped; transactional path step complete + unlock next)
- **Migration:** `20260929140000_lesson_progress` (Neon Migrate Deploy **#7**)
- Checker reviews: `docs/reviews/MVP-M2-WAVE1.md`, `docs/reviews/MVP-M2-FINAL.md` (APPROVED FOR MERGE, delta @ `9538bf0`)
- Branch: `feature/MVP-M2-lesson-1` squash-merged to `main` **2026-09-29** (`338b2af`)
- **Production verification:** **complete** (2026-10-03)
- **Non-blocking follow-ups (record only):** I-M2-01 (GET lesson path membership), I-M2-02 (server grader trust), I-M2-05 (back-nav editor reset vs pass flag); see `MVP-M2-FINAL.md`

### Added (MVP-M1 — TASK-204)
- **Deterministic learning path:** template + concept-graph path plan persisted to `learning_paths` / `learning_path_steps`
- **API:** `GET`/`POST` `/api/learning-path` (generate idempotent, read active path)
- **Onboarding:** path preview loads persisted plan via POST generate; completion ensures path exists
- **Roadmap v1:** `/roadmap` lists steps and links to first unlocked lesson; lesson player placeholder route
- **Migration:** `20260928120000_learning_paths` (deploy to Neon before production use)
- Checker review: `docs/reviews/TASK-204.md` (APPROVED FOR MERGE, HEAD `85c3399`)
- Branch: `feature/TASK-204-deterministic-path` squash-merged to `main` **2026-09-29** (`a6e859e`)

### Operational (MVP-M1 — production verified 2026-09-29)
- **Neon migration `20260928120000_learning_paths`:** deployed via **Database Migrate Deploy #6** from `main` @ `c93a743`
- **Vercel Production `DATABASE_URL`:** corrected to Neon **pooled** connection string; Production redeployed (fixes webhook/profile/onboarding persistence failures caused by non-pooled URL)
- **TASK-102 ops closed:** new-user `user.created` webhook → `users` + `profiles` verified in production
- **TASK-204 production smoke test passed:** sign-up → onboarding (goal → experience → quiz → path) → `/roadmap`
- **MVP-M1 operationally verified** (minimal `/roadmap` from TASK-204; TASK-205 polish deferred post-M2)
- **Historical users:** accounts created during DB outage may lack webhook rows — no TASK-211 auto-create workaround

### Planning (First MVP — Option A, ADR-022)
- **MVP delivery model:** End-to-end vertical slices (MVP-M1→M4); deterministic/template path first; ~3 lessons + project start before full 12-lesson / Build Mode scope
- **TASK_QUEUE:** Reorganized backlog; **OPS-PHASE4-001 closed** (production auth verified 2026-09-28); TASK-102 Neon webhook row verification noted outstanding separately
- **IMPLEMENTATION_PLAN:** § 1A First MVP milestones; updated checklist
- **DECISIONS:** ADR-022 accepted
- **No product code** in this planning update

### Operational (Phase 4 — OPS-PHASE4-001 repository alignment)
- **Clerk redirect repo alignment:** `.env.example`, CI, and Vitest sign-up force redirect → `/onboarding/goal`; sign-in remains `/dashboard`
- Aligns documented/local env with `SIGN_UP_REDIRECT` and Phase 4 onboarding entry; TASK-212 dynamic resume unchanged
- Checker review: `docs/reviews/OPS-PHASE4-001.md` (APPROVED FOR MERGE)
- Branch: `ops/phase-4-clerk-redirect` merged 2026-09-16
- ~~**OPS-PHASE4-001 remains `pending`**~~ — **closed 2026-09-28** (production verified; see TASK_QUEUE.md)

### Added (Phase 4 — TASK-213)
- **Onboarding UI profile integration:** P1 onboarding wired to TASK-211 `GET`/`PATCH` `/api/profile`
- Persisted profile is durable source of truth for goal and experience; quiz/placement remains client/session-only (ADR-021)
- Goal → `learningGoalText` + `onboardingStep=experience`; experience → `experienceLevel` + `onboardingStep=quiz`
- Quiz complete/skip → `onboardingStep=path` only; Start learning → `onboardingComplete=true` + navigate `/roadmap` on success
- Persistence failures prevent navigation and allow retry; no Prisma migration required
- Checker review: `docs/reviews/TASK-213.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-213-onboarding-profile-integration` merged 2026-09-16
- **Phase 4 minimum DoD complete (2026-09-16)** — `/roadmap` page UI not implemented (accepted gap; TASK-205)
- **TASK-203 unblocked** — status `pending`; implementation not started
- **OPS-PHASE4-001 remains pending** — Clerk env/deployment redirect alignment (pre-production ops)

### Added (Phase 4 — TASK-212)
- **Onboarding resume & auth routing:** ADR-021 profile-aware resume resolver (`onboarding-resume.ts`)
- Incomplete users resume stored/inferred onboarding step; complete users route to `/dashboard`
- Middleware route gating via TASK-211 `GET /api/profile` (READ + ROUTE only; no Profile writes)
- Sign-in server redirect for authenticated users; sign-up remains `/onboarding/goal`
- No Prisma schema/migration changes
- Checker review: `docs/reviews/TASK-212.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-212-onboarding-resume-routing` merged 2026-09-02
- **Phase 4 not yet complete** — TASK-213 UI profile integration outstanding
- **TASK-203 remains blocked** until Phase 4 minimum DoD complete

### Operational (Phase 4 — TASK-211 Neon onboarding_step complete)
- **TASK-211 operational follow-up complete (2026-08-12)**
- Migration `20260811120000_onboarding_step` deployed to Neon successfully via **Database Migrate Deploy**
- Neon verified: `profiles.onboarding_step` column exists (nullable `OnboardingStep` enum)
- **TASK-211 fully complete operationally** — code merged and Neon schema aligned
- **TASK-212 database prerequisite cleared** — implementation not started
- **TASK-213 TASK-211 dependency satisfied** — implementation not started
- **Phase 4 not yet complete** — TASK-212 and TASK-213 outstanding
- **TASK-203 remains blocked** until Phase 4 minimum DoD complete
- Checker review: `docs/reviews/task-211-neon-onboarding-step-complete.md` (APPROVED FOR MERGE)
- Branch: `docs/task-211-neon-onboarding-step-complete` merged 2026-08-12

### Added (Phase 4 — TASK-211)
- **Profile onboarding persistence API:** authenticated `GET`/`PATCH` `/api/profile` for ADR-021 fields (`learningGoalText`, `experienceLevel`, `onboardingStep`, `onboardingComplete`)
- **Prisma:** `OnboardingStep` enum (`goal`, `experience`, `quiz`, `path`); nullable `profiles.onboarding_step`
- Migration: `20260811120000_onboarding_step` (committed; **not deployed to Neon during merge**)
- Clerk session identity only — no arbitrary `userId`; webhook remains User/Profile creation source; no placement persistence; no `goalSummary` writes
- Checker review: `docs/reviews/TASK-211.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-211-profile-onboarding-api` merged 2026-08-12
- **Operational follow-up before TASK-212/TASK-213 consume deployed `onboardingStep`:** deploy `20260811120000_onboarding_step` to Neon via Database Migrate Deploy; verify `profiles.onboarding_step` column — **not run during merge**

### Planning (Phase 4 — backend task definitions)
- **ADR-021** — Phase 4 onboarding persistence model (`onboardingStep` enum; no placement DB persistence in Phase 4)
- **TASK-211** — Profile & onboarding persistence API (**done**, merged 2026-08-12)
- **TASK-212** — Onboarding resume & auth routing (**done**, merged 2026-09-02)
- **TASK-213** — Onboarding UI profile integration (P1, pending; depends TASK-211 ✅, TASK-212 ✅)
- **OPS-PHASE4-001** — Clerk sign-up redirect alignment (pending)
- **TASK-203 blocked** until Phase 4 minimum DoD complete
- Checker review: `docs/reviews/phase-4-backend-task-definitions.md` (APPROVED FOR MERGE)
- Branch: `docs/phase-4-backend-task-definitions` merged 2026-08-10
- **TASK-213 may begin** when Master directs; TASK-212 resume routing merged (2026-09-02)

### Added (Phase 4 — TASK-202)
- **Placement quiz UI:** 5 curated beginner HTML/CSS/JS MCQs at `/onboarding/quiz`; one question at a time with progress dots
- Client-side deterministic scoring (`totalCorrect`, `totalQuestions`, `percentage`, lightweight domain summary) in sessionStorage-backed onboarding state
- Skip flow preserved (`I'm not sure — skip quiz` → `/onboarding/path`); completion stores answers + placement result → `/onboarding/path`
- Question data under `src/lib/onboarding/` (P1-owned); path preview remains stub/mock (no score consumption)
- Checker review: `docs/reviews/TASK-202.md` (APPROVED FOR MERGE)
- Branch: `feature/TASK-202-placement-quiz` merged 2026-08-10
- **Phase 4 P1 onboarding UI complete** — profile persistence, onboarding resume backend, placement quiz backend/API, and `.env.example` redirect alignment remain separate P2/ops work

### Planning (Phase 4 — TASK-202 task definition)
- **TASK-202 full task definition added** to `docs/TASK_QUEUE.md` — Placement quiz (Programmer 1, Phase 4, P1, status `pending`)
- Question content under `src/lib/onboarding/` (P1-owned); client-side scoring only; placement signals reserved for Phase 5
- Profile persistence and placement quiz backend remain separate P2 Phase 4 work
- `.env.example` / deployment sign-up redirect alignment remains pre-production follow-up (not a TASK-202 blocker)
- **TASK-202 implementation not started** — definition approved and merged; begin on `feature/TASK-202-placement-quiz` when Master directs
- Checker review: `docs/reviews/TASK-202-task-definition.md` (APPROVED FOR MERGE)
- Branch: `docs/TASK-202-task-definition` merged 2026-08-10

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
