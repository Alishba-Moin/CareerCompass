/**
 * Roadmap Generator Agent
 *
 * Generates a tailored 4-week action plan and portfolio project
 * recommendation based on the student's selected career path and
 * identified skill gaps.
 *
 * All output is strictly structured JSON suitable for frontend rendering.
 * Part of the CareerCompass multi-agent pipeline.
 */

// ── Portfolio project templates by path ───────────────────────
const PORTFOLIO_PROJECTS = {
  'AI/ML Engineer': {
    title: 'Spam Email Classifier using Scikit-Learn',
    description: 'A Python-based email classifier that uses TF-IDF vectorization and Naive Bayes / SVM to detect spam emails. Includes a Flask API for real-time predictions and a simple web interface.',
    tech_stack: ['Python', 'Scikit-Learn', 'Pandas', 'Flask', 'NumPy'],
    estimated_duration: '1.5 weeks',
    impact: 'High',
  },
  'Full Stack Web Developer': {
    title: 'TaskFlow — Real-time Task Manager',
    description: 'A full-stack task management app with user authentication, CRUD operations, real-time updates via Socket.io, and deployment to a cloud platform. Demonstrates complete MERN/PERN stack proficiency.',
    tech_stack: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io'],
    estimated_duration: '2 weeks',
    impact: 'High',
  },
  'Data Analyst': {
    title: 'Pakistan Job Market Dashboard',
    description: 'An interactive dashboard analyzing tech job trends in Pakistan using scraped/curated data. Features filterable charts for salary ranges, demand by city, and skill popularity over time.',
    tech_stack: ['Python', 'Pandas', 'Plotly', 'SQL', 'Streamlit'],
    estimated_duration: '1.5 weeks',
    impact: 'Medium-High',
  },
  'Computer Science Foundation': {
    title: 'Algorithm Visualizer',
    description: 'A web-based tool that visually demonstrates sorting algorithms (bubble, merge, quick sort) and pathfinding (BFS, DFS, Dijkstra). Built with vanilla JavaScript to reinforce core CS concepts.',
    tech_stack: ['HTML/CSS', 'JavaScript', 'Canvas API'],
    estimated_duration: '1.5 weeks',
    impact: 'Medium',
  },
  'Data Analytics Entry': {
    title: 'Student Grade Analyzer',
    description: 'A Python script that reads student grade data from CSV files, computes statistical summaries, generates visualizations with Matplotlib, and exports a PDF report. Great first data project.',
    tech_stack: ['Python', 'Pandas', 'Matplotlib', 'CSV'],
    estimated_duration: '1 week',
    impact: 'Medium',
  },
};

// ── Free learning resources by skill category ──────────────────
const RESOURCES = {
  python:       { platform: 'YouTube', title: 'Python for Beginners — Programming with Mosh', url: 'https://youtube.com' },
  javascript:   { platform: 'YouTube', title: 'JavaScript Full Course — freeCodeCamp', url: 'https://youtube.com' },
  react:        { platform: 'YouTube', title: 'React Tutorial — Traversy Media', url: 'https://youtube.com' },
  node:         { platform: 'YouTube', title: 'Node.js Crash Course — Traversy Media', url: 'https://youtube.com' },
  sql:          { platform: 'Khan Academy', title: 'Intro to SQL', url: 'https://khanacademy.org' },
  pandas:       { platform: 'Kaggle', title: 'Pandas Micro-Course', url: 'https://kaggle.com/learn/pandas' },
  scikit:       { platform: 'Kaggle', title: 'Intro to Machine Learning', url: 'https://kaggle.com/learn/intro-to-machine-learning' },
  pytorch:      { platform: 'YouTube', title: 'PyTorch Beginner Tutorial — Aladdin Persson', url: 'https://youtube.com' },
  ml:           { platform: 'Google', title: 'Google ML Crash Course', url: 'https://developers.google.com/machine-learning/crash-course' },
  git:          { platform: 'YouTube', title: 'Git & GitHub Crash Course — Traversy Media', url: 'https://youtube.com' },
  html:         { platform: 'freeCodeCamp', title: 'Responsive Web Design Certification', url: 'https://freecodecamp.org' },
  math:         { platform: 'Khan Academy', title: 'Mathematics Foundations', url: 'https://khanacademy.org' },
  statistics:   { platform: 'Khan Academy', title: 'Statistics & Probability', url: 'https://khanacademy.org' },
  docker:       { platform: 'YouTube', title: 'Docker Tutorial for Beginners — TechWorld with Nana', url: 'https://youtube.com' },
  default:      { platform: 'Coursera', title: 'Audit relevant course for free', url: 'https://coursera.org' },
};

/**
 * Maps a skill name to a resource key.
 */
function resourceKey(skill) {
  const s = skill.toLowerCase();
  if (s.includes('python') && !s.includes('pandas') && !s.includes('scikit') && !s.includes('pytorch')) return 'python';
  if (s.includes('pandas') || s.includes('numpy')) return 'pandas';
  if (s.includes('scikit') || s.includes('sklearn')) return 'scikit';
  if (s.includes('pytorch') || s.includes('tensorflow')) return 'pytorch';
  if (s.includes('javascript') || s.includes('es6')) return 'javascript';
  if (s.includes('react')) return 'react';
  if (s.includes('node') || s.includes('express')) return 'node';
  if (s.includes('sql') || s.includes('database')) return 'sql';
  if (s.includes('ml') || s.includes('machine learning')) return 'ml';
  if (s.includes('git') || s.includes('github')) return 'git';
  if (s.includes('html') || s.includes('css')) return 'html';
  if (s.includes('math')) return 'math';
  if (s.includes('statistic')) return 'statistics';
  if (s.includes('docker')) return 'docker';
  return 'default';
}

/**
 * Builds a task list for a given week theme and skill gaps.
 */
function buildWeekTasks(week, theme, gaps) {
  switch (week) {
    case 1: {
      const gapTasks = gaps.slice(0, 3).map((gap, i) => ({
        id: `w1t${i + 1}`,
        text: `Learn ${gap} — complete introductory module`,
        resource: RESOURCES[resourceKey(gap)],
        status: 'pending',
      }));
      gapTasks.push({
        id: 'w1t4',
        text: 'Review career path overview and set weekly learning goals',
        resource: null,
        status: 'pending',
      });
      return gapTasks;
    }

    case 2:
      return [
        { id: 'w2t1', text: `Complete a free course on ${gaps[0] || 'core skill'} (${RESOURCES[resourceKey(gaps[0] || 'default')].platform})`, resource: RESOURCES[resourceKey(gaps[0] || 'default')], status: 'pending' },
        { id: 'w2t2', text: `Practice exercises: 10 problems on ${gaps[1] || 'secondary skill'}`, resource: null, status: 'pending' },
        { id: 'w2t3', text: `Build a mini-project combining ${gaps[0] || 'skill 1'} + ${gaps[1] || 'skill 2'}`, resource: null, status: 'pending' },
        { id: 'w2t4', text: 'Set up GitHub profile and push all practice code', resource: RESOURCES.git, status: 'pending' },
      ];

    case 3:
      return [
        { id: 'w3t1', text: 'Start portfolio project — scaffold repository and README', resource: null, status: 'pending' },
        { id: 'w3t2', text: 'Implement core feature of portfolio project', resource: null, status: 'pending' },
        { id: 'w3t3', text: 'Add secondary feature and polish UI/output', resource: null, status: 'pending' },
        { id: 'w3t4', text: 'Deploy project (GitHub Pages / Render / Heroku)', resource: null, status: 'pending' },
      ];

    case 4:
      return [
        { id: 'w4t1', text: 'Optimize LinkedIn profile with new skills and project links', resource: null, status: 'pending' },
        { id: 'w4t2', text: 'Pin portfolio project on GitHub with clean documentation', resource: null, status: 'pending' },
        { id: 'w4t3', text: 'Write a technical blog post about portfolio project', resource: null, status: 'pending' },
        { id: 'w4t4', text: 'Apply to 5 positions or prepare university entry materials', resource: null, status: 'pending' },
      ];

    default:
      return [];
  }
}

/**
 * Generates a 4-week action plan and portfolio project for a student.
 *
 * @param {{ name: string, education_level: string, interests: string, skills?: string[] }} student
 * @param {{ recommended_path: string, domain: string, overview: string, milestones: string[] }} path
 * @param {string[]} skillGaps — Skills the student needs to learn.
 * @returns {{
 *   student_name: string,
 *   path: string,
 *   portfolio_project: { title: string, description: string, tech_stack: string[], estimated_duration: string, impact: string },
 *   weeks: { week: number, theme: string, tasks: { id: string, text: string, resource: object|null, status: string }[] }[],
 *   total_tasks: number,
 * }}
 */
export function generateRoadmap(student, path, skillGaps) {
  if (!student || !path) {
    throw new TypeError('student and path are required.');
  }

  const gaps = Array.isArray(skillGaps) ? skillGaps : [];
  const portfolioProject = PORTFOLIO_PROJECTS[path.recommended_path] || PORTFOLIO_PROJECTS['Full Stack Web Developer'];

  const weeks = [
    { week: 1, theme: 'Foundation — Core Skill Build', tasks: buildWeekTasks(1, 'Foundation', gaps) },
    { week: 2, theme: 'Practice — Course Completion & Exercises', tasks: buildWeekTasks(2, 'Practice', gaps) },
    { week: 3, theme: 'Build — Portfolio Project Development', tasks: buildWeekTasks(3, 'Build', gaps) },
    { week: 4, theme: 'Launch — Job Readiness & Applications', tasks: buildWeekTasks(4, 'Launch', gaps) },
  ];

  const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);

  return {
    student_name: student.name || 'Student',
    path: path.recommended_path,
    portfolio_project: portfolioProject,
    weeks,
    total_tasks: totalTasks,
  };
}
