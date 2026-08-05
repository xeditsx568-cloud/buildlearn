# Contributing — BuildLearn

This repository is developed primarily by five AI coding agents. Human contributors follow the same rules.

## Agents

| Agent | Role |
| ----- | ---- |
| **Master** | Coordinates tasks, maintains docs, merges approved PRs |
| **Checker** | Reviews code; does not implement features |
| **Programmer 1** | Frontend UI, lesson player, onboarding, dashboard |
| **Programmer 2** | Backend API, Prisma, AI layer, CI/CD, content seeds |
| **Bug Fixer** | Confirmed bugs and failing tests only |

Full details: [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md)

## Before you start

1. Read [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) (first session) or [docs/TASK_QUEUE.md](docs/TASK_QUEUE.md)
2. Claim a task — set `Status: in_progress` and `Owner` in TASK_QUEUE.md
3. Check [docs/FILE_OWNERSHIP.md](docs/FILE_OWNERSHIP.md) — do not edit files owned by another agent's active task
4. Create a branch: `feature/TASK-XXX-short-description`

## Pull requests

- One task per PR
- Link `TASK-XXX` in title and description
- Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
- CI must pass before Checker review
- Checker **APPROVED** required before merge
- Prefer squash merge

## Code standards

- TypeScript strict mode
- Match existing patterns in surrounding code
- Tests required per task acceptance criteria
- No server-side execution of user code (MVP security rule)
- Architectural changes → add entry to [docs/DECISIONS.md](docs/DECISIONS.md)

## Parallel work

Use separate branches per task. Worktrees are optional (see `scripts/` and AGENT_WORKFLOW.md §4) — only needed when two agents work on the same machine simultaneously.

## Questions and escalations

Escalate to the stakeholder (human) via Master Agent when:

- A pending decision in DECISIONS.md blocks work
- Scope change is requested
- Checker and Programmer cannot resolve a conflict
