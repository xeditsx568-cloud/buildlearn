# UX Specification — BuildLearn MVP

> **Status:** Draft for stakeholder approval  
> **Version:** 1.0  
> **Date:** 2026-08-05  
> **Scope:** MVP only (Phases 2–15 UI)  
> **Related:** [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)

---

## 1. Purpose

This document defines every user-facing screen, navigation pattern, state, and design token for the BuildLearn MVP. It aligns with the Phase 1 route structure (`(marketing)` and `(app)` groups) and extends it with nested routes required by later phases.

**Design principles:**
- Goal-first: every screen connects back to what the user wants to build
- Teacher-not-builder: AI assists via sidebar, never replaces the editor
- Progressive disclosure: beginners see simple paths; complexity reveals as they advance
- One primary action per screen
- Mobile-responsive web (not native app)

---

## 2. Route architecture alignment

### Current Phase 1 routes (implemented)

| Route | Group | Status |
| ----- | ----- | ------ |
| `/` | `(marketing)` | Placeholder |
| `/dashboard` | `(app)` | Placeholder |
| `/learn` | `(app)` | Placeholder |
| `/project` | `(app)` | Placeholder |
| `/build` | `(app)` | Placeholder |

### Recommended route additions (before Phase 2 UI work)

| Route | Group | Phase | Notes |
| ----- | ----- | ----- | ----- |
| `/sign-in`, `/sign-up` | `(auth)` or root | 2 | Outside `(app)` — Clerk hosted UI |
| `/onboarding/*` | `(onboarding)` | 4 | New group: no app nav, stepper only |
| `/learn/lessons/[lessonId]` | `(app)` | 7 | Lesson player |
| `/learn/challenges/[challengeId]` | `(app)` | 8 | Challenge player |
| `/build/recipes/[recipeId]` | `(app)` | 11 | Recipe-guided build flow |
| `/settings` | `(app)` | 2+ | Profile & account |
| `/privacy`, `/terms` | `(marketing)` | 2 | GDPR-ready (P1) |

### Screens that are **not** routes (overlays/panels)

| UI surface | Context | Rationale |
| ---------- | ------- | --------- |
| AI Tutor sidebar | Lesson, challenge, project, build | Persistent panel; not a page (ARCHITECTURE §2.1) |
| Path generation loader | Onboarding | Blocking overlay while AI generates path |
| Milestone celebration | Project | Modal after rubric pass |
| AI quota warning | Any AI surface | Modal when approaching/exceeding 30 msg/month |
| Session expired | App shell | Modal redirect to sign-in |

---

## 3. Sitemap

```
buildlearn.app
├── /                          Landing (marketing)
├── /privacy                   Privacy policy
├── /terms                     Terms of service
├── /sign-in                   Sign in (Clerk)
├── /sign-up                   Sign up (Clerk)
│
├── /onboarding
│   ├── /goal                  Step 1: What do you want to build?
│   ├── /experience            Step 2: Experience level
│   ├── /quiz                  Step 3: Placement quiz (optional, skippable)
│   └── /path                  Step 4: Path preview + confirm
│
└── (authenticated app shell)
    ├── /dashboard             Home hub — continue learning
    ├── /learn                 Learning path overview
    │   ├── /lessons/[id]      Lesson player
    │   └── /challenges/[id]   Challenge player
    ├── /project               Multi-file project workspace
    ├── /build                 Build Mode recipe catalog
    │   └── /recipes/[id]      Guided recipe implementation
    └── /settings              Profile & account
```

**Deferred post-MVP:** `/pricing`, `/about`, `/admin/*`, multiple projects, skill graph viz, deploy preview URL.

---

## 4. Navigation model

### Global app shell (`(app)` layout)

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo → /dashboard]   Dashboard  Learn  Project  Build      │
│                                        [AI quota] [Avatar ▾] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      {page content}                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Primary nav:** Dashboard, Learn, Project, Build — always visible on desktop
- **Mobile:** Hamburger menu collapses nav; bottom tab bar optional enhancement (P1)
- **Avatar menu:** Settings, Sign out
- **Active state:** underline + `aria-current="page"` on current nav item
- **Logo click:** returns to `/dashboard` when authenticated

### Marketing shell (`(marketing)` layout)

- Minimal header: Logo + Sign in + Get started (→ sign-up)
- No app nav
- Footer: Privacy, Terms, copyright

### Onboarding shell (`(onboarding)` layout)

- Progress stepper (4 steps max)
- No app nav (prevents skipping onboarding)
- Back button within flow only; no escape to dashboard until complete

### Cross-screen navigation rules

| From | Action | To |
| ---- | ------ | -- |
| Landing | Get started | `/sign-up` |
| Landing | Sign in | `/sign-in` |
| Sign up success (new user) | Auto | `/onboarding/goal` |
| Sign in success (returning, onboarding done) | Auto | `/dashboard` |
| Sign in success (returning, onboarding incomplete) | Auto | resume onboarding step |
| Onboarding complete | Confirm path | `/dashboard` |
| Dashboard | Continue learning | `/learn/lessons/[nextLessonId]` or `/learn` |
| Dashboard | Open project | `/project` |
| Learn path | Click step | `/learn/lessons/[id]` or `/learn/challenges/[id]` |
| Lesson complete | Next step | next path item or `/learn` |
| Build hub | Select recipe | `/build/recipes/[id]` |
| Build recipe | Apply to project | `/project` (with recipe context) |

---

## 5. Screen inventory

### 5.1 Marketing — Landing (`/`)

**Purpose:** Communicate value proposition; convert visitors to sign-up.

**Primary user:** Anonymous visitor.

**Components:**
- Hero: headline ("Learn to build it yourself"), subhead, primary CTA (Get started), secondary CTA (Sign in)
- Philosophy strip: 3 bullets (goal-driven, AI teacher not builder, real project)
- How it works: 4-step visual (Goal → Path → Learn → Build)
- Social proof placeholder (testimonial slots — static for MVP)
- Footer

**Wireframe (text):**
```
[Logo]                                    [Sign in] [Get started]

              Learn to build it yourself
     AI-guided paths. Real projects. You write the code.

                    [ Get started free ]

    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ 1. Goal  │→ │ 2. Path  │→ │ 3. Learn │→ │ 4. Build │
    └──────────┘  └──────────┘  └──────────┘  └──────────┘

              [Footer: Privacy | Terms]
```

**Empty/loading/error:** N/A (static marketing page).

**Mobile:** Single column; CTAs full-width; steps stack vertically.

**A11y:** Semantic landmarks (`header`, `main`, `footer`); heading hierarchy h1→h2; focus visible on CTAs.

---

### 5.2 Auth — Sign In (`/sign-in`) & Sign Up (`/sign-up`)

**Purpose:** Account access via Clerk (email + Google).

**Components:**
- Clerk `<SignIn />` / `<SignUp />` components (centered card)
- Link to alternate flow (sign up ↔ sign in)
- Brand logo above card
- Return to home link

**Wireframe:**
```
                    [Logo]
              ┌─────────────────┐
              │  Clerk widget   │
              │  Email / Google │
              │  [Continue]     │
              └─────────────────┘
           Don't have an account? Sign up
```

**Loading:** Clerk internal loading states.

**Error:** Clerk inline validation; network error toast.

**Mobile:** Full-width card with 16px padding.

**A11y:** Clerk components are accessible; ensure focus trap in modal mode if used.

---

### 5.3 Onboarding — Goal (`/onboarding/goal`)

**Purpose:** Capture user's build goal (FR-2.1).

**Components:**
- Step indicator (1 of 4)
- Prompt: "What do you want to build?"
- Large textarea (500 char max, counter)
- Example chips ("A portfolio site", "A bakery landing page", "A blog")
- Continue button (disabled until min 10 chars)

**Wireframe:**
```
Step ●○○○  Goal

What do you want to build?
Describe your project in your own words.

┌─────────────────────────────────────────┐
│ I want to create a website for my...    │
└─────────────────────────────────────────┘
                              142 / 500

[Example chips row]

                              [ Continue → ]
```

**Empty:** Placeholder text in textarea.

**Error:** "Please describe your goal in at least 10 characters."

---

### 5.4 Onboarding — Experience (`/onboarding/experience`)

**Purpose:** Self-assessment (FR-2.2).

**Components:**
- Step indicator (2 of 4)
- Three radio cards: `beginner`, `some_exposure`, `intermediate`
- Each card: title, 1-line description, icon
- Continue button

**Wireframe:**
```
Step ●●○○  Experience

How much coding have you done?

( ) Complete beginner — never written code
( ) Some exposure — tried tutorials or snippets
( ) Intermediate — built small projects before

                              [ Continue → ]
```

---

### 5.5 Onboarding — Placement Quiz (`/onboarding/quiz`) — P1, skippable

**Purpose:** Optional placement signals (FR-2.3).

**Components:**
- Step indicator (3 of 4)
- 5 multiple-choice questions (one per screen or paginated)
- Skip link ("I'm not sure — skip quiz")
- Progress dots within quiz

**Loading:** N/A.

**Error:** Must select an answer or skip.

**Note:** If skipped, step collapses; path generation uses experience level only.

---

### 5.6 Onboarding — Path Preview (`/onboarding/path`)

**Purpose:** Show AI-generated path; confirm before dashboard (FR-2.5).

**Components:**
- Step indicator (4 of 4)
- Goal summary card (user's words + AI-refined summary)
- Vertical path preview (12–20 steps, scrollable)
- Step types icon-coded: lesson, challenge, project milestone
- "Start learning" primary CTA

**Loading state:**
```
Step ●●●●  Your path

  [Animated skeleton list — 8 rows]
  Generating your personalized path...
  This usually takes 10–20 seconds.
```

**Error state:**
```
  We couldn't generate your path.
  [ Try again ]  [ Contact support ]
```

**Wireframe (loaded):**
```
Your learning path

Goal: Clothing business landing page

  ✓ 1. How Websites Work          [lesson]
  ○ 2. Your First HTML Page       [lesson]
  ○ 3. HTML Structure             [lesson]
  ...
  ○ 12. Events & Interactivity    [lesson]
  ○ — Profile card challenge      [challenge]
  ○ ★ Project milestone 1         [milestone]

                    [ Start learning → ]
```

---

### 5.7 Dashboard (`/dashboard`)

**Purpose:** Home hub — orient user, drive next action (FR-10.1).

**Components:**
- Welcome header with goal reminder ("Building: [goal summary]")
- **Continue learning** card (primary): next path step, progress bar, CTA
- **Project status** card: milestone progress (0–4), thumbnail preview, "Open project"
- **Path overview** mini-list: next 3 steps
- **Weak areas** callout (P1, after mastery data exists)
- AI message quota indicator (e.g., "24 of 30 messages left")

**Wireframe:**
```
Welcome back, Alex

┌─ Continue learning ─────────────────────────────┐
│ Next: CSS Box Model & Spacing    [====··] 67% │
│                              [ Continue → ]     │
└─────────────────────────────────────────────────┘

┌─ Your project ──────┐  ┌─ Up next ─────────────┐
│ StyleShop           │  │ 4. Links & Forms      │
│ Milestone 2 of 4    │  │ 5. CSS Basics         │
│ [ Open project ]    │  │ 6. Box Model          │
└─────────────────────┘  └───────────────────────┘
```

**Empty state (new user, path just created):**
```
Welcome! Your path is ready.
[ Start your first lesson → ]
```

**Loading:** Skeleton cards for each section.

**Error:** "Couldn't load your progress. [ Retry ]"

**Mobile:** Cards stack single column; continue card pinned near top.

---

### 5.8 Learning Path (`/learn`)

**Purpose:** Full roadmap with step states (FR-3.1, Phase 6).

**Components:**
- Page title + overall progress (e.g., "8 of 24 steps complete")
- Filter tabs: All | Lessons | Challenges | Milestones
- Vertical timeline / step list
- Step card states:
  - **Locked:** greyed, lock icon, prerequisite tooltip
  - **Available:** accent border, "Start" button
  - **In progress:** progress indicator
  - **Completed:** checkmark, muted
  - **Skipped:** dashed border, "Skipped" badge
- Legend for step types

**Wireframe:**
```
Your learning path                    8 / 24 complete
[All] [Lessons] [Challenges] [Milestones]

  ✓  How Websites Work          completed
  ✓  Your First HTML Page       completed
  →  CSS Box Model              [ Continue ]
  🔒 Responsive Design           locked — complete Box Model first
  ○  JavaScript Basics           available
  ...
```

**Empty:** Should not occur post-onboarding.

**Loading:** Skeleton timeline.

**Error:** Full-page error with retry.

---

### 5.9 Lesson Player (`/learn/lessons/[lessonId]`)

**Purpose:** Deliver lesson content blocks (FR-4.1–4.6).

**Layout (desktop):**
```
┌──────────────────────────────────────┬──────────────────┐
│ [← Back to path]  Lesson 5 of 12     │   AI Tutor       │
│                                      │   [sidebar]      │
│  {block content scroll area}         │                  │
│  - Objective                         │   Ask a question │
│  - Explain (prose + code)            │   [Hint L1-L3]   │
│  - Interact (mini editor)            │                  │
│  - Exercise (Monaco + preview)       │                  │
│  - Quiz (MCQ / fill-blank)           │                  │
│  - Bridge                            │                  │
│                                      │                  │
│  [ ← Previous block ] [ Next → ]     │                  │
└──────────────────────────────────────┴──────────────────┘
```

**Mobile layout:** AI tutor collapses to floating action button (FAB) opening bottom sheet; editor stacks above preview (tab switch: Code | Preview).

**Components per block type:**

| Block | Components |
| ----- | ---------- |
| Objective | Heading, bullet list, estimated time |
| Explain | Prose, syntax-highlighted code (read-only), optional diagram |
| Interact | Small Monaco (read-only starter + editable zone), Run button |
| Exercise | Monaco editor, live iframe preview, Run tests, Hint button |
| Quiz | Question, options or input, Submit, feedback |
| Bridge | Goal connection text, next step preview |

**Loading:** Block skeleton; Monaco lazy-load spinner.

**Error states:**
- Lesson not found → 404
- Save failed → toast "Progress not saved. Retrying..."
- Grading error → inline "We couldn't check your code. Try again."

**Empty:** N/A.

**Lesson complete modal:**
```
🎉 Lesson complete!
You learned: CSS Box Model, margin, padding

[ Next lesson → ]  [ Back to path ]
```

**A11y:** Monaco aria-label; preview iframe title="Code output"; keyboard nav between blocks; tutor sidebar focus trap when open on mobile.

---

### 5.10 Challenge Player (`/learn/challenges/[challengeId]`)

**Purpose:** Standalone coding challenge with auto-grading (FR-5.1–5.3).

**Layout:** Similar to lesson exercise block but full-page.

**Components:**
- Instructions panel (left/top)
- Monaco editor (center)
- Test results panel (visible tests listed; hidden tests count shown only)
- Preview iframe (when HTML/CSS)
- Attempt counter
- Hint button (AI, levels 1–3)
- Submit button

**Wireframe:**
```
Challenge: Build a profile card          Attempt 2 of ∞

┌ Instructions ──────┐ ┌ Editor ────────────────┐
│ Requirements:      │ │                        │
│ - Use semantic HTML│ │  <html>...             │
│ - Include img, h2  │ │                        │
└────────────────────┘ └────────────────────────┘
┌ Preview ───────────┐ ┌ Tests ─────────────────┐
│ [rendered card]    │ │ ✓ Has h2 element       │
│                    │ │ ✗ img has alt text     │
└────────────────────┘ │ 2 / 3 passing          │
                       └────────────────────────┘
              [ Get hint ]  [ Submit solution ]
```

**Pass state:** Green banner + mastery update toast + "Next challenge" CTA.

**Fail state:** Red banner with failed test messages (no hidden test details).

**Loading:** Grading spinner on submit.

---

### 5.11 Project Workspace (`/project`)

**Purpose:** Persistent multi-file project (FR-7.1–7.3).

**Layout (desktop):**
```
┌─────────────────────────────────────────────────────────────┐
│ StyleShop — Milestone 2 of 4          [ Preview ] [ Save ✓ ] │
├──────────┬──────────────────────────────┬───────────────────┤
│ Files    │ Editor (Monaco, tabbed)      │ AI Tutor sidebar  │
│ index    │                              │                   │
│ styles   │                              │                   │
│ script   │                              │                   │
├──────────┴──────────────────────────────┤                   │
│ Milestone checklist                      │                   │
│ ☑ Structure  → ○ Styled  ○ Responsive   │                   │
└──────────────────────────────────────────┴───────────────────┘
```

**Components:**
- File tree (3 files MVP: index.html, styles.css, script.js)
- Tabbed Monaco editor
- iframe preview (sandboxed)
- Auto-save indicator
- Milestone checklist (4 items)
- "Request review" button (P1 — AI rubric)
- Link to Build Mode

**Empty state (project just created at onboarding):**
```
Your project is ready: StyleShop
We've created starter files based on your goal.
[ Start with milestone 1 → ]
```

**Loading:** Skeleton editor; "Loading project files..."

**Error:** Save failed banner; preview crash message in iframe area.

**Mobile:** File tabs horizontal; editor/preview tab switch; tutor via FAB.

---

### 5.12 Build Mode Hub (`/build`)

**Purpose:** Catalog of 5 feature recipes (FR-8.1, FR-8.5).

**Components:**
- Page intro explaining Build Mode philosophy
- Recipe cards (5): icon, title, description, prerequisite concepts, status (available / locked / completed)
- Locked card shows missing concepts with link to relevant lesson

**Wireframe:**
```
Build Mode
Add features to your project — we'll teach you how.

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🌙 Dark mode│ │ ☰ Mobile nav│ │ 🎯 Hero CTA │
│ Available   │ │ Locked      │ │ Completed   │
│ [ Start ]   │ │ Needs: flex │ │ ✓           │
└─────────────┘ └─────────────┘ └─────────────┘
...
```

**Empty:** N/A post-onboarding.

---

### 5.13 Build Mode Recipe Flow (`/build/recipes/[recipeId]`)

**Purpose:** Guided feature implementation (FR-8.3–8.4).

**Components:**
- Recipe title + goal connection
- Prerequisite check result (pass / micro-path required)
- Step-by-step instructions (3–6 steps)
- "Open in project" deep link with recipe context
- AI tutor sidebar (recipe-aware)
- Completion checklist

**Micro-path required state:**
```
Before adding dark mode, let's learn:
  1. CSS variables (5 min micro-lesson)
  2. prefers-color-scheme (3 min)
[ Start micro-path ]  [ Cancel ]
```

---

### 5.14 Settings (`/settings`)

**Purpose:** Profile and account management (FR-1.4, FR-1.5 P1).

**Components:**
- Display name input
- Email (read-only, from Clerk)
- Experience level (read-only post-onboarding)
- Goal summary (editable with re-path warning)
- AI usage stats (messages used / 30)
- Danger zone: Delete account, Export data (P1)
- Sign out button

**Wireframe:**
```
Settings

Profile
  Display name  [ Alex          ]
  Email         alex@example.com

Learning
  Goal          Clothing business site  [ Edit ]
  AI messages   24 / 30 this month

Account
  [ Export my data ]  [ Delete account ]
```

---

### 5.15 System screens

| Screen | Route / trigger | Purpose |
| ------ | --------------- | ------- |
| 404 Not Found | Unknown URL | Friendly message + links to dashboard or home |
| Session expired | Clerk session timeout | Modal → sign-in |
| AI quota exceeded | 30 messages used | Modal explaining limit; tutor disabled until next month |
| Offline | Network loss | Banner "You're offline. Changes saved locally." |
| Global error | React error boundary | "Something went wrong" + reload |

---

## 6. End-to-end user flow (first visit → first project milestone)

```
1. VISIT /
   └─ Read value prop → Click "Get started"

2. SIGN UP /sign-up
   └─ Email or Google → Account created

3. ONBOARDING /onboarding/goal → /experience → [/quiz] → /path
   └─ Enter goal → Select experience → [Optional quiz]
   └─ AI generates path (loading 10–20s)
   └─ Review path → "Start learning"
   └─ System auto-creates project (StyleShop)

4. DASHBOARD /dashboard
   └─ See "Continue learning" + empty project card
   └─ Click "Start your first lesson"

5. LESSON 1 /learn/lessons/how-websites-work
   └─ Complete blocks: objective → explain → interact → exercise → quiz → bridge
   └─ Use AI hint (level 1) if stuck — quota decrements
   └─ Lesson complete modal → Next lesson

6. LESSONS 2–4 (path continues)
   └─ User completes HTML fundamentals lessons
   └─ Interleaved: Challenge 1 (profile card) after lesson 3

7. PROJECT /project
   └─ Milestone 1 unlocked: "Static page structure"
   └─ User edits index.html in project editor
   └─ Preview updates live
   └─ Checklist item complete → Milestone 1 done 🎉

8. RETURN /dashboard
   └─ Project card shows "Milestone 1 of 4 complete"
   └─ Continue learning → next path step
```

**Estimated time to Milestone 1:** 2–4 hours of learning spread over 1–3 sessions.

---

## 7. Design system

### 7.1 Color tokens

Built on shadcn/ui semantic tokens (Tailwind v4 CSS variables).

| Token | Light mode | Usage |
| ----- | ---------- | ----- |
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#0a0a0a` | Primary text |
| `--primary` | `#2563eb` (blue-600) | CTAs, links, active nav |
| `--primary-foreground` | `#ffffff` | Text on primary buttons |
| `--secondary` | `#f4f4f5` | Secondary buttons, chips |
| `--muted` | `#f4f4f5` | Subtle backgrounds |
| `--muted-foreground` | `#71717a` | Secondary text, placeholders |
| `--accent` | `#f0fdf4` (green-50) | Success states |
| `--destructive` | `#ef4444` | Errors, delete actions |
| `--border` | `#e4e4e7` | Dividers, card borders |
| `--ring` | `#2563eb` | Focus rings |

**Semantic colors:**
- Success: green-600 (`#16a34a`)
- Warning: amber-500 (`#f59e0b`) — AI quota low
- Error: destructive token
- Locked step: muted-foreground + 50% opacity

**Code editor:** Monaco theme `vs-light` (default); future dark mode syncs with recipe.

### 7.2 Typography

| Element | Font | Size | Weight |
| ------- | ---- | ---- | ------ |
| Font family | Geist Sans (loaded) | — | — |
| Code | Geist Mono (add Phase 7) | 14px | 400 |
| h1 (page title) | Geist Sans | 30px / 1.875rem | 700 |
| h2 (section) | Geist Sans | 24px | 600 |
| h3 (card title) | Geist Sans | 18px | 600 |
| Body | Geist Sans | 16px | 400 |
| Small / caption | Geist Sans | 14px | 400 |
| Label | Geist Sans | 14px | 500 |

**Line height:** 1.5 body, 1.25 headings.

### 7.3 Spacing scale

Tailwind default (4px base): `1=4px`, `2=8px`, `3=12px`, `4=16px`, `6=24px`, `8=32px`, `12=48px`.

| Context | Spacing |
| ------- | ------- |
| Page padding | `px-6 py-6` (24px) |
| Card padding | `p-6` (24px) |
| Card gap in grid | `gap-6` (24px) |
| Section margin | `mb-8` (32px) |
| Form field gap | `gap-4` (16px) |
| Nav item gap | `gap-4` (16px) |

### 7.4 Components

**Buttons (shadcn):**
- `default` — primary CTA (one per screen section)
- `outline` — secondary actions
- `ghost` — nav, icon buttons
- `destructive` — delete account
- Sizes: `default` (h-10), `sm` (h-8 nav), `lg` (h-12 hero CTA)

**Cards:**
- Border `border`, rounded `rounded-lg`, shadow `shadow-sm`
- Hover: `shadow-md` on clickable cards
- Progress card variant: includes progress bar in footer

**Inputs:**
- shadcn `Input`, `Textarea`, `Select`, `RadioGroup`
- Min touch target 44×44px on mobile
- Error state: red border + error message below

**Navigation:**
- Top bar: h-14, border-b
- Active link: `font-semibold` + bottom border primary
- Mobile drawer: slide from left, overlay backdrop

**Progress bars:**
- Height 8px, rounded full
- Track: muted; fill: primary
- Label above: "8 of 24 complete"

**Code editor layout:**
- Monaco min-height: 300px (lesson), 400px (challenge/project)
- Split: 50/50 editor-preview on desktop (≥1024px)
- Below 1024px: tab switch Code | Preview
- Preview iframe: border, rounded, `sandbox="allow-scripts"`, title="Preview"

**AI Tutor sidebar:**
- Width: 320px desktop; bottom sheet mobile (70vh)
- Header: "AI Tutor" + quota badge
- Message list scroll area
- Input + send at bottom
- Hint level buttons L1–L3 (L4–5 P1, gated)

---

## 8. Responsive breakpoints

| Breakpoint | Width | Behavior |
| ---------- | ----- | -------- |
| Mobile | < 640px | Single column; hamburger nav; FAB tutor |
| Tablet | 640–1023px | 2-column cards; collapsed editor/preview tabs |
| Desktop | ≥ 1024px | Full split layouts; sidebar tutor visible |
| Wide | ≥ 1280px | Max content width 1200px centered |

**Lesson/project editor:** Always usable on mobile; Monaco font size 14px minimum.

---

## 9. Accessibility (WCAG 2.1 AA target)

| Requirement | Implementation |
| ----------- | -------------- |
| Keyboard navigation | All interactive elements tabbable; skip link to main content |
| Focus visible | `--ring` outline on all focusable elements |
| Color contrast | 4.5:1 body text; 3:1 large text and UI components |
| Landmarks | `header`, `nav`, `main`, `aside` (tutor), `footer` |
| Headings | One h1 per page; logical hierarchy |
| Forms | Labels associated; errors announced via `aria-live="polite"` |
| Images | Alt text required in lesson content |
| Motion | Respect `prefers-reduced-motion`; no auto-playing animations |
| iframe preview | `title` attribute; not focusable |
| Monaco | Accessible alternatives for critical actions where possible |

**Testing:** axe-core in CI (Phase 14); manual screen reader pass before launch.

---

## 10. Architecture fit assessment

### Screens that fit current structure ✅

All MVP screens map to `(marketing)`, `(app)`, `(onboarding)`, or `(auth)` route groups. AI tutor is a shared layout component, not a route — matches ARCHITECTURE client model.

### Missing routes to add (recommended before Phase 2 UI)

| Route | Priority | Rationale |
| ----- | -------- | --------- |
| `/sign-in`, `/sign-up` | P0 | TASK-101 already planned |
| `/onboarding/*` (4 steps) | P0 | Phase 4; needs `(onboarding)` group |
| `/learn/lessons/[id]` | P0 | Phase 7 |
| `/learn/challenges/[id]` | P0 | Phase 8 |
| `/build/recipes/[id]` | P0 | Phase 11 |
| `/settings` | P1 | Profile FR-1.4 |
| `/privacy`, `/terms` | P1 | GDPR FR-1.5 |

### Screens to defer (not MVP) ❌

| Screen | Reason |
| ------ | ------ |
| `/pricing` | No payments in MVP |
| `/about` | Marketing nice-to-have |
| `/admin/*` | Content via JSON in repo |
| Skill graph visualization | P2 FR-6.5 |
| Multiple projects list | FR-7.6 out of scope |
| Deploy/publish preview URL | FR-7.7 P3 |
| Leaderboards, social, achievements | Explicitly OUT |
| Separate `/tutor` page | Sidebar pattern sufficient |

### Recommended architecture doc updates (no code)

1. Add `(onboarding)` route group to ARCHITECTURE.md § folder structure
2. Document nested `/learn/lessons/` and `/learn/challenges/` routes
3. Update `(app)/README.md` route table with nested routes
4. Add `(auth)` routes note outside `(app)` shell

---

## 11. Open questions for stakeholder

1. **Bottom tab bar on mobile?** Recommended for faster nav between Dashboard/Learn/Project/Build.
2. **Onboarding quiz skippable by default?** Recommended yes for P1 launch.
3. **Challenge list:** tab on `/learn` vs separate `/challenges` route? **Recommend:** tab on `/learn` to avoid nav clutter.
4. **Dark mode for app shell?** Defer to post-MVP; dark mode recipe teaches CSS approach in project.
5. **Legal pages before beta?** Recommend minimal `/privacy` and `/terms` before public beta.

---

## 12. Implementation readiness checklist

- [x] Every MVP screen identified and mapped to routes
- [x] Navigation flows documented
- [x] Empty, loading, error states defined per screen
- [x] Mobile and accessibility requirements specified
- [x] Design system tokens defined (extends shadcn/Tailwind)
- [x] End-to-end user flow documented
- [x] Architecture gaps identified with recommendations
- [ ] Stakeholder approval (pending)
- [ ] Figma/high-fidelity mockups (optional; text wireframes sufficient to start)
