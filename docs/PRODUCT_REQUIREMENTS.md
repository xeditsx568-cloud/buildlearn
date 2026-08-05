# Product Requirements — BuildLearn

> **Status:** Planning — not yet approved for implementation  
> **Last updated:** 2026-08-04

---

## 1. Product Goals

### Primary goals
1. Validate that goal-driven learning paths improve beginner completion vs static courses
2. Prove AI-as-teacher (not builder) creates real skill acquisition
3. Ship a usable web-dev learning experience for HTML/CSS/JS fundamentals

### Non-goals (MVP)
- Become a general-purpose IDE
- Replace bootcamps or formal CS education
- Support all programming languages
- Maximize AI usage or engagement time

---

## 2. Functional Requirements

### FR-1: Authentication & Accounts
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-1.1 | Email/password registration and login | Yes | P0 |
| FR-1.2 | Google OAuth | Yes | P0 |
| FR-1.3 | Password reset | Yes | P1 |
| FR-1.4 | Profile (display name, avatar) | Yes | P1 |
| FR-1.5 | Account deletion / data export | Yes | P1 (GDPR-ready) |

### FR-2: Onboarding
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-2.1 | "What do you want to build?" free-text goal capture | Yes | P0 |
| FR-2.2 | Experience level self-assessment (`beginner` / `some_exposure` / `intermediate`) | Yes | P0 |
| FR-2.3 | Optional 5-question placement quiz | Yes | P1 |
| FR-2.4 | Goal refinement via AI (clarifying questions, max 2 turns) | Yes | P1 |
| FR-2.5 | Generate initial learning path | Yes | P0 |

### FR-3: Learning Paths
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-3.1 | Display personalized roadmap with progress | Yes | P0 |
| FR-3.2 | Skip nodes based on placement / demonstrated mastery | Yes | P0 |
| FR-3.3 | Insert remedial nodes on failure patterns | Yes | P1 |
| FR-3.4 | Path adapts when user enters Build Mode feature requests | Partial | P1 |
| FR-3.5 | Multiple concurrent goals | No | P3 |

### FR-4: Lessons
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-4.1 | Lesson player with blocks (explain, example, exercise, quiz) | Yes | P0 |
| FR-4.2 | Embedded Monaco code editor | Yes | P0 |
| FR-4.3 | Live HTML/CSS/JS preview (iframe) | Yes | P0 |
| FR-4.4 | Auto-graded exercises (test assertions) | Yes | P0 |
| FR-4.5 | Multiple-choice and fill-in-blank quizzes | Yes | P0 |
| FR-4.6 | AI hint button with escalation levels 1–3 | Yes | P0 |
| FR-4.7 | AI hint levels 4–5 | Yes | P1 |
| FR-4.8 | Debugging challenges | Yes | P1 |
| FR-4.9 | Short-answer AI-graded questions | No | P2 |

### FR-5: Challenges
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-5.1 | Standalone coding challenges linked to concepts | Yes | P0 |
| FR-5.2 | Visible test cases (some hidden for anti-gaming) | Yes | P1 |
| FR-5.3 | Multiple attempts with mastery impact | Yes | P0 |
| FR-5.4 | Challenge hints via AI tutor | Yes | P1 |

### FR-6: Skill Mastery
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-6.1 | Per-concept mastery score (0.0–1.0) | Yes | P0 |
| FR-6.2 | Proficiency level display | Yes | P1 |
| FR-6.3 | Weak area identification | Yes | P1 |
| FR-6.4 | Spaced review insertion | No | P2 |
| FR-6.5 | Skill graph visualization | No | P2 |

### FR-7: Projects
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-7.1 | One persistent project per user (auto-created at onboarding) | Yes | P0 |
| FR-7.2 | Multi-file editor (index.html, styles.css, script.js) | Yes | P0 |
| FR-7.3 | Project milestones tied to learning path | Yes | P0 |
| FR-7.4 | AI project review with structured rubric | Yes | P1 |
| FR-7.5 | Project versioning / history | No | P2 |
| FR-7.6 | Multiple projects | No | P2 |
| FR-7.7 | Deploy/publish project | No | P3 |

### FR-8: Build Mode
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-8.1 | Separate Build Mode workspace UI | Yes | P0 |
| FR-8.2 | Feature request input | Yes | P0 |
| FR-8.3 | Prerequisite check against skill graph | Yes | P0 |
| FR-8.4 | Micro learning path before build | Yes | P1 |
| FR-8.5 | 5 pre-defined feature recipes | Yes | P0 |
| FR-8.6 | Open-ended feature NLP analysis | No | P2 |
| FR-8.7 | Progressive assistance levels 1–5 | Partial (1–3) | P1 |

### FR-9: AI Tutor
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-9.1 | Context-aware tutoring (lesson, challenge, project, build) | Yes | P0 |
| FR-9.2 | Socratic questioning before solutions | Yes | P0 |
| FR-9.3 | Error explanation for user code | Yes | P0 |
| FR-9.4 | Misconception detection (structured) | Partial | P1 |
| FR-9.5 | "Explain like I'm 12" adaptation | Yes | P1 |
| FR-9.6 | Rate limiting / usage quotas | Yes | P0 |

### FR-10: Progress & Dashboard
| ID | Requirement | MVP | Priority |
|----|-------------|-----|----------|
| FR-10.1 | Dashboard: current path, next lesson, project status | Yes | P0 |
| FR-10.2 | Lesson/challenge completion history | Yes | P0 |
| FR-10.3 | Streak counter (days with activity) | Yes | P2 |
| FR-10.4 | XP and levels | No | P3 |
| FR-10.5 | Achievements | No | P3 |

---

## 3. MVP Definition

### The smallest version that validates the core loop

**User story:**
> As a complete beginner who wants a website for my small business, I sign up, tell the platform my goal, get a personalized HTML/CSS/JS path, complete 8–12 lessons and 5+ challenges, build a landing page with guided feature additions, and feel confident I understand the code I wrote.

### MVP feature set (IN)

1. **Auth:** Email + Google
2. **Onboarding:** Goal capture, experience level, optional placement quiz
3. **AI path generation:** From curated graph + goal template + user signals
4. **Curriculum:** 12 lessons covering web fundamentals through basic JS DOM
5. **Challenges:** 8 auto-graded coding challenges
6. **Lesson player:** Monaco + live preview + quizzes + exercises
7. **Skill tracking:** Mastery scores for 24 concepts
8. **Project:** Single multi-file static site project with 4 milestones
9. **Build Mode:** 5 feature recipes (dark mode, responsive nav, hero section, image grid, contact form styling)
10. **AI tutor:** Sidebar with hints, error help, concept explanation (30 messages/month quota)
11. **Dashboard:** Path progress, continue learning CTA, project status

### Explicitly OUT of MVP

| Feature | Reason to defer |
|---------|-----------------|
| Python, React, TypeScript, backend | Scope; prove web loop first |
| Fully AI-generated lessons | Quality/hallucination risk |
| WebContainers | Complexity; static web runs client-side |
| Payments / subscriptions | Need usage data first |
| Social features | Distraction; moderation burden |
| Leaderboards | Toxic dynamics; gaming risk |
| Full gamification (XP, achievements) | Can bias toward time-on-site not learning |
| Multiple projects | One project sufficient to validate |
| Open-ended Build Mode | Requires robust skill graph + NLP pipeline |
| Mobile native app | Web-first |
| Instructor/admin CMS | Seed content via JSON/markdown initially |
| Spaced repetition engine | Algorithm complexity |
| Video lessons | Production cost |
| Live classrooms | Enterprise scope |

---

## 4. Curriculum Scope (MVP)

### Skill graph nodes (24 concepts)

**Foundations**
- how-web-works, html-document-structure, html-elements, html-attributes, html-semantics, html-forms

**CSS**
- css-syntax, css-selectors, css-box-model, css-colors-typography, css-flexbox, css-grid-intro, css-responsive

**JavaScript**
- js-variables-types, js-functions, js-conditionals, js-loops, js-arrays, js-dom-selection, js-dom-manipulation, js-events

**Integration**
- combining-html-css-js, debugging-basics, project-structure

### Lessons (12)
1. How Websites Work
2. Your First HTML Page
3. HTML Structure & Semantics
4. Links, Images & Forms
5. CSS Basics & Selectors
6. Box Model & Spacing
7. Layout with Flexbox
8. Responsive Design
9. JavaScript Basics
10. Functions & Logic
11. DOM Manipulation
12. Events & Interactivity

### Challenges (8)
1. Build a basic profile card (HTML)
2. Style a card with CSS
3. Create a navigation bar (flexbox)
4. Make a page responsive
5. Variables and functions drill
6. DOM text changer
7. Click counter
8. Form validation (basic)

### Project milestones
1. Static personal/business page structure
2. Styled layout with flexbox
3. Responsive mobile view
4. Interactive element (toggle, form, or counter)

### Build Mode recipes
1. Dark mode toggle
2. Mobile hamburger navigation
3. Hero section with CTA
4. Product/image grid
5. Styled contact form section

---

## 5. Feature Prioritization (Full Product)

### P0 — MVP launch blockers
Auth, onboarding, path generation, lessons, challenges, editor, preview, project, basic AI tutor, mastery tracking

### P1 — MVP polish (launch + 4 weeks)
Password reset, placement quiz, Build Mode micro-paths, AI levels 4–5, project review, streak counter, debugging challenges

### P2 — Post-MVP (months 2–4)
Spaced review, skill visualization, short-answer grading, open Build Mode (limited), second project template, CSS Grid deep dive, local storage lessons

### P3 — Growth (months 4–8)
Payments, premium paths, React intro, backend basics, achievements, project deploy, admin CMS

### P4 — Scale (months 8+)
Social features, leaderboards, mobile app, Python track, AI integrations track, teams/classrooms

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Lesson page LCP < 2.5s on 4G |
| Availability | 99.5% uptime target |
| Security | No server-side user code execution in MVP |
| Privacy | GDPR-ready; minimal data collection |
| Accessibility | WCAG 2.1 AA for lesson player |
| AI cost | < $3/active user/month at MVP scale |
| Scalability | 10K MAU without architecture change |

---

## 7. Gamification Design (Future)

### Principles
- Reward **demonstrated mastery**, not time spent
- Never reward copy-paste of AI solutions
- Streaks require meaningful activity (lesson, challenge, or project milestone — not login alone)

### Proposed systems (post-MVP)

**XP sources (weighted)**
| Action | XP | Anti-exploit |
|--------|-----|--------------|
| Lesson demonstrated (not just viewed) | 50 | Requires quiz pass |
| Challenge first-try pass | 100 | Hidden tests |
| Challenge pass with hints | 40 | Reduced XP |
| Project milestone | 150 | Rubric check |
| Spaced review pass | 30 | Cooldown |
| Login | 0 | — |

**Streaks:** 1 meaningful activity per calendar day; 1 freeze/week for premium

**Achievements:** Milestone-based ("First DOM manipulation", "Built without level-5 help")

**Do NOT build for MVP** except optional simple streak counter.

---

## 8. Social Features Analysis (Future)

| Feature | MVP? | Assessment |
|---------|------|------------|
| Friends | No | Moderation, low value early |
| Progress sharing | No | Nice-to-have; link export sufficient later |
| Public profiles | No | Privacy concerns for beginners |
| Leaderboards (weekly XP) | No | Encourages grinding |
| "Most improved" | No | Hard to measure fairly; gaming risk |
| Coding duels | No | Scope explosion |

**If added later:** Opt-in only, no public leaderboards for beginners, focus on "study buddies" not competition.

**Fair "most improved" metric (if ever built):**
```
improvement = Σ(concept_mastery_delta × concept_difficulty_weight) over window
```
Exclude concepts already > 0.8 mastery. Cap daily contribution. Require minimum activity threshold.

---

## 9. Monetization Strategy

### Recommended model: Freemium + AI credits subscription

**Why not pure subscription:** Education should not paywall fundamentals.  
**Why not pure usage-based:** Unpredictable bills scare learners.  
**Hybrid works:** Free core learning; paid for AI-intensive features.

### Free tier (post-MVP monetization — not enforced at MVP launch)
- Full HTML/CSS/JS fundamentals path
- All 12 lessons and 8 challenges
- Full project and all 5 Build Mode recipes (**everything free during MVP beta**)
- 30 AI tutor messages/month (quota enforced at launch; instrument usage during beta)
- Community support (future)

> **Note:** MVP beta has no payments. All content and recipes are free. The 3/5 recipe split is a post-MVP monetization option only — do NOT implement at MVP launch.

### Pro tier (~$12–15/month)
- Unlimited basic AI tutoring (fair use cap ~500 msg/month)
- Advanced code review
- All Build Mode recipes + open feature requests (when available)
- Future advanced paths (React, backend)
- Streak freezes, progress analytics

### Alternative revenue (later)
- One-time project packs ($9–19)
- Student discount (50%)
- Team/classroom licensing ($5/seat/month)

### What NOT to paywall
- Core lesson content
- Basic challenges
- First project
- Accessibility features

### Payment provider
**Stripe** — industry standard, subscription support, tax handling.

**Do NOT implement payments in MVP.** Instrument AI usage to inform pricing.

---

## 10. Content Strategy

### MVP content authoring
- Lessons stored as structured JSON/Markdown in repo (`content/lessons/`)
- Version controlled, reviewed by humans
- AI adapts framing at runtime, not source of truth

### Post-MVP
- Admin CMS for content team
- AI-assisted content drafting with human review
- Community contributions (heavily moderated)

---

## 11. Acceptance Criteria (MVP Launch)

- [ ] New user completes onboarding in < 3 minutes
- [ ] AI generates valid path from 10 tested goal variations
- [ ] All 12 lessons playable end-to-end
- [ ] All 8 challenges auto-grade correctly
- [ ] Project editor saves and previews correctly
- [ ] AI tutor responds within 5 seconds (p95)
- [ ] No server-side code execution of user code
- [ ] AI costs tracked per user
- [ ] Mobile-responsive UI (not native app)
- [ ] Basic accessibility audit passes
