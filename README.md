# CareerCompass — Multi-Agent AI Career Orchestration Platform

CareerCompass is an AI-driven career guidance system designed to provide personalized, market-aligned career roadmaps for students. Powered by a deterministic six-agent pipeline, the platform analyzes individual skill matrices, compares them against real-time industry demand signals, evaluates candidate readiness, and builds personalized four-week execution plans.

---

## Key Architecture & Feature Highlights

* **Six-Agent Deterministic Pipeline**: Rather than relying on single ungrounded LLM prompts, the platform delegates specialized operations across six autonomous agents with transparent execution logging.
* **Real-Time Agent Command Center**: Visualizes the active step-by-step pipeline execution stream using dynamic status badges (`IDLE` to `EXECUTING` to `COMPLETE`), animated pulse indicators, and detailed output summaries.
* **Dynamic Career Readiness Engine**: Calculates candidate readiness dynamically using a deterministic scoring formula combining skill match percentages, remote market demand, and plan task completion rates.
* **Warm Luxury Design System**: Tailored educational layout using an off-white/cream background (`#FDFBF7`), deep espresso typography (`#2C221E`), champagne gold accents (`#D4AF37`), micro-shadows, and glassmorphic card elements.
* **Multi-Student Switcher & Profile Management**: Switch between seeded profiles seamlessly or modify existing credentials via an interactive modal with immediate SQLite persistence.
* **Full Localization (i18n)**: Native bilingual support for English and Urdu with Right-to-Left (RTL) layout adjustments and persistent language selection.

---

## Multi-Agent System Architecture

```text
                        [ User Career Query ]
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │    Career Coach Orchestrator     │
                └─────────────────┬────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌───────────────┐         ┌───────────────┐         ┌───────────────┐
│     Skill     │         │    Market     │         │  Career Path  │
│  Assessment   │         │ Intelligence  │         │   Selector    │
└───────┬───────┘         └───────┬───────┘         └───────┬───────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │     Roadmap Generator Agent      │
                └─────────────────┬────────────────┘
                                  │
                                  ▼
                ┌──────────────────────────────────┐
                │      Progress Tracker Agent      │
                └─────────────────┬────────────────┘
                                  │
                                  ▼
                    [ Unified Response Payload ]
```

### Agent Roles

1. **Skill Assessment Agent** (`agents/skillAssessmentAgent.js`): Evaluates candidate skill arrays against target role requirements using normalized set operations to identify matched strengths and critical gaps.
2. **Market Intelligence Agent** (`agents/marketIntelligenceAgent.js`): Queries local and remote demand metrics, identifying high-growth domains, salary benchmarks, and hiring hubs within the region.
3. **Career Path Agent** (`agents/careerPathAgent.js`): Evaluates academic background (Intermediate vs. Graduate) alongside target preferences to select optimal career tracks.
4. **Roadmap Generator Agent** (`agents/roadmapGeneratorAgent.js`): Synthesizes identified gaps into a structured four-week action plan (4 tasks per week) paired with a tailored portfolio project specification.
5. **Progress Tracker Agent** (`agents/progressTrackerAgent.js`): Re-evaluates readiness scores upon task toggle events and updates persistent log records.
6. **Career Coach Orchestrator** (`agents/careerCoachOrchestrator.js`): Manages end-to-end agent execution sequence, logs execution timestamps, and synthesizes structured recommendations.

---

## Career Readiness Score Engine

The readiness score is computed deterministically using the following formula:

$$\text{Readiness Score} = \min\left(100, \text{Round}\left(\text{SkillMatchPct} \times 0.50 + \text{RemoteDemandPct} \times 0.30 + \text{CompletedTasksRatio} \times 20\right)\right)$$

### Scoring Distribution

| Scoring Factor | Evaluation Basis | Maximum Point Allocation |
| :--- | :--- | :--- |
| **Skill Alignment** | Direct match ratio against target role skill matrix | 50 Points |
| **Market Alignment** | Regional remote market demand indicator | 30 Points |
| **Plan Execution** | Completed tasks / Total tasks ratio (16 tasks total) | 20 Points |
| **Total Target Score** | **Weighted Composite Value** | **100 Points** |

---

## Tech Stack & Dependencies

### Backend Layer
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: SQLite via `sql.js` (WebAssembly)
* **Configuration**: `dotenv`, `cors`

### Frontend Layer
* **Framework**: React 18 / Next.js (App Router)
* **Styling**: Tailwind CSS (Custom Color Extension)
* **Animation Engine**: Framer Motion
* **Iconography**: Lucide React
* **Internationalization**: Custom Dictionary-based i18n Hook (English / Urdu RTL)

---
## Project Directory Structure

CareerCompass/
├── agents/
│   ├── skillAssessmentAgent.js       # Logic for matching student skills to role requirements
│   ├── marketIntelligenceAgent.js    # Logic for analyzing local and remote market signals
│   ├── careerPathAgent.js            # Logic for evaluating optimal education-to-career tracks
│   ├── roadmapGeneratorAgent.js      # Logic for building structured 4-week action plans
│   ├── progressTrackerAgent.js       # Logic for dynamic readiness score recalculation
│   └── careerCoachOrchestrator.js    # Master pipeline manager for agent synchronization
├── database/
│   ├── db.js                         # SQLite initialization and WASM connector
│   └── seed.js                       # Data seeding script for student and market records
├── routes/
│   ├── api.js                        # Primary REST API routes for dashboard interaction
│   └── health.js                     # System status and database connectivity endpoint
├── src/
│   ├── components/
│   │   ├── Navbar.jsx                # Navigation, student switcher, and language controls
│   │   ├── AgentCommandCenter.jsx    # Real-time multi-agent execution visualizer
│   │   ├── ReadinessScoreCard.jsx    # Component for animated readiness score gauges
│   │   ├── SkillAnalysisCard.jsx     # Comparative matrix for strengths and gaps
│   │   ├── MarketInsightsCard.jsx    # Visualization for local vs. remote job demand
│   │   ├── ActionPlanSection.jsx     # Interactive 4-week task checklist
│   │   ├── PortfolioProjectCard.jsx  # Highlight section for recommended project builds
│   │   └── EditProfileModal.jsx      # Dialog for modifying student records in real-time
│   ├── i18n/
│   │   ├── dictionaries.js           # Localization strings for English and Urdu
│   │   └── LanguageContext.jsx       # Global state manager for locale and RTL alignment
│   ├── styles/
│   │   └── globals.css               # Tailwind directives and custom luxury theme tokens
│   └── page.jsx                      # Main dashboard controller and view logic
├── public/                           # Static assets and design resources
├── .env                              # Environment configuration (Port, API settings)
├── package.json                      # Dependency manifests and automation scripts
└── server.js                         # Express.js entry point and static file server
