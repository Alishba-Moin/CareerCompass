/**
 * CareerCompass — Database Seed Script
 *
 * Populates the SQLite database with default students, market signals,
 * and progress log entries for the prototype demo.
 *
 * Usage:  npm run seed
 */
import { initDatabase, dbRun, dbAll, getDb, saveToDisk } from './db.js';
import { unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'node:crypto';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '..', 'career_compass.db');

async function seed() {
  console.log('');
  console.log('CareerCompass — Seeding database...');
  console.log('─────────────────────────────────────');

  // 1. Remove stale DB to ensure clean schema
  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH);
    console.log('  Removed existing database for clean schema');
  }

  // 2. Initialize fresh schema
  await initDatabase();

  const db = getDb();

  // 3. Clear tables (safe for re-runs on a fresh DB)
  db.run('DELETE FROM progress_logs');
  db.run('DELETE FROM roadmaps');
  db.run('DELETE FROM market_signals');
  db.run('DELETE FROM students');

  // Reset autoincrement counters
  db.run("DELETE FROM sqlite_sequence WHERE name IN ('students','market_signals','roadmaps','progress_logs')");

  // ─── Students ────────────────────────────────────────────
  // Readiness scores are computed from the formula:
  //   min(100, round(skillMatchPct*0.50 + remoteDemandPct*0.30 + completedTasksRatio*20))
  //   where completedTasksRatio is 0..1
  //
  // Ali Khan:  25% skill match, 92% remote demand, 2/16 tasks → ratio 0.125 → score = 43
  // Sara Ahmed:  0% skill match, 84% remote demand, 0 tasks → score ≈ 25
  const defaultPw = hashPassword('password123');

  const students = [
    {
      name: 'Ali Khan',
      email: 'ali@careercompass.pk',
      password_hash: defaultPw.hash,
      salt: defaultPw.salt,
      education_level: 'Graduate',
      stream_or_degree: 'BS Computer Science — FAST NUCES, Islamabad',
      interests: 'AI, Machine Learning, Web Dev',
      skills: JSON.stringify(['Python', 'Basic Math', 'HTML/CSS']),
      target_role: 'AI/ML Engineer',
      skill_match_pct: 25,
      remote_demand_pct: 92,
      readiness_score: 43,
    },
    {
      name: 'Sara Ahmed',
      email: 'sara@careercompass.pk',
      password_hash: defaultPw.hash,
      salt: defaultPw.salt,
      education_level: 'Intermediate',
      stream_or_degree: 'Pre-Engineering',
      interests: 'Software Engineering, Data Science',
      skills: JSON.stringify(['Mathematics', 'Physics']),
      target_role: 'Full Stack Web Developer',
      skill_match_pct: 0,
      remote_demand_pct: 84,
      readiness_score: 25,
    },
  ];

  for (const s of students) {
    dbRun(
      `INSERT INTO students (name, email, password_hash, salt, education_level, stream_or_degree, interests, skills, target_role, skill_match_pct, remote_demand_pct, readiness_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.name, s.email, s.password_hash, s.salt, s.education_level, s.stream_or_degree, s.interests, s.skills, s.target_role, s.skill_match_pct, s.remote_demand_pct, s.readiness_score]
    );
  }
  console.log(`  students ............. ${students.length} rows inserted`);

  // ─── Market Signals ──────────────────────────────────────
  const marketSignals = [
    {
      role_title: 'AI/ML Engineer',
      domain: 'Data & AI',
      local_demand: 78,
      remote_demand: 92,
      required_skills: JSON.stringify(['Python', 'Pandas', 'Scikit-Learn', 'PyTorch']),
      growth_trend: 'High Growth',
    },
    {
      role_title: 'Full Stack Web Developer',
      domain: 'Web',
      local_demand: 85,
      remote_demand: 88,
      required_skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'SQL']),
      growth_trend: 'Stable High',
    },
    {
      role_title: 'Data Analyst',
      domain: 'Data',
      local_demand: 80,
      remote_demand: 84,
      required_skills: JSON.stringify(['Python', 'SQL', 'Excel', 'PowerBI']),
      growth_trend: 'Growing',
    },
  ];

  for (const m of marketSignals) {
    dbRun(
      `INSERT INTO market_signals (role_title, domain, local_demand, remote_demand, required_skills, growth_trend)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.role_title, m.domain, m.local_demand, m.remote_demand, m.required_skills, m.growth_trend]
    );
  }
  console.log(`  market_signals ....... ${marketSignals.length} rows inserted`);

  // ─── Roadmap (sample for Ali Khan) ───────────────────────
  dbRun(
    `INSERT INTO roadmaps (student_id, recommended_path, portfolio_project, weekly_tasks)
     VALUES (?, ?, ?, ?)`,
    [
      1, // Ali Khan
      'Full Stack → AI/ML Hybrid',
      JSON.stringify({
        title: 'Spam Email Classifier using Scikit-Learn',
        tech_stack: ['Python', 'Scikit-Learn', 'Flask'],
        estimated_duration: '1.5 weeks',
        impact: 'Medium-High',
      }),
      JSON.stringify([
        {
          week: 1,
          theme: 'Foundation',
          tasks: [
            { id: 'w1t1', text: 'Complete Node.js crash course (4 hrs)', status: 'completed' },
            { id: 'w1t2', text: 'Set up GitHub profile + pin 3 repos', status: 'completed' },
            { id: 'w1t3', text: 'Build REST API with Express + MongoDB', status: 'pending' },
            { id: 'w1t4', text: "Read Pakistan's IT Industry 2025 report", status: 'pending' },
          ],
        },
        {
          week: 2,
          theme: 'Build',
          tasks: [
            { id: 'w2t1', text: 'Start portfolio project: Task Manager App', status: 'pending' },
            { id: 'w2t2', text: 'Learn Docker basics (2 hrs)', status: 'pending' },
            { id: 'w2t3', text: 'Practice 10 LeetCode easy problems', status: 'pending' },
            { id: 'w2t4', text: 'Deploy API on Render/Railway', status: 'pending' },
          ],
        },
        {
          week: 3,
          theme: 'ML Intro',
          tasks: [
            { id: 'w3t1', text: "Complete Google's ML Crash Course (half)", status: 'pending' },
            { id: 'w3t2', text: 'Pandas + NumPy hands-on exercises', status: 'pending' },
            { id: 'w3t3', text: 'Build a simple ML model (Titanic dataset)', status: 'pending' },
            { id: 'w3t4', text: 'Update LinkedIn with new skills', status: 'pending' },
          ],
        },
        {
          week: 4,
          theme: 'Launch',
          tasks: [
            { id: 'w4t1', text: 'Polish portfolio site + deploy', status: 'pending' },
            { id: 'w4t2', text: 'Write 1 technical blog post', status: 'pending' },
            { id: 'w4t3', text: 'Apply to 5 local + 3 remote positions', status: 'pending' },
            { id: 'w4t4', text: 'Schedule mock interview with peer', status: 'pending' },
          ],
        },
      ]),
    ]
  );
  console.log('  roadmaps ............. 1 row inserted (Ali Khan)');

  // ─── Progress Logs (all 16 roadmap tasks for Ali) ───────
  const progressLogs = [
    // Week 1 — 2 completed, 2 pending
    { student_id: 1, task_id: 'w1t1', status: 'completed' },
    { student_id: 1, task_id: 'w1t2', status: 'completed' },
    { student_id: 1, task_id: 'w1t3', status: 'pending' },
    { student_id: 1, task_id: 'w1t4', status: 'pending' },
    // Week 2 — all pending
    { student_id: 1, task_id: 'w2t1', status: 'pending' },
    { student_id: 1, task_id: 'w2t2', status: 'pending' },
    { student_id: 1, task_id: 'w2t3', status: 'pending' },
    { student_id: 1, task_id: 'w2t4', status: 'pending' },
    // Week 3 — all pending
    { student_id: 1, task_id: 'w3t1', status: 'pending' },
    { student_id: 1, task_id: 'w3t2', status: 'pending' },
    { student_id: 1, task_id: 'w3t3', status: 'pending' },
    { student_id: 1, task_id: 'w3t4', status: 'pending' },
    // Week 4 — all pending
    { student_id: 1, task_id: 'w4t1', status: 'pending' },
    { student_id: 1, task_id: 'w4t2', status: 'pending' },
    { student_id: 1, task_id: 'w4t3', status: 'pending' },
    { student_id: 1, task_id: 'w4t4', status: 'pending' },
  ];

  for (const p of progressLogs) {
    dbRun(
      `INSERT INTO progress_logs (student_id, task_id, status, completed_at)
       VALUES (?, ?, ?, ?)`,
      [p.student_id, p.task_id, p.status, p.status === 'completed' ? new Date().toISOString() : null]
    );
  }
  console.log(`  progress_logs ........ ${progressLogs.length} rows inserted`);

  // ─── Verification ────────────────────────────────────────
  console.log('');
  console.log('Verification:');
  console.log('─────────────────────────────────────');

  const studentRows = dbAll('SELECT id, name, education_level, skill_match_pct, remote_demand_pct, readiness_score, skills FROM students');
  for (const row of studentRows) {
    const parsed = JSON.parse(row.skills);
    console.log(`  student #${row.id}: ${row.name} (${row.education_level}, score=${row.readiness_score}, match=${row.skill_match_pct}%, demand=${row.remote_demand_pct}%, skills=${parsed.length} items: ${parsed.join(', ')})`);
  }

  const marketRows = dbAll('SELECT id, role_title, domain, local_demand, remote_demand, required_skills, growth_trend FROM market_signals');
  for (const row of marketRows) {
    const parsed = JSON.parse(row.required_skills);
    console.log(`  market  #${row.id}: ${row.role_title} [${row.domain}] local=${row.local_demand}% remote=${row.remote_demand}% skills=${parsed.join(', ')} trend=${row.growth_trend}`);
  }

  const roadmapRows = dbAll('SELECT id, student_id, recommended_path FROM roadmaps');
  for (const row of roadmapRows) {
    console.log(`  roadmap #${row.id}: student=${row.student_id} path="${row.recommended_path}"`);
  }

  const progressRows = dbAll('SELECT COUNT(*) as count, status FROM progress_logs GROUP BY status');
  for (const row of progressRows) {
    console.log(`  progress: ${row.status}=${row.count}`);
  }

  // Validate JSON integrity
  console.log('');
  console.log('JSON validation:');
  let valid = true;
  for (const row of studentRows) {
    try { JSON.parse(row.skills); } catch { console.log(`  FAIL: student #${row.id} skills is invalid JSON`); valid = false; }
  }
  for (const row of marketRows) {
    try { JSON.parse(row.required_skills); } catch { console.log(`  FAIL: market #${row.id} required_skills is invalid JSON`); valid = false; }
  }
  const roadmapFull = dbAll('SELECT portfolio_project, weekly_tasks FROM roadmaps');
  for (const row of roadmapFull) {
    try { JSON.parse(row.portfolio_project); JSON.parse(row.weekly_tasks); } catch { console.log('  FAIL: roadmap JSON is invalid'); valid = false; }
  }
  if (valid) console.log('  All JSON fields are valid ✓');

  // Validate numeric ranges
  console.log('');
  console.log('Numeric validation:');
  let numericOk = true;
  for (const row of studentRows) {
    if (row.readiness_score < 0 || row.readiness_score > 100) { console.log(`  FAIL: student #${row.id} readiness_score out of range`); numericOk = false; }
  }
  for (const row of marketRows) {
    if (row.local_demand < 0 || row.local_demand > 100) { console.log(`  FAIL: market #${row.id} local_demand out of range`); numericOk = false; }
    if (row.remote_demand < 0 || row.remote_demand > 100) { console.log(`  FAIL: market #${row.id} remote_demand out of range`); numericOk = false; }
  }
  if (numericOk) console.log('  All numeric values within valid ranges ✓');

  console.log('');
  console.log('Seed complete ✓');
  console.log('─────────────────────────────────────');
  console.log('');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
