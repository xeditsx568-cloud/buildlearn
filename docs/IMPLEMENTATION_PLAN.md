# Implementation Plan — BuildLearn

> **Status:** Planning approved — Phase 1 ready  
> **Last updated:** 2026-08-05

---

## 1. Development Roadmap

Phases reordered for dependency correctness and MVP focus. Security and testing are woven throughout, not deferred to end.

---

### PHASE 0 — Discovery & Architecture ✅
**Objective:** Establish shared source of truth for all agents.

| Area | Deliverables |
|------|-------------|
| Docs | PROJECT_CONTEXT, PRD, ARCHITECTURE, AGENT_WORKFLOW, DECISIONS, TASK_QUEUE, FILE_OWNERSHIP |
| Decisions | P-002 approved 2026-08-05 |

**Definition of done:** ✅ Complete

---

### PREP — Development Environment ✅
**Objective:** Prepare repo for Phase 1 without application code.

| Area | Deliverables |
|------|-------------|
| Structure | Full `src/`, `content/`, `prisma/`, `tests/` layout with READMEs |
| Git workflow | PR template, CODEOWNERS, worktree scripts, ci.yml.example |
| Tasks | TASK_QUEUE Phase 1 tasks TASK-001–006 fully defined |

**Definition of done:** ✅ Complete (PREP-001)

---

### PHASE 1 — Project Foundation
**Objective:** Runnable monorepo skeleton with CI, no features.

**Features:**
- Next.js 15 + TypeScript + Tailwind + shadcn/ui scaffold
- Prisma + Neon connection
- ESLint, Vitest (Prettier and Playwright deferred to later phases)
- GitHub Actions CI (lint, typecheck, test, build)
- Environment variable template
- Folder structure per ARCHITECTURE.md

**Dependencies:** PREP-001 ✅, P-002 approved

**Database:** Initial migration — users, profiles only

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | TASK-001 (scaffold), TASK-004 (route layout) |
| Programmer 2 | TASK-002 (Prisma), TASK-003 (CI), TASK-005 (env) |
| Checker | TASK-006 (Phase 1 gate) |
| Master | Update TASK_QUEUE, verify DoD |

**Parallelizable:** After TASK-001 merges → TASK-002/003/004/005 in parallel  
**Blocking:** TASK-001 must merge first  
**DoD:** `pnpm dev` runs, CI green, Checker TASK-006 APPROVED

---

### PHASE 2 — Authentication
**Objective:** Users can sign up, log in, log out.

**Features:**
- Clerk integration
- Protected routes middleware
- User sync webhook (Clerk → DB)
- Basic profile page

**Dependencies:** Phase 1

**Database:** users, profiles tables

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Clerk UI, middleware |
| Programmer 2 | Webhook, user sync, profile API |
| Checker | Security review (session, IDOR) |

**DoD:** Email + Google auth works; user row created on signup; protected routes redirect

---

### PHASE 3 — Content Foundation & Skill Graph
**Objective:** Curated curriculum data exists in system.

**Features:**
- Concept seed data (~25 nodes + prerequisites)
- 12 lesson content files (JSON blocks)
- 8 challenge definitions with test specs
- Goal templates (5 variants)
- Content loader service

**Dependencies:** Phase 1

**Database:** concepts, concept_prerequisites, lessons, challenges, goal_templates

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Schema + seed scripts |
| Programmer 2 | Lesson/challenge content authoring |
| Master | Content review for pedagogical order |

**Parallelizable:** Schema ∥ content authoring  
**DoD:** `pnpm db:seed` populates all content; API returns lesson list

---

### PHASE 4 — User Onboarding & Goal Selection
**Objective:** New users complete onboarding and land on `/roadmap` (first learning view per UX_SPECIFICATION.md §138 and ADR-020).

**Features:**
- "What do you want to build?" flow (TASK-201 ✅)
- Experience level selection (TASK-201 ✅)
- Optional placement quiz — TASK-201 shell ✅; UI + client-side scoring TASK-202 ✅ (5 questions)
- Goal stored on profile (profile API — Programmer 2; **not TASK-201**)
- Onboarding resume on sign-in (profile API — **not TASK-201**)

**Dependencies:** Phase 2, Phase 3

**Database:** Existing `profiles` fields (`experience_level`, `learning_goal_text`, `goal_summary`, `onboarding_complete`) — no new tables in Phase 4 UI work. Profile writes via profile API (P2).

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Onboarding UI wizard (TASK-201 ✅) |
| Programmer 1 | Placement quiz UI + client-side scoring (TASK-202 ✅) |
| Programmer 2 | Profile persistence API + onboarding resume logic (parallel Phase 4); placement quiz backend/API deferred — not TASK-202 |

**DoD:** New user completes onboarding wizard; goal saved to profile (requires profile API); redirected to **`/roadmap`** on completion. `/roadmap` page UI is Phase 6 (TASK-205) — Phase 4 wires the CTA only.

**TASK-201 boundary:** UI wizard, client-side state, stub path preview, auth routing. Excludes profile API, real AI path generation, roadmap implementation, and Prisma changes.

**TASK-202 boundary:** 5 curated MCQ placement quiz UI; deterministic client-side scoring/signals in sessionStorage; question data under `src/lib/onboarding/`. Excludes profile API, backend scoring, Prisma changes, and path-preview modifications. Placement signals reserved for Phase 5 (TASK-204). **Merged 2026-08-10.**

**Phase 4 P1 complete; P2 outstanding:** profile persistence API, onboarding resume backend, placement quiz backend/API, and `.env.example`/deployment redirect alignment remain separate work before production.

---

### PHASE 5 — AI Infrastructure & Path Generation
**Objective:** AI generates personalized learning path from goal.

**Features:**
- AIService abstraction layer
- Goal analyzer pipeline
- Path generator pipeline (curated graph constrained)
- Context builder foundation
- AI usage logging
- Rate limiting

**Dependencies:** Phase 3, Phase 4

**Database:** learning_paths, learning_path_steps, ai_usage_logs

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | AI service layer, provider integration |
| Programmer 2 | Path generation logic, graph traversal |
| Checker | AI safety review, cost controls |

**DoD:** 10 test goals produce valid paths; prerequisites respected; usage logged

---

### PHASE 6 — Roadmap & Dashboard UI
**Objective:** User sees and navigates their personalized visual learning journey.

**Features:**
- **Roadmap page (`/roadmap`)** — vertical journey with section groupings, node states, progress stats
- Dashboard quick overview with Continue Learning → current node
- `/learn` redirect to active player (no list view)
- Streak, time remaining, project milestone on roadmap header
- Replay mode for completed nodes (review-only)
- Auto-scroll to current node on Roadmap load

**Dependencies:** Phase 5

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Roadmap UI, Dashboard refactor, node components |
| Programmer 2 | Path API, step state, roadmap data aggregation |

**DoD:** Roadmap renders full path; clicking unlocked node opens lesson/challenge; Dashboard CTA opens current node

---

### PHASE 7 — Lesson System
**Objective:** Users complete lessons end-to-end.

**Features:**
- Lesson player (block renderer)
- Monaco editor integration
- iframe live preview
- Exercise auto-grading (client-side)
- Quiz component
- Lesson progress tracking

**Dependencies:** Phase 3, Phase 6

**Database:** lesson_progress

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Lesson player UI, block types |
| Programmer 2 | Editor + preview + grading engine |

**DoD:** User completes Lesson 1 end-to-end; progress saved; preview works

---

### PHASE 8 — Coding Challenges
**Objective:** Standalone challenges with auto-grading.

**Features:**
- Challenge page (instructions + editor + tests)
- Test runner (visible + hidden tests)
- Attempt tracking
- Pass/fail feedback

**Dependencies:** Phase 7 (reuse editor/grading)

**Database:** challenge_attempts

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Challenge UI |
| Programmer 2 | Test runner, attempt API |

**DoD:** All 8 challenges grade correctly; attempts recorded

---

### PHASE 9 — Skill Mastery & Progress
**Objective:** System tracks and displays learning progress accurately.

**Features:**
- Mastery score calculation service
- Update on lesson/challenge completion
- Hint usage penalty
- Progress dashboard widgets
- Weak area detection

**Dependencies:** Phase 7, Phase 8

**Database:** concept_mastery

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 2 | Mastery service |
| Programmer 1 | Progress UI |

**DoD:** Completing lesson updates concept mastery; hint overuse reduces score

---

### PHASE 10 — Project System
**Objective:** User has persistent project tied to learning.

**Features:**
- Auto-create project at onboarding
- Multi-file editor (reuse Monaco)
- File save/load API
- Live preview
- 4 project milestones with rubrics

**Dependencies:** Phase 7

**Database:** projects, project_files, project_milestones

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Project workspace UI |
| Programmer 2 | File CRUD API, milestone checks |

**DoD:** Project persists across sessions; milestone 1 checkable

---

### PHASE 11 — Build Mode
**Objective:** User adds features to project with prerequisite gating.

**Features:**
- Build Mode UI (separate from lesson flow)
- Feature request input
- Recipe matching (5 recipes)
- Prerequisite gap analysis
- Micro learning path insertion
- Guided build flow

**Dependencies:** Phase 9, Phase 10

**Database:** build_mode_requests

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Build Mode UI |
| Programmer 2 | Recipe matcher, prerequisite engine |

**DoD:** "Add dark mode" triggers prerequisite check; user guided through build

---

### PHASE 12 — AI Tutor
**Objective:** Context-aware AI assistance in lessons, challenges, projects.

**Features:**
- Tutor sidebar component
- Streaming responses
- Help level escalation (1–5)
- Error explanation for user code
- Socratic prompting
- Quota enforcement

**Dependencies:** Phase 5, Phase 7

**Database:** ai_conversations, ai_messages

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Tutor UI, streaming |
| Programmer 2 | Tutor pipeline, help controller |
| Checker | Prompt safety audit |

**DoD:** Tutor works in lesson/challenge/project; quota enforced; no full-code dumps at level 1

---

### PHASE 13 — AI Project Review
**Objective:** AI reviews project milestones with structured feedback.

**Features:**
- Project reviewer pipeline
- Rubric-based scoring
- Actionable feedback UI

**Dependencies:** Phase 10, Phase 12

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 2 | Reviewer pipeline |
| Programmer 1 | Review results UI |

**DoD:** Milestone submission returns structured review; mastery updated

---

### PHASE 14 — Polish, Accessibility & Performance
**Objective:** Production-quality UX.

**Features:**
- Responsive design pass
- WCAG 2.1 AA audit fixes
- Loading states, error boundaries
- Optimistic UI for saves
- SEO for marketing pages

**Dependencies:** All UI phases

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 1 | Responsive + a11y |
| Programmer 2 | Performance optimization |
| Checker | a11y + UI consistency review |

**DoD:** Lighthouse a11y > 90; mobile usable; no critical UX bugs

---

### PHASE 15 — Testing & AI Eval
**Objective:** Confidence to launch.

**Features:**
- E2E test suite (onboarding → lesson → challenge → project)
- AI eval suite (20 golden tests)
- Load test AI endpoints
- Security scan

**Dependencies:** Phase 12+

**Agent assignments:**
| Agent | Work |
|-------|------|
| Programmer 2 | E2E tests |
| Checker | Full review report |
| Bug Fixer | Fix failing tests |

**DoD:** CI green; E2E passes; AI eval > 90% pass rate

---

### PHASE 16 — Deployment & Launch
**Objective:** Production deployment.

**Features:**
- Vercel production config
- Neon production DB
- Domain + SSL
- Sentry + PostHog production
- Runbook documentation

**Dependencies:** Phase 15

**DoD:** Production URL live; monitoring active; rollback tested

---

### DEFERRED PHASES (Post-MVP)

| Phase | Features |
|-------|----------|
| 17 — Gamification | XP, achievements, streak freezes |
| 18 — Monetization | Stripe, plans, AI quotas |
| 19 — Social | Friends, sharing, opt-in leaderboards |
| 20 — Advanced paths | React, backend, Python |
| 21 — WebContainers | Node/React in browser |
| 22 — Admin CMS | Content management UI |
| 23 — Spaced repetition | Review scheduling engine |

---

## 2. MVP Milestone Checklist

```
[✅] Phase 0  — Planning approved
[✅] PREP    — Development environment prepared
[✅] Phase 1  — Foundation (TASK-001–006)
[✅] Phase 2  — Auth (TASK-101 ✅, TASK-102 ✅); Neon init migration applied (2026-08-10)
[✅] Phase 3  — Content Foundation (TASK-103 ✅, TASK-104 ✅ operationally complete 2026-08-10)
[ ] Phase 4  — Onboarding
[ ] Phase 5  — AI paths
[ ] Phase 6  — Roadmap & Dashboard UI
[ ] Phase 7  — Lessons
[ ] Phase 8  — Challenges
[ ] Phase 9  — Mastery
[ ] Phase 10 — Projects
[ ] Phase 11 — Build Mode
[ ] Phase 12 — AI Tutor
[ ] Phase 13 — Project review
[ ] Phase 14 — Polish
[ ] Phase 15 — Testing
[ ] Phase 16 — Launch
```

---

## 3. First 10 Development Tasks (Phase 1)

| # | Task ID | Title | Owner | Depends on |
|---|---------|-------|-------|------------|
| 1 | TASK-001 | Initialize Next.js 15 + TypeScript + Tailwind + shadcn/ui | Programmer 1 | PREP-001 ✅ |
| 2 | TASK-002 | Prisma + Neon + users/profiles schema | Programmer 2 | TASK-001 |
| 3 | TASK-003 | GitHub Actions CI pipeline | Programmer 2 | TASK-001 |
| 4 | TASK-004 | Wire scaffold into route layout | Programmer 1 | TASK-001 |
| 5 | TASK-005 | t3-env + .env.example | Programmer 2 | TASK-001 |
| 6 | TASK-006 | Checker Phase 1 gate review | Checker | TASK-001–005 |
| 7 | TASK-101 | Clerk auth (Phase 2) | Programmer 1 | TASK-006 |
| 8 | TASK-102 | Clerk webhook (Phase 2) | Programmer 2 | TASK-101 |
| 9 | TASK-103 | Concept graph seed (Phase 3) | Programmer 2 | TASK-002 |
| 10 | TASK-104 | Lesson schema + Lesson 1 (Phase 3) | Programmer 2 | TASK-103 |

---

## 4. Risk Analysis (25 Risks)

| # | Risk | Prob. | Impact | Mitigation |
|---|------|-------|--------|------------|
| 1 | AI generates incorrect teaching content | High | High | Curated content; AI adapts framing only in MVP |
| 2 | AI hallucinates learning paths with missing prerequisites | Medium | High | Constrain path gen to skill graph DAG; validate programmatically |
| 3 | Users copy AI solutions without learning | High | High | Help escalation penalties; hidden tests; project rubrics |
| 4 | AI costs exceed revenue | High | High | Quotas, mini models, caching, usage monitoring |
| 5 | iframe sandbox escape | Low | Critical | No allow-same-origin; security review; no server execution |
| 6 | Prompt injection manipulates tutor | Medium | Medium | System prompt hardening; input isolation; output filtering |
| 7 | Scope creep delays MVP | High | High | Strict MVP doc; Master agent gatekeeps scope |
| 8 | Poor beginner retention | High | High | Short lessons, early wins, project milestone by day 3 |
| 9 | Mastery scoring feels unfair | Medium | Medium | Transparent scoring; show what affects mastery |
| 10 | Auto-grader false negatives frustrate users | Medium | Medium | Visible tests first; generous HTML normalization; appeal via AI |
| 11 | Monaco + iframe performance on low-end devices | Medium | Medium | Performance budget; lazy load editor |
| 12 | Multi-agent merge conflicts | Medium | Medium | File ownership rules; worktrees; small PRs |
| 13 | Curriculum quality too low to retain | Medium | High | Human review of all content; beta tester feedback |
| 14 | Clerk/Neon vendor lock-in | Low | Medium | Abstract auth and DB access layers |
| 15 | GDPR/privacy compliance gaps | Medium | High | Privacy policy; deletion flow; minimal data |
| 16 | Accessibility lawsuits/poor a11y | Medium | Medium | WCAG audit in Phase 14; keyboard nav in editor |
| 17 | Competition from free alternatives | High | Medium | Differentiate on goal-driven paths + project integration |
| 18 | Users expect AI to build for them | High | Medium | Clear messaging; product philosophy in onboarding |
| 19 | Build Mode open-ended requests fail badly | High | Medium | Recipe-only in MVP; honest "coming soon" for others |
| 20 | Database schema churn causes rewrites | Medium | High | Phase 3 content schema early; migrations reviewed |
| 21 | Gamification exploitation (future) | Medium | Low | Defer gamification; design anti-exploit now |
| 22 | Leaderboard toxicity (future) | Medium | Medium | Defer social; opt-in only if added |
| 23 | Scaling AI context costs | Medium | High | Context builder with strict token budget |
| 24 | Key person/content dependency | Medium | Medium | Content in repo; documented authoring guide |
| 25 | Inadequate testing of AI behavior | Medium | High | Golden eval suite; regression on prompt changes |

---

## 5. Competitive Analysis

### Landscape

| Competitor | Strengths | Weaknesses | Relevant to us |
|------------|-----------|------------|----------------|
| **Codecademy** | Structured paths, in-browser editor, brand trust | Generic paths, limited personalization, AI bolted on | Editor UX, path structure |
| **freeCodeCamp** | Free, project-based, community | Overwhelming, no personalization, dated UX | Project-based learning philosophy |
| **Scrimba** | Interactive screencasts, great UX | Pre-recorded, not adaptive, limited AI | Interactive lesson format |
| **The Odin Project** | Deep projects, free, respected | Self-directed, high dropout, no AI | Project rigor |
| **Duolingo** | Gamification, streaks, adaptive | Not for coding, shallow for dev | Streak design (careful) |
| **LeetCode** | Challenges, grading | Interview focus, not beginner building | Auto-grading patterns |
| **Replit** | Browser IDE, AI agent, deploy | AI builds for you — opposite philosophy | IDE patterns, not AI agent |
| **Cursor/GitHub Copilot** | Powerful AI coding | Not education; solves not teaches | Anti-pattern for our AI |
| **Mimo/Boot.dev** | Mobile/gamified learning | Limited depth, generic paths | UX inspiration only |

### Differentiation (NOT "we use AI")

**Primary value proposition:**
> **BuildLearn turns your creation goal into a learning path, then guides you to build it yourself — with an AI mentor that teaches, not codes for you.**

**Differentiators:**
1. **Goal-first curriculum assembly** — path built around what you want to create
2. **Build Mode integration** — learning and building are connected, not separate
3. **Demonstrated mastery** — progress requires proof, not checkbox completion
4. **Teacher AI with escalation ethics** — help when stuck, not instant solutions

### What NOT to copy
- Replit Agent's "build it for me" UX
- Duolingo's aggressive streak manipulation
- LeetCode's competitive pressure for beginners
- Codecademy's paywall-on-basic-content model
- Infinite AI chat with no pedagogical structure

---

## 6. Open Questions

1. Final product name and branding?
2. Target launch date?
3. Budget for AI API costs during beta?
4. Will content be authored by stakeholder or outsourced?
5. Beta tester access model (invite-only vs open)?
6. Age restriction policy (13+ recommended)?
7. Marketing site separate or same Next.js app?

See DECISIONS.md for approval-tracked items.

---

## 7. Feature Prioritization Matrix

```
                    IMPACT
                      ▲
                      │  AI Tutor ●     Path Gen ●
                      │  Lessons ●       Projects ●
                      │  Challenges ●   Build Mode ●
                      │  
                      │  Streaks ○      XP/Levels ○
                      │  Social ○       Payments ○
                      │  WebContainers ○
                      └──────────────────────────► EFFORT
                         Low              High
```

**Build first (high impact, manageable effort):** Lessons, path gen, editor, challenges, projects  
**Build next:** AI tutor, Build Mode, mastery  
**Defer (high effort or lower MVP impact):** Social, payments, WebContainers, gamification
