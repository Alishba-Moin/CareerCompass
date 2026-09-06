import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'career_compass.db');

let db = null;
let initPromise = null;

/**
 * Standard Password Hashing Utility
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Returns the singleton database connection.
 */
export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * Persists the in-memory database to disk if filesystem allows.
 */
export function saveToDisk() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      writeFileSync(DB_PATH, buffer);
    } catch (e) {
      // Gracefully ignore on Vercel read-only environment
    }
  }
}

/**
 * Runs a SQL statement (INSERT/UPDATE/DELETE) and auto-saves.
 */
export function dbRun(sql, params = []) {
  db.run(sql, params);
  saveToDisk();
}

/**
 * Runs a SQL query and returns all rows as objects.
 */
export function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Seeds fixed initial demo users with exact credentials.
 */
function seedIfEmpty() {
  try {
    const countRes = dbAll('SELECT COUNT(*) as count FROM students');
    if (countRes[0] && countRes[0].count > 0) return;

    console.log('Seeding initial demo data into SQLite...');
    
    // Default fixed password for testing: "password123"
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
      db.run(
        `INSERT INTO students (name, email, password_hash, salt, education_level, stream_or_degree, interests, skills, target_role, skill_match_pct, remote_demand_pct, readiness_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.name, s.email, s.password_hash, s.salt, s.education_level, s.stream_or_degree, s.interests, s.skills, s.target_role, s.skill_match_pct, s.remote_demand_pct, s.readiness_score]
      );
    }

    const marketSignals = [
      { role_title: 'AI/ML Engineer', domain: 'Data & AI', local_demand: 78, remote_demand: 92, required_skills: JSON.stringify(['Python', 'Pandas', 'Scikit-Learn', 'PyTorch']), growth_trend: 'High Growth' },
      { role_title: 'Full Stack Web Developer', domain: 'Web', local_demand: 85, remote_demand: 88, required_skills: JSON.stringify(['JavaScript', 'React', 'Node.js', 'SQL']), growth_trend: 'Stable High' },
      { role_title: 'Data Analyst', domain: 'Data', local_demand: 80, remote_demand: 84, required_skills: JSON.stringify(['Python', 'SQL', 'Excel', 'PowerBI']), growth_trend: 'Growing' },
    ];

    for (const m of marketSignals) {
      db.run(
        `INSERT INTO market_signals (role_title, domain, local_demand, remote_demand, required_skills, growth_trend)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [m.role_title, m.domain, m.local_demand, m.remote_demand, m.required_skills, m.growth_trend]
      );
    }
  } catch (err) {
    console.error('Seeding execution error:', err);
  }
}

/**
 * Initializes the database safely with promise locks and WebAssembly CDN fallback.
 */
export async function initDatabase() {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // CDN fallback resolves WebAssembly loading issues on Vercel
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });

    try {
      if (existsSync(DB_PATH)) {
        const fileBuffer = readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }
    } catch (err) {
      db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    // ── students ──
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        name              TEXT NOT NULL,
        email             TEXT UNIQUE,
        password_hash     TEXT,
        salt              TEXT,
        education_level   TEXT NOT NULL CHECK(education_level IN ('Intermediate','Graduate')),
        stream_or_degree  TEXT,
        interests         TEXT,
        skills            TEXT DEFAULT '[]',
        target_role       TEXT,
        skill_match_pct   REAL DEFAULT 0,
        remote_demand_pct REAL DEFAULT 0,
        readiness_score   INTEGER DEFAULT 0 CHECK(readiness_score BETWEEN 0 AND 100),
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      const studentCols = dbAll("PRAGMA table_info(students)").map(c => c.name);
      if (!studentCols.includes('email')) db.run('ALTER TABLE students ADD COLUMN email TEXT UNIQUE');
      if (!studentCols.includes('password_hash')) db.run('ALTER TABLE students ADD COLUMN password_hash TEXT');
      if (!studentCols.includes('salt')) db.run('ALTER TABLE students ADD COLUMN salt TEXT');
      if (!studentCols.includes('target_role')) db.run('ALTER TABLE students ADD COLUMN target_role TEXT');
      if (!studentCols.includes('created_at')) db.run('ALTER TABLE students ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    } catch (e) {
      // Already existing
    }

    // ── market_signals ──
    db.run(`
      CREATE TABLE IF NOT EXISTS market_signals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        role_title      TEXT NOT NULL,
        domain          TEXT,
        local_demand    INTEGER CHECK(local_demand BETWEEN 0 AND 100),
        remote_demand   INTEGER CHECK(remote_demand BETWEEN 0 AND 100),
        required_skills TEXT DEFAULT '[]',
        growth_trend    TEXT
      )
    `);

    // ── roadmaps ──
    db.run(`
      CREATE TABLE IF NOT EXISTS roadmaps (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id         INTEGER REFERENCES students(id) ON DELETE CASCADE,
        recommended_path   TEXT,
        portfolio_project  TEXT DEFAULT '{}',
        weekly_tasks       TEXT DEFAULT '[]',
        created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── progress_logs ──
    db.run(`
      CREATE TABLE IF NOT EXISTS progress_logs (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id   INTEGER REFERENCES students(id) ON DELETE CASCADE,
        task_id      TEXT,
        status       TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed')),
        completed_at DATETIME
      )
    `);

    seedIfEmpty();
    saveToDisk();
    return db;
  })();

  return initPromise;
}
