## [Unreleased]

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
