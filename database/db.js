import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'career_compass.db');

let db = null;

/**
 * Returns the singleton database connection.
 * Must call initDatabase() first.
 */
export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

/**
 * Persists the in-memory database to disk.
 */
export function saveToDisk() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
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
 * Initializes the database.
 * Loads existing DB from disk or creates a new one, then ensures schema exists.
 */
export async function initDatabase() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
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

  // Run lightweight migrations if upgrading existing database
  try {
    const studentCols = dbAll("PRAGMA table_info(students)").map(c => c.name);
    if (!studentCols.includes('email')) db.run('ALTER TABLE students ADD COLUMN email TEXT UNIQUE');
    if (!studentCols.includes('password_hash')) db.run('ALTER TABLE students ADD COLUMN password_hash TEXT');
    if (!studentCols.includes('salt')) db.run('ALTER TABLE students ADD COLUMN salt TEXT');
    if (!studentCols.includes('target_role')) db.run('ALTER TABLE students ADD COLUMN target_role TEXT');
    if (!studentCols.includes('created_at')) db.run('ALTER TABLE students ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
  } catch (e) {
    // Ignore if already present
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

  saveToDisk();
  console.log(`SQLite database initialized → ${DB_PATH}`);
}