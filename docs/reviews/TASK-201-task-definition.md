# Checker Review — TASK-201 task definition (documentation)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `docs/TASK-201-task-definition`  
**Commit reviewed:** `2f46367e2133412923894ce0774489ad1eb4620b`

---

## Executive summary

This branch is **documentation-only** work that adds a complete TASK-201 YAML task
definition to `docs/TASK_QUEUE.md`, resolves the Phase 4 onboarding completion
destination to **`/roadmap`** (aligned with frozen UX and ADR-020), and documents
profile persistence/resume as separate Programmer 2 Phase 4 backend work outside
TASK-201.

**Four expected tracking files changed** (+112/−20 lines). No application code,
Prisma schema, migrations, workflows, environment files, or dependencies were modified.
Historical checker reviews and point-in-time records under `docs/reviews/` were not
rewritten.

TASK-201 remains **`pending`** (not `in_progress`). TASK-202+ has not started.
After merge, Programmer 1 may begin implementation on `feature/TASK-201-onboarding-wizard`
when Master directs.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Documentation-only changes | ✅ |
| 2 | Only expected four files modified | ✅ |
| 3 | TASK-201 complete YAML in established format | ✅ |
| 4 | TASK-201 metadata correct | ✅ |
| 5 | All dependencies complete | ✅ |
| 6 | Scope limited to onboarding UI wizard | ✅ |
| 7 | Explicit out-of-scope exclusions documented | ✅ |
| 8 | Acceptance criteria align with PRD, UX, ARCHITECTURE, ADR-020 | ✅ |
| 9 | Authoritative completion destination is `/roadmap` | ✅ |
| 10 | IMPLEMENTATION_PLAN `/dashboard` onboarding wording corrected | ✅ |
| 11 | Historical reviews not rewritten | ✅ |
| 12 | Tests Required section reasonable for TASK-201 | ✅ |
| 13 | Profile persistence/resume documented as separate P2 work | ✅ |
| 14 | TASK-201 status remains `pending` | ✅ |
| 15 | TASK-202+ not started | ✅ |
| 16 | No application / schema / migration / workflow / env / deps changes | ✅ |

---

## Branch diff vs `main`

```
docs/CHANGELOG.md           |   5 +++++
docs/IMPLEMENTATION_PLAN.md |  23 +++++-----
docs/README.md              |   3 +-
docs/TASK_QUEUE.md          | 101 ++++++++++++++++++++++++++++++++++++++++----
4 files changed, 112 insertions(+), 20 deletions(-)
```

No other paths differ from `main`.

---

## Detailed review

### 1. Documentation-only scope — ✅

Confirmed unchanged in branch diff:

- `src/**` (no application code)
- `prisma/**` (no schema or migrations)
- `content/**`
- `.github/workflows/**`
- `package.json`, `pnpm-lock.yaml`
- `.env.example`
- `docs/reviews/**` (historical reviews untouched)

### 2. TASK-201 task definition format — ✅

TASK-201 YAML block follows the established structure used by TASK-101–104:

| Field | Present |
| ----- | ------- |
| TASK-ID | ✅ |
| Title | ✅ |
| Description | ✅ |
| Owner | ✅ |
| Status | ✅ |
| Priority | ✅ |
| Phase | ✅ |
| Dependencies | ✅ |
| Branch | ✅ |
| Files | ✅ |
| Acceptance Criteria | ✅ |
| Tests Required | ✅ |
| Reviewer | ✅ |
| Notes | ✅ |

Placed under new `## Backlog — Phase 4 (User Onboarding)` section, consistent with
Phase 2/3 task organization.

### 3. TASK-201 metadata — ✅

| Field | Expected | Documented | Match |
| ----- | -------- | ---------- | ----- |
| Title | Onboarding wizard UI | Onboarding wizard UI | ✅ |
| Phase | 4 | 4 | ✅ |
| Priority | P0 | P0 | ✅ |
| Owner | Programmer 1 | Programmer 1 | ✅ |
| Branch | feature/TASK-201-onboarding-wizard | feature/TASK-201-onboarding-wizard | ✅ |
| Status | pending | pending | ✅ |
| Dependencies | TASK-101, 102, 103, 104 | [TASK-101, TASK-102, TASK-103, TASK-104] | ✅ |

Task index, backlog table, and sprint header all reflect `pending` — not `in_progress`.

### 4. Dependencies — ✅

| Dependency | Status in TASK_QUEUE | Operational |
| ---------- | -------------------- | ----------- |
| TASK-101 | done (2026-08-06) | Clerk auth merged |
| TASK-102 | done (2026-08-10) | Webhook merged |
| TASK-103 | done (2026-08-10) | Neon: 24 concepts, 5 templates, 36 edges |
| TASK-104 | done (2026-08-10) | Neon: Lesson 1 `how-websites-work` |

All four dependencies are complete. Notes correctly state dependencies satisfied.

### 5. In-scope boundaries — ✅

TASK-201 Description, Files, and Acceptance Criteria cover:

- `(onboarding)` route group, layout, stepper
- `/onboarding/goal`, `/experience`, `/quiz` (shell), `/path`
- Client-side wizard state/navigation
- Path UI states with stub/mock data
- Auth protection for `/onboarding/*`
- Sign-up redirect to `/onboarding/goal`
- Responsive behavior per UX spec
- Start learning CTA → `/roadmap` (page not implemented)

**File ownership:** All listed paths fall under Programmer 1 per FILE_OWNERSHIP.md
(`src/app/**`, `src/components/**`, `src/middleware.ts`, sign-up page, `tests/unit/**`).

### 6. Out-of-scope exclusions — ✅

Notes block explicitly excludes:

- Profile persistence API
- Onboarding resume backend logic
- Quiz questions/scoring (TASK-202)
- Real AI path generation (Phase 5)
- `learning_paths` tables
- `/roadmap` page implementation (TASK-205)
- Lesson player, project creation
- OpenAI integration
- Prisma schema changes
- API routes
- TASK-202+

IMPLEMENTATION_PLAN Phase 4 reinforces the same boundary in agent assignments and
TASK-201 boundary paragraph.

### 7. Acceptance criteria consistency — ✅

| Source | Requirement | TASK-201 coverage |
| ------ | ----------- | ----------------- |
| **FR-2.1** (PRD) | Free-text goal capture | Goal textarea, 10–500 chars, example chips ✅ |
| **FR-2.2** (PRD) | Experience self-assessment | `beginner`, `some_exposure`, `intermediate` ✅ |
| **FR-2.3** (PRD) | Optional placement quiz | Quiz route + skip; content deferred to TASK-202 ✅ |
| **FR-2.5** (PRD) | Initial learning path | Path preview UI with stub data only ✅ |
| **UX §5.3–5.6** | Four onboarding screens + states | All four steps; loading/error/loaded on path ✅ |
| **UX §123–127** | Onboarding shell — no app nav, stepper | Acceptance criteria #9–10 ✅ |
| **UX §135** | Sign-up → `/onboarding/goal` | Acceptance criterion #1 ✅ |
| **UX §138** | Onboarding complete → `/roadmap` | Acceptance criterion #7 ✅ |
| **ARCHITECTURE § profiles** | Existing profile fields | Notes: no schema migration for UI work ✅ |
| **ADR-020** | `/roadmap` primary learning surface | Completion destination documented ✅ |

**Intentional Phase 4 split:** Full Phase 4 DoD (“goal saved to profile”) requires
profile API (P2) — correctly excluded from TASK-201 acceptance criteria.

### 8. Onboarding completion destination — ✅

Authoritative destination is now **`/roadmap`** in:

- TASK-201 Acceptance Criteria #7
- TASK-201 Notes (UX §138 + ADR-020)
- IMPLEMENTATION_PLAN Phase 4 Objective and DoD

TASK-201 correctly states the CTA may link to `/roadmap` while the roadmap page
itself is TASK-205 (Phase 6).

### 9. IMPLEMENTATION_PLAN correction — ✅

Phase 4 previously stated “land on dashboard” and DoD “redirected to dashboard.”
Branch updates:

| Before | After |
| ------ | ----- |
| land on dashboard | land on `/roadmap` (UX §138, ADR-020) |
| redirected to dashboard | redirected to **`/roadmap`** |
| Empty dashboard shell (Phase 4 feature) | Removed; dashboard UI deferred to Phase 6 |

Grep for `onboarding.*dashboard` / `redirected to dashboard` in IMPLEMENTATION_PLAN:
**no matches** after this branch.

### 10. Historical records preserved — ✅

No files under `docs/reviews/` were modified. Prior reviews (TASK-101 I-101-03,
BUG-101-001 Phase 4 note, task-104-neon-lesson-complete) retain their point-in-time
wording. CHANGELOG adds a new `[Unreleased]` entry without rewriting prior entries.

### 11. Tests Required — ✅

Six unit-test items are appropriate for TASK-201 UI scope:

| Test | Rationale |
| ---- | --------- |
| Auth-route classification | Middleware contract for `/onboarding/*` |
| Goal validation | FR-2.1 / UX §5.3 |
| Experience selection | FR-2.2 / UX §5.4 |
| Quiz skip navigation | UX §5.5 shell behavior |
| Path loading/error/loaded | UX §5.6 UI states |
| Sign-up redirect target | UX §135 / TASK-101 follow-up |

No integration/E2E requirements imposed — consistent with TASK-101 precedent for
middleware (unit classification + deferred E2E).

### 12. Profile persistence dependency — ✅

Documented in three places:

1. TASK-201 Notes — “Phase 4 backend dependency (separate from TASK-201)”
2. IMPLEMENTATION_PLAN Phase 4 Features — profile API and resume marked “not TASK-201”
3. IMPLEMENTATION_PLAN agent assignments — P2 owns profile persistence API

TASK-201 may use client-side wizard state until profile API ships — explicit and
correct.

### 13. Phase 4 tracking updates — ✅

| Surface | Update |
| ------- | ------ |
| TASK_QUEUE sprint header | Phase 4 — User Onboarding & Goal Selection |
| Statistics | Phase 4 pending: 1; Backlog (Phase 4+): 9 |
| Task index | TASK-201 added as `pending` |
| README.md | Phase 4 line added |
| CHANGELOG.md | Planning entry under `[Unreleased]` |

---

## Findings

### Critical — none

### Major — none

### Minor — none

### Informational (non-blocking)

| ID | Severity | Location | Note |
| -- | -------- | -------- | ---- |
| I-201-01 | Info | `docs/TASK_QUEUE.md` Notes | `.env.example` update for `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL` requires P2 coordination — correctly documented; not in Files list per FILE_OWNERSHIP |
| I-201-02 | Info | `docs/IMPLEMENTATION_PLAN.md` Phase 4 | Agent table lists Programmer 1 twice (TASK-201, TASK-202) — accurate split, acceptable |
| I-201-03 | Info | TASK-201 acceptance criteria | “Back button within flow only” (UX §127) implied by wizard navigation scope but not an explicit criterion — acceptable; P1 should follow UX during implementation |

---

## Post-merge confirmations

| Item | Status |
| ---- | ------ |
| Branch may merge to `main` | ✅ Yes |
| TASK-201 ready for Programmer 1 after merge | ✅ Yes — begin on `feature/TASK-201-onboarding-wizard` when Master directs |
| TASK-201 status remains `pending` until implementation starts | ✅ Confirmed |
| `/roadmap` is authoritative onboarding completion destination | ✅ Confirmed |
| TASK-202+ remains unstarted | ✅ Confirmed |
| No implementation code on this branch | ✅ Confirmed |

---

## Final decision

**APPROVED FOR MERGE**

The TASK-201 task definition is complete, correctly scoped, aligned with frozen UX
and ADR-020, and ready for Programmer 1. Merge `docs/TASK-201-task-definition` to
`main` after stakeholder confirmation. Do **not** mark TASK-201 `in_progress` until
Master directs implementation on `feature/TASK-201-onboarding-wizard`.
