# MVP Design Freeze — BuildLearn

> **Date:** 2026-08-05  
> **Status:** ✅ APPROVED — awaiting final go-ahead to begin Phase 2 implementation  
> **Foundation tag:** `v0.1.0-foundation`  
> **UX version:** 1.2

---

## Executive summary

The BuildLearn MVP product vision, user experience, and technical architecture are **finalized** for implementation. Phase 2 (Authentication) may begin without further planning changes, subject to stakeholder go-ahead after this report.

---

## 1. Product vision — FINALIZED

| Element | Status | Source |
| ------- | ------ | ------ |
| Goal-driven coding education platform | ✅ | PROJECT_CONTEXT.md |
| AI as teacher, not builder | ✅ | PROJECT_CONTEXT.md §3 |
| Curated curriculum + AI personalization | ✅ | ADR-001 |
| MVP scope: HTML/CSS/JS, 12 lessons, 8 challenges, 1 project, 5 Build Mode recipes | ✅ | PRODUCT_REQUIREMENTS.md §3–4 |
| 24-concept skill graph | ✅ | PRODUCT_REQUIREMENTS.md §4 |
| Client-side code execution only | ✅ | ADR-002 |
| Working codename: BuildLearn | ✅ | P-001 pending (name TBD) |

**Core loop validated:**
> Sign up → state goal → receive visual Roadmap → complete lessons/challenges → apply in project → guided Build Mode features → finish with confidence.

---

## 2. User experience — FINALIZED

| Document | Version | Status |
| -------- | ------- | ------ |
| [UX_SPECIFICATION.md](UX_SPECIFICATION.md) | 1.2 | ✅ Finalized |
| Roadmap-centric revision | v1.1 | ✅ Approved |
| Design decisions (replay, auto-scroll, streak) | v1.2 | ✅ Approved 2026-08-05 |

### Screen inventory (final)

- **18 route-based screens** + 5 overlay surfaces
- **Primary nav:** Dashboard · **Roadmap** · Project · Build
- **Core experience:** `/roadmap` visual learning journey
- **Dashboard:** quick overview; Continue Learning → current node
- **Learn:** player-only (`/learn/lessons/[id]`, `/learn/challenges/[id]`)

### Approved UX decisions (2026-08-05)

| ID | Decision | ADR |
| -- | -------- | --- |
| Replay completed content | Review-only from Roadmap; no progress/mastery/streak changes | ADR-017 |
| Auto-scroll | Scroll to current node on Roadmap load; respect `prefers-reduced-motion` | ADR-018 |
| Daily streak | Simple counter; ≥1 session/day; no freezes/XP/rewards | ADR-019 |
| Roadmap as primary surface | Replaces lesson list; Dashboard demoted to overview | ADR-020 |

### Remaining non-blocking items (implementation-time)

- High-fidelity Figma mockups (optional)
- `/privacy` and `/terms` pages before public beta (P1)
- Onboarding quiz skippable by default (P1 — recommended yes)

---

## 3. Architecture — FINALIZED

| Document | Status |
| -------- | ------ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | ✅ Finalized for MVP |
| [DECISIONS.md](DECISIONS.md) | ADR-001 through ADR-020 |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | 16 phases defined |
| Phase 1 foundation | ✅ Merged — `v0.1.0-foundation` |

### Technical stack (locked)

| Layer | Choice |
| ----- | ------ |
| Frontend | Next.js 15, React 19, TypeScript strict, Tailwind v4, shadcn/ui |
| Editor | Monaco + iframe preview (client-side) |
| Backend | Next.js API routes + Server Actions |
| Database | PostgreSQL (Neon) + Prisma |
| Auth | Clerk (Phase 2) |
| AI | Vercel AI SDK (Phase 5+) |
| Env validation | t3-env |
| CI | GitHub Actions |

### Route architecture (locked)

```
(marketing)/     → /, /privacy, /terms
(auth)/          → /sign-in, /sign-up
(onboarding)/    → /onboarding/*
(app)/           → /dashboard, /roadmap, /learn/*, /project, /build/*, /settings
```

### Data model extensions documented (implement in Phases 5–9)

- `learning_path_steps.metadata` — section grouping, future branches
- `learning_paths.metadata.sections` — Roadmap phase headers
- `profiles.current_streak_days`, `profiles.last_activity_date` — streak (ADR-019)
- Replay mode — read-only API path (ADR-017)

---

## 4. Phase 1 foundation — COMPLETE

| Task | Status |
| ---- | ------ |
| TASK-001 Next.js scaffold | ✅ Merged |
| TASK-002 Prisma users/profiles | ✅ Merged |
| TASK-003 CI pipeline | ✅ Merged |
| TASK-004 Route layout | ✅ Merged |
| TASK-005 t3-env validation | ✅ Merged |
| TASK-006 Phase 1 gate | ✅ APPROVED |
| Release tag | ✅ `v0.1.0-foundation` |

**CI verified locally:** lint, typecheck, test (5), build — all passing.

---

## 5. Phase 2 readiness

| Prerequisite | Ready |
| ------------ | ----- |
| Route shell `(app)` with placeholders | ✅ |
| Env validation extensible for `CLERK_*` | ✅ |
| users/profiles schema (String Clerk ID) | ✅ |
| UX spec for auth routes | ✅ |
| FILE_OWNERSHIP for TASK-101/102 | ✅ |
| TASK-101 unblocked in queue | ✅ |

**Phase 2 scope (unchanged):** Clerk auth, sign-in/sign-up, middleware protecting `(app)` routes, ClerkProvider.

**Phase 2 does NOT include:** Roadmap UI, onboarding, lessons — those are Phases 4–7.

---

## 6. Known deferred decisions (non-blocking)

These do **not** block Phase 2 implementation:

| ID | Decision |
| -- | -------- |
| P-001 | Final product name |
| P-003 | AI budget cap |
| P-005 | Neon provisioning |
| P-006 | Primary AI model |
| P-007 | Content authorship |
| P-008 | Beta access model |
| P-011 | Free tier AI limit (30 msg/month recommended) |

---

## 7. Confirmation

| Question | Answer |
| -------- | ------ |
| Is the product vision finalized? | **Yes** — MVP scope locked in PRD and PROJECT_CONTEXT |
| Is the UX finalized? | **Yes** — UX_SPECIFICATION v1.2 + stakeholder approvals |
| Is the architecture finalized? | **Yes** — ARCHITECTURE.md + ADRs for MVP |
| Can Phase 2 begin without further planning changes? | **Yes** — Clerk integration per TASK-101; no planning blockers |

---

## 8. Next step

**Awaiting stakeholder go-ahead** to begin Phase 2 implementation (TASK-101: Clerk authentication).

Recommended first actions when approved:
1. Configure Clerk application + env vars
2. Implement `src/middleware.ts` protecting `(app)` routes
3. Add sign-in/sign-up routes
4. Extend `src/env.ts` with Clerk keys

---

## Document index (canonical)

| Document | Role |
| -------- | ---- |
| PROJECT_CONTEXT.md | Vision & journeys |
| PRODUCT_REQUIREMENTS.md | Functional requirements |
| UX_SPECIFICATION.md | Screens, flows, design system |
| ARCHITECTURE.md | Technical architecture |
| IMPLEMENTATION_PLAN.md | Phased delivery |
| DECISIONS.md | ADRs & approvals |
| TASK_QUEUE.md | Active tasks |
| FILE_OWNERSHIP.md | Agent file boundaries |
