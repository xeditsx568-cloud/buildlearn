# Task Queue — BuildLearn

> **Maintained by:** Master Agent  
> **Last updated:** 2026-08-10 (TASK-103 operational complete)  
> **Status key:** `pending` | `in_progress` | `review` | `done` | `blocked`

---

## Current Sprint: Phase 3 — Content Foundation (in progress)

**Goal:** Curriculum foundation — concept graph, goal templates, then lessons (TASK-104).

**Status:** **TASK-103 operationally complete (2026-08-10).** Migration deployed; Database Seed workflow succeeded; Neon curriculum verified. **TASK-104 unblocked** — status `pending`; implementation not started.

### Operational follow-up (before TASK-104) — complete (2026-08-10)

- ~~Deploy migration **`20260810170000_concept_graph_and_goal_templates`** to Neon via **Database Migrate Deploy**~~ — **complete**
- ~~Run **Database Seed** workflow (`.github/workflows/db-seed.yml`, confirmation **`seed`**)~~ — **complete**
- ~~Verify curriculum rows in Neon~~ — **complete:**
  - `concepts` = **24**
  - `goal_templates` = **5**
  - `concept_prerequisites` = **36**

---

## Phase 2 — Authentication (complete)

**Goal:** Clerk authentication foundation — sign-in/sign-up, middleware, env validation, user sync webhook.

**Status:** TASK-101 merged (2026-08-06). BUG-101-001 post-sign-in redirect fixed (2026-08-06). Prisma–Neon configuration merged (2026-08-08). **TASK-102 merged (2026-08-10).** Manual Neon migration deploy workflow merged (2026-08-10). Init migration BOM recovery merged (2026-08-10). Phase 2 auth foundation complete.

### Operational follow-up (before production use)

- ~~Run **Database Migrate Resolve** then **Database Migrate Deploy** to apply `20250805103100_init`~~ — **complete (2026-08-10)**; Neon has `users`, `profiles`, `_prisma_migrations`
- If local Prisma CLI P1001 persists, use the CI workflow instead of `pnpm prisma:migrate` locally (`docs/notes/prisma-neon-connectivity.md`)
- Register Clerk webhook endpoint → `POST /api/webhooks/clerk`
- Add real `CLERK_WEBHOOK_SIGNING_SECRET` to deployment environments
- Perform live sign-up test; confirm `users` + `profiles` rows are created

### Parallel execution (Phase 2 — complete)

| Wave | Tasks | Agents |
| ---- | ----- | ------ |
| 1 | TASK-101 | Programmer 1 |
| 2 | TASK-102 | Programmer 2 |
| 3 | — | Checker (after TASK-102) |

See [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) §4 and [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md).

---

## Phase 1 Queue

### TASK-001
```yaml
TASK-ID: TASK-001
Title: Initialize Next.js 15 project with TypeScript, Tailwind, shadcn/ui
Description: |
  Bootstrap the application scaffold in the existing directory layout.
  The folder structure and READMEs already exist (PREP-001). This task
  adds package.json, Next.js config, root layout, placeholder home page,
  and Vitest configuration.
Owner: Programmer 1
Status: done
Priority: P0
Phase: 1
Dependencies: [PREP-001]
Branch: feature/TASK-001-nextjs-scaffold
Files:
  - package.json
  - pnpm-lock.yaml
  - next.config.ts
  - tsconfig.json
  - tailwind.config.ts
  - postcss.config.mjs
  - components.json
  - vitest.config.ts
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
Acceptance Criteria:
  - pnpm install succeeds
  - pnpm dev starts without errors on port 3000
  - TypeScript strict: true in tsconfig.json
  - Tailwind classes render on placeholder home page
  - shadcn/ui initialized; Button component available
  - Path alias @/ maps to src/
  - Existing directory READMEs preserved (do not delete)
Tests Required:
  - Vitest configured with at least one smoke test (app module imports)
Reviewer: Checker
Notes: |
  Use pnpm as package manager (see .npmrc).
  Do NOT add Clerk, Prisma, or AI SDK dependencies yet.
  Place root layout in src/app/ — route groups (marketing) and (app) already exist.
```

### TASK-002
```yaml
TASK-ID: TASK-002
Title: Configure Prisma with Neon and initial schema
Description: |
  Add Prisma ORM, connect to Neon PostgreSQL, create initial migration
  for users and profiles tables per ARCHITECTURE.md. Add db scripts and
  seed stub.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 1
Dependencies: [TASK-001]
Branch: feature/TASK-002-prisma-schema
Files:
  - prisma/schema.prisma
  - prisma/migrations/**
  - prisma/seed.ts
  - src/server/db.ts
  - package.json  # prisma deps + db:* scripts — Master note: P2 only
Acceptance Criteria:
  - prisma migrate dev runs successfully against Neon (or local Postgres)
  - users table: id String @id (Clerk user ID), email, created_at, deleted_at
  - profiles table: user_id, display_name, experience_level enum, goal fields stub
  - Prisma client importable from @/server/db
  - package.json scripts: db:generate, db:migrate, db:seed, db:studio
  - .env.example documents DATABASE_URL
Tests Required:
  - Unit test: Prisma client singleton initializes without throw (mock URL ok)
Reviewer: Checker
Notes: |
  users.id is String (Clerk format user_xxx), NOT UUID.
  Do not implement Clerk integration yet.
  See prisma/README.md.
  Operational (2026-08-10): init migration 20250805103100_init applied to Neon
  via manual Resolve → Deploy workflow. Tables users, profiles verified.
```

### TASK-003
```yaml
TASK-ID: TASK-003
Title: Set up GitHub Actions CI pipeline
Description: |
  Copy ci.yml.example to ci.yml and ensure CI runs lint, typecheck,
  test, and build on pull_request and push to main.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 1
Dependencies: [TASK-001]
Branch: feature/TASK-003-ci-pipeline
Files:
  - .github/workflows/ci.yml
  - package.json  # lint, typecheck, test, build scripts — Master note: P2 only
Acceptance Criteria:
  - .github/workflows/ci.yml exists and matches ci.yml.example intent
  - pnpm lint, pnpm typecheck, pnpm test, pnpm build all defined in package.json
  - CI passes on a clean TASK-001 scaffold
  - pnpm cache configured in workflow
  - Node 20 from .node-version
Tests Required:
  - CI green on PR (meta)
Reviewer: Checker
Notes: |
  Template at .github/workflows/ci.yml.example.
  Use dummy DATABASE_URL in build step env for compile-time validation.
```

### TASK-004
```yaml
TASK-ID: TASK-004
Title: Wire Next.js scaffold into established route layout
Description: |
  Connect the TASK-001 scaffold to the pre-created route groups and
  placeholder structure. Add minimal placeholder pages so routes resolve.
  Verify all READMEs still accurate.
Owner: Programmer 1
Status: done
Priority: P0
Phase: 1
Dependencies: [TASK-001]
Branch: feature/TASK-004-route-layout
Files:
  - src/app/(marketing)/page.tsx
  - src/app/(marketing)/layout.tsx
  - src/app/(app)/layout.tsx
  - src/app/(app)/dashboard/page.tsx
  - src/app/(app)/learn/page.tsx
  - src/app/(app)/project/page.tsx
  - src/app/(app)/build/page.tsx
Acceptance Criteria:
  - / renders marketing placeholder (not app shell)
  - /dashboard, /learn, /project, /build render placeholder pages
  - Route groups (marketing) and (app) correctly isolate layouts
  - No auth middleware yet — placeholders accessible (auth is Phase 2)
  - All directory READMEs present and unchanged in purpose
Tests Required:
  - Component smoke test: marketing page renders title
Reviewer: Checker
Notes: |
  Do NOT add Clerk middleware — that is TASK-101 (Phase 2).
  Keep placeholders minimal ("Coming soon" level).
  Component subdirs (ui/, lesson/, etc.) are created in later phases — do not pre-create.
```

### TASK-005
```yaml
TASK-ID: TASK-005
Title: Environment variable validation with t3-env
Description: |
  Add @t3-oss/env-nextjs for type-safe environment variables.
  Create .env.example with documented variables.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 1
Dependencies: [TASK-001]
Branch: feature/TASK-005-env-validation
Files:
  - src/env.ts
  - .env.example
  - package.json  # t3-env dep — Master note: P2 only
Acceptance Criteria:
  - src/env.ts validates DATABASE_URL and NEXT_PUBLIC_APP_URL at build time
  - .env.example lists all Phase 1–2 vars with comments for future keys
  - Commented placeholders: CLERK_*, OPENAI_*, UPSTASH_* (not required yet)
  - App builds with .env.example copied to .env.local (dummy values)
Tests Required:
  - Unit test: env schema accepts valid test payload
  - Unit test: env schema rejects missing required vars
Reviewer: Checker
Notes: |
  Only DATABASE_URL and NEXT_PUBLIC_APP_URL are required in Phase 1.
  Integrate env import in next.config if needed for build validation.
```

### TASK-006
```yaml
TASK-ID: TASK-006
Title: Checker review — Phase 1 foundation gate
Description: |
  Comprehensive review of TASK-001 through TASK-005.
  Verify structure, CI, schema, env handling, and file ownership compliance.
  Produce review report in docs/reviews/TASK-006.md.
Owner: Checker
Status: done
Priority: P0
Phase: 1
Dependencies: [TASK-001, TASK-002, TASK-003, TASK-004, TASK-005]
Branch: docs/TASK-006-phase1-review
Files:
  - docs/reviews/TASK-006.md
Acceptance Criteria:
  - Review report with verdict APPROVED
  - All critical and major issues resolved
  - CI green on main after all Phase 1 PRs merged
  - FILE_OWNERSHIP.md rules followed in all PRs
  - users.id confirmed as String (Clerk ID)
  - No Clerk, AI, or product features merged prematurely
Tests Required:
  - Verify pnpm lint && pnpm typecheck && pnpm test && pnpm build pass locally
Reviewer: Master (accepts Checker report)
Notes: |
  Gate before Phase 2 (Authentication) begins.
  Master merges any doc fixes from Checker before marking Phase 1 complete.
```

---

## Infrastructure — Init migration BOM recovery (complete)

```yaml
TASK-ID: FIX-INIT-MIGRATION-BOM
Title: Init migration UTF-8 BOM fix and resolve workflow
Description: |
  Remove UTF-8 BOM from 20250805103100_init migration.sql (P3018 root cause).
  Add manual db-migrate-resolve workflow and recovery runbook documentation.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 2 (infrastructure)
Dependencies: [INFRA-DB-MIGRATE-DEPLOY]
Branch: fix/init-migration-bom-recovery
Merged: 2026-08-10
Files:
  - prisma/migrations/20250805103100_init/migration.sql  # BOM removal only
  - .github/workflows/db-migrate-resolve.yml
  - docs/notes/db-migrate-deploy-ci.md
  - docs/reviews/fix-init-migration-bom-recovery.md
Acceptance Criteria:
  - Only 3-byte BOM removed; SQL unchanged; UTF-8 without BOM
  - resolve workflow: workflow_dispatch, confirm resolve, migration allowlist
  - pnpm exec prisma migrate resolve --rolled-back only
  - lint, typecheck, test pass; Checker APPROVED FOR MERGE
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/fix-init-migration-bom-recovery.md)
Notes: |
  Merged to main 2026-08-10. Resolve and Deploy completed operationally 2026-08-10.
  Init migration applied to Neon; TASK-103 database blocker cleared.
```

---

## Infrastructure — Neon migration deploy (complete)

```yaml
TASK-ID: INFRA-DB-MIGRATE-DEPLOY
Title: Manual Neon Prisma migrate deploy workflow
Description: |
  GitHub Actions workflow to apply existing committed migrations to Neon.
  Manual workflow_dispatch only; uses GitHub Environment neon and
  prisma migrate deploy (not migrate dev).
Owner: Programmer 2
Status: done
Priority: P0
Phase: 2 (infrastructure)
Dependencies: [CONFIG-PRISMA-NEON]
Branch: infra/db-migrate-deploy-workflow
Merged: 2026-08-10
Files:
  - .github/workflows/db-migrate-deploy.yml
  - docs/notes/db-migrate-deploy-ci.md
  - docs/reviews/infra-db-migrate-deploy-workflow.md
Acceptance Criteria:
  - workflow_dispatch only; confirmation input deploy
  - environment neon; secrets DATABASE_URL + DIRECT_URL only
  - permissions contents read; no secrets committed
  - pnpm exec prisma migrate deploy only
  - lint, typecheck, test pass; Checker APPROVED FOR MERGE
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/infra-db-migrate-deploy-workflow.md)
Notes: |
  Merged to main 2026-08-10. Init migration applied to Neon 2026-08-10 (operational).
```

---

## Infrastructure — Prisma–Neon (complete)

```yaml
TASK-ID: CONFIG-PRISMA-NEON
Title: Prisma–Neon environment configuration
Description: |
  Wire pooled DATABASE_URL and direct DIRECT_URL for Prisma + Neon.
  Add dotenv-cli prisma:* scripts, update .env.example, document local
  Prisma CLI P1001 follow-up before first migration.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 2 (infrastructure)
Dependencies: [TASK-101]
Branch: config/prisma-neon-env
Files:
  - prisma/schema.prisma  # directUrl only — no model changes
  - .env.example
  - package.json
  - pnpm-lock.yaml
  - docs/notes/prisma-neon-connectivity.md
  - docs/reviews/config-prisma-neon-env.md
Acceptance Criteria:
  - datasource uses url + directUrl per Prisma + Neon docs
  - prisma:* scripts load .env.local via dotenv-cli
  - No secrets committed; no migration files added; no model changes
  - prisma:generate, lint, typecheck, test pass
  - Technical note records local db pull P1001 as pre-migration follow-up
Reviewer: Checker (APPROVED FOR MERGE 2026-08-08)
Notes: |
  Merged to main 2026-08-08. Re-test prisma:pull before first migration.
  TASK-102 may proceed after merge workflow complete.
```

---

## Backlog — Phase 2 (Authentication)

### TASK-101
```yaml
TASK-ID: TASK-101
Title: Integrate Clerk authentication
Phase: 2
Owner: Programmer 1
Status: done
Dependencies: [TASK-006]
Priority: P0
Branch: feature/TASK-101-clerk-auth
Files:
  - src/middleware.ts
  - src/app/(app)/layout.tsx
  - src/app/sign-in/**
  - src/app/sign-up/**
  - src/env.ts  # add CLERK keys
Acceptance Criteria:
  - Email and Google sign-in work
  - Unauthenticated users redirected from /dashboard, /learn, /project, /build
  - ClerkProvider wraps app
Tests Required:
  - Integration test: middleware redirects unauthenticated requests
Reviewer: Checker
```

### TASK-102
```yaml
TASK-ID: TASK-102
Title: Clerk webhook for user sync
Phase: 2
Owner: Programmer 2
Status: done
Dependencies: [TASK-101]
Priority: P0
Branch: feature/TASK-102-clerk-webhook
Merged: 2026-08-10
Files:
  - src/app/api/webhooks/clerk/route.ts
  - src/server/services/user-service.ts
  - src/server/services/clerk-webhook-handler.ts
Acceptance Criteria:
  - user.created creates users + profiles row
  - user.deleted soft-deletes user (deleted_at)
  - Webhook signature verified (Svix)
  - Idempotent on duplicate events
Tests Required:
  - Integration test with mock Clerk/Svix payload
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-102.md)
Notes: |
  Security critical — Svix verification via verifyWebhook (@clerk/nextjs/webhooks).
  Pre-production: apply init migration to Neon, register Clerk webhook, live sign-up test.
  Local Prisma CLI P1001 documented in docs/notes/prisma-neon-connectivity.md — not a merge blocker.
```

---

## Backlog — Phase 3 (Content Foundation)

### TASK-103
```yaml
TASK-ID: TASK-103
Title: Seed concept graph and goal templates
Phase: 3
Owner: Programmer 2
Status: done
Dependencies: [TASK-002]
Priority: P0
Branch: feature/TASK-103-concept-graph
Merged: 2026-08-10
Files:
  - prisma/schema.prisma
  - prisma/seed.ts
  - content/concepts.json
  - content/goal-templates.json
  - src/lib/content/curriculum.ts
  - prisma/migrations/20260810170000_concept_graph_and_goal_templates/**
  - tests/unit/concept-graph.test.ts
Acceptance Criteria:
  - 24 concepts seeded per PRODUCT_REQUIREMENTS.md §4
  - 5 goal templates seeded
  - Prerequisite DAG valid (no cycles)
  - pnpm db:seed succeeds
Tests Required:
  - Unit test: DAG has no cycles
  - Unit test: concept count equals 24
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-103.md)
Notes: |
  Merged to main 2026-08-10. Operationally complete 2026-08-10.
  Migration `20260810170000_concept_graph_and_goal_templates` deployed to Neon.
  Database Seed workflow completed successfully.
  Neon verified: concepts=24, goal_templates=5, concept_prerequisites=36.
```

### TASK-104
```yaml
TASK-ID: TASK-104
Title: Lesson content schema and seed Lesson 1
Phase: 3
Owner: Programmer 2
Status: pending
Dependencies: [TASK-103]
Priority: P0
Branch: feature/TASK-104-lesson-schema
Files:
  - prisma/schema.prisma  # lessons table
  - src/lib/schemas/lesson.ts
  - content/lessons/01-how-websites-work.json
  - prisma/seed.ts
Acceptance Criteria:
  - Zod schema validates lesson block types: objective, explain, interact, exercise, quiz, bridge
  - Lesson 1 seeded and queryable via Prisma
Tests Required:
  - Unit test: schema accepts valid lesson, rejects invalid
Reviewer: Checker
Notes: |
  TASK-103 operational follow-up complete (2026-08-10). Blocker cleared.
  Ready to begin when directed by Master Agent. Implementation not started.
```

---

## Backlog — Phase 4+

| Task ID | Title | Owner | Phase | Priority |
| ------- | ----- | ----- | ----- | -------- |
| TASK-201 | Onboarding wizard UI | P1 | 4 | P0 |
| TASK-202 | Placement quiz | P1 | 4 | P1 |
| TASK-203 | AI service abstraction | P2 | 5 | P0 |
| TASK-204 | Path generation pipeline | P2 | 5 | P0 |
| TASK-205 | Learning path UI | P1 | 6 | P0 |
| TASK-206 | Lesson player | P1 | 7 | P0 |
| TASK-207 | Monaco + iframe preview | P1 | 7 | P0 |
| TASK-208 | Challenge system | P2 | 8 | P0 |
| TASK-209 | Mastery service | P2 | 9 | P0 |
| TASK-210 | Project workspace | P1 | 10 | P0 |

---

## Completed

| Task ID | Title | Completed | Owner |
| ------- | ----- | --------- | ----- |
| TASK-001 | Next.js scaffold | 2026-08-05 | Programmer 1 |
| TASK-002 | Prisma users/profiles | 2026-08-05 | Programmer 2 |
| TASK-003 | GitHub Actions CI | 2026-08-05 | Programmer 2 |
| TASK-004 | Route layout wiring | 2026-08-05 | Programmer 1 |
| TASK-005 | t3-env validation | 2026-08-05 | Programmer 2 |
| TASK-006 | Phase 1 gate review | 2026-08-05 | Checker |
| CONFIG-PRISMA-NEON | Prisma–Neon env config | 2026-08-08 | Programmer 2 |
| INFRA-DB-MIGRATE-DEPLOY | Neon migrate deploy workflow | 2026-08-10 | Programmer 2 |
| FIX-INIT-MIGRATION-BOM | Init migration BOM recovery | 2026-08-10 | Programmer 2 |
| TASK-101 | Clerk authentication | 2026-08-06 | Programmer 1 |
| TASK-102 | Clerk webhook user sync | 2026-08-10 | Programmer 2 |
| TASK-103 | Concept graph + goal templates | 2026-08-10 | Programmer 2 |
| PHASE-0 | Planning documentation | 2026-08-04 | Architect |
| PREP-001 | Development environment preparation | 2026-08-05 | Architect |

**PREP-001 included:** folder structure, READMEs, git workflow config, FILE_OWNERSHIP.md, AGENT_WORKFLOW.md, scripts, PR template, CI template, task queue restructure.

---

## Statistics

| Metric | Count |
| ------ | ----- |
| Phase 1 pending | 0 |
| Phase 1 in progress | 0 |
| Phase 1 in review | 0 |
| Phase 1 complete | 6 |
| Phase 2 complete | 2 |
| Phase 2 infra complete | 3 |
| Phase 2 pending | 0 |
| Phase 3 pending | 1 |
| Phase 3 blocked | 0 |
| Backlog (Phase 3+) | 10 |
| Completed (all phases) | 14 |

---

## Task Index (quick reference)

| ID | Phase | Title | Owner | Status |
| -- | ----- | ----- | ----- | ------ |
| TASK-001 | 1 | Next.js scaffold | P1 | done |
| TASK-002 | 1 | Prisma + users/profiles | P2 | done |
| TASK-003 | 1 | CI pipeline | P2 | done |
| TASK-004 | 1 | Route layout wiring | P1 | done |
| TASK-005 | 1 | t3-env validation | P2 | done |
| TASK-006 | 1 | Phase 1 Checker gate | Checker | done |
| TASK-101 | 2 | Clerk auth | P1 | done |
| TASK-102 | 2 | Clerk webhook | P2 | done |
| TASK-103 | 3 | Concept graph seed | P2 | done |
| TASK-104 | 3 | Lesson schema + L1 | P2 | pending |
