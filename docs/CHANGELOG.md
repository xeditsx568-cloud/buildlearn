## [Unreleased]

### Added
- **PREP-001:** Development environment preparation (2026-08-05)
  - Complete folder structure with READMEs in all major directories
  - Git workflow: PR template, CODEOWNERS, ci.yml.example, worktree scripts
  - `docs/FILE_OWNERSHIP.md` — file ownership matrix for parallel agents
  - `docs/GIT_WORKFLOW.md` — branch, worktree, and merge process
  - `docs/README.md` — documentation index
  - `.env.example`, `.gitignore`, `.editorconfig`, `.node-version`, `.npmrc`
  - Root `README.md` and `CONTRIBUTING.md`
- Restructured `docs/TASK_QUEUE.md`:
  - Phase 1: TASK-001 through TASK-006 (foundation only)
  - Phase 2 backlog: TASK-101, TASK-102 (auth)
  - Phase 3 backlog: TASK-103, TASK-104 (content)
- Planning approved (P-002); ADR-013 (Clerk String ID), ADR-014 (Phase 1 boundary)

### Added (TASK-004)
- App Router route groups: `(marketing)` home at `/`, `(app)` shell with `/dashboard`, `/learn`, `/project`, `/build` placeholders
- Marketing page component smoke test

### Added (TASK-003)
- GitHub Actions CI workflow (lint, typecheck, test, build)

### Added (TASK-002)
- Prisma ORM with `users` and `profiles` schema, initial migration, db client singleton
- ADR-016 in DECISIONS.md

### Added (TASK-001)
- Next.js 15 foundation: TypeScript strict, Tailwind v4, shadcn/ui Button, Vitest smoke test
- ADR-015 in DECISIONS.md

### Changed (audit 2026-08-05)
- Lean repo audit: removed 24 leaf READMEs, 17 premature empty directories
- Merged GIT_WORKFLOW.md into AGENT_WORKFLOW.md §4; deleted redundant files
- Removed CODEOWNERS (placeholder usernames), repositories layer, pre-created component/content subdirs
- Simplified FILE_OWNERSHIP.md; worktrees now documented as optional

### Pending
- TASK-001: Next.js scaffold (first development task)

---

## [0.1.0] — 2026-08-05

### Added
- Development prep complete; Phase 1 ready

## [0.0.0] — 2026-08-04

### Added
- Phase 0 planning documentation
- Git repository initialized
