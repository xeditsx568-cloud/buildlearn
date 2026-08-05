# Project Context — BuildLearn

> **Status:** Planning phase complete. MVP Design Freeze approved 2026-08-05.  
> **Working codename:** BuildLearn (final product name TBD — see DECISIONS.md)  
> **Last updated:** 2026-08-04

---

## 1. Executive Summary

BuildLearn is an AI-powered coding education platform where users describe what they want to build, and the platform teaches them the skills required to build it themselves.

**Core differentiator:** Goal-driven, adaptive learning with a strict "teacher, not builder" AI philosophy. The AI personalizes *order*, *depth*, and *practice* around the user's project goals — it does not auto-generate complete applications.

**MVP thesis to validate:**

> A beginner states a build goal → receives a personalized web-dev learning path → completes lessons and challenges → builds a real project with AI guidance → feels capable of continuing independently.

**Brutally honest assessment:** The full vision is ambitious and expensive. The MVP must constrain scope to a **human-curated curriculum** with an **AI personalization layer**, not fully AI-generated lessons. True skill mastery measurement is hard; MVP uses practical heuristic scoring. Build Mode in MVP is **recipe-based**, not open-ended feature analysis.

---



## 2. Refined Product Concept



### What this is

- A **goal-first learning platform** for people who want to create things with code
- An **AI mentor** that adapts explanations, detects gaps, and guides building
- A **structured skill graph** that tracks demonstrated understanding, not just completion



### What this is NOT

- A code generator (like v0, Cursor, or Replit Agent for output)
- A static course catalog (like early Codecademy)
- A LeetCode-style interview prep platform
- A replacement for human teachers in formal education (initially)



### Product Philosophy

> **Don't just let AI build your website. Learn how to build it yourself.**

The AI escalation ladder for help:

1. Small hint
2. Concept explanation
3. Similar example
4. Partial solution
5. Full solution (only after genuine struggle or explicit request)

---



## 3. Target Users



### Primary (MVP)


| Persona                       | Description                                                  | Goal                                |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| **Complete Beginner Builder** | Never coded; wants a portfolio site or business landing page | Learn enough to ship something real |
| **Hobbyist Creator**          | Tried tutorials; can't connect concepts to projects          | Finish a project with guidance      |
| **Career Explorer**           | Considering web dev; wants low-friction first experience     | Decide if coding is for them        |




### Secondary (post-MVP)

- Students supplementing bootcamps
- Self-taught devs filling specific gaps (e.g., "I need auth")
- Teachers assigning guided project paths



### Anti-personas (not MVP focus)

- Senior engineers wanting AI codegen
- Interview prep users wanting DSA drills
- Teams needing enterprise LMS features

---



## 4. Core User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│  LAND → "What do you want to build?"                            │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ONBOARD → Goal refinement + experience check + optional quiz   │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PATH → Personalized ROADMAP (visual journey, `/roadmap`)      │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
┌───────────────┐                       ┌─────────────────┐
│  LEARN        │                       │  BUILD MODE     │
│  Active node  │◄──────────────────────│  Feature goals  │
│  (player)     │                       │                 │
└───────┬───────┘                       └────────┬────────┘
        ▼                                          │
┌───────────────┐                                  │
│  PRACTICE     │                                  │
│  Challenges   │                                  │
└───────┬───────┘                                  │
        ▼                                          │
┌───────────────┐                                  │
│  PROJECT      │◄─────────────────────────────────┘
│  Apply skills │
└───────┬───────┘
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  REVIEW → AI feedback → mastery update → unlock next steps      │
└─────────────────────────────────────────────────────────────────┘
```



### Session loop (15–25 minutes ideal)

1. **Orient** (30 sec): check Roadmap or Dashboard — see where you are
2. **Learn** (5–8 min): short explanation + interactive example (active node player)
3. **Practice** (5–10 min): 1–2 exercises or a challenge node
4. **Check** (2–3 min): quick quiz or challenge pass
5. **Apply** (optional): project milestone progress
6. **Reflect**: AI summarizes what was learned; return to Roadmap to see progress

---

## 4.1 The Roadmap — Core product surface

The **Roadmap** (`/roadmap`) is BuildLearn's primary learning experience and key differentiator vs static course catalogs.

**What it is:**
- A vertical visual journey from Start → Finish, grouped into sections (HTML Basics, CSS Basics, etc.)
- Personalized to the user's stated goal ("Build a Personal Portfolio Website")
- Shows every node — completed, current, locked — so users always know what's ahead

**What it is not:**
- A flat list of lessons (Codecademy-style)
- The Dashboard (which is a quick overview only)
- The Learn page (which opens only the active lesson/challenge player)

**User questions answered on every visit:**

| Question | Roadmap answer |
| -------- | -------------- |
| What am I building? | Goal title in header |
| Where am I now? | Highlighted current node |
| What have I completed? | ✓ on completed nodes |
| What comes next? | Next unlocked node visible |
| How far from finishing? | Progress % + time remaining + Finish node |

**Approved behaviors (Design Freeze 2026-08-05):**

| Behavior | Rule |
| -------- | ---- |
| **Replay** | Completed nodes open in review-only replay; no mastery, progress, streak, or unlock changes |
| **Auto-scroll** | Roadmap scrolls to current node on load; instant scroll when `prefers-reduced-motion` |
| **Streak** | Simple daily streak — ≥1 learning session per calendar day; no freezes, XP, or rewards in MVP |

See [UX_SPECIFICATION.md](UX_SPECIFICATION.md) §5.8 for full Roadmap specification.

---



## 5. Learning Path System (Design)



### Architecture: Curated Graph + AI Personalization

**Do NOT** generate entire curricula from scratch via LLM in MVP. Instead:

1. **Skill Graph (curated):** Stable DAG of concepts, skills, technologies with prerequisites
2. **Goal Templates (curated):** Map common goals → required skill subsets
3. **AI Personalizer:** Given goal + user profile + placement signals → selects, orders, skips, and adds remedial nodes
4. **AI Content Adapter:** Rewrites lesson framing around user's stated goal (e.g., "for your clothing business site")



### Example goal decomposition

**User:** "I want to make a website for my clothing business."

**System extracts:**

- Domain: web development
- Specificity: business landing page
- Implied needs: layout, branding/styling, images, contact section, mobile-friendly
- Deferred: e-commerce, auth, backend (flagged for later)

**Path for complete beginner:**

1. How websites work
2. HTML structure → semantic sections
3. CSS basics → layout (flexbox) → responsive design
4. JS basics → DOM → events (for simple interactivity)
5. Mini-project: hero + product grid + contact
6. Capstone: business landing page in Build Mode



### Dynamic behaviors


| Signal                              | System response                                           |
| ----------------------------------- | --------------------------------------------------------- |
| Placement quiz shows HTML knowledge | Skip/shrink HTML fundamentals                             |
| Failed functions challenge 2x       | Insert remedial micro-lesson + extra practice             |
| High hint usage on CSS flexbox      | Lower mastery score; flag as weak area (spaced review post-MVP) |
| User asks Build Mode feature early  | Prerequisite check → micro-path or block with explanation |


---



## 6. Skill Mastery System



### Proficiency levels (per concept)


| Level | Name           | Meaning                                       |
| ----- | -------------- | --------------------------------------------- |
| 0     | `unknown`      | No exposure                                   |
| 1     | `introduced`   | Viewed lesson                                 |
| 2     | `practicing`   | Attempted exercises                           |
| 3     | `demonstrated` | Passed assessments with minimal hints         |
| 4     | `proficient`   | Applied successfully in project context       |
| 5     | `solid`        | Consistent performance + spaced review passed |


**Critical distinction:** `completed lesson` ≠ `demonstrated`. Completion only grants `introduced` or `practicing`.

### Mastery score (0.0–1.0)

Weighted composite updated after each signal:

```
mastery = weighted_avg(
  quiz_score        × 0.20,
  challenge_score   × 0.30,
  project_rubric    × 0.25,
  independence      × 0.15,  // inverse of hints used
  recency_decay     × 0.10
)
```



### Signals collected

- Quiz answers (auto-graded)
- Challenge submissions (test cases + AI rubric)
- Project milestone checks (structured criteria)
- Hint level requested (escalation = lower independence)
- Time to completion (weak signal alone; used with others)
- Repeat mistakes on same concept (triggers review)
- AI conversational assessment (structured output, not freeform guess)



### Spaced review (post-MVP — not in MVP launch)

Concepts with mastery > 0.7 but not reviewed in 14+ days should eventually get a short review challenge inserted into path. **Deferred to post-MVP** (see FR-6.4). MVP may flag weak areas but does not auto-insert review steps.

---



## 7. Lesson Design Standards



### Lesson length

- **Target:** 12–18 minutes total
- **Max:** 25 minutes (split if longer)
- **Micro-lessons:** 5–7 minutes for remedial inserts



### Lesson structure (blocks)

1. **Objective** (1 min): what you'll be able to do
2. **Explain** (3–5 min): prose + diagrams + code examples
3. **Interact** (2–3 min): manipulate example in embedded editor
4. **Exercise** (5–8 min): write code / fill-blank / debug
5. **Check** (2–3 min): 2–4 quiz questions
6. **Bridge** (1 min): connect to user's goal and project



### Difficulty progression

- One new concept per lesson (two max if tightly related)
- 60% of exercises reinforce current concept; 40% mix prior concepts
- Debugging challenges introduced after lesson 5+
- Mini-projects every 3–4 lessons

---



## 8. Build Mode (Concept)

Separate workspace where user works on their persistent project.

**Flow:**

1. User requests feature in natural language
2. System maps feature → required concepts (from skill graph)
3. If gaps exist → generate micro learning path (not full detour)
4. User implements in project editor
5. AI reviews against rubric; provides feedback
6. Mastery updated for applied concepts

**MVP limitation:** Only pre-mapped "feature recipes" (see canonical list in §14). Open-ended NLP feature decomposition waits until post-MVP.

---



## 9. AI Context & Memory



### Three-layer memory model


| Layer                  | Storage                  | Contents                                       | TTL       |
| ---------------------- | ------------------------ | ---------------------------------------------- | --------- |
| **Structured profile** | PostgreSQL               | Goals, mastery scores, path state, preferences | Permanent |
| **Session context**    | Redis / in-memory        | Current lesson, recent messages, editor state  | Session   |
| **Retrieval memory**   | pgvector (optional MVP+) | Lesson snippets, past mistakes, project notes  | Long-term |




### What goes to AI per request (assembled, not dumped)

```json
{
  "user_summary": "Beginner; goal: clothing business site; weak: JS functions",
  "current_objective": "Lesson: CSS Flexbox",
  "relevant_mastery": { "html-basics": 0.85, "css-selectors": 0.72 },
  "recent_mistakes": ["confused margin vs padding"],
  "active_project": { "name": "StyleShop", "stack": ["html","css","js"] },
  "mode": "lesson_tutor",
  "help_level_cap": 2
}
```

**Never send:** full chat history, entire project files (send relevant excerpts only), other users' data.

---



## 10. MVP vs Full Vision

See PRODUCT_REQUIREMENTS.md for detailed feature lists. Summary:


| In MVP                               | Wait                             |
| ------------------------------------ | -------------------------------- |
| Web (HTML/CSS/JS) only               | Python, React, backend, DB       |
| Curated skill graph (24 concepts)    | Open-ended curriculum generation |
| ~12 lessons, ~8 challenges           | 100+ lesson library              |
| 1 persistent project                 | Multi-project portfolio          |
| Recipe-based Build Mode (5 features) | Open NLP feature decomposition   |
| Basic AI tutor (rate-limited)        | Unlimited premium tutoring       |
| Email + Google auth                  | SSO, teams, classrooms           |
| Client-side code execution           | WebContainers / server sandboxes |
| —                                    | Streak counter, full gamification |
| —                                    | Social, leaderboards, payments   |


---



## 11. Success Metrics (MVP)


| Metric                                   | Target            |
| ---------------------------------------- | ----------------- |
| Onboarding → first lesson complete       | > 70%             |
| Week-1 retention                         | > 30%             |
| Lesson completion rate                   | > 60%             |
| Project milestone 1 reached              | > 40% of starters |
| User reports "I understand what I built" | > 4/5 survey      |
| AI cost per active user per month        | < $3              |


---



## 12. Document Index


| Document                | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| PROJECT_CONTEXT.md      | This file — vision, users, journeys, concepts            |
| PRODUCT_REQUIREMENTS.md | Features, MVP scope, prioritization, monetization        |
| ARCHITECTURE.md         | Tech stack, system design, database, AI, security        |
| IMPLEMENTATION_PLAN.md  | Phased roadmap, risks, competitive analysis, first tasks |
| AGENT_WORKFLOW.md       | Multi-agent development process                          |
| FILE_OWNERSHIP.md       | File ownership rules for parallel programmers            |
| TASK_QUEUE.md           | Active task tracking for agents                          |
| DECISIONS.md            | Architectural decisions and pending approvals            |
| README.md               | Documentation index                                      |


---



## 13. Canonical MVP Constants

All documents MUST use these values. Do not approximate.

| Constant | Value |
| -------- | ----- |
| Skill graph concepts | **24** (listed in PRODUCT_REQUIREMENTS.md §4) |
| Lessons | **12** |
| Challenges | **8** |
| Project milestones | **4** |
| Build Mode recipes | **5** (dark mode toggle, mobile hamburger nav, hero section with CTA, product/image grid, styled contact form section) |
| Free AI tutor quota (MVP) | **30 messages/month** |
| Help levels in MVP | **1–3** (levels 4–5 are P1 polish) |
| Experience levels | `beginner` \| `some_exposure` \| `intermediate` |
| User code execution | **Client-side iframe only** — never on server |

## 14. Open Questions

See DECISIONS.md for items requiring stakeholder approval.