# MVP-M2 — Founder production verification

**Status:** PRODUCTION VERIFIED  
**Date:** 2026-10-03  
**Environment:** https://buildlearn-two.vercel.app  
**Main commits:** MVP-M2 `338b2af`; infra fix `b734367` / docs `a370ee7`  
**Neon:** `20260929140000_lesson_progress` applied (Database Migrate Deploy **#7**) — **do not re-run**

---

## Infrastructure confirmed

| Item | Status |
| ---- | ------ |
| Vercel Production build | **Green** @ `main` `a370ee7` |
| `postinstall` → `prisma generate` | Operational |
| Pooled `DATABASE_URL` (MVP-M1) | Unchanged; working |

---

## Founder smoke checklist (15/15 passed)

1. Existing completed onboarding loads correctly.
2. Generated roadmap loads from persisted path.
3. Lesson 1 — **How Websites Work** — opens from roadmap.
4. Lesson player loads all six block types.
5. Monaco editor works.
6. Live iframe preview updates from learner edits.
7. Interact grader works.
8. Exercise grader works.
9. Quiz / lesson progression works.
10. Progress persists through the lesson.
11. **Complete lesson** succeeds.
12. Learner returns to `/roadmap`.
13. Lesson 1 step shows **COMPLETED**.
14. Lesson 2 — **Your First HTML Page** — shows **AVAILABLE**.
15. Later roadmap steps remain **LOCKED**.

**MVP-M2 Definition of Done:** satisfied (complete L1 in-app; progress saved; next step unlocked on roadmap).

---

## Founder product finding (beginner UX — not a blocker for M2 closure)

During the **“Label the page parts”** exercise, founder testing **as a genuine beginner**
could not understand without external step-by-step help:

- what the exercise wanted,
- what an HTML comment is,
- where to type the comment in the editor,
- what “above the `<html>`, `<head>`, and `<body>` tags” meant,
- how to recover when stuck.

This is **not** treated as copy-only polish. It indicates a **teaching-model gap** between
working mechanics (MVP-M2) and beginner-ready learning (next teaching milestone).

**Recorded requirements:** ADR-023 (Beginner Teaching Principle); MVP-M3 / TASK-203 scope notes in `TASK_QUEUE.md`.

**Out of scope for this verification close:** Lesson 1 content rewrite, TASK-205 roadmap polish, TASK-203 implementation.

---

## Non-blocking technical follow-ups (unchanged)

See `docs/reviews/MVP-M2-FINAL.md`: I-M2-01, I-M2-02, I-M2-05.
