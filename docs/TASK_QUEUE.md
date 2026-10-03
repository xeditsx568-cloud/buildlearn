# Task Queue — BuildLearn

> **Maintained by:** Master Agent  
> **Last updated:** 2026-10-03 (MVP-M3 plan revised post-Checker B-M3-01/02/03 — re-review pending)  
> **Status key:** `pending` | `in_progress` | `review` | `done` | `blocked`

---

## Current focus: First MVP (Option A) — vertical slices

**Founder decision (2026-09-28, ADR-022):** Ship a **smaller, fully working
end-to-end MVP** first (~3 lessons + project start), then expand curriculum and
Build Mode. Build **vertical slices**, not isolated screen polish.

**Foundation complete:** Phases 1–4 minimum DoD (TASK-001–006, 101–102, 103–104,
201–202, 211–213). Production auth verified (Clerk, Google OAuth, middleware
`/__clerk` matcher `28b727e`). **OPS-PHASE4-001 `done`** (2026-09-28).

**Active delivery track:** **MVP-M1** → **MVP-M2** → **MVP-M3** → **MVP-M4**
(see § MVP delivery milestones below).

**MVP-M1:** **Operationally verified in production (2026-09-29)** — sign-up through
`/roadmap` smoke test passed after Neon pooled `DATABASE_URL` fix on Vercel.
**TASK-204 `done`** (code + migration). **TASK-205** (roadmap visual polish) **deferred**
until after **MVP-M2** functional slice (ADR-022: working loop before polish).

**MVP-M2:** **Production verified (2026-10-03)** on https://buildlearn-two.vercel.app — TASK-206/207 **done**; DoD satisfied (`docs/reviews/mvp-m2-production-verification.md`). Migration **#7** applied; Vercel green @ `a370ee7`.

**Founder teaching finding (ADR-023):** L1 exercise blocked genuine beginners without external help — progressive teach/help model required; **informs MVP-M3 / TASK-203** (not implemented yet). **TASK-205** still **deferred**.

**Next implementation track:** **MVP-M3** — **TASK-203** (P2 backend) + **TASK-203-UI** (P1 lesson mentor panel) on Lesson 1 only — plan: `docs/plans/MVP-M3-TASK-203-ai-mentor.md`.
**Do not start** implementation until Master directs post-plan review. **Do not** patch TASK-211 to auto-create
profiles for historical users who signed up during DB outage.

---

## MVP delivery milestones (ADR-022)

Legacy task IDs (TASK-203+) are **mapped** to milestones; execution order follows
milestones, not legacy Phase 5→6→7 numbering.

### MVP-M1 — Path spine & roadmap (first slice)

**Learner outcome:** After onboarding, land on a **real `/roadmap`** showing a
**persisted personalized path** (deterministic/template + concept graph); **first
lesson node unlocked** and navigable.

| Item | Detail |
| ---- | ------ |
| **Maps to** | **TASK-204** (deterministic path v1), **TASK-205** (roadmap UI v1), onboarding handoff |
| **Dependencies** | Phase 3 graph/templates; TASK-211 profile fields; TASK-213 onboarding complete → `/roadmap` |
| **Not in M1** | AI path generation; full roadmap polish (streak, replay, auto-scroll); lesson player/editor |
| **Likely modules** | `prisma/schema.prisma` (+ migration when approved), path service, path API, `src/app/(app)/roadmap/**`, `src/lib/auth-routes.ts` (`/roadmap` protected), onboarding path step (replace mock with persisted path) |
| **Tests** | Path DAG validation; template matching; API auth/IDOR; roadmap smoke |
| **Definition of done** | New user: sign-up → onboarding → **Start learning** → **`/roadmap` loads** (not 404); steps persisted per user; **first lesson unlocked**; click navigates to **`/learn/lessons/how-websites-work`** (player may be minimal until M2) |

### Operational — MVP-M2 (complete 2026-10-03)

| Item | Status |
| ---- | ------ |
| Code merge **`feature/MVP-M2-lesson-1` → `main`** | **Complete** — `338b2af` |
| Migration **`20260929140000_lesson_progress`** on Neon | **Complete** — Migrate Deploy **#7** (do not re-run) |
| Vercel build (`postinstall` prisma generate) | **Complete** — `a370ee7` production green |
| MVP-M2 founder production smoke | **Complete** — 15/15 checklist |
| MVP-M2 Definition of Done | **Satisfied** |
| TASK-206 / TASK-207 | **done** |
| Beginner UX finding | **ADR-023** — drives MVP-M3 teaching scope |
| TASK-205 roadmap polish | **Deferred** (ADR-022) |
| Non-blocking technical follow-ups | I-M2-01, I-M2-02, I-M2-05 — see `MVP-M2-FINAL.md` |

### Operational — TASK-204 / MVP-M1 production (complete 2026-09-29)

| Item | Status |
| ---- | ------ |
| Migration **`20260928120000_learning_paths`** on Neon | **Complete** — Database Migrate Deploy **#6** from `main` @ `c93a743` |
| Vercel Production **`DATABASE_URL`** | **Fixed** — Neon **pooled** connection string (`-pooler` + `pgbouncer=true` per `.env.example`); Production redeployed |
| New-user **`user.created` webhook → `users` + `profiles`** | **Verified** in production (post-fix sign-up) |
| TASK-204 production smoke test | **Passed** — sign-up → onboarding (goal → experience → quiz → path) → **`/roadmap`** |
| MVP-M1 learner outcome | **Operationally verified** (minimal `/roadmap` from TASK-204 acceptable until TASK-205) |

**Known limitation:** Users created while Production used a **non-pooled / unreachable**
`DATABASE_URL` may lack webhook-persisted **`users`/`profiles`** rows. **Do not** change
TASK-211 architecture (webhook remains sole creator). Those accounts need ops/support
remediation or re-sign-up — not application-level profile auto-create.

---

### MVP-M2 — Lesson 1 completable (editor, preview, progress)

**Learner outcome:** Complete **Lesson 1** inside BuildLearn: blocks, Monaco,
iframe preview, client grading, progress saved, **next step unlocks** on roadmap.

| Item | Detail |
| ---- | ------ |
| **Maps to** | **TASK-206** + **TASK-207** (deliver together), `lesson_progress` schema |
| **Dependencies** | **MVP-M1**; Lesson 1 content (TASK-104 ✅) |
| **Likely modules** | `src/app/(app)/learn/**`, lesson player components, grading lib, progress API, `/learn` redirect v1 |
| **Tests** | Lesson schema; grader unit tests; progress API; completion unlock |
| **Definition of done** | Signed-in user completes L1 end-to-end; refresh shows completed node; next node unlocked |
| **Production status** | **Verified** 2026-10-03 — see `docs/reviews/mvp-m2-production-verification.md` |

---

### MVP-M3 — Context-aware AI mentor (Lesson 1 slice)

**Learner outcome:** **Context-aware teaching** during Lesson 1 activities — progressive
help per **ADR-023**, not generic chat or instant solutions. Teacher-not-builder (ADR-001).

**Authoritative plan:** [`docs/plans/MVP-M3-TASK-203-ai-mentor.md`](plans/MVP-M3-TASK-203-ai-mentor.md)

| Item | Detail |
| ---- | ------ |
| **Maps to** | **TASK-203** (P2) + **TASK-203-UI** (P1) — Phase 12 tutor **slice** only |
| **Dependencies** | **MVP-M2 production verified** @ `7d09768`; `OPENAI_API_KEY`; Upstash recommended for FR-9.6 |
| **Not in M3** | Lessons 2–3, challenges, project/build tutor, AI paths, unrestricted chat, TASK-205, MVP-M4 |
| **Schema** | Reuse `lesson_progress.hints_used`; **no** `ai_conversations` / `ai_messages` for M3 |
| **API** | `POST /api/ai/mentor/help`, `GET /api/ai/mentor/quota` |
| **Help policy** | ADR-023 levels 1–4; server-side `help-policy.ts`; stuck signals from player |
| **Quota** | FR-9.6 enforced via Upstash; defaults 30/month (PRD §3), 10 RPM (ARCHITECTURE §3.6); prod Redis required |
| **Struggle** | `POST /api/ai/mentor/grader-event` + Redis `MentorBlockState`; level 4 needs fails after L3 help |
| **Definition of done** | Founder golden path: “Label the page parts” completable with in-app mentor only; §16 smoke checklist |

---

### MVP-M4 — ~3 lessons & project workspace (first MVP target)

**Learner outcome:** Progress through **~3 complete lessons**; **begin** persistent
multi-file **project** workspace tied to goal (initial milestone shell OK).

| Item | Detail |
| ---- | ------ |
| **Maps to** | Curriculum expansion (lessons 2–3 minimum), **TASK-210** (project workspace v1), dashboard **Continue learning** (FR-10) |
| **Dependencies** | **MVP-M3** |
| **Likely modules** | `content/lessons/**`, seed/migrations, `(app)/dashboard`, `(app)/project/**`, project APIs |
| **Tests** | E2E: onboarding → L1 → L2 → L3; project file save/load |
| **Definition of done** | Founder testable loop: onboarding → roadmap → **3 lessons** with AI assist → **project workspace opens** with saved files |

---

### Post–first-MVP backlog (unchanged vision, deferred)

| Area | Legacy tasks / phases | Notes |
| ---- | --------------------- | ----- |
| Remaining lessons (4–12) | TASK-104 follow-on | Content + seed |
| 8 challenges | TASK-208 | After lesson loop stable |
| Full mastery / streak UI | TASK-209, FR-3.3–3.4 | Heuristics may start in M4 thin form |
| Full Build Mode (5 recipes) | Phase 11 | Not required for first MVP test |
| AI-generated path refinement | TASK-204 AI enhancement, FR-2.4 | After deterministic path proven |
| Roadmap polish | Replay ADR-017, auto-scroll ADR-018 | P0 for full MVP, not first slice |
| Placement server persistence | ADR-021 deferred | Inspect if skip rules need server signals |

---

## Phase 4 — complete (historical)

**Goal:** Phase 4 onboarding — authenticated users complete onboarding with profile-backed persistence and resume (ADR-021).

**Status:** **Phase 4 minimum DoD complete (2026-09-16).** All TASK-201–213 merged.
**OPS-PHASE4-001 `done` (2026-09-28).** Delivery continues under **MVP milestones** above.

### Phase 4 boundary (2026-08-10)

**P1 complete (merged):**
- TASK-201 — onboarding wizard UI
- TASK-202 — placement quiz UI + client-side scoring

**P2 complete (merged and operational):**
- TASK-211 — Profile & onboarding persistence API (2026-08-12; Neon migration verified 2026-08-12)
- TASK-212 — Onboarding resume & auth routing (2026-09-02)

**P1 profile integration (merged):**
- TASK-213 — Onboarding UI profile integration (2026-09-16)

**ADR-021 decisions:** `onboardingStep` enum on `profiles`; persist goal, experience,
completion, and resume step only; placement quiz remains client/sessionStorage
authoritative for Phase 4.

### Operational follow-up — TASK-211 onboarding_step migration — complete (2026-08-12)

- ~~Deploy migration **`20260811120000_onboarding_step`** to Neon via **Database Migrate Deploy**~~ — **complete**
- ~~Verify `profiles.onboarding_step` column exists (nullable `OnboardingStep` enum)~~ — **complete**
- **TASK-211 fully complete operationally** — TASK-212 database prerequisite cleared; TASK-213 TASK-211 dependency satisfied
- **Not run during TASK-211 merge** — completed as post-merge operational follow-up

### OPS-PHASE4-001 — complete (2026-09-28)

| Track | Status |
| ----- | ------ |
| **Repository alignment** | **COMPLETE** (merged 2026-09-16) |
| **Deployment environment alignment** | **COMPLETE** — Production verified |

**Verification recorded (tracking only, 2026-09-28):**
- Production deploy Ready (`ef7b37e`+, middleware `28b727e` for Clerk `/__clerk` proxy)
- Clerk Sign In / Sign Up UI on `https://buildlearn-two.vercel.app`
- Google OAuth configured; end-to-end sign-in tested (Testing mode intentional)
- Sign-up entry → `/onboarding/goal` per env alignment

**Task status:** **`done`** — see Completed table and YAML below.

### Operational follow-up (before TASK-104) — complete (2026-08-10)

- ~~Deploy migration **`20260810170000_concept_graph_and_goal_templates`** to Neon via **Database Migrate Deploy**~~ — **complete**
- ~~Run **Database Seed** workflow (`.github/workflows/db-seed.yml`, confirmation **`seed`**)~~ — **complete**
- ~~Verify curriculum rows in Neon~~ — **complete:**
  - `concepts` = **24**
  - `goal_templates` = **5**
  - `concept_prerequisites` = **36**

### Operational follow-up (lesson data in Neon) — complete (2026-08-10)

- ~~Deploy migration **`20260810173000_lessons`** to Neon via **Database Migrate Deploy**~~ — **complete**
- ~~Run **Database Seed** workflow (confirmation **`seed`**)~~ — **complete**
- ~~Verify Lesson 1 in Neon~~ — **complete:**
  - `lessons.id` = **`how-websites-work`**
  - `lessons.title` = **How Websites Work**

---

## Phase 2 — Authentication (complete)

**Goal:** Clerk authentication foundation — sign-in/sign-up, middleware, env validation, user sync webhook.

**Status:** TASK-101 merged (2026-08-06). BUG-101-001 post-sign-in redirect fixed (2026-08-06). Prisma–Neon configuration merged (2026-08-08). **TASK-102 merged (2026-08-10).** Manual Neon migration deploy workflow merged (2026-08-10). Init migration BOM recovery merged (2026-08-10). Phase 2 auth foundation complete.

### Operational follow-up (before production use)

- ~~Run **Database Migrate Resolve** then **Database Migrate Deploy** to apply `20250805103100_init`~~ — **complete (2026-08-10)**; Neon has `users`, `profiles`, `_prisma_migrations`
- If local Prisma CLI P1001 persists, use the CI workflow instead of `pnpm prisma:migrate` locally (`docs/notes/prisma-neon-connectivity.md`)
- ~~Register Clerk webhook endpoint → `POST /api/webhooks/clerk`~~ — **configured in Production (2026-09-28)**
- ~~Add real `CLERK_WEBHOOK_SIGNING_SECRET` to deployment environments~~ — **configured in Production (2026-09-28)**
- ~~Live sign-up → confirm **`users` + `profiles` rows in Neon** via webhook (`user.created`)~~ — **verified in production (2026-09-29)** after Vercel pooled `DATABASE_URL` fix (see § Operational — TASK-204 / MVP-M1 production).

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
Status: done
Dependencies: [TASK-103]
Priority: P0
Branch: feature/TASK-104-lesson-schema
Merged: 2026-08-10
Files:
  - prisma/schema.prisma  # lessons table
  - src/lib/schemas/lesson.ts
  - content/lessons/01-how-websites-work.json
  - prisma/seed.ts
  - prisma/migrations/20260810173000_lessons/**
  - tests/unit/lesson-schema.test.ts
Acceptance Criteria:
  - Zod schema validates lesson block types: objective, explain, interact, exercise, quiz, bridge
  - Lesson 1 seeded and queryable via Prisma
Tests Required:
  - Unit test: schema accepts valid lesson, rejects invalid
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-104.md)
Notes: |
  Merged to main 2026-08-10. Operationally complete 2026-08-10.
  Migration `20260810173000_lessons` deployed to Neon via Database Migrate Deploy.
  Database Seed workflow completed successfully.
  Neon verified: lessons.id=how-websites-work, title=How Websites Work.
```

---

## Backlog — Phase 4 (User Onboarding)

### TASK-201
```yaml
TASK-ID: TASK-201
Title: Onboarding wizard UI
Description: |
  Implement the `(onboarding)` route group and four-step wizard UI per
  UX_SPECIFICATION.md §5.3–5.6. Client-side navigation and validation only;
  stub/mock path data on the path preview step. No profile API, no real AI
  path generation, no roadmap page implementation.
Owner: Programmer 1
Status: done
Priority: P0
Phase: 4
Dependencies: [TASK-101, TASK-102, TASK-103, TASK-104]
Branch: feature/TASK-201-onboarding-wizard
Merged: 2026-08-10
Files:
  - src/app/(onboarding)/layout.tsx
  - src/app/(onboarding)/goal/page.tsx
  - src/app/(onboarding)/experience/page.tsx
  - src/app/(onboarding)/quiz/page.tsx
  - src/app/(onboarding)/path/page.tsx
  - src/components/onboarding/**
  - src/lib/auth-routes.ts
  - src/middleware.ts
  - src/app/sign-up/[[...sign-up]]/page.tsx
  - tests/unit/auth-routes.test.ts
  - tests/unit/onboarding/**
Acceptance Criteria:
  - Authenticated new users are directed from sign-up to /onboarding/goal
  - Onboarding contains four visible steps — goal, experience, quiz, path
  - Goal screen — textarea, 10–500 character validation, example goal chips, Continue disabled until valid
  - Experience screen — beginner, some_exposure, intermediate; Continue requires selection
  - Quiz screen — route exists, correct onboarding shell, user can skip to path; full quiz content/scoring deferred to TASK-202
  - Path screen — loading, error, and loaded preview states; stub/mock path data only; Start learning CTA
  - Onboarding completion destination is /roadmap (CTA may link to /roadmap; roadmap page itself is NOT implemented in this task)
  - /onboarding/* requires authentication
  - Onboarding uses no normal authenticated app navigation
  - Responsive/mobile behavior follows UX_SPECIFICATION.md
Tests Required:
  - Unit test — onboarding auth-route classification
  - Unit test — goal validation (min 10, max 500 characters)
  - Unit test — experience selection requirement
  - Unit test — quiz skip navigation to path step
  - Unit test — path loading, error, and loaded preview states where practical
  - Unit test — sign-up redirect target is /onboarding/goal
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-201.md)
Notes: |
  Merged to main 2026-08-10. Onboarding wizard UI: `/onboarding/goal`,
  `/onboarding/experience`, `/onboarding/quiz` (shell), `/onboarding/path`
  (stub preview). Sign-up redirect → `/onboarding/goal`; Start learning CTA
  → `/roadmap`. Client-side wizard state via sessionStorage; no profile API.

  **Pre-production follow-up (post-merge, not a merge blocker):**
  Align `.env.example` and deployment
  `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding/goal` with P2
  (FILE_OWNERSHIP). Application SignUp component already uses
  `SIGN_UP_REDIRECT`.

  **Out of scope (do NOT implement in TASK-201):**
  profile persistence API, onboarding resume logic (requires profile read),
  quiz question implementation/scoring (TASK-202), real AI path generation
  (Phase 5 TASK-203/204), learning_paths tables, /roadmap page implementation
  (Phase 6 TASK-205), lesson player, project creation, OpenAI integration,
  Prisma schema changes, API routes, TASK-202+.

  **Phase 4 backend dependency (separate from TASK-201):**
  Profile persistence and onboarding resume logic (goal/experience save,
  onboarding_complete flag, sign-in resume step) are Programmer 2 Phase 4
  work — profile API — not part of this task. TASK-201 may use client-side
  wizard state until that API ships.

  **Sign-up redirect:** Update SignUp forceRedirectUrl in
  src/app/sign-up/[[...sign-up]]/page.tsx. Coordinate
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL in .env.example with P2
  (FILE_OWNERSHIP — .env.example owned by Programmer 2).

  **Completion destination:** Frozen UX (UX_SPECIFICATION.md §138) and
  ADR-020 — onboarding complete → /roadmap. TASK-201 wires the Start
  learning CTA to /roadmap; the roadmap page is implemented in TASK-205.

  **Path preview:** Use stub/mock path data only. Real generation is Phase 5.

  **Dependencies satisfied:** Phase 2 auth (TASK-101/102) and Phase 3 content
  (TASK-103/104) complete. Profile fields already exist on profiles table;
  no schema migration required for UI-only work.
```

### TASK-202
```yaml
TASK-ID: TASK-202
Title: Placement quiz
Description: |
  Replace the TASK-201 `/onboarding/quiz` placeholder with a 5-question
  curated placement quiz UI. One MCQ per screen, progress dots, skip option,
  and deterministic client-side scoring/signals stored in sessionStorage.
  Question data lives under src/lib/onboarding/ (P1-owned). No backend,
  profile persistence, Prisma changes, or path-preview modifications.
Owner: Programmer 1
Status: done
Priority: P1
Phase: 4
Dependencies: [TASK-201]
Branch: feature/TASK-202-placement-quiz
Merged: 2026-08-10
Files:
  - src/components/onboarding/quiz-shell-screen.tsx
  - src/components/onboarding/onboarding-provider.tsx
  - src/lib/onboarding/types.ts
  - src/lib/onboarding/constants.ts
  - src/lib/onboarding/placement-quiz.ts
  - src/lib/onboarding/placement-quiz-questions.ts
  - src/lib/onboarding/placement-scoring.ts
  - src/app/(onboarding)/onboarding/quiz/page.tsx
  - tests/unit/onboarding/placement-quiz.test.ts
  - tests/unit/onboarding/placement-scoring.test.ts
  - tests/unit/onboarding/quiz-skip.test.tsx
Acceptance Criteria:
  - /onboarding/quiz renders exactly 5 curated MCQs aligned with beginner HTML/CSS/JS concept set
  - One question shown at a time; quiz progress indicator/dots visible
  - Next cannot advance without a selected answer
  - User can skip at any point — skip sets quizSkipped true and navigates to /onboarding/path
  - Completing all five sets quizSkipped false, stores answers in onboarding client state, computes deterministic client-side placement result, navigates to /onboarding/path
  - Placement result does not modify the stub path preview (Phase 5 consumption)
  - sessionStorage preserves quiz state within the browser session where practical
  - No backend, API, or database functionality introduced
  - Existing TASK-201 onboarding flow remains intact
Tests Required:
  - Unit test — exactly 5 questions with deterministic question IDs
  - Unit test — one-question-at-a-time navigation
  - Unit test — answer required before advancing
  - Unit test — progress indicator reflects current question
  - Unit test — skip from quiz sets quizSkipped and targets /onboarding/path
  - Unit test — final completion flow stores answers and navigates to /onboarding/path
  - Unit test — deterministic scoring (totalCorrect, totalQuestions, percentage)
  - Unit test — scoring boundary cases
  - Unit test — onboarding provider/sessionStorage quiz state round-trip
  - Unit test — regression of TASK-201 quiz skip/path behavior
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-202.md)
Notes: |
  Merged to main 2026-08-10. Placement quiz: 5 curated MCQs, one-at-a-time UI,
  progress dots, skip → `/onboarding/path`, deterministic client-side scoring
  in sessionStorage. Path preview unchanged (stub/mock).

  **Question content location (Master decision):**
  Curated question data under `src/lib/onboarding/` (P1-owned). Do NOT create
  `content/placement-quiz.json` — `content/` is P2-owned per FILE_OWNERSHIP.

  **Scoring boundary (Master decision):**
  TASK-202 includes deterministic client-side scoring/signals only:
  totalCorrect, totalQuestions, percentage; optional simple domain/concept
  summary if clearly useful. No backend scoring, no profile persistence, no
  Prisma/schema changes, no Neon writes, no concept_mastery models.

  **Placement signals:** Stored in client onboarding state for later Phase 5
  path generation (TASK-204). TASK-202 does NOT change stub path preview or
  roadmap nodes (FR-3.9 deferred to Phase 5+).

  **P2 boundary (separate from TASK-202):**
  Profile persistence, onboarding resume backend logic, and placement quiz
  backend/API remain Programmer 2 Phase 4 work — not part of this task.

  **Pre-production follow-up (not a TASK-202 blocker):**
  Align `.env.example` and deployment
  `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding/goal` with P2.
  Application SignUp already uses SIGN_UP_REDIRECT from TASK-201.

  **Out of scope (do NOT implement in TASK-202):**
  profile persistence, onboarding resume backend logic, placement quiz
  backend/API, Prisma/schema changes, Neon writes, concept_mastery writes,
  AI/OpenAI, runtime AI-generated questions, real path generation, changing
  roadmap nodes based on quiz results, /roadmap implementation, lesson/challenge
  quizzes, TASK-203+.

  **Dependencies satisfied:** TASK-201 merged; /onboarding/quiz shell,
  onboarding provider, and sessionStorage wizard state exist on main.
```

### TASK-211
```yaml
TASK-ID: TASK-211
Title: Profile & onboarding persistence API
Description: |
  Implement authenticated profile read/write for Phase 4 onboarding persistence
  per ADR-021. Add OnboardingStep enum and onboardingStep column to profiles.
  Expose GET/PATCH for the authenticated user's own profile onboarding fields
  only. Webhook remains source of User/Profile row creation.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 4
Dependencies: [TASK-101, TASK-102, TASK-201, TASK-202]
Branch: feature/TASK-211-profile-onboarding-api
Files:
  - prisma/schema.prisma
  - prisma/migrations/**
  - src/app/api/profile/route.ts
  - src/server/services/profile-service.ts
  - src/lib/onboarding/onboarding-step.ts
  - tests/unit/profile-service.test.ts
  - tests/unit/profile-route.test.ts
Acceptance Criteria:
  - OnboardingStep enum added — goal, experience, quiz, path
  - onboardingStep nullable column added to profiles via migration
  - GET /api/profile returns authenticated user's profile onboarding fields
  - PATCH /api/profile updates learningGoalText, experienceLevel, onboardingStep, onboardingComplete for own user only
  - Validates learningGoalText 10–500 characters
  - Validates experienceLevel against ExperienceLevel enum
  - Validates onboardingStep against OnboardingStep enum
  - Validates onboardingComplete boolean
  - No arbitrary userId input — Clerk session identifies user
  - User may access/update only own profile (no IDOR)
  - Webhook remains source of User/Profile creation — API does not create users
  - Does NOT persist placement quiz answers, scores, skip state, or placementResult
  - Does NOT write placement data to goalSummary
Tests Required:
  - Unit test — GET returns own profile fields
  - Unit test — PATCH updates allowed onboarding fields
  - Unit test — goal validation min/max length
  - Unit test — experience enum validation
  - Unit test — onboardingStep enum validation
  - Unit test — rejects unauthenticated requests
  - Unit test — rejects cross-user access / no arbitrary userId
  - Unit test — profile row must pre-exist (webhook-created)
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-211.md)
Notes: |
  **Authority:** ADR-021 Phase 4 onboarding persistence model.

  **Persisted fields (Phase 4 minimum):** learningGoalText, experienceLevel,
  onboardingStep, onboardingComplete. Placement quiz data remains client-only.

  **Merged to main 2026-08-12.** Implementation `fff27fe`; checker review `0daacf7`.

  **Operational follow-up complete (2026-08-12):** migration
  `20260811120000_onboarding_step` deployed to Neon via Database Migrate Deploy;
  `profiles.onboarding_step` verified. TASK-211 fully complete operationally.

  **Out of scope:** onboarding resume routing (TASK-212), P1 UI integration
  (TASK-213), placement signal persistence, goalSummary AI writes, TASK-203+.
```

### TASK-212
```yaml
TASK-ID: TASK-212
Title: Onboarding resume & auth routing
Description: |
  Implement profile-aware onboarding resume and auth routing per ADR-021.
  Incomplete users resume stored or inferred onboarding step on sign-in.
  Completed users route to /dashboard. Guard app routes for incomplete
  onboarding; prevent completed users re-entering onboarding wizard.
Owner: Programmer 2
Status: done
Priority: P0
Phase: 4
Dependencies: [TASK-211]
Branch: feature/TASK-212-onboarding-resume-routing
Files:
  - src/lib/auth-routes.ts
  - src/lib/onboarding/onboarding-step.ts
  - src/lib/onboarding/onboarding-resume.ts
  - src/middleware.ts
  - src/app/sign-in/[[...sign-in]]/page.tsx
  - tests/unit/onboarding-resume.test.ts
  - tests/unit/auth-routes.test.ts
Acceptance Criteria:
  - onboardingComplete true → authenticated home /dashboard
  - onboardingComplete false → redirect to stored onboardingStep route
  - onboardingStep null → infer goal if no learningGoalText; experience if no experienceLevel; else /onboarding/quiz
  - Never infer /onboarding/path without explicit onboardingStep path
  - Incomplete user accessing protected app routes redirected to resume route where practical
  - Completed user accessing /onboarding/* redirected to /dashboard
  - New sign-up continues to /onboarding/goal (unchanged from TASK-201)
  - Sign-in forceRedirectUrl may remain /dashboard; dynamic resume handled in app logic
  - No UI redesign
Tests Required:
  - Unit test — complete user → /dashboard
  - Unit test — incomplete user with stored step → correct route
  - Unit test — inference fallback goal / experience / quiz
  - Unit test — never infer path without stored step
  - Unit test — completed user blocked from onboarding routes
  - Unit test — incomplete user blocked from app routes (where applicable)
  - Unit test — regression of existing auth-route classification
Reviewer: Checker (APPROVED FOR MERGE — docs/reviews/TASK-212.md)
Notes: |
  **Authority:** ADR-021 routing and resume inference rules.

  **Merged to main 2026-09-02.** Implementation `09b1922`; checker review `ec8047a`.

  **Delivered:** ADR-021 resume resolver; profile-aware authenticated routing via
  middleware + sign-in server redirect; incomplete-user resume; completed-user
  redirect to `/dashboard`; app/onboarding route gating. READ + ROUTE only — no
  Profile writes; no Prisma migration required.

  **Depends on TASK-211** — satisfied. Database prerequisite cleared (2026-08-12).

  **Out of scope:** profile PATCH (TASK-211), P1 provider integration (TASK-213),
  placement persistence, TASK-203+.
```

### TASK-213
```yaml
TASK-ID: TASK-213
Title: Onboarding UI profile integration
Description: |
  Connect existing TASK-201/202 onboarding UI to the TASK-211 profile API.
  Backend becomes source of truth for goal, experience, onboardingStep, and
  onboardingComplete. sessionStorage remains local convenience/cache only.
  Preserve TASK-201/202 UX; no new backend endpoints.
Owner: Programmer 1
Status: done
Priority: P0
Phase: 4
Dependencies: [TASK-211, TASK-212]
Branch: feature/TASK-213-onboarding-profile-integration
Merged: 2026-09-16
Delivered:
  - Onboarding UI connected to authenticated GET/PATCH /api/profile
  - Persisted profile is durable source of truth for goal and experience (hydration)
  - Goal continue: learningGoalText + onboardingStep=experience
  - Experience continue: experienceLevel + onboardingStep=quiz
  - Quiz complete/skip: onboardingStep=path only (placement remains client/session-only)
  - Start learning: onboardingComplete=true + onboardingStep=path; navigate /roadmap on success
  - PATCH failures prevent navigation and allow retry
  - No Prisma migration required
Files:
  - src/components/onboarding/onboarding-provider.tsx
  - src/components/onboarding/goal-screen.tsx
  - src/components/onboarding/experience-screen.tsx
  - src/components/onboarding/quiz-shell-screen.tsx
  - src/components/onboarding/path-preview-screen.tsx
  - src/lib/onboarding/onboarding-client.ts
  - tests/unit/onboarding/onboarding-profile-integration.test.ts
  - tests/unit/onboarding/**
Acceptance Criteria:
  - Hydrate goal, experience, onboardingStep from profile API on load
  - Goal saved to profile on successful continue; onboardingStep advances to experience
  - Experience saved on continue; onboardingStep advances to quiz
  - Quiz skip or completion proceeding to path sets onboardingStep path (no placement DB writes)
  - Start learning sets onboardingComplete true; onboardingStep remains path
  - sessionStorage not source of truth — syncs from API where practical
  - TASK-201/202 quiz client state (answers, placementResult) remains sessionStorage-only
  - Existing onboarding UX preserved — no redesign
  - No new API routes — consumes TASK-211 only
Tests Required:
  - Unit test — provider hydrates from profile API
  - Unit test — goal save advances step
  - Unit test — experience save advances step
  - Unit test — quiz proceed advances step to path
  - Unit test — Start learning sets onboardingComplete
  - Unit test — sessionStorage subordinate to API hydration
  - Unit test — TASK-201/202 regression (validation, quiz scoring, path preview)
Reviewer: Checker
Notes: |
  **Authority:** ADR-021 step update policy.

  **Depends on TASK-211.** TASK-211 dependency satisfied (API merged and Neon
  migration verified 2026-08-12). **TASK-212 merged (2026-09-02)** — resume routing
  foundation available. TASK-212 resume routing should land first or in parallel;
  P1 integration must not assume resume routing until TASK-212 merged for sign-in
  flows — **TASK-212 now merged.**

  **Out of scope:** backend API (TASK-211), middleware resume (TASK-212),
  placement server persistence, profile fields beyond ADR-021, TASK-203+.
```

### OPS-PHASE4-001
```yaml
TASK-ID: OPS-PHASE4-001
Title: Clerk redirect alignment (Phase 4)
Description: |
  Align .env.example and deployment Clerk sign-up redirect with Phase 4
  onboarding entry. Sign-in redirect remains /dashboard; incomplete-user
  resume is handled by TASK-212 application logic.
Owner: Programmer 2
Status: done
Priority: P1
Phase: 4
Dependencies: []
Branch: ops/phase-4-clerk-redirect
Completed: 2026-09-28
Files:
  - .env.example
  - docs/TASK_QUEUE.md
Acceptance Criteria:
  - NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding/goal in .env.example
  - Outdated Phase 4 comment updated
  - Deployment environment documented in TASK_QUEUE or ops notes
  - NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL remains /dashboard
  - No application SignUp component regression — aligns with SIGN_UP_REDIRECT
  - Production deployment env verified and smoke-tested
Tests Required:
  - Existing auth-redirect.test.tsx continues to pass or updated intentionally
Reviewer: Checker
Notes: |
  **Repository alignment:** merged 2026-09-16. **Deployment verified:** 2026-09-28
  (Production Clerk, sign-up/sign-in UI, Google OAuth, onboarding entry). Closed
  in tracking only; no production config changes in this docs commit.
```

---

## Backlog — First MVP (MVP-M1 → MVP-M4)

| Milestone | Task ID | Title | Owner | Priority | Status | Notes |
| --------- | ------- | ----- | ----- | -------- | ------ | ----- |
| **MVP-M1** | **TASK-204** | Deterministic path generation & persistence | P2 | P0 | **done** | Merged + Neon migration + prod smoke **2026-09-29** |
| **MVP-M1** | **TASK-205** | Roadmap UI (`/roadmap`) v1 | P1 | P1 | **deferred** | After MVP-M2; functional `/roadmap` OK for now |
| **MVP-M2** | **TASK-206** | Lesson player | P1 | P0 | done | Merged `338b2af`; prod smoke pending |
| **MVP-M2** | **TASK-207** | Monaco + iframe preview | P1 | P0 | done | Merged `338b2af`; migration pending |
| **MVP-M3** | **TASK-203** | AI mentor backend (provider, API, policy, quota) | P2 | P0 | pending | Plan revised — Checker re-review |
| **MVP-M3** | **TASK-203-UI** | Lesson 1 mentor panel + grader-event client | P1 | P0 | pending | Same branch as TASK-203 |
| **MVP-M4** | *(content)* | Lessons 2–3 seed + player | P2 | P0 | pending | Extend TASK-104 pattern |
| **MVP-M4** | **TASK-210** | Project workspace v1 | P1 | P0 | pending | Multi-file; begin project after ~3 lessons |
| *Post-MVP* | **TASK-208** | Challenge system | P2 | P0 | pending | After first MVP loop |
| *Post-MVP* | **TASK-209** | Mastery service | P2 | P0 | pending | Full FR-6; thin updates may land in M4 |
| *Post-MVP* | *(Phase 11)* | Build Mode (5 recipes) | P1 | P0 | pending | Not first MVP target |

### TASK-204 (MVP-M1 — complete)
```yaml
TASK-ID: TASK-204
Title: Deterministic learning path generation & persistence
Description: |
  Generate and persist a personalized learning path from goal templates, concept
  graph, and profile fields (experience level). ADR-022: no AI path dependency
  for this task. Replace onboarding mock path preview with real persisted steps.
  Enable roadmap and first-lesson navigation (TASK-205 may follow or overlap).
Owner: Programmer 2
Status: done
Completed: 2026-09-29
Priority: P0
Phase: MVP-M1
Dependencies: [TASK-103, TASK-104, TASK-211, TASK-213]
Branch: feature/TASK-204-deterministic-path (squash-merged to main a6e859e)
Checker: docs/reviews/TASK-204.md (APPROVED FOR MERGE, HEAD 85c3399)
Operational: migration 20260928120000_learning_paths deployed Neon Migrate Deploy #6 (2026-09-29)
Production: smoke test passed; Vercel DATABASE_URL = Neon pooled URL
Files:
  - prisma/schema.prisma
  - prisma/migrations/**
  - src/server/services/**  # path generation
  - src/app/api/**          # path/roadmap read APIs as designed
  - src/lib/onboarding/**   # handoff from mock to real path
  - src/lib/auth-routes.ts  # /roadmap protected when route exists
Acceptance Criteria:
  - learning_paths + learning_path_steps persisted per ARCHITECTURE.md
  - Path respects concept prerequisite DAG
  - Goal template matching selects concept set / ordering rules
  - Path created when user completes onboarding (Start learning)
  - Deterministic output for same profile inputs (no LLM required)
  - First step references lesson how-websites-work and is unlocked
Tests Required:
  - Unit: template match, DAG validation, step ordering
  - Unit/API: auth — user can read only own path
Reviewer: Checker
Notes: |
  Placement quiz remains client/sessionStorage (ADR-021); optional skip rules
  may use client signals in a follow-up. Do not start TASK-203 in this branch.
```

### TASK-206 (MVP-M2 — lesson player UI)
```yaml
TASK-ID: TASK-206
Title: Lesson player UI (Lesson 1)
Description: |
  Replace /learn/lessons/[lessonId] placeholder with a functional block-based player
  for how-websites-work. Sequential block navigation, completion UX, roadmap return.
  Consumes TASK-207 APIs and client grading helpers. No AI hints (MVP-M3).
Owner: Programmer 1
Status: done
Priority: P0
Phase: MVP-M2
Dependencies: [TASK-104, TASK-204, TASK-207 APIs/contracts]
Branch: feature/MVP-M2-lesson-1 (merged to main 2026-09-29)
Files:
  - src/app/(app)/learn/lessons/[lessonId]/**
  - src/components/lesson-player/**
  - src/lib/lesson-player/**          # client fetch helpers, shared types (with P2)
  - package.json                      # Monaco dep — Master-approved only
  - tests/unit/lesson-player/**       # RTL/player flow as needed
Acceptance Criteria:
  - Player renders all six L1 block types from seeded DB content
  - Learner can step through blocks; interact/exercise use editor+preview; quiz gated
  - Complete lesson triggers TASK-207 completion API; redirects to /roadmap
  - Locked lessons/path steps not openable from player URL alone
Tests Required:
  - Component/flow tests for block navigation and quiz gating
  - Uses mocked TASK-207 API responses
Reviewer: Checker
Notes: |
  Deliver on same branch/integration window as TASK-207. TASK-205 polish out of scope.
```

### TASK-207 (MVP-M2 — editor, grading, progress, path unlock)
```yaml
TASK-ID: TASK-207
Title: Monaco, preview, client grading, lesson progress & path unlock
Description: |
  lesson_progress migration (not applied during dev). Load L1 from lessons table.
  Client-side HTML graders for L1 interact/exercise. Persist progress; atomic
  lesson completion updates learning_path_steps (complete current lesson step,
  unlock next). Auth-scoped APIs only.
Owner: Programmer 2
Status: done
Priority: P0
Phase: MVP-M2
Dependencies: [TASK-104, TASK-204]
Branch: feature/MVP-M2-lesson-1 (merged to main 2026-09-29)
Files:
  - prisma/schema.prisma
  - prisma/migrations/**              # lesson_progress only
  - src/server/services/lesson-progress-service.ts
  - src/server/services/learning-path-service.ts  # step complete/unlock helpers
  - src/lib/grading/**                # L1 HTML graders (client-safe)
  - src/lib/lesson-player/contracts.ts # API DTOs shared with P1
  - src/app/api/lessons/**
  - src/app/api/lesson-progress/**
  - tests/unit/grading/**
  - tests/unit/lesson-progress-service.test.ts
  - tests/unit/learning-path-step-unlock.test.ts
Acceptance Criteria:
  - lesson_progress persisted per user+lesson; Clerk String user_id FK
  - GET lesson returns parsed Zod-valid content for how-websites-work
  - Complete lesson in one transaction: progress completed + path step completed + next available
  - Idempotent complete; user cannot unlock another user's steps (IDOR tests)
  - Graders pass golden L1 solutions; reject obvious failures
Tests Required:
  - Grader unit tests; service transaction tests; API auth tests
Reviewer: Checker
Notes: |
  Do not apply migration to Neon until Checker-approved merge + Migrate Deploy workflow.
  No TASK-203, no lesson 2–3, no dashboard/build mode.
```

### TASK-203 (MVP-M3 — AI mentor backend)
```yaml
TASK-ID: TASK-203
Title: AI mentor backend — provider abstraction, context, policy, API (Lesson 1)
Description: |
  MVP-M3 P2 work: AIService + OpenAI/mock providers, Redis MentorBlockState,
  POST /api/ai/mentor/grader-event + /help + GET quota. Server-only help policy (§7.2).
  Production requires Upstash (503 if missing). hints_used server-only increment.
  Lesson how-websites-work only. Spec: docs/plans/MVP-M3-TASK-203-ai-mentor.md
Owner: Programmer 2
Status: pending
Priority: P0
Phase: MVP-M3
Dependencies: [TASK-206, TASK-207]
Branch: feature/MVP-M3-lesson-1-mentor
Files:
  - src/ai/**
  - src/app/api/ai/mentor/**
  - src/lib/ai/mentor-contracts.ts
  - src/server/services/mentor-quota-service.ts
  - src/server/services/mentor-block-state-service.ts
  - src/ai/mentor/fallback-copy.ts
  - src/env.ts
  - .env.example
  - package.json  # ai + @ai-sdk/openai + optional @upstash/ratelimit — Master-coordinated
  - tests/unit/ai/**
  - tests/unit/mentor-route.test.ts
  - tests/unit/grader-event-route.test.ts
  - tests/unit/mentor-block-state.test.ts
  - tests/unit/fallback-copy.test.ts
Acceptance Criteria:
  - AIService interface with OpenAIProvider + MockProvider; CI uses mock only
  - MentorHelpRequest/Response + grader-event Zod contracts shared with P1
  - Help level from Redis MentorBlockState; need_more_help cannot reach 4 without server grader fails after L3
  - grader-event authoritative for failedChecksSinceLastPass
  - Levels 1–2 do not return full L1 exercise solution (automated policy tests)
  - Auth + lesson access + valid blockIndex; IDOR tests pass; POST body max 32 KB
  - Production: Upstash required; 503 if Redis missing; no in-memory prod fallback
  - Quota defaults 30/month (PRD §3), 10 RPM (ARCHITECTURE); 429 when exceeded
  - hints_used incremented server-only in help route (P1 does not PATCH)
  - Provider failure returns fallback-copy contract
  - Only lessonId how-websites-work accepted in M3
Tests Required:
  - help-policy truth table, block-state, grader-event, mentor API auth/quota/503, fallback-copy, mock policy tests
Reviewer: Checker
Notes: |
  Coordinate Wave 0 contracts before TASK-203-UI integrates. Do not implement path
  generation, project reviewer, or TASK-205. Optional ai_usage_logs migration out of M3 DoD.
```

### TASK-203-UI (MVP-M3 — lesson mentor UI)
```yaml
TASK-ID: TASK-203-UI
Title: Lesson 1 AI mentor panel — UX, stuck detection, API client
Description: |
  MVP-M3 P1 work: AI mentor sidebar/FAB per UX_SPEC §5.10. POST grader-event after
  each Run check; POST /help with client context only. Static fallback on 503.
  No PATCH hintsUsed. Spec: docs/plans/MVP-M3-TASK-203-ai-mentor.md
Owner: Programmer 1
Status: pending
Priority: P0
Phase: MVP-M3
Dependencies: [TASK-206, TASK-203 mentor-contracts/API or mocked API]
Branch: feature/MVP-M3-lesson-1-mentor
Files:
  - src/components/lesson-player/ai-mentor-panel.tsx
  - src/components/lesson-player/lesson-player.tsx
  - src/lib/lesson-player/mentor-client.ts
  - src/lib/lesson-player/stuck-detection.ts
  - src/lib/lesson-player/grader-event-client.ts
  - tests/unit/lesson-player/stuck-detection.test.ts
  - tests/unit/lesson-player/grader-event-client.test.ts
  - tests/unit/lesson-player/ai-mentor-panel.test.tsx
Acceptance Criteria:
  - Desktop sidebar + mobile FAB/sheet for mentor
  - Stuck UX when server/local fail count >= 2 or 180s on block
  - Displays help level, quota remaining, mentor messages, 503 fallback copy
  - grader-event called on every graded check pass/fail before mentor help
  - Does not PATCH hintsUsed; replay smoke N/A until replay mode exists
  - Layout aligns with UX_SPEC §5.10 (two-column desktop)
Tests Required:
  - stuck-detection unit tests; panel RTL tests with mocked mentor API
Reviewer: Checker
Notes: |
  Deliver on same integration branch/window as TASK-203. Do not expand to lessons 2–3.
  package.json deps owned by Master/P2 — consume API only.
```

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
| TASK-104 | Lesson schema + Lesson 1 | 2026-08-10 | Programmer 2 |
| TASK-201 | Onboarding wizard UI | 2026-08-10 | Programmer 1 |
| TASK-202 | Placement quiz | 2026-08-10 | Programmer 1 |
| TASK-211 | Profile & onboarding persistence API | 2026-08-12 | Programmer 2 |
| TASK-212 | Onboarding resume & auth routing | 2026-09-02 | Programmer 2 |
| TASK-213 | Onboarding UI profile integration | 2026-09-16 | Programmer 1 |
| OPS-PHASE4-001 | Clerk redirect alignment (prod verified) | 2026-09-28 | Programmer 2 |
| TASK-204 | Deterministic path generation & persistence | 2026-09-29 | Programmer 2 |
| TASK-206 | Lesson player UI (Lesson 1) | 2026-09-29 | Programmer 1 |
| TASK-207 | Lesson progress, grading, path unlock | 2026-09-29 | Programmer 2 |
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
| Phase 3 pending | 0 |
| Phase 3 blocked | 0 |
| Phase 4 P1 complete | 3 |
| Phase 4 P2 complete | 2 |
| Phase 4 P1 pending | 0 |
| Phase 4 ops pending | 0 |
| Phase 4 phase complete | 1 |
| MVP-M1 pending (polish) | 1 (TASK-205 deferred) |
| MVP-M1 complete (core) | 1 (TASK-204; milestone verified in prod) |
| MVP-M2 complete (prod verified) | 2 (TASK-206, TASK-207) |
| First MVP backlog (M3–M4 + post) | 9 |
| Completed (all phases) | 24 |

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
| TASK-104 | 3 | Lesson schema + L1 | P2 | done |
| TASK-201 | 4 | Onboarding wizard UI | P1 | done |
| TASK-202 | 4 | Placement quiz | P1 | done |
| TASK-211 | 4 | Profile & onboarding API | P2 | done |
| TASK-212 | 4 | Onboarding resume routing | P2 | done |
| TASK-213 | 4 | Onboarding UI profile integration | P1 | done |
| OPS-PHASE4-001 | 4 | Clerk redirect alignment | P2 | done |
| TASK-204 | MVP-M1 | Deterministic path generation | P2 | done |
| TASK-205 | MVP-M1 | Roadmap UI v1 | P1 | deferred |
| TASK-206 | MVP-M2 | Lesson player | P1 | done |
| TASK-207 | MVP-M2 | Monaco + preview | P1 | done |
| TASK-203 | MVP-M3 | AI mentor backend (L1) | P2 | pending |
| TASK-203-UI | MVP-M3 | Lesson 1 mentor UI | P1 | pending |
| TASK-210 | MVP-M4 | Project workspace v1 | P1 | pending |
| TASK-208 | post-MVP | Challenge system | P2 | pending |
| TASK-209 | post-MVP | Mastery service | P2 | pending |
