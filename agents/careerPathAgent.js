/**
 * Career Path Agent
 *
 * Evaluates a student's profile (education level, interests, skills)
 * against predefined career tracks and selects the optimal path.
 *
 * All scoring is deterministic — no LLM or random estimates.
 * Part of the CareerCompass multi-agent pipeline.
 */

// ── Career Path Definitions ───────────────────────────────────
const PATHS = [
  {
    name: 'AI/ML Engineer',
    domain: 'Data & AI',
    education_level: 'Graduate',
    keywords: ['ai', 'machine learning', 'ml', 'data', 'deep learning'],
    overview: 'Build intelligent systems using Python, data science libraries, and deep learning frameworks. High demand in Pakistan\'s growing AI sector and remote markets.',
    milestones: [
      'Master Python data stack: NumPy, Pandas, Matplotlib',
      'Complete ML fundamentals via Google ML Crash Course',
      'Build 2 ML projects: classification + regression',
      'Learn PyTorch or TensorFlow for deep learning',
      'Deploy an ML model via Flask API',
    ],
  },
  {
    name: 'Full Stack Web Developer',
    domain: 'Web',
    education_level: 'Graduate',
    keywords: ['web', 'full stack', 'frontend', 'backend', 'react', 'javascript', 'web dev'],
    overview: 'Build complete web applications from frontend to backend. Consistently the highest-demand role in Pakistani software houses and remote freelancing platforms.',
    milestones: [
      'Master JavaScript ES6+ and modern frameworks',
      'Build responsive UIs with React',
      'Create RESTful APIs with Node.js and Express',
      'Work with SQL and NoSQL databases',
      'Deploy full-stack applications to production',
    ],
  },
  {
    name: 'Data Analyst',
    domain: 'Data',
    education_level: 'Graduate',
    keywords: ['data', 'analytics', 'analyst', 'business intelligence', 'bi'],
    overview: 'Transform raw data into actionable insights using Python, SQL, and visualization tools. Growing demand across Pakistani enterprises and remote opportunities.',
    milestones: [
      'Learn SQL for data querying and manipulation',
      'Master Pandas and NumPy for data processing',
      'Build dashboards with PowerBI or Tableau',
      'Complete a real-world data analysis project',
      'Learn basic statistics for data interpretation',
    ],
  },
  {
    name: 'Computer Science Foundation',
    domain: 'CS Fundamentals',
    education_level: 'Intermediate',
    keywords: ['software', 'engineering', 'computer science', 'cs', 'programming'],
    overview: 'Build a strong CS foundation before university. Focus on programming fundamentals, mathematics, and problem-solving — essential for any tech career path.',
    milestones: [
      'Learn Python or C++ programming basics',
      'Strengthen mathematics: algebra, logic, statistics',
      'Solve 50+ problems on competitive coding platforms',
      'Build 2 small projects to apply learning',
      'Research university CS programs in Pakistan',
    ],
  },
  {
    name: 'Data Analytics Entry',
    domain: 'Data',
    education_level: 'Intermediate',
    keywords: ['data', 'analytics', 'data science', 'statistics'],
    overview: 'Start your data journey early. Learn Excel, basic Python, and statistics to build a competitive edge before entering university.',
    milestones: [
      'Master Excel for data: pivot tables, charts, formulas',
      'Learn Python basics for data manipulation',
      'Understand descriptive statistics concepts',
      'Complete a small data project with real datasets',
      'Explore data science university programs',
    ],
  },
];

/**
 * Scores a career path against the student profile.
 *
 * @param {object} student   — { education_level, interests, skills }
 * @param {object} path      — A path definition from PATHS.
 * @param {string} targetPref — Optional explicit target preference.
 * @returns {number} Score (higher = better fit).
 */
function scorePath(student, path, targetPref) {
  let score = 0;

  // Education level match (strong signal)
  const studentLevel = (student.education_level || '').toLowerCase();
  if (path.education_level.toLowerCase() === studentLevel) {
    score += 40;
  }

  // Interest keyword overlap
  const interests = (student.interests || '').toLowerCase();
  const interestMatches = path.keywords.filter(kw => interests.includes(kw)).length;
  score += interestMatches * 12;

  // Explicit target preference bonus
  if (targetPref) {
    const pref = targetPref.toLowerCase();
    if (path.name.toLowerCase().includes(pref) || path.keywords.some(kw => pref.includes(kw))) {
      score += 30;
    }
  }

  return score;
}

/**
 * Selects the optimal career path for a student.
 *
 * @param {{ education_level: string, interests: string, skills?: string[] }} student
 * @param {string} [targetPreference] — Optional explicit target (e.g., "AI/ML", "Web Dev").
 * @returns {{
 *   recommended_path: string,
 *   domain: string,
 *   overview: string,
 *   milestones: string[],
 *   score: number,
 *   alternatives: { name: string, score: number }[],
 * }}
 */
export function selectOptimalPath(student, targetPreference) {
  if (!student || typeof student !== 'object') {
    throw new TypeError('student must be an object with at least education_level and interests.');
  }

  // Score all paths
  const scored = PATHS.map(path => ({
    ...path,
    score: scorePath(student, path, targetPreference),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  const alternatives = scored.slice(1, 4).map(p => ({ name: p.name, score: p.score }));

  return {
    recommended_path: top.name,
    domain: top.domain,
    overview: top.overview,
    milestones: top.milestones,
    score: top.score,
    alternatives,
  };
}
