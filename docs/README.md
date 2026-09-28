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
- **Phase 2:** Complete — auth foundation, Neon init migration applied (2026-08-10).
- **Phase 3:** **Complete (2026-08-10)** — TASK-103 and TASK-104 operationally complete in Neon.
- **Phase 4:** **Complete (2026-09-16 minimum DoD; OPS-PHASE4-001 production verified 2026-09-28).**
- **First MVP (Option A, ADR-022):** Delivery via **MVP-M1→M4** vertical slices — see [TASK_QUEUE.md](TASK_QUEUE.md) § MVP delivery milestones and [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) § 1A. **Next:** TASK-204 (deterministic path, MVP-M1). `/roadmap` not implemented yet.
- **UX specification:** v1.2 — **MVP Design Freeze approved** (2026-08-05)
