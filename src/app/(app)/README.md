# Authenticated application shell

Route group: `(app)` — **Owner:** Programmer 1

| Route | Phase | Purpose |
| ----- | ----- | ------- |
| `/dashboard` | 6 | Quick overview — stats & Continue Learning CTA |
| `/roadmap` | 6 | **Primary visual learning journey** |
| `/learn` | 7 | Redirect → active node player (no list view) |
| `/learn/lessons/[id]` | 7 | Lesson player |
| `/learn/challenges/[id]` | 8 | Challenge player |
| `/project` | 10 | Multi-file project workspace |
| `/build` | 11 | Build Mode recipe catalog |
| `/build/recipes/[id]` | 11 | Guided recipe flow |
| `/settings` | 2+ | Profile & account |

Protected by Clerk middleware starting Phase 2 (TASK-101).

**Navigation:** Dashboard · **Roadmap** · Project · Build

See [UX_SPECIFICATION.md](../../docs/UX_SPECIFICATION.md) §5.8 for Roadmap specification.
