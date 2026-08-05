# File Ownership — BuildLearn

> Prevent merge conflicts when Programmer 1 and Programmer 2 work in parallel.  
> **Last updated:** 2026-08-05

---

## Rules

1. One owner per directory during an active task.
2. One task = one branch = one agent.
3. `package.json` and `prisma/schema.prisma` require Master coordination.
4. Checker rejects PRs that touch files outside the task's `Files` list.

---

## Directory ownership

| Path | Owner |
| ---- | ----- |
| `src/app/(marketing)/`, `src/app/(app)/`, `src/components/` | Programmer 1 |
| `src/middleware.ts` | Programmer 1 |
| `src/app/api/`, `src/server/`, `src/ai/`, `src/env.ts` | Programmer 2 |
| `src/lib/schemas/` | Programmer 2 |
| `prisma/`, `content/` | Programmer 2 |
| `.github/workflows/` | Programmer 2 |
| `tests/unit/` | Code owner |
| `tests/integration/` | Programmer 2 |
| `tests/e2e/` | Programmer 1 |
| `docs/` | Master Agent |

Create subdirectories (e.g. `components/ui/`, `content/lessons/`) within the owning agent's task — do not pre-create.

---

## Phase 1 task files

| Task | Owner | Key paths |
| ---- | ----- | --------- |
| TASK-001 | P1 | `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx` |
| TASK-002 | P2 | `prisma/**`, `src/server/db.ts` |
| TASK-003 | P2 | `.github/workflows/ci.yml`, `package.json` (scripts only) |
| TASK-004 | P1 | `src/app/(marketing)/**`, `src/app/(app)/**/page.tsx` |
| TASK-005 | P2 | `src/env.ts`, `.env.example` |
| TASK-006 | Checker | `docs/reviews/TASK-006.md` |

---

## Shared files

| File | Rule |
| ---- | ---- |
| `package.json` | Master assigns which agent adds deps |
| `prisma/schema.prisma` | Programmer 2 only |
| `tsconfig.json`, `next.config.ts` | P1 in TASK-001; changes need Master approval after |

---

## Checker checklist

- [ ] Modified files ⊆ task `Files` list in TASK_QUEUE.md
- [ ] No overlap with another `in_progress` task
- [ ] `prisma/schema.prisma` touched only by P2
