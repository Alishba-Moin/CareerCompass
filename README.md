# CareerCompass

CareerCompass is an AI-powered, multi-agent career guidance and roadmap generation system tailored for Pakistani technology graduates and students. Rather than relying on a single, ungrounded Large Language Model response, the platform utilizes a deterministic pipeline of six specialized sub-agents working in orchestration to evaluate student skills, analyze job market signals, generate structured action plans, and track progress over time.

---

## Features

* **Multi-Agent Orchestration**: Transparent execution stream demonstrating step-by-step collaboration across six dedicated agents.
* **Deterministic Skill Assessment**: Case-insensitive matrix evaluation that identifies student strengths and missing technical gaps against specific role targets.
* **Localized Market Intelligence**: Real-time evaluation of local versus remote job market demand percentages, growth trends, and hiring hubs within Pakistan.
* **Dynamic 4-Week Roadmaps**: Tailored action plans featuring four weekly tasks and a concrete portfolio project specification.
* **Interactive Progress Tracking**: Dynamic Career Readiness Score calculation based on skill match ratio, remote demand, and task completion metrics.
* **Multi-Student Profiles**: Built-in support to switch between different student profiles and update profile metrics dynamically via an interactive modal dialog.
* **Dual-Language Interface**: Support for both professional English and Roman Urdu via a global navigation toggle.

---

## System Architecture

The application bypasses monolithic prompting by delegating tasks to distinct backend modules:


```

```
              [ Student Query / Profile ]
                           │
                           ▼
           [ Career Coach Orchestrator ]
                           │
   ┌───────────────────────┼───────────────────────┐
   ▼                       ▼                       ▼

```

[ Skill Assessment ]  [ Market Intelligence ]   [ Career Path ]
│                       │                       │
└───────────────────────┼───────────────────────┘
▼
[ Roadmap Generator ]
│
▼
[ Progress Tracker ]
│
▼
[ Unified Dashboard UI ]

```

### Agent Responsibilities

1. **Skill Assessment Agent**: Evaluates student skills against target role matrices to compute match percentages, strengths, and skill gaps.
2. **Market Intelligence Agent**: Queries local and remote demand metrics, salary bands, and hiring trends for Pakistani tech regions.
3. **Career Path Agent**: Evaluates student education levels and interests using a weighted scoring algorithm to recommend optimal tracks.
4. **Roadmap Generator Agent**: Generates a 4-week task schedule and portfolio project tailored to specific skill gaps.
5. **Progress Tracker Agent**: Persists task state changes and dynamically updates the overall Career Readiness Score.
6. **Career Coach Orchestrator**: Manages execution flow across all sub-agents, logs execution timestamps, and produces synthesized guidance.

---

## Technical Stack

* **Backend**: Node.js, Express.js
* **Database**: SQLite (`sql.js` WebAssembly / `better-sqlite3`)
* **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS CDN
* **Testing**: Node.js Native Test Runner

---

## Mathematical Models & Formulas

### Career Readiness Score

$$ \text{Readiness Score} = \min\left(100, \text{Round}\left((\text{Skill Match Ratio} \times 50) + (\text{Remote Demand Ratio} \times 30) + (\text{Completed Task Ratio} \times 20)\right)\right) $$

* **Skill Alignment**: Up to 50 points based on target role coverage.
* **Market Demand**: Up to 30 points based on remote job opportunity index.
* **Plan Completion**: Up to 20 points based on completed roadmap tasks.

---

## Directory Structure


```

CareerCompass/
├── server.js                        # Express server entry point
├── package.json                     # Project dependencies and scripts
├── .env                             # Environment configuration
├── database/
│   ├── db.js                        # SQLite connection wrapper and schemas
│   └── seed.js                      # Database population script
├── routes/
│   └── api.js                       # Express REST endpoints
├── agents/
│   ├── skillAssessmentAgent.js      # Skill matching module
├── marketIntelligenceAgent.js   # Job market analytics module
├── careerPathAgent.js           # Career path selection module
├── roadmapGeneratorAgent.js     # Action plan generation module
├── progressTrackerAgent.js      # Task tracking and scoring module
└── careerCoachOrchestrator.js   # Pipeline orchestrator
├── public/
│   └── index.html                   # Dashboard UI
└── tests/                           # Unit and orchestration test suites

```

---

## API Endpoints

### Student Profile
* **GET** `/api/students/:id`
  * Returns student details, current skills, progress statistics, and baseline readiness scores.
* **PUT** `/api/students/:id`
  * Updates existing student fields (name, skills, education, interests) and returns refreshed profile data.

### Analysis & Orchestration
* **POST** `/api/coach/analyze`
  * Accepts `{ studentId, query, language }`.
  * Executes the full 6-agent pipeline and returns unified JSON containing market metrics, skill gaps, roadmaps, and execution logs.

### Task Management
* **POST** `/api/progress/toggle`
  * Accepts `{ studentId, taskId, status }`.
  * Updates database logs and returns recalculated readiness scores and task completion metrics.

---

## Installation & Setup

### Prerequisites

* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher)

### Setup Steps

1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/CareerCompass.git](https://github.com/your-username/CareerCompass.git)
   cd CareerCompass

```

2. Install dependencies:
```bash
npm install

```


3. Initialize and seed the database:
```bash
npm run seed

```


4. Start the application server:
```bash
npm start

```


5. Access the dashboard:
Open browser at `http://localhost:3000`

---

## Testing

Run the full test suite covering individual agent modules and end-to-end orchestration pipelines:

```bash
npm test

```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
