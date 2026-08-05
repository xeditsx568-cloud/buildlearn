# Decisions — BuildLearn

> **Purpose:** Record architectural decisions and track pending approvals.  
> **Format:** ADR (Architecture Decision Record) for resolved; PENDING for awaiting stakeholder input.  
> **Last updated:** 2026-08-05

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

## Override Process

1. Stakeholder requests change
2. Master Agent documents new ADR with status ACCEPTED
3. Superseded ADR marked DEPRECATED
4. IMPLEMENTATION_PLAN and affected tasks updated
5. Programmers notified via TASK_QUEUE Notes
