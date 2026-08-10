# Checker Review — TASK-104 (Lesson content schema and seed Lesson 1)

**Verdict:** APPROVED FOR MERGE  
**Date:** 2026-08-10  
**Reviewer:** Checker Agent  
**Branch:** `feature/TASK-104-lesson-schema`  
**Commit reviewed:** `d098707182a604216f0d9b4058f49f2e5024c181`

---

## Executive summary

TASK-104 delivers the Phase 3 lesson content foundation: a minimal `Lesson` Prisma
model, Zod validation for six frozen block types, curated Lesson 1 JSON, idempotent
seed logic, migration SQL, and focused unit tests. The branch diff against `main`
contains **six files only** (+418 lines). No lesson player UI, API routes, progress
models, challenge models, AI integration, or out-of-scope Phase 4+ work was introduced.

Lint, typecheck, tests (51/51), and build pass. Migration SQL was generated via the
approved offline `prisma migrate diff` path (local P1001 documented); file is BOM-free
and creates only the `lessons` table.

**Merge-readiness (critical question): Option A** — TASK-104 is safe to merge with
migration + seed **code reviewed**; live Neon migration deploy and seed verification
are **operational follow-ups** before the next task that consumes lesson data
(`TASK-201` onboarding / `TASK-206` lesson player), mirroring TASK-103 precedent.

Neon migration and seed were **not run** during this review.

---

## Review checklist

| # | Criterion | Result |
| - | --------- | ------ |
| 1 | Only intended 6 files changed | ✅ |
| 2 | `Lesson` model matches architecture (5 fields, `lessons` map) | ✅ |
| 3 | No future-phase models or UI/API work | ✅ |
| 4 | Migration: offline diff, lessons-only, BOM-free | ✅ |
| 5 | Zod schema: six block types, discriminated union, quiz validation | ✅ |
| 6 | Lesson 1 JSON: id, title, concept, golden-path blocks, MVP scope | ✅ |
| 7 | Seed: JSON load, Zod validate, idempotent upsert, TASK-103 preserved | ✅ |
| 8 | Tests cover required acceptance cases | ✅ |
| 9 | `prisma:generate`, lint, typecheck, test, build | ✅ |
| 10 | No unrelated UX/auth/AI work | ✅ |

---

## Branch diff vs `main`

```
content/lessons/01-how-websites-work.json          |  69 +++++++++
prisma/migrations/20260810173000_lessons/migration.sql | 10 +
prisma/schema.prisma                               |  10 +
prisma/seed.ts                                     |  28 ++++
src/lib/schemas/lesson.ts                          | 136 +++++++++++++++++
tests/unit/lesson-schema.test.ts                   | 165 +++++++++++++++++++++
6 files changed, 418 insertions(+)
```

No other paths differ from `main`.

---

## Detailed review

### 1. Scope — ✅

Confirmed unchanged in branch diff:

- `src/app/**` (no lesson player routes added)
- `src/app/api/**` (no lesson API)
- Auth, AI, onboarding code
- `content/concepts.json`, `content/goal-templates.json` (TASK-103 sources untouched)
- `.github/workflows/**`
- `package.json`, lockfile

### 2. Prisma `Lesson` model — ✅

```prisma
model Lesson {
  id               String @id
  title            String
  content          Json
  estimatedMinutes Int    @map("estimated_minutes")
  version          Int

  @@map("lessons")
}
```

| Architecture column | Present | Notes |
| ------------------- | ------- | ----- |
| `id` | ✅ | VARCHAR PK |
| `title` | ✅ | |
| `content` | ✅ | JSONB via Prisma `Json` |
| `estimated_minutes` | ✅ | `@map("estimated_minutes")` |
| `version` | ✅ | Content versioning (ADR-011) |

No relations to `Concept`, `User`, or progress tables. No speculative fields.

### 3. Future-phase exclusions — ✅

Not introduced:

- `lesson_progress`
- `LessonConcept` / join table
- `Challenge`, `ChallengeAttempt`
- Roadmap/path/progress models
- Lesson player UI or `/learn/lessons/[lessonId]` implementation
- Monaco, iframe preview, grading engine
- OpenAI / AI service configuration

### 4. Migration SQL — ✅

**File:** `prisma/migrations/20260810173000_lessons/migration.sql`

| Check | Result |
| ----- | ------ |
| Generation method | Offline `prisma migrate diff --from-schema-datamodel` (pre-lesson schema) → current schema — approved TASK-103 precedent after local P1001 |
| Scope | `CREATE TABLE "lessons"` only |
| Existing tables | No ALTER on `users`, `profiles`, `concepts`, `concept_prerequisites`, `goal_templates` |
| UTF-8 BOM | **Absent** — first bytes `45 45 32` (`-- `) |
| PostgreSQL validity | Standard Prisma-generated DDL; JSONB column compatible with Neon |

### 5. `src/lib/schemas/lesson.ts` — ✅

**Lesson envelope:** `id`, `title`, `estimatedMinutes`, `version`, `conceptIds`, `blocks`

**Block types (discriminated union on `type`):**

| Type | Validated |
| ---- | --------- |
| `objective` | ✅ `title`, `objectives[]` |
| `explain` | ✅ `body`, optional `title`, optional `code` |
| `interact` | ✅ `instructions`, `starterCode`, `language` |
| `exercise` | ✅ `title`, `instructions`, `language`, `starterCode` |
| `quiz` | ✅ `question`, `options[]`, `correctOptionId` with cross-field validation |
| `bridge` | ✅ `body`, optional next-lesson metadata |

- Unsupported types (e.g. `video`) rejected by discriminated union ✅
- Quiz `correctOptionId` must match an option id via `superRefine` ✅
- No speculative block types ✅
- `lessonContentSchema` + `toPersistedLessonContent()` shape persisted JSON as `{ conceptIds, blocks }` ✅

### 6. Lesson 1 JSON — ✅

**File:** `content/lessons/01-how-websites-work.json`

| Requirement | Value |
| ----------- | ----- |
| ID | `how-websites-work` (matches UX route slug) |
| Title | `How Websites Work` (PRODUCT_REQUIREMENTS §4, Lesson 1) |
| Concept | `how-web-works` (TASK-103 seeded concept) |
| Duration | 8 minutes |
| Version | 1 |
| Block order | objective → explain → interact → exercise → quiz → bridge (UX golden path) |

**Content scope:** Beginner HTML fundamentals only — browser/server request flow,
HTML/CSS/JS roles, HTML skeleton editing and comments. No React, backend, Python,
database, or out-of-MVP topics.

**Bridge block:** References `your-first-html-page` / "Your First HTML Page" as
metadata only (PRODUCT_REQUIREMENTS Lesson 2 title). Does not implement Lesson 2
or player navigation — acceptable.

### 7. Seed behavior — ✅

**`prisma/seed.ts` changes:**

- `seedCurriculum()` logic unchanged (TASK-103 upserts + prerequisite sync)
- New exported `seedLessons()`:
  1. `loadLessonFromFile("01-how-websites-work.json")` — Zod validation on load
  2. `client.lesson.upsert` by stable `id` (`how-websites-work`)
  3. Persists `title`, `content`, `estimatedMinutes`, `version`
- `main()` runs curriculum then lessons — deterministic order

**Idempotency:** Upsert by primary key; safe to re-run.

**Destructive behavior:** No new destructive patterns. Pre-existing
`conceptPrerequisite.deleteMany()` (TASK-103, I-T103-01) unchanged — acceptable at
current stage.

**Live seed:** Not verified against Neon in this review (operational follow-up).

### 8. Tests — ✅

**File:** `tests/unit/lesson-schema.test.ts` (6 tests)

| Requirement | Covered |
| ----------- | ------- |
| Valid lesson accepted (all six block types) | ✅ |
| Invalid lesson rejected | ✅ |
| Unsupported block type rejected | ✅ |
| Invalid quiz `correctOptionId` rejected | ✅ |
| Each block type validates independently | ✅ |
| Lesson 1 JSON validates | ✅ |

No integration test for `seedLessons()` against a live DB — acceptable; mirrors
TASK-103 review scope.

### 9. Verification — ✅

```
pnpm prisma:generate  ✅
pnpm lint             ✅  No ESLint warnings or errors
pnpm typecheck        ✅
pnpm test             ✅  51/51 passed
pnpm build            ✅
```

**Neon migration:** Not run (per review scope).  
**Neon seed:** Not run (per review scope).

---

## Critical merge-readiness question

**Decision: Option A — APPROVED FOR MERGE**

| Factor | Assessment |
| ------ | ---------- |
| TASK-104 acceptance: Zod schema validates six block types | ✅ Code complete, tested |
| TASK-104 acceptance: Lesson 1 seeded and queryable via Prisma | Operational — requires `lessons` table on target DB |
| TASK-103 precedent | Merge approved before live Neon migration/seed; ops follow-up documented |
| TASK-002 precedent | Code merged before init migration applied to Neon |
| Migration file | Present, Prisma-generated (offline diff), BOM-free, lessons-only |
| Seed logic | Reviewed; idempotent; Zod-validated pre-write |
| Next consumer | `TASK-201` (Phase 4 onboarding) / `TASK-206` (lesson player) — not started |

Live Neon migration deploy + seed verification is an **operational gate before tasks
that consume lesson data**, not a merge blocker for TASK-104 — consistent with
established project governance.

**Option B (block merge until Neon seeded) is not required** given precedent and
frozen task documentation pattern.

---

## Findings

### Critical

None.

### Major

None.

### Minor

| ID | Severity | File / location | Explanation | Required correction |
| -- | -------- | --------------- | ----------- | ------------------- |
| I-T104-01 | Info | Operational | Live `pnpm db:seed` against Neon not verified; requires `20260810173000_lessons` migration deployed first | None — post-merge follow-up |
| I-T104-02 | Info | `prisma/seed.ts` | Pre-existing `conceptPrerequisite.deleteMany()` from TASK-103 unchanged (I-T103-01) | None for this task |
| I-T104-03 | Info | `src/lib/schemas/lesson.ts` | `conceptIds` appears in lesson envelope and persisted `content` JSON — intentional duplication for query metadata | None |
| I-T104-04 | Info | Tests | No DB integration test for `seedLessons()` — acceptable at this stage | None for merge |
| I-T104-05 | Info | `content/lessons/01-how-websites-work.json` | Bridge references Lesson 2 slug not yet authored — metadata only, aligned with PRODUCT_REQUIREMENTS | None |

---

## Merge authorization

**The branch `feature/TASK-104-lesson-schema` may be merged to `main`.**

Explicit confirmations:

- **Neon migration deploy and seed may remain post-merge operational work** via
  approved **Database Migrate Deploy** then **Database Seed** workflows.
- **Before next task consumes Lesson 1:** deploy migration
  `20260810173000_lessons` to Neon; run seed; verify `lessons` row for
  `how-websites-work` with six blocks in `content`.
- **TASK-201+ remains unstarted.**
- **Neon migration was not run** during this review.
- **Neon was not seeded** during this review.

---

## Post-merge operator checklist

1. Merge to `main` (Master Agent workflow).
2. Actions → **Database Migrate Deploy** → confirmation **`deploy`**.
3. Actions → **Database Seed** → confirmation **`seed`**.
4. Verify in Neon:
   - `lessons` table exists
   - Row `id = 'how-websites-work'`, `title = 'How Websites Work'`
   - `content` JSON contains `conceptIds: ['how-web-works']` and six blocks
5. Only then consider Phase 4 (`TASK-201`) or lesson-player work operationally
   unblocked (subject to Master direction).
