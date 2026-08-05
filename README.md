# BuildLearn

AI-powered coding education platform — goal-driven learning with a teacher-not-builder AI philosophy.

> **Status:** Phase 1 development ready (scaffold not yet initialized).

## Quick links

| Document | Purpose |
| -------- | ------- |
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | Product vision and user journeys |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture |
| [docs/TASK_QUEUE.md](docs/TASK_QUEUE.md) | Active development tasks |
| [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md) | Five-agent collaboration, git, PRs |
| [docs/FILE_OWNERSHIP.md](docs/FILE_OWNERSHIP.md) | File ownership rules for parallel work |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How agents and contributors work in this repo |

## Tech stack (planned)

- **Frontend:** Next.js 15, React, TypeScript, Tailwind, shadcn/ui
- **Backend:** Next.js API routes + Server Actions
- **Database:** PostgreSQL (Neon) + Prisma
- **Auth:** Clerk
- **AI:** Vercel AI SDK (provider abstraction)
- **Hosting:** Vercel

## Getting started (after Phase 1 tasks)

```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm db:migrate
pnpm dev
```

## Development workflow

1. Master Agent assigns a task from `docs/TASK_QUEUE.md`
2. Programmer creates an isolated branch/worktree (see `scripts/`)
3. Implement, test, open PR using the PR template
4. Checker Agent reviews → Master merges

**Do not commit directly to `main`.**
