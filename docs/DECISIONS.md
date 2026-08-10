# Decisions — BuildLearn

> **Purpose:** Record architectural decisions and track pending approvals.  
> **Format:** ADR (Architecture Decision Record) for resolved; PENDING for awaiting stakeholder input.  
> **Last updated:** 2026-08-10

---

## Pending Decisions (Require Stakeholder Approval)

| ID | Decision | Recommendation | Impact if delayed |
|----|----------|----------------|-------------------|
| **P-001** | **Product name** | Working codename: **BuildLearn** | Branding, domain, repo rename |
| **P-003** | **AI budget for beta** | $500/month cap initially | AI feature limits |
| **P-004** | **Auth provider** | Clerk (recommended) vs Supabase Auth | Phase 2 implementation |
| **P-005** | **Database host** | Neon (recommended) vs Supabase Postgres | Phase 1 TASK-002 |
| **P-006** | **Primary AI model** | GPT-4o-mini for tutoring, GPT-4o for path gen | Cost vs quality |
| **P-007** | **Content authorship** | Who writes the 12 lessons and 8 challenges? | Phase 3 timeline |
| **P-008** | **Beta access model** | Invite-only (recommended) vs open signup | Launch strategy |
| **P-009** | **Minimum age** | 13+ with age confirmation (recommended) | Legal compliance |
| **P-010** | **Domain name** | TBD based on P-001 | Deployment |
| **P-011** | **Free tier AI limit** | 30 messages/month (recommended) | Monetization |
| **P-012** | **Target MVP launch date** | TBD — estimate 10-14 weeks with agents | Planning |

---

## Approved Decisions

| ID | Decision | Approved | Notes |
|----|----------|----------|-------|
| **P-002** | **Proceed with development** | 2026-08-05 | Planning approved; Phase 1 unblocked |
| **P-013** | **MVP Design Freeze** | 2026-08-05 | UX v1.2 finalized; Phase 2 unblocked pending final go-ahead |

---

## Resolved Decisions (Architect Recommendations)

### ADR-001: Curated Curriculum + AI Personalization (Not Full AI Generation)

**Status:** RECOMMENDED  
**Date:** 2026-08-04

MVP uses human-curated skill graph, lessons, and challenges. AI personalizes ordering, skipping, framing, and tutoring at runtime.

---

### ADR-002: Client-Side Code Execution Only (MVP)

**Status:** RECOMMENDED  
**Date:** 2026-08-04

MVP executes user code only in sandboxed iframe in browser. No server-side execution.

---

### ADR-003: Next.js Monolith on Vercel

**Status:** RECOMMENDED  
**Date:** 2026-08-04

Single Next.js 15 application with API routes and server actions. Deploy to Vercel.

---

### ADR-004: Clerk for Authentication

**Status:** RECOMMENDED (pending P-004)  
**Date:** 2026-08-04

---

### ADR-005: PostgreSQL + Prisma on Neon

**Status:** RECOMMENDED (pending P-005)  
**Date:** 2026-08-04

---

### ADR-006: AI Provider Abstraction via Vercel AI SDK

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-007: Build Mode Recipe-Based (MVP)

**Status:** RECOMMENDED  
**Date:** 2026-08-04

Five recipes: dark mode, mobile nav, hero section, image grid, contact form styling.

---

### ADR-008: Mastery Heuristic Scoring (Not ML)

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-009: Defer Gamification, Social, Payments

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-010: Freemium + AI Credits (Post-MVP)

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-011: Content as Versioned JSON in Repo

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-012: Five-Agent Development Workflow

**Status:** RECOMMENDED  
**Date:** 2026-08-04

---

### ADR-013: Canonical User ID Type (Clerk)

**Status:** ACCEPTED  
**Date:** 2026-08-05

`users.id` is `String` (Clerk user ID format), not UUID.

---

### ADR-014: Phase 1 Scope Boundary

**Status:** ACCEPTED  
**Date:** 2026-08-05

Phase 1: scaffold, Prisma users/profiles, CI, env validation, route placeholders. Auth and content seeding are separate phases.

---

### ADR-015: TASK-001 Foundation Stack

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Context:** Initialize Next.js foundation in an existing repo with pre-created directory layout.

**Decisions:**

1. **Manual scaffold** — `create-next-app` refused non-empty directory; files created manually.
2. **Next.js 15.5 + React 19** — matches architecture doc; installed latest 15.x via pnpm.
3. **Tailwind CSS v4** — via `@tailwindcss/postcss`; no `tailwind.config.ts` (v4 CSS-first config).
4. **shadcn/ui** — `new-york` style; Button component only (required by acceptance criteria).
5. **Single root route** — `src/app/page.tsx` only; route groups `(marketing)` / `(app)` left empty for TASK-004.
6. **Vitest** — smoke test on `@/lib/utils` path alias; no React Testing Library yet.
7. **ESLint flat config** — `eslint.config.mjs` with `@eslint/eslintrc` compat for `eslint-config-next`.
8. **`outputFileTracingRoot`** — set to project root to avoid parent lockfile warning.

**Excluded (per task scope):** Clerk, Prisma, AI SDK, route group pages, env validation (t3-env).

---

### ADR-016: TASK-002 Initial Database Schema

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Decisions:**

1. **`users.id` as `String`** — Clerk user IDs (`user_xxx`), not UUID (supersedes ARCHITECTURE.md UUID wording).
2. **`ExperienceLevel` enum** — `beginner`, `some_exposure`, `intermediate` per PROJECT_CONTEXT canonical constants.
3. **Snake_case columns in PostgreSQL** — via Prisma `@map` for SQL; camelCase in TypeScript client.
4. **Profiles 1:1 with users** — `profiles.user_id` is PK and FK with `onDelete: Cascade`.
5. **Minimal Phase 1 schema** — only `users` and `profiles`; no concepts, paths, or content tables yet.
6. **Migration generated offline** — `prisma migrate diff` SQL committed; apply with `pnpm db:migrate` when Neon is configured.

---

### ADR-017: Roadmap Replay Mode (Review-Only)

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Decision:** Users may replay any completed lesson or challenge from the Roadmap.

**Rules:**
- Replay is for review only
- Must not modify mastery, progress, completion %, streaks, unlocks, or attempt counts
- Player shows "Review mode" banner; API rejects progress writes in replay context

---

### ADR-018: Roadmap Auto-Scroll to Current Node

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Decision:** Roadmap auto-scrolls to the current active node when opened.

**Rules:**
- Default: smooth scroll to center current node
- `prefers-reduced-motion: reduce`: instant scroll, no pulse animation on current node
- Expand collapsed mobile section containing current node before scroll

---

### ADR-019: Simple Daily Streak (MVP)

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Decision:** MVP implements a simple daily streak counter displayed on Roadmap and Dashboard.

**Rules:**
- Completing ≥1 learning session per calendar day maintains the streak
- Qualifying activity: lesson completion, challenge pass, or project milestone (not replay, not login alone)
- **Excluded from MVP:** streak freezes, XP bonuses, multipliers, rewards, premium mechanics

**Storage:** `profiles.current_streak_days`, `profiles.last_activity_date` (see ARCHITECTURE.md)

---

### ADR-020: Roadmap as Primary Learning Surface

**Status:** ACCEPTED  
**Date:** 2026-08-05

**Decision:** `/roadmap` is the core learning journey UI. Dashboard is quick overview only. `/learn` is player-only (redirect).

---

### ADR-021: Phase 4 Onboarding Persistence Model

**Status:** ACCEPTED  
**Date:** 2026-08-10

**Context:** TASK-201 and TASK-202 delivered client-side onboarding UI with
`sessionStorage` state. Phase 4 minimum DoD requires goal saved to profile,
onboarding resume on sign-in, and `onboarding_complete` recorded when the user
confirms via Start learning. Placement quiz data from TASK-202 remains
client-side until TASK-204 pre-development inspection. UX §137 requires
incomplete users to resume the correct onboarding step.

**Decision:** Persist onboarding progress on the existing `profiles` row using
explicit typed columns. Do not use a generic JSON blob for resume position.
Do not persist placement quiz answers, scores, or skip state in Phase 4.

**1. Existing profile fields used**

| Field | Prisma / DB | Purpose |
| ----- | ----------- | ------- |
| `learningGoalText` | `learning_goal_text` | Raw goal from TASK-201 goal step |
| `experienceLevel` | `experience_level` | `ExperienceLevel` enum from TASK-201 |
| `onboardingComplete` | `onboarding_complete` | Set `true` when user confirms via Start learning |

**2. Resume-step persistence**

Add one explicit nullable profile field:

| Field | Prisma / DB | Type |
| ----- | ----------- | ---- |
| `onboardingStep` | `onboarding_step` | `OnboardingStep` enum |

**`OnboardingStep` enum values:** `goal`, `experience`, `quiz`, `path`

Maps to routes:

| Value | Route |
| ----- | ----- |
| `goal` | `/onboarding/goal` |
| `experience` | `/onboarding/experience` |
| `quiz` | `/onboarding/quiz` |
| `path` | `/onboarding/path` |

**3. Placement quiz persistence (Phase 4)**

**Do NOT persist** in Phase 4 minimum DoD:

- raw quiz answers
- placement score / `placementResult`
- quiz skipped state
- quiz completed state

TASK-202 client/`sessionStorage` remains authoritative for placement quiz
data until separately formalized (e.g. before TASK-204 if server-side path
generation requires persisted signals).

**Do NOT** store placement data in `goalSummary` — that field is reserved for
AI-structured goal refinement (FR-2.4, Phase 5).

**4. Resume inference / fallback**

When determining redirect for an authenticated user with
`onboardingComplete === false`:

1. If `onboardingStep` is set → use mapped route.
2. If `onboardingStep` is null/missing → infer safely:
   - no `learningGoalText` → `/onboarding/goal`
   - goal exists but no `experienceLevel` → `/onboarding/experience`
   - otherwise → `/onboarding/quiz`
3. **Never infer `/onboarding/path`** without explicit stored `onboardingStep = path`.

When `onboardingComplete === true` → authenticated home is `/dashboard`.

**5. Step update policy**

| Event | Profile updates |
| ----- | --------------- |
| Goal saved successfully | `learningGoalText` set; `onboardingStep = experience` |
| Experience saved successfully | `experienceLevel` set; `onboardingStep = quiz` |
| Quiz skipped or completed and user proceeds to path | `onboardingStep = path` (no placement fields written) |
| Start learning / onboarding confirmation | `onboardingComplete = true`; `onboardingStep` remains `path` |

**6. Routing policy**

| Scenario | Destination |
| -------- | ----------- |
| New sign-up success | `/onboarding/goal` |
| Sign-in, `onboardingComplete === false` | Stored or inferred onboarding step route |
| Sign-in, `onboardingComplete === true` | `/dashboard` |
| Incomplete user hits protected app routes (`/dashboard`, `/learn`, `/project`, `/build`) | Redirect to resume route where practical |
| Complete user hits `/onboarding/*` | Redirect to `/dashboard` |

Sign-up env redirect: `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/onboarding/goal`.
Sign-in env redirect remains `/dashboard`; dynamic incomplete-user resume is
implemented in application logic (TASK-212), not via Clerk env alone.

**7. Onboarding completion vs `/roadmap`**

Setting `onboardingComplete = true` occurs when the user confirms onboarding
via **Start learning** on the path preview step. This is **not blocked** by
absence of the `/roadmap` page (TASK-205, Phase 6). The Start learning CTA
may continue targeting `/roadmap` per ADR-020 and TASK-201.

**Consequences:**

- TASK-211 adds `OnboardingStep` enum + `onboardingStep` column and profile API.
- TASK-212 implements profile-aware resume routing.
- TASK-213 wires P1 onboarding UI to the profile API.
- TASK-203 / Phase 5 remain blocked until Phase 4 minimum DoD is complete.
- Placement signal server persistence deferred; inspect before TASK-204.

**Related tasks:** TASK-211, TASK-212, TASK-213, OPS-PHASE4-001

---

## Override Process

1. Stakeholder requests change
2. Master Agent documents new ADR with status ACCEPTED
3. Superseded ADR marked DEPRECATED
4. IMPLEMENTATION_PLAN and affected tasks updated
5. Programmers notified via TASK_QUEUE Notes
