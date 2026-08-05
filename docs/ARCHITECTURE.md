# Architecture — BuildLearn

> **Status:** Finalized — MVP Design Freeze (2026-08-05)  
> **Last updated:** 2026-08-05

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                             │
│  Next.js App ─ Monaco Editor ─ iframe Preview ─ AI Tutor Sidebar         │
│  (User HTML/CSS/JS runs ONLY in browser sandbox — never on server)        │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APPLICATION (Vercel)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ App Router  │  │ API Routes   │  │ Server      │  │ Background Jobs │ │
│  │ (RSC/SSR)   │  │ /api/*       │  │ Actions     │  │ (Inngest/CRON)  │ │
│  └─────────────┘  └──────────────┘  └─────────────┘  └─────────────────┘ │
│                              │                                            │
│                    ┌─────────┴─────────┐                                  │
│                    ▼                   ▼                                  │
│            ┌──────────────┐   ┌──────────────┐                          │
│            │ AI Service   │   │ Domain       │                          │
│            │ (abstraction)│   │ Services     │                          │
│            └──────┬───────┘   └──────┬───────┘                          │
└───────────────────┼──────────────────┼───────────────────────────────────┘
                    │                  │
         ┌──────────┼──────────────────┼──────────┐
         ▼          ▼                  ▼          ▼
   ┌──────────┐ ┌────────┐    ┌────────────┐ ┌────────┐
   │ OpenAI / │ │ Redis  │    │ PostgreSQL │ │ Sentry │
   │ Anthropic│ │(Upstash)│   │ (Neon)     │ │PostHog │
   └──────────┘ └────────┘    └────────────┘ └────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend

| Choice | Recommendation | Why |
|--------|----------------|-----|
| **Framework** | Next.js 15 (App Router) | Full-stack, RSC, API routes, Vercel-native |
| **Language** | TypeScript (strict) | Type safety across stack |
| **UI** | React 19 + Tailwind CSS + shadcn/ui | Fast iteration, accessible components |
| **Editor** | Monaco Editor | VS Code engine, syntax highlighting, familiar |
| **State** | React Query + Zustand | Server state vs local UI state |
| **Forms** | React Hook Form + Zod | Validation |

**Alternatives considered:**
- *Remix* — excellent, but team docs assume Next.js; Vercel ecosystem alignment
- *Vite SPA* — loses SSR, SEO for marketing pages, integrated API

### 2.2 Backend

| Choice | Recommendation | Why |
|--------|----------------|-----|
| **Runtime** | Next.js API Routes + Server Actions | Single deploy unit for MVP |
| **ORM** | Prisma | Type-safe, migrations, good DX |
| **Validation** | Zod | Shared schemas client/server |
| **Background jobs** | Inngest (or Vercel Cron for simple) | Mastery recalc, AI batch jobs |

**When to split backend:** If WebSocket-heavy features, long-running sandboxes, or team > 5 engineers on API — extract to separate service post-MVP.

**Alternative:** Supabase Edge Functions — viable if choosing Supabase for everything.

### 2.3 Database

| Choice | Recommendation | Why |
|--------|----------------|-----|
| **Primary DB** | PostgreSQL (Neon) | Relational fit for skill graph, progress, ACID |
| **ORM** | Prisma | Schema migrations, type generation |
| **Cache** | Upstash Redis | Sessions, rate limits, AI context cache |
| **Vector (post-MVP)** | pgvector extension on Neon | Avoid separate vector DB initially |

**Alternatives:**
- *Supabase Postgres* — good if using Supabase Auth; slightly more vendor coupling
- *PlanetScale* — MySQL; less ideal for graph-like queries and pgvector

### 2.4 Authentication

| Choice | Recommendation | Why |
|--------|----------------|-----|
| **Provider** | Clerk | Fastest MVP: email, Google, session management, webhooks |
| **Alternative** | Supabase Auth | Better if consolidating on Supabase; more DIY |

**Why not roll your own:** Security burden, OAuth complexity, password reset flows.

**Authorization model:** Role-based (`user`, `admin`, future `instructor`) + resource ownership checks on every API route.

### 2.5 AI

| Choice | Recommendation | Why |
|--------|----------------|-----|
| **SDK** | Vercel AI SDK | Streaming, tool calling, provider abstraction |
| **Primary model** | OpenAI GPT-4o-mini (routing, tutoring) | Cost/quality balance |
| **Complex tasks** | GPT-4o or Claude Sonnet (path generation, review) | Better reasoning |
| **Structured output** | Zod schemas + `generateObject` | Reliable JSON for paths, rubrics |
| **Embeddings** | text-embedding-3-small | Cost-effective for RAG (post-MVP) |

**Abstraction layer:** `AIService` interface with providers `OpenAIProvider`, `AnthropicProvider`. All AI calls go through this layer.

### 2.6 Code Execution

| Phase | Approach |
|-------|----------|
| **MVP** | Client-side only: Monaco + iframe `srcdoc` preview. HTML/CSS/JS concatenated and rendered in sandboxed iframe with `sandbox="allow-scripts"`. |
| **Post-MVP (multi-file Node)** | WebContainers (StackBlitz) in browser — no server execution |
| **Future (Python/backend)** | Dedicated sandbox service (e.g., E2B, Fly Machines) with gVisor/Firecracker isolation |

**MVP security stance:** User code NEVER reaches the server for execution. Auto-grading runs test assertions via `new Function()` in client for JS, or server compares normalized HTML/CSS strings (not execution).

**WebContainers limitations:** ~500MB download, no Safari iOS, cold start latency. Defer until needed.

### 2.7 Payments (Post-MVP)

| Choice | Stripe Billing |
|--------|----------------|
| Why | Subscriptions, usage metering, tax, customer portal |

### 2.8 Hosting

| Component | Provider |
|-----------|----------|
| App | Vercel |
| Database | Neon (serverless Postgres) |
| Redis | Upstash |
| File storage | Vercel Blob or S3 (project files in DB for MVP) |
| CDN | Vercel Edge |

**Expected MVP cost:** $50–200/month at low traffic (mostly AI API costs).

### 2.9 Analytics & Monitoring

| Purpose | Tool |
|---------|------|
| Product analytics | PostHog |
| Error tracking | Sentry |
| Logging | Vercel Logs + structured JSON |
| Uptime | Better Stack (optional) |
| AI cost tracking | Custom `ai_usage_logs` table |

---

## 3. AI Architecture

### 3.1 AI Service Layers

```
┌─────────────────────────────────────────┐
│           AI Orchestrator               │
│  (selects pipeline by mode + context)   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    ▼             ▼             ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Path   │  │ Tutor    │  │ Grader   │  │ Reviewer │
│ Gen    │  │ Pipeline │  │ Pipeline │  │ Pipeline │
└────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 3.2 AI Pipelines

| Pipeline | Input | Output | Model tier |
|----------|-------|--------|------------|
| Goal Analyzer | User goal text | Structured goal object | Mini |
| Path Generator | Goal + profile + skill graph | Ordered node IDs + rationale | Large |
| Tutor | Context packet + user message | Streamed response + hint level | Mini |
| Exercise Grader | Code + test spec | Pass/fail + feedback | Mini |
| Project Reviewer | Code + rubric | Scores + actionable feedback | Large |
| Misconception Detector | Recent mistakes | Concept flags | Mini |

### 3.3 Prompt Management

- Prompts stored in `src/ai/prompts/` as versioned templates
- Variables injected from context builder
- System prompts enforce teacher-not-builder behavior
- All prompts reviewed in PRs (Checker Agent)

### 3.4 AI Teaching Framework

**Core system prompt principles:**
1. Never output full project code unless help level ≥ 4 AND user stuck
2. Ask one guiding question before explaining
3. Adapt vocabulary to user's proficiency level
4. Reference user's stated goal in examples
5. Explain errors in plain language first, technical second
6. Detect copy-paste requests and redirect to learning

**Help escalation controller:**
```typescript
interface HelpRequest {
  userId: string;
  sessionId: string;
  currentHelpLevel: 1-5;
  attemptsOnTask: number;
  timeStuckMinutes: number;
}

// Auto-elevate after 3 attempts or 10 minutes stuck
// User can manually request higher level
// Level 5 logged for mastery penalty
```

### 3.5 Context Builder

Assembles minimal context per request (~2–4K tokens):

1. **User profile summary** (from DB, cached 5 min)
2. **Relevant mastery** (only concepts related to current task)
3. **Current task metadata** (lesson ID, exercise spec)
4. **Code excerpt** (relevant file section, max 500 lines)
5. **Last 6 conversation turns** (session only)
6. **Retrieved snippets** (post-MVP RAG, top 3)

**Not included:** Full project, full history, other users' data, API keys.

### 3.6 AI Cost Controls

- Per-user monthly message quota (free: 30, pro: 500)
- Rate limit: 10 requests/minute
- Cache path generation results for identical goal+profile hash (24h)
- Use mini model for routing and simple hints
- Log token usage to `ai_usage_logs`
- Circuit breaker if daily spend exceeds budget

---

## 4. Coding Environment Architecture

### 4.1 MVP Editor Stack

```
┌─────────────────────────────────────────────────┐
│  Editor Panel (Monaco)                          │
│  ├── File tabs: index.html, styles.css, script.js│
│  └── Language services (HTML/CSS/JS)              │
├─────────────────────────────────────────────────┤
│  Preview Panel (iframe)                           │
│  ├── srcdoc assembled from files                │
│  ├── sandbox="allow-scripts allow-modals"         │
│  └── NO allow-same-origin (prevent cookie access) │
├─────────────────────────────────────────────────┤
│  Console Panel (optional MVP+)                    │
│  └── Captured via iframe message proxy            │
└─────────────────────────────────────────────────┘
```

### 4.2 Auto-Grading (Client-Side)

**HTML/CSS:** Normalize whitespace, parse DOM with browser DOMParser, assert structure/selectors/computed styles via iframe.

**JavaScript:** Run user code + test harness in isolated iframe with timeout (5s). No network access.

**Security notes:**
- iframe sandbox without `allow-same-origin` isolates from parent
- Timeout kills infinite loops (best-effort in browser)
- No `eval` on server
- Test harness code is trusted, user code is not

### 4.3 Future: WebContainers

When adding Node/npm/React:
- `@webcontainer/api` runs entirely in browser
- Package install via browser FS
- Dev server in browser tab
- Still no server-side user code execution

---

## 5. Database Design

### 5.1 Entity Relationship Summary

```
User ─┬─ Profile
      ├─ Goal(s)
      ├─ LearningPath ─── LearningPathStep[] ─── Concept
      ├─ LessonProgress[]
      ├─ ChallengeAttempt[]
      ├─ ConceptMastery[]
      ├─ Project ─── ProjectFile[]
      ├─ AiConversation ─── AiMessage[]
      └─ AiUsageLog[]

Concept ─── ConceptPrerequisite[] (self-referential)
Lesson ─── LessonConcept[] (M:N)
Challenge ─── ChallengeConcept[] (M:N)
GoalTemplate ─── GoalTemplateConcept[] (M:N)
```

### 5.2 Core Tables

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | String PK | Clerk user ID (`user_xxx`) — see ADR-013 |
| email | VARCHAR UNIQUE | |
| created_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ NULL | Soft delete |

#### profiles
| Column | Type | Notes |
|--------|------|-------|
| user_id | String PK/FK | References `users.id` |
| display_name | VARCHAR | |
| experience_level | ENUM | `beginner`, `some_exposure`, `intermediate` |
| learning_goal_text | TEXT | Raw user input |
| goal_summary | JSONB | AI-structured goal |
| onboarding_complete | BOOLEAN | |

#### concepts
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR PK | e.g., `css-flexbox` |
| name | VARCHAR | Display name |
| description | TEXT | |
| domain | VARCHAR | web, js, etc. |
| difficulty | INT 1-5 | |
| tags | TEXT[] | |

#### concept_prerequisites
| Column | Type | Notes |
|--------|------|-------|
| concept_id | VARCHAR FK | |
| prerequisite_id | VARCHAR FK | |
| PRIMARY KEY | (concept_id, prerequisite_id) | |

#### concept_mastery
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID FK | |
| concept_id | VARCHAR FK | |
| score | FLOAT 0-1 | |
| level | ENUM | unknown→solid |
| signals | JSONB | Last quiz, challenge scores |
| last_reviewed_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (user_id, concept_id) | |

#### goal_templates
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR PK | e.g., `business-website` |
| name | VARCHAR | |
| matching_keywords | TEXT[] | For goal classification |
| concept_ids | TEXT[] | Required concepts |

#### learning_paths
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| goal_template_id | VARCHAR FK NULL | |
| status | ENUM | active, completed, paused |
| generated_by | ENUM | system, ai |
| metadata | JSONB | AI rationale, version |
| created_at | TIMESTAMPTZ | |

#### learning_path_steps
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| path_id | UUID FK | |
| order_index | INT | |
| step_type | ENUM | lesson, challenge, project_milestone, mini_project, review |
| reference_id | VARCHAR | lesson/challenge/milestone ID |
| status | ENUM | locked, available, in_progress, completed, skipped |
| metadata | JSONB | See Roadmap UI mapping below |
| UNIQUE | (path_id, order_index) | |

**Roadmap UI mapping (`/roadmap`):**

The Roadmap screen renders `learning_path_steps` for the user's active `learning_paths` row. Section groupings (e.g., "HTML Basics", "CSS Basics") are stored in `learning_paths.metadata`:

```json
{
  "goal_display_title": "Build a Personal Portfolio Website",
  "sections": [
    { "id": "html-basics", "title": "HTML Basics", "start_order": 0, "end_order": 6 },
    { "id": "css-basics", "title": "CSS Basics", "start_order": 7, "end_order": 14 }
  ]
}
```

**Node type → Roadmap visual:**

| `step_type` | Roadmap visual | Size |
| ----------- | -------------- | ---- |
| `lesson` | Circle + label | Standard |
| `challenge` | Diamond + label | Standard |
| `mini_project` | Rounded square + label | Medium |
| `project_milestone` | Star/hex + label | **Large** |
| `review` | Circle (dotted) | Standard |

**Per-step `metadata` (JSONB) — future-proofing (not all used in MVP):**

| Field | Type | MVP | Purpose |
| ----- | ---- | --- | ------- |
| `section_id` | string | Yes | Links step to section header |
| `display_title` | string | Yes | Override title on roadmap |
| `is_optional` | boolean | No | Side quest nodes (post-MVP) |
| `branch_id` | string | No | AI-generated branch grouping |
| `parent_step_id` | UUID | No | Fork point for branches |
| `node_flags` | string[] | No | `bonus`, `community`, `advanced` |

**Computed fields (API, not stored):**
- `completion_percent` — completed steps / total steps
- `estimated_minutes_remaining` — sum of incomplete lesson/challenge estimates
- `current_streak_days` — consecutive calendar days with ≥1 learning session (see ADR-019)

**Replay mode (client + API):**

When `?replay=true` on lesson/challenge player routes:
- Read-only progress path — **no writes** to `lesson_progress`, `challenge_attempts`, `concept_mastery`, `learning_path_steps`, or streak
- API middleware rejects mutating requests with `X-Replay-Mode: true` header
- UI displays persistent "Review mode" banner

**Streak storage (MVP):**

| Column | Table | Notes |
| ------ | ----- | ----- |
| `current_streak_days` | `profiles` | Integer; updated on first qualifying session per calendar day |
| `last_activity_date` | `profiles` | Date (user timezone or UTC — decide at implementation) |
| `longest_streak_days` | `profiles` | Optional; display only |

Qualifying session = completing a lesson, passing a challenge, or completing a project milestone. **Replay does not qualify.**

**MVP constraint:** Single active path per user; linear render only. Fork/optional UI deferred.

#### App Router — authenticated routes (`(app)`)

| Route | Purpose | Phase |
| ----- | ------- | ----- |
| `/dashboard` | Quick overview, Continue Learning CTA | 6 |
| `/roadmap` | **Primary visual learning journey** | 6 |
| `/learn` | Redirect → active node player | 7 |
| `/learn/lessons/[lessonId]` | Lesson player | 7 |
| `/learn/challenges/[challengeId]` | Challenge player | 8 |
| `/project` | Multi-file project workspace | 10 |
| `/build` | Build Mode recipe catalog | 11 |
| `/build/recipes/[recipeId]` | Guided recipe flow | 11 |
| `/settings` | Profile & account | 2+ |

**Navigation:** Primary nav = Dashboard · **Roadmap** · Project · Build. Learn is not top-level nav.

**Responsibility split:** Roadmap owns path visualization; Dashboard owns summary; Learn owns active content only.

#### lessons
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR PK | |
| title | VARCHAR | |
| content | JSONB | Block-based content |
| estimated_minutes | INT | |
| version | INT | Content versioning |

#### lesson_progress
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID FK | |
| lesson_id | VARCHAR FK | |
| status | ENUM | started, completed |
| blocks_completed | JSONB | |
| quiz_score | FLOAT NULL | |
| hints_used | INT DEFAULT 0 | |
| completed_at | TIMESTAMPTZ NULL | |
| PRIMARY KEY | (user_id, lesson_id) | |

#### challenges
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR PK | |
| title | VARCHAR | |
| instructions | TEXT | |
| starter_code | JSONB | File map |
| test_spec | JSONB | Auto-grade spec |
| difficulty | INT | |

#### challenge_attempts
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| challenge_id | VARCHAR FK | |
| submitted_code | JSONB | |
| passed | BOOLEAN | |
| score | FLOAT | |
| hints_used | INT | |
| attempt_number | INT | |
| created_at | TIMESTAMPTZ | |

#### projects
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| name | VARCHAR | |
| template_id | VARCHAR NULL | |
| created_at | TIMESTAMPTZ | |

#### project_files
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| project_id | UUID FK | |
| path | VARCHAR | index.html, etc. |
| content | TEXT | |
| updated_at | TIMESTAMPTZ | |
| UNIQUE | (project_id, path) | |

#### project_milestones
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR PK | |
| project_template_id | VARCHAR | |
| title | VARCHAR | |
| rubric | JSONB | |
| order_index | INT | |

#### build_mode_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| project_id | UUID FK | |
| feature_text | TEXT | |
| recipe_id | VARCHAR NULL | If matched to recipe |
| prerequisite_gaps | JSONB | |
| status | ENUM | analyzing, learning, building, complete |

#### ai_conversations
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| context_type | ENUM | lesson, challenge, project, build |
| context_id | VARCHAR | |
| created_at | TIMESTAMPTZ | |

#### ai_messages
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | UUID FK | |
| role | ENUM | user, assistant, system |
| content | TEXT | |
| help_level | INT NULL | |
| tokens_used | INT | |
| created_at | TIMESTAMPTZ | |

#### ai_usage_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| pipeline | VARCHAR | |
| model | VARCHAR | |
| input_tokens | INT | |
| output_tokens | INT | |
| cost_usd | DECIMAL | |
| created_at | TIMESTAMPTZ | |

### 5.3 Indexes

```sql
CREATE INDEX idx_concept_mastery_user ON concept_mastery(user_id);
CREATE INDEX idx_learning_path_steps_path ON learning_path_steps(path_id, order_index);
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_challenge_attempts_user ON challenge_attempts(user_id, challenge_id);
CREATE INDEX idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);
```

### 5.4 Data Ownership Rules

- All user progress tables keyed by `user_id` with row-level ownership checks
- Content tables (lessons, concepts, challenges) are read-only for users
- AI-generated path metadata stored on `learning_paths.metadata`; curriculum content is NOT AI-generated in MVP
- Project file content belongs to user; deleted on account deletion

### 5.5 What is AI-generated vs curated

| Curated (human) | AI-generated (runtime) |
|-----------------|------------------------|
| Lessons, challenges, concepts | Path ordering and skip decisions |
| Skill graph structure | Goal summary extraction |
| Goal templates | Lesson framing adaptations |
| Test specs, rubrics | Tutoring responses |
| Build Mode recipes | Project review feedback |

---

## 6. Security Architecture

### 6.1 Authentication & Authorization
- Clerk handles auth; verify JWT on every API route
- Server Actions validate `userId` matches session
- IDOR prevention: all queries include `where: { userId: session.userId }`
- Admin routes behind role check + separate audit log

### 6.2 API Security
- Rate limiting via Upstash (global + per-user)
- Zod validation on all inputs
- CORS restricted to app domain
- CSP headers on all pages
- No sensitive data in client bundles

### 6.3 AI Security
- **Prompt injection:** System prompts instruct ignoring override attempts; user code in separate message block; no tool execution from user input
- **Cost abuse:** Quotas, rate limits, anomaly detection on usage spikes
- **Data leakage:** Context builder whitelists fields; no cross-user retrieval
- **Output filtering:** No API keys, internal URLs, or system prompts in responses

### 6.4 Code Execution Security
- **MVP:** Client-side iframe sandbox only
- **Never** run user code on server in MVP
- iframe sandbox attributes: `sandbox="allow-scripts allow-modals"` without `allow-same-origin`
- Post-MVP sandboxes: gVisor/Firecracker, network disabled, CPU/memory/time limits

### 6.5 Database Security
- Neon connection via SSL, credentials in env vars
- Prisma parameterized queries (no raw SQL unless reviewed)
- Least-privilege DB user for app
- Encrypted at rest (Neon default)

### 6.6 Payment Security (future)
- Stripe Checkout — no card data touches our servers
- Webhook signature verification

### 6.7 Privacy & Data Retention
- Privacy policy and terms required before launch
- Account deletion cascades user data within 30 days
- AI conversations retained 90 days, then anonymized
- No selling user data
- COPPA: platform 13+ only (age gate at signup)

### 6.8 Security Checklist (pre-launch)
- [ ] OWASP Top 10 review
- [ ] Dependency audit (npm audit CI)
- [ ] Penetration test on auth + API
- [ ] CSP and security headers configured
- [ ] Secrets in Vercel env, not repo
- [ ] Rate limiting on AI endpoints
- [ ] iframe sandbox verified

---

## 7. Project System Architecture

### 7.1 MVP Project Model
- Auto-create project at onboarding based on goal template
- Default files: `index.html`, `styles.css`, `script.js`
- Starter template varies by goal (business site vs portfolio)
- Milestones unlock as learning path progresses

### 7.2 Project ↔ Learning Integration
```
Learning Path Step (project_milestone)
        │
        ▼
Project Milestone Rubric
        │
        ▼
User edits in Build Mode / Project workspace
        │
        ▼
Submit for check → Auto checks + AI review
        │
        ▼
Update concept_mastery + unlock next path step
```

### 7.3 Versioning (post-MVP)
- Snapshot on milestone completion
- Diff view between snapshots
- No git integration initially

---

## 8. Deployment Architecture

```
GitHub Repo
    │
    ▼ (push to main)
GitHub Actions CI
    ├── lint + typecheck
    ├── unit tests
    ├── integration tests
    └── build
    │
    ▼
Vercel Preview (PR) / Production (main)
    │
    ├── Neon Postgres (branch per preview optional)
    └── Upstash Redis
```

### Environment variables
- `DATABASE_URL`, `CLERK_*`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_*`, `SENTRY_DSN`, `POSTHOG_KEY`
- `AI_MONTHLY_BUDGET_USD`

---

## 9. Testing Strategy

| Layer | Tool | Coverage target |
|-------|------|-----------------|
| Unit | Vitest | Services, utils, grading logic |
| Component | React Testing Library | Lesson player, editor |
| Integration | Vitest + test DB | API routes, path generation |
| E2E | Playwright | Onboarding, lesson flow, project |
| AI eval | Custom eval suite | 20 golden goal→path cases, tutor safety |
| Security | OWASP ZAP (CI optional) | Auth, injection |

**Critical test cases:**
- Path generation respects prerequisites
- Mastery not updated on hint-level-5 completion
- User A cannot access User B's project
- iframe sandbox prevents parent access
- AI quota enforced

---

## 10. Monitoring Strategy

| Signal | Tool | Alert |
|--------|------|-------|
| Errors | Sentry | Slack on new issues |
| Performance | Vercel Analytics | p95 latency > 3s |
| AI spend | Custom dashboard | Daily > budget |
| User funnels | PostHog | Drop-off spikes |
| Uptime | Better Stack | Downtime > 1 min |

Structured logging format:
```json
{
  "level": "info",
  "service": "ai-tutor",
  "userId": "uuid",
  "pipeline": "tutor",
  "durationMs": 1200,
  "tokens": 450
}
```
