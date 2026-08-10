# Documentation Index — BuildLearn

> Source of truth for all AI agents and contributors.

## Core documents

| Document | Purpose | When to read |
| -------- | ------- | ------------ |
| [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) | Vision, users, journeys, canonical constants | First session |
| [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) | Features, MVP scope, FR-* requirements | Before implementing features |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack, DB schema, AI, security | Before any code task |
| [UX_SPECIFICATION.md](UX_SPECIFICATION.md) | MVP screens, flows, design system, wireframes | Before Phase 2+ UI work |
| [MVP_DESIGN_FREEZE.md](MVP_DESIGN_FREEZE.md) | Design freeze confirmation | Before Phase 2 |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Phased roadmap, risks, dependencies | Master Agent planning |
| [DECISIONS.md](DECISIONS.md) | ADRs and pending approvals | Before architectural choices |

## Development operations

| Document | Purpose | When to read |
| -------- | ------- | ------------ |
| [TASK_QUEUE.md](TASK_QUEUE.md) | Active tasks with acceptance criteria | Every agent session start |
| [AGENT_WORKFLOW.md](AGENT_WORKFLOW.md) | Five-agent roles, git branches, PR process |
| [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md) | Who edits which files |
| [CHANGELOG.md](CHANGELOG.md) | Merged changes log | After merges |

## Reviews

| Path | Purpose |
| ---- | ------- |
| [reviews/](reviews/) | Checker Agent review reports (`TASK-XXX.md`) |

## Status

- **Planning:** Approved (2026-08-05)
- **Phase 1:** Complete — tagged `v0.1.0-foundation`
- **Phase 2:** Complete — auth foundation, Neon migration infrastructure, init migration applied to Neon (2026-08-10).
- **Phase 3:** **Ready to begin** — TASK-103 **pending** (database blocker cleared); implementation not started.
- **UX specification:** v1.2 — **MVP Design Freeze approved** (2026-08-05)
