import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IS_VERCEL = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
const DB_DIR = IS_VERCEL ? '/tmp' : join(__dirname, '..');
const DB_PATH = join(DB_DIR, 'career_compass.db');

let db = null;

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function saveToDisk() {
  if (db) {
    try {
      if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true });
      }
      const data = db.export();
      const buffer = Buffer.from(data);
      writeFileSync(DB_PATH, buffer);
    } catch (err) {
      console.error('Failed to save DB to disk:', err);
    }
  }
}

export function dbRun(sql, params = []) {
  db.run(sql, params);
  saveToDisk();
}

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

export async function initDatabase() {
  if (db) return db;

  try {
    // Locate sql-wasm.wasm file explicitly for Vercel Serverless Function
    const wasmPath = join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    
    let SQL;
    if (existsSync(wasmPath)) {
      const wasmBinary = readFileSync(wasmPath);
      SQL = await initSqlJs({ wasmBinary });
    } else {
      SQL = await initSqlJs();
    }

    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }

    if (existsSync(DB_PATH)) {
      const fileBuffer = readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');

    // ── Create Tables ──
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

    db.run(`
      CREATE TABLE IF NOT EXISTS progress_logs (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id   INTEGER REFERENCES students(id) ON DELETE CASCADE,
        task_id      TEXT,
        status       TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed')),
        completed_at DATETIME
      )
    `);

    // ── Auto-Seed Default Test Personas if Database is Fresh ──
    const studentCount = dbAll('SELECT COUNT(*) as count FROM students');
    if (studentCount[0]?.count === 0) {
      db.run(`
        INSERT INTO students (name, email, password_hash, education_level, stream_or_degree, interests, skills, target_role, skill_match_pct, remote_demand_pct, readiness_score)
        VALUES 
        ('Ali Khan', 'ali@example.com', 'seeded_user', 'Graduate', 'Computer Science', 'Artificial Intelligence, Machine Learning', '["Python", "C++", "Data Structures"]', 'AI Engineer', 75, 85, 78),
        ('Sara Ahmed', 'sara@example.com', 'seeded_user', 'Intermediate', 'Pre-Engineering', 'Web Development, Frontend Design', '["HTML", "CSS", "JavaScript"]', 'Frontend Developer', 60, 80, 68)
      `);
      console.log('Seeded initial student personas successfully.');
    }

    saveToDisk();
    console.log(`SQLite database initialized → ${DB_PATH}`);
    return db;
  } catch (err) {
    console.error('CRITICAL: Database init error:', err);
    throw err;
  }
}
