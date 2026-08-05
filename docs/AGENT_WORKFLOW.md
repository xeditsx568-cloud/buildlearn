# Agent Workflow — BuildLearn

> **Status:** Active  
> **Last updated:** 2026-08-05

---

## 1. Five-Agent System Overview

```
                    ┌─────────────────┐
                    │  MASTER AGENT   │
                    │  Coordinator    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   TASK QUEUE    │
                    │  (docs/TASK_    │
                    │   QUEUE.md)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │ PROGRAMMER 1│ │ PROGRAMMER 2│ │   CHECKER   │
     │  Features   │ │  Features   │ │   Review    │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                    ┌───────────────┐
                    │  PR / MERGE   │
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │  BUG FIXER    │
                    │  (if needed)  │
                    └───────────────┘
```

---

## 2. Agent Responsibilities

### 2.1 Master Agent

**Primary role:** Coordinator — NOT primary coder.

| Does | Does NOT |
|------|----------|
| Maintain docs/IMPLEMENTATION_PLAN.md and TASK_QUEUE.md | Write production features (except doc updates) |
| Break phases into tasks with clear ownership | Randomly rewrite other agents' code |
| Assign tasks to Programmer 1/2 | Merge without Checker approval |
| Track progress and dependencies | Make architectural changes without documenting in DECISIONS.md |
| Resolve scope conflicts | Skip reading PROJECT_CONTEXT before assigning |
| Update CHANGELOG after merges | Create tasks without acceptance criteria |

**Session start checklist:**
1. Read docs/PROJECT_CONTEXT.md (if first session) or TASK_QUEUE.md
2. Check open PRs and CI status
3. Identify next unblocked tasks
4. Assign with file ownership boundaries
5. Update TASK_QUEUE.md statuses

### 2.2 Checker Agent

**Primary role:** Quality gate — review only, minimal changes.

| Reviews | Produces |
|---------|----------|
| Code correctness | Review report in PR comment or `docs/reviews/` |
| Architecture compliance vs ARCHITECTURE.md | Pass/fail + findings list |
| Security (auth, IDOR, AI, sandbox) | Severity-tagged issues |
| Test coverage | Missing test identification |
| UI consistency | Design/UX issues |
| Requirements vs PRODUCT_REQUIREMENTS.md | Gap analysis |

**Does NOT:** Implement features, refactor unrelated code, approve own work.

**Review report format:**
```markdown
## Checker Review — TASK-XXX

**Verdict:** APPROVED | CHANGES REQUESTED | BLOCKED

### Critical
- [ ] ...

### Major
- [ ] ...

### Minor
- [ ] ...

### Requirements coverage
- FR-X.X: ✅ | ❌

### Security notes
- ...
```

### 2.3 Programmer Agent 1

**Focus areas (default):**
- Frontend UI components
- Lesson player, editor UI
- Onboarding flows
- Dashboard and path visualization

**Responsibilities:**
- Implement assigned tasks only
- Write unit/component tests for own code
- Follow ARCHITECTURE.md patterns
- Update task status in TASK_QUEUE.md
- Create PR with description linking TASK-ID

### 2.4 Programmer Agent 2

**Focus areas (default):**
- Backend API routes and services
- Prisma schema and migrations
- AI service layer
- Grading engine, mastery service
- CI/CD and infrastructure config

**Responsibilities:** Same as Programmer 1.

**Conflict avoidance:** P1 and P2 must NOT edit the same files in the same sprint. Master assigns file ownership per task.

### 2.5 Bug Fixer Agent

**Primary role:** Fix confirmed bugs only.

| Does | Does NOT |
|------|----------|
| Fix failing tests | Add new features |
| Fix regressions from merged PRs | Refactor unrelated code |
| Add regression tests | Change architecture |
| Investigate Sentry errors | Work on unconfirmed reports |

**Activation triggers:**
- CI failure on main
- Checker BLOCKED verdict with bug classification
- Master assigns bug task with reproduction steps

---

## 3. Workflow Pipeline

```
1. Master creates/assigns task in TASK_QUEUE.md
        │
2. Programmer claims task → creates branch/worktree
        │
3. Programmer implements + tests
        │
4. Programmer opens PR (links TASK-ID)
        │
5. CI runs automatically
        │
6. Checker reviews → APPROVED or CHANGES REQUESTED
        │
7. If changes requested → Programmer fixes → re-review
        │
8. Master merges to main
        │
9. Master updates TASK_QUEUE (done) + CHANGELOG
        │
10. If CI fails post-merge → Bug Fixer assigned
```

---

## 4. Git, Branches & Parallel Work

### Branch naming

```
feature/TASK-XXX-short-description
fix/TASK-XXX-short-description
docs/TASK-XXX-short-description
```

### Commit messages

```
type(TASK-XXX): short imperative summary
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `ci`

### Rules

- One task = one branch; no direct commits to `main`
- Rebase on `main` if branch is > 2 days old
- Soft limit: 400 lines changed per PR
- Squash merge; Checker APPROVED + CI green required

### Parallel work (optional)

Use separate branches for P1 and P2. Worktrees are optional — only needed when two agents work simultaneously on the same machine:

```powershell
.\scripts\worktree-create.ps1 -TaskId TASK-002 -Agent p2 -Description prisma-schema
```

Worktrees are **not required** for TASK-001 (single agent).

### Phase 1 parallel plan (after TASK-001 merges)

| Task | Agent |
| ---- | ----- |
| TASK-002, TASK-003, TASK-005 | Programmer 2 |
| TASK-004 | Programmer 1 |

### File ownership

See [FILE_OWNERSHIP.md](FILE_OWNERSHIP.md) for the full matrix.

| Directory | Owner |
| --------- | ----- |
| `src/app/(marketing)/`, `src/app/(app)/`, `src/components/` | Programmer 1 |
| `src/app/api/`, `src/server/`, `src/ai/`, `prisma/`, `content/` | Programmer 2 |
| `docs/` | Master Agent |

**Shared files (Master coordinates):** `package.json`, `prisma/schema.prisma`

---

## 5. Task Format

```yaml
TASK-ID: TASK-001
Title: Initialize Next.js 15 project
Description: |
  Create the project scaffold with Next.js 15 App Router, TypeScript,
  Tailwind CSS, and shadcn/ui. Configure strict TypeScript.
Owner: Programmer 1
Status: pending  # pending | in_progress | review | done | blocked
Priority: P0  # P0 | P1 | P2
Dependencies: []  # List of TASK-IDs
Files:
  - package.json
  - src/app/**
  - tailwind.config.ts
  - tsconfig.json
Acceptance Criteria:
  - pnpm dev starts without errors
  - TypeScript strict mode enabled
  - Tailwind working with sample page
  - shadcn/ui Button component installed
Tests Required:
  - Smoke test: app renders
Reviewer: Checker
Notes: |
  Do not add auth or database yet.
  Follow folder structure in ARCHITECTURE.md Section 1.
```

---

## 6. Task Locking

To prevent duplicate work:

1. Master sets task `Status: in_progress` with `Owner: <agent>`
2. Only one owner per task
3. Programmer adds `Claimed: <date>` in Notes when starting
4. If blocked, set `Status: blocked` with reason
5. Master releases lock if agent session ends incomplete

---

## 7. Communication Protocol

### Between agents (via artifacts, not chat)

| Artifact | Purpose |
|----------|---------|
| `docs/TASK_QUEUE.md` | Current task states |
| `docs/DECISIONS.md` | Architectural decisions |
| PR descriptions | Implementation notes |
| `docs/reviews/TASK-XXX.md` | Checker reports |
| `docs/CHANGELOG.md` | Merged changes log |

### Escalation to stakeholder (human)

Master escalates when:
- Decision needed from DECISIONS.md pending list
- Scope change requested
- Unresolvable conflict between Checker and Programmer
- Budget/security concern (AI costs, sandbox)

---

## 8. CI/CD Requirements

Every PR must pass:
```yaml
- pnpm lint
- pnpm typecheck
- pnpm test (unit)
- pnpm build
- (E2E on main merge or nightly)
```

Checker verifies CI green before APPROVED.

---

## 9. Testing Responsibilities

| Agent | Testing duty |
|-------|-------------|
| Programmer 1 | Component tests, E2E user flows (with P2) |
| Programmer 2 | Unit tests for services, API integration tests |
| Checker | Verify tests exist and cover acceptance criteria |
| Bug Fixer | Regression test for every bug fix |
| Master | Ensure test tasks included in plan |

---

## 10. Documentation Maintenance

| Event | Agent | Action |
|-------|-------|--------|
| Architectural change | Programmer → Master | Add DECISIONS.md entry |
| Phase complete | Master | Update IMPLEMENTATION_PLAN checklist |
| Task complete | Owner | Update TASK_QUEUE.md |
| Merge to main | Master | Update CHANGELOG.md |
| New risk discovered | Any | Add to IMPLEMENTATION_PLAN risks |
| Scope change | Master | Update PRODUCT_REQUIREMENTS.md |

---

## 11. Anti-Patterns to Avoid

1. **Two programmers editing `schema.prisma` simultaneously**
2. **Master implementing features "just this once"**
3. **Checker approving without running review checklist**
4. **Bug Fixer adding features while fixing bugs**
5. **Merging without CI green**
6. **AI agents inventing architecture not in docs**
7. **Large PRs (>800 lines) without split**
8. **Skipping TASK_QUEUE updates**

---

## 12. Session Templates

### Master session start
```
1. Read TASK_QUEUE.md
2. Check git status / open PRs
3. Identify blocked vs ready tasks
4. Assign next tasks with file ownership
5. Update TASK_QUEUE.md
```

### Programmer session start
```
1. Read assigned TASK-XXX from TASK_QUEUE.md
2. Read relevant sections of ARCHITECTURE.md
3. Create branch/worktree
4. Implement acceptance criteria
5. Write tests
6. Open PR, set task to 'review'
```

### Checker session start
```
1. Read PR description and linked TASK-ID
2. Read acceptance criteria
3. Review code against ARCHITECTURE.md + SECURITY
4. Post review report
5. Set verdict
```

### Bug Fixer session start
```
1. Read bug report / failing test
2. Reproduce
3. Fix with minimal diff
4. Add regression test
5. Open fix PR
```
