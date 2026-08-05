# BuildLearn

AI-powered coding education platform — goal-driven learning with a teacher-not-builder AI philosophy.

> **Status:** Phase 1 foundation complete (2026-08-05). Phase 2 (Authentication) ready to begin pending approval.

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

## Getting started

```bash
pnpm install
cp .env.example .env.local   # edit DATABASE_URL for Neon when ready
pnpm db:generate
pnpm dev
```

For lint/build/test, `.env.local` must contain valid `DATABASE_URL` and `NEXT_PUBLIC_APP_URL` (dummy values from `.env.example` work for local development).

## Development workflow

1. Master Agent assigns a task from `docs/TASK_QUEUE.md`
2. Programmer creates an isolated branch/worktree (see `scripts/`)
3. Implement, test, open PR using the PR template
4. Checker Agent reviews → Master merges

**Do not commit directly to `main`.**
