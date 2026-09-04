# CareerCompass — Implementation Specification

> **Version:** 1.0 · **Status:** Draft · **Date:** 2026-09-03
> **Prototype reference:** `index.html` (single-file Tailwind CDN prototype)

---

## 1. Product Goal

CareerCompass provides Pakistani Intermediate and Graduate students with a market-grounded AI Career Coach and multi-agent system to **eliminate career confusion, analyze skill gaps, and deliver a week-by-week actionable execution plan**.

The platform operates on one core principle:

> **One Student + One AI Career Coach + One Structured Career Roadmap**

Students input their education level, skills, and interests — or ask a direct career question in English or Roman Urdu. The system coordinates specialized sub-agents to produce a personalized, market-validated career path with concrete next steps.

---

## 2. Target Users & Personas

### User 1 — Intermediate Student

| Attribute        | Detail                                                    |
|------------------|-----------------------------------------------------------|
| Age              | 16–18                                                     |
| Context          | Choosing between Pre-Engineering / Pre-Medical / ICS / Arts |
| Core questions   | Stream selection, degree advice, university choice         |
| Key output       | Recommended degree paths, university shortlist, early-skill suggestions |

### User 2 — Graduate / Final-Year Student

| Attribute        | Detail                                                    |
|------------------|-----------------------------------------------------------|
| Age              | 20–24                                                     |
| Context          | Job readiness, career specialization, freelancing vs. local job |
| Core questions   | Which specialization to pursue, how to become job-ready, remote vs. local |
| Key output       | Skill gap matrix, market analysis, action plan, portfolio projects |

### Default Seed Persona — Ali Khan

| Field            | Value                                                      |
|------------------|------------------------------------------------------------|
| Name             | Ali Khan                                                   |
| Education        | BS Computer Science — Graduate, Class of 2025              |
| Institution      | FAST NUCES, Islamabad                                      |
| Current skills   | Python, JavaScript, React, SQL, ML Basics, Git             |
| Interests        | AI / Machine Learning, Full Stack Dev, Freelancing         |
| Career question  | "Mujhe AI/ML path choose karna chahiye ya Full Stack Web Development?" |

All UI sections in the prototype (`index.html`) are populated with Ali Khan's data as the default view.

---

## 3. Agent Architecture

Six agents are orchestrated by the Career Coach. Each agent has a single responsibility and produces a structured output consumed by downstream agents or the UI.

### 3.1 Career Coach Agent — Orchestrator

| Item        | Detail |
|-------------|--------|
| Role        | Central coordinator. Receives user goals, delegates to sub-agents, synthesizes final roadmap and conversational advice. |
| Input       | Student profile (education, skills, interests) + free-text question |
| Output      | Orchestrator dispatches to Skill Assessment → Market Intel → Career Path → Roadmap Gen in sequence; synthesizes a final bilingual response for the chat UI |
| Downstream  | All other agents |

### 3.2 Skill Assessment Agent — Evaluator

| Item        | Detail |
|-------------|--------|
| Role        | Evaluates existing skills against target role requirements; identifies exact skill gaps with proficiency levels. |
| Input       | Student skills list + target career path(s) |
| Output      | Skill Gap Matrix — a list of `{ skill, current_level (0–100), required_level (0–100), gap, category (strength \| gap) }` |
| Data source | Static role-skill templates stored in SQLite (`role_skills` table) |

### 3.3 Market Intelligence Agent — Pakistan + Remote

| Item        | Detail |
|-------------|--------|
| Role        | Analyzes Pakistani local hiring demand, remote market trends, and salary signals for matched career paths. |
| Input       | Target career path(s) from Career Path Agent |
| Output      | Market snapshot: `{ path, local_demand (Low \| Growing \| High), remote_demand, salary_local_pkr { min, max }, salary_remote_usd { min, max }, hiring_hubs[], platforms[] }` |
| Data source | Static market data stored in SQLite (`market_data` table); designed to be replaceable with live API feeds in a future stage |

### 3.4 Career Path Agent — Planner

| Item        | Detail |
|-------------|--------|
| Role        | Matches student profile to optimal career trajectories using skill-match scoring and market signals. |
| Input       | Skill Gap Matrix + Market snapshot + Student interests |
| Output      | Ranked list of career paths: `{ path, match_pct (0–100), rationale, short_term_verdict, long_term_verdict }` |
| Logic       | Weighted formula: `score = (skill_match * 0.4) + (market_demand * 0.3) + (interest_alignment * 0.3)` |

### 3.5 Roadmap Generator Agent — Builder

| Item        | Detail |
|-------------|--------|
| Role        | Generates a 4-week action plan with specific tasks, free/low-cost learning resources, and portfolio project recommendations. |
| Input       | Top-ranked career path + Skill Gap Matrix + Student profile |
| Output      | `{ weeks[ { week_number, theme, tasks[] } ], portfolio_projects[ { title, description, tech_stack[], estimated_duration, impact } ] }` |
| Data source | Resource and project templates stored in SQLite (`roadmap_templates` table) |

### 3.6 Progress Tracker Agent — Monitor

| Item        | Detail |
|-------------|--------|
| Role        | Manages task completion states and dynamically recalculates Career Readiness Score as the student checks off tasks. |
| Input       | Completed task IDs from the action plan |
| Output      | Updated `{ readiness_score (0–100), completed_count, total_count, score_history[] }` |
| Score calc  | See Section 5.4 (Score Calculation Formula) |

### Agent Communication Flow

```
Student Input
     │
     ▼
┌─────────────────┐
│  Career Coach    │ ← Orchestrator (delegates + synthesizes)
│  (Orchestrator)  │
└────┬────────────┘
     │ 1. "assess skills for path X"
     ▼
┌─────────────────┐
│  Skill Assessment│ → Skill Gap Matrix
└────┬────────────┘
     │ 2. "analyze market for paths X, Y"
     ▼
┌─────────────────┐
│  Market Intel    │ → Market Snapshot
└────┬────────────┘
     │ 3. "rank career paths given skills + market"
     ▼
┌─────────────────┐
│  Career Path     │ → Ranked Paths
└────┬────────────┘
     │ 4. "generate roadmap for top path"
     ▼
┌─────────────────┐
│  Roadmap Gen     │ → 4-Week Plan + Projects
└────┬────────────┘
     │ 5. continuous
     ▼
┌─────────────────┐
│  Progress Tracker│ → Score updates
└─────────────────┘
```

---

## 4. Core Scenario

**Input:** Student asks — "Mujhe AI/ML path choose karna chahiye ya Web Dev?"

**System execution:**

1. **Career Coach** parses the question, identifies two candidate paths: AI/ML Engineer and Full-Stack Developer.
2. **Skill Assessment** evaluates Ali's 6 skills against both paths and produces the Skill Gap Matrix.
3. **Market Intel** retrieves demand and salary data for both paths (local + remote).
4. **Career Path** scores and ranks both paths.
5. **Roadmap Gen** generates a 4-week plan for the top-ranked path.
6. **Progress Tracker** initializes the score.

**Expected output rendered in UI:**

| Section | Ali Khan's Result |
|---------|-------------------|
| **Skill Gap Matrix** | Strengths: JavaScript (85%), React (78%), Python (72%). Gaps: TensorFlow/PyTorch (15%), Pandas (30%), Docker (10%) |
| **Path Match** | AI/ML: 42% match · Full Stack: 71% match |
| **Market Analysis** | Local — Full Stack: High, AI/ML: Growing · Remote — Both: Very High |
| **Coach Verdict** | Short-term: Full Stack (job-ready faster). Long-term: Add AI/ML specialization |
| **4-Week Action Plan** | W1: Node.js + GitHub setup. W2: Task Manager project. W3: ML Crash Course. W4: Portfolio polish + applications |
| **Portfolio Projects** | 1. Full Stack Task Manager  2. ML Sentiment Analyzer  3. Pakistan Job Trends Dashboard |
| **Career Readiness Score** | 64/100 (Moderate) — projected 80+ after plan completion |

---

## 5. Acceptance Criteria

### 5.1 UI Criteria

| # | Criterion | Pass condition |
|---|-----------|----------------|
| U1 | All 8 sections render (Profile, Score, Chat, Pipeline, Skills, Market, Plan, Projects) | Every section visible on page load with Ali Khan's data |
| U2 | Bilingual labels | Every section heading includes a Roman Urdu hint in `<span>` or tooltip |
| U3 | Slate-950 dark theme | Background `#020617`, text slate-200, brand indigo accents per prototype palette |
| U4 | Responsive layout | All sections render correctly at 375 px (mobile), 768 px (tablet), 1280 px (desktop) |
| U5 | Chat interaction | User can type a question, press Enter or Send, and receive a coach response with typing indicator |
| U6 | Pipeline animation | "Run Analysis" button sequentially activates all 6 agent cards with status dot transitions |
| U7 | Checklist toggling | Clicking a task checkbox toggles strikethrough and triggers score recalculation |
| U8 | Edit Profile modal | Clicking "Edit Profile" opens a modal with pre-filled fields; saving updates the profile card |
| U9 | Market tab switching | Local/Remote tabs toggle content without page reload |

### 5.2 SQLite Schema

A single SQLite database (`careercompass.db`) with the following tables:

```sql
-- Students
CREATE TABLE students (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE,
    edu_level   TEXT CHECK(edu_level IN ('intermediate','graduate')),
    institution TEXT,
    skills      TEXT,           -- JSON array: ["Python","JavaScript",...]
    interests   TEXT,           -- JSON array: ["AI/ML","Full Stack",...]
    career_question TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Skills catalog (master list)
CREATE TABLE skills_catalog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT UNIQUE NOT NULL,
    category    TEXT            -- 'language','framework','tool','concept'
);

-- Role skill requirements
CREATE TABLE role_skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role        TEXT NOT NULL,  -- 'AI/ML Engineer','Full Stack Developer',...
    skill_id    INTEGER REFERENCES skills_catalog(id),
    required_level INTEGER CHECK(required_level BETWEEN 0 AND 100),
    priority    TEXT CHECK(priority IN ('must','should','nice'))
);

-- Market data
CREATE TABLE market_data (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    role            TEXT NOT NULL,
    market_type     TEXT CHECK(market_type IN ('local','remote')),
    demand          TEXT CHECK(demand IN ('Low','Growing','Medium','High','Very High')),
    salary_min      INTEGER,
    salary_max      INTEGER,
    currency        TEXT CHECK(currency IN ('PKR','USD')),
    hiring_hubs     TEXT,       -- JSON array
    platforms       TEXT,       -- JSON array
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roadmap templates
CREATE TABLE roadmap_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    role            TEXT NOT NULL,
    week_number     INTEGER CHECK(week_number BETWEEN 1 AND 4),
    theme           TEXT,
    tasks           TEXT,       -- JSON array of task strings
    projects        TEXT        -- JSON array of project objects
);

-- Student action plans (generated)
CREATE TABLE action_plans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER REFERENCES students(id),
    role        TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    weeks       TEXT            -- JSON array of { week, theme, tasks[{text,done}] }
);

-- Progress tracking
CREATE TABLE progress (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER REFERENCES students(id),
    task_index  INTEGER,        -- references position in action_plan.weeks
    is_done     INTEGER DEFAULT 0,
    completed_at DATETIME,
    score_snapshot INTEGER       -- readiness score at time of change
);

-- Chat history
CREATE TABLE chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  INTEGER REFERENCES students(id),
    role        TEXT CHECK(role IN ('student','coach')),
    content     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Agent Deterministic Logic

Agents operate deterministically in this stage — no external LLM calls. All outputs are computed from SQLite data and weighted formulas.

| Agent | Deterministic rule |
|-------|--------------------|
| Skill Assessment | Compare `students.skills[]` against `role_skills[]` for target role. If skill exists in student list, assign proficiency based on a static mapping table; otherwise mark as gap at 0%. |
| Market Intel | Direct lookup from `market_data` table by role. Return all rows for the matched career paths. |
| Career Path | Compute: `score = (skill_match × 0.4) + (demand_weight × 0.3) + (interest_weight × 0.3)`. Demand weight mapped: Very High=100, High=80, Growing=60, Medium=40, Low=20. Interest weight: 100 if path keyword appears in `students.interests`, else 50. |
| Roadmap Gen | Look up `roadmap_templates` by top-ranked role. Copy template into `action_plans` with student reference. |
| Progress Tracker | On task toggle: update `progress` row, recompute score (see 5.4), insert new `score_snapshot`. |
| Career Coach | Concatenates structured outputs from sub-agents into a templated bilingual response string. |

### 5.4 Score Calculation Formula

The Career Readiness Score (0–100) is computed as:

```
score = (skills_component × 0.40) + (plan_progress × 0.30) + (market_alignment × 0.15) + (portfolio_bonus × 0.15)

Where:
  skills_component  = weighted average of student skill levels against top-ranked role requirements
  plan_progress     = (completed_tasks / total_tasks) × 100
  market_alignment  = demand weight of top-ranked path (Very High=100, High=80, etc.)
  portfolio_bonus   = (completed_portfolio_projects / recommended_projects) × 100
```

**Ali Khan baseline:** skills=58, plan_progress=12.5 (2/16 tasks), market_alignment=80, portfolio_bonus=0 → **Score ≈ 49**. After full plan completion: projected 82+.

> The prototype displays 64 as a static seed value. The implementation must compute this dynamically.

### 5.5 Bilingual Support Criteria

| # | Criterion | Pass condition |
|---|-----------|----------------|
| B1 | Section headings | Every section heading has an English title + Roman Urdu subtitle hint |
| B2 | Chat responses | Coach agent generates responses mixing English technical terms with Roman Urdu connective phrases (matching prototype tone) |
| B3 | UI controls | Input placeholder: "Apna sawal yahan likhein... (Type your question)" — bilingual |
| B4 | Labels | Skill names, role names, and data labels remain in English; descriptive hints use Roman Urdu |
| B5 | No Nastaliq rendering required | Urdu script rendering is NOT required in this stage; Roman Urdu transliteration is sufficient |

---

## 6. Out of Scope

The following are **explicitly excluded** from this implementation stage:

| Item | Reason for exclusion |
|------|----------------------|
| Mobile apps (iOS / Android) | Web-first; mobile can be a PWA wrapper later |
| Payment gateways (Stripe, JazzCash, EasyPaisa) | No monetization in prototype/MVP stage |
| Live job portal integrations (LinkedIn scraping, Rozee.pk API) | Requires OAuth approvals and scraping infrastructure; use static seeded data |
| Heavy ML model fine-tuning | Agents use deterministic logic + LLM chat only; no custom model training |
| Real-time collaboration / multi-user chat | Single-student experience only |
| Voice input / speech-to-text | Text-only input in this stage |
| Nastaliq / Urdu script font rendering | Roman Urdu is sufficient; Nastaliq can be added when targeting broader audience |
| Automated resume / CV generation | Planned for a later stage after core roadmap flow is validated |
| Email / push notification reminders | Progress tracking is in-app only for now |

---

## 7. Technology Stack (Recommended)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | HTML + Tailwind CSS (CDN) + Vanilla JS | Matches existing prototype; zero build tooling needed |
| Backend | Python (Flask) or Node.js (Express) | Lightweight API server to serve pages and agent endpoints |
| Database | SQLite | Single-file, zero-config, sufficient for hackathon scale |
| LLM (Coach responses) | OpenAI API or Claude API | For conversational responses only; agent logic remains deterministic |
| Hosting | Local for demo; Vercel/Railway for shareable link | No infrastructure overhead |

---

## 8. File Structure (Proposed)

```
CareerCompass-Hackathon/
├── index.html              # Existing prototype (reference)
├── spec.md                 # This file
├── db/
│   ├── schema.sql          # SQLite schema DDL
│   └── seed.sql            # Ali Khan seed data + master catalogs
├── agents/
│   ├── coach.py            # Career Coach (Orchestrator)
│   ├── skill_assessment.py # Skill Assessment Agent
│   ├── market_intel.py     # Market Intelligence Agent
│   ├── career_path.py      # Career Path Agent
│   ├── roadmap_gen.py      # Roadmap Generator Agent
│   └── progress_tracker.py # Progress Tracker Agent
├── app.py                  # Flask/Express entry point
└── static/
    └── style.css           # Custom CSS extracted from prototype <style>
```

---

## 9. Verification Checklist

Before marking this spec as implementation-ready, verify:

- [x] All 6 agents have defined input/output contracts
- [x] SQLite schema covers all data entities (7 tables)
- [x] Score formula is explicitly defined with weights
- [x] Core scenario walkthrough maps input → output through all agents
- [x] Bilingual criteria are concrete and testable
- [x] Out-of-scope items are explicitly listed
- [x] File structure aligns with agent architecture
- [x] No external dependency on live APIs, payment systems, or ML training
- [x] Prototype (`index.html`) serves as pixel-accurate UI reference for all sections
