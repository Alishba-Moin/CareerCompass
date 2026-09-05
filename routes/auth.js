import { Router } from 'express';
import crypto from 'node:crypto';
import { dbAll, dbRun } from '../database/db.js';
import { runPipeline } from '../agents/careerCoachOrchestrator.js';

export const authRouter = Router();
const db = { dbAll, dbRun };

const JWT_SECRET = process.env.JWT_SECRET || 'careercompass_secret_jwt_key_pakistan_2025';

/**
 * Hashes a password using PBKDF2 with SHA-512 and a random salt.
 */
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

/**
 * Verifies a password against the stored salt and hash.
 */
export function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

/**
 * Generates an HMAC-SHA256 signed stateless auth token (7-day validity).
 */
export function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes an auth token.
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to fetch full student details + progress + active analysis.
 */
export function getStudentData(studentId) {
  const rows = dbAll('SELECT * FROM students WHERE id = ?', [studentId]);
  if (rows.length === 0) return null;

  const student = rows[0];
  let skills = [];
  try {
    skills = JSON.parse(student.skills || '[]');
  } catch {
    skills = [];
  }

  // Fetch progress stats
  const counts = dbAll(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM progress_logs WHERE student_id = ?`,
    [studentId]
  );

  const logs = dbAll(
    'SELECT task_id, status, completed_at FROM progress_logs WHERE student_id = ? ORDER BY task_id',
    [studentId]
  );

  // Return clean student object (excluding sensitive password hash & salt)
  const safeStudent = {
    id: student.id,
    name: student.name,
    email: student.email,
    education_level: student.education_level,
    stream_or_degree: student.stream_or_degree,
    interests: student.interests,
    skills,
    target_role: student.target_role,
    skill_match_pct: student.skill_match_pct,
    remote_demand_pct: student.remote_demand_pct,
    readiness_score: student.readiness_score,
    created_at: student.created_at,
    progress: {
      total_tasks: (counts[0] && counts[0].total) || 0,
      completed_tasks: (counts[0] && counts[0].completed) || 0,
    },
    progress_logs: logs,
  };

  return safeStudent;
}

/**
 * Runs pipeline and ensures roadmap & tasks are persisted in DB.
 */
export function buildOrRefreshStudentRoadmap(studentId, query = '') {
  const student = getStudentData(studentId);
  if (!student) return null;

  const effectiveQuery = query || student.target_role || student.interests || '';
  const pipelineResult = runPipeline(db, studentId, effectiveQuery);

  if (pipelineResult && pipelineResult.success) {
    // Check if roadmap row exists
    const existingRoadmaps = dbAll('SELECT id FROM roadmaps WHERE student_id = ?', [studentId]);
    const weeklyTasksJson = JSON.stringify(pipelineResult.weeklyTasks || []);
    const portfolioJson = JSON.stringify(pipelineResult.portfolioProject || {});
    const recommendedPath = pipelineResult.targetRole || pipelineResult.marketAnalysis?.role_title || 'General';

    if (existingRoadmaps.length > 0) {
      dbRun(
        `UPDATE roadmaps SET recommended_path = ?, portfolio_project = ?, weekly_tasks = ? WHERE student_id = ?`,
        [recommendedPath, portfolioJson, weeklyTasksJson, studentId]
      );
    } else {
      dbRun(
        `INSERT INTO roadmaps (student_id, recommended_path, portfolio_project, weekly_tasks) VALUES (?, ?, ?, ?)`,
        [studentId, recommendedPath, portfolioJson, weeklyTasksJson]
      );
    }

    // Ensure all tasks exist in progress_logs
    if (Array.isArray(pipelineResult.weeklyTasks)) {
      for (const week of pipelineResult.weeklyTasks) {
        if (Array.isArray(week.tasks)) {
          for (const task of week.tasks) {
            const taskId = task.id;
            const existingLog = dbAll('SELECT id FROM progress_logs WHERE student_id = ? AND task_id = ?', [
              studentId,
              taskId,
            ]);
            if (existingLog.length === 0) {
              dbRun(
                `INSERT INTO progress_logs (student_id, task_id, status, completed_at) VALUES (?, ?, ?, ?)`,
                [studentId, taskId, task.status || 'pending', null]
              );
            }
          }
        }
      }
    }
  }

  return pipelineResult;
}

// ─── POST /api/auth/signup ──────────────────────────────────────────
authRouter.post('/signup', (req, res) => {
  const {
    name,
    email,
    password,
    education_level,
    stream_or_degree,
    interests,
    skills,
    target_role,
  } = req.body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (education_level !== 'Intermediate' && education_level !== 'Graduate') {
    return res.status(400).json({ error: 'Education level must be "Intermediate" or "Graduate".' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already registered
  const existing = dbAll('SELECT id FROM students WHERE email = ?', [normalizedEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const { salt, hash } = hashPassword(password);
  const skillsArray = Array.isArray(skills)
    ? skills.filter(s => typeof s === 'string' && s.trim().length > 0).map(s => s.trim())
    : typeof skills === 'string'
    ? skills.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const skillsJson = JSON.stringify(skillsArray);
  const userInterests = (typeof interests === 'string' ? interests : (skillsArray.join(', ') || 'Technology')).trim();
  const userDegree = (typeof stream_or_degree === 'string' ? stream_or_degree : 'General Studies').trim();
  const userTarget = (typeof target_role === 'string' && target_role.trim().length > 0) ? target_role.trim() : 'Full Stack Web Developer';

  try {
    dbRun(
      `INSERT INTO students (
         name, email, password_hash, salt, education_level,
         stream_or_degree, interests, skills, target_role,
         skill_match_pct, remote_demand_pct, readiness_score
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        name.trim(),
        normalizedEmail,
        hash,
        salt,
        education_level,
        userDegree,
        userInterests,
        skillsJson,
        userTarget,
      ]
    );

    const inserted = dbAll('SELECT id FROM students WHERE email = ?', [normalizedEmail])[0];
    const newStudentId = inserted.id;

    // Immediately run multi-agent pipeline to generate initial customized roadmap & calculate score
    const analysis = buildOrRefreshStudentRoadmap(newStudentId, userTarget);
    const student = getStudentData(newStudentId);
    const token = createToken({ studentId: newStudentId, email: normalizedEmail, name: student.name });

    res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      token,
      student,
      analysis,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create student account: ' + err.message });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const rows = dbAll('SELECT * FROM students WHERE email = ?', [normalizedEmail]);

  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const studentRow = rows[0];

  // If password_hash is not set (e.g. legacy demo without password), allow login with default "password123"
  let valid = false;
  if (!studentRow.password_hash || !studentRow.salt) {
    valid = password === 'password123' || password === 'admin';
  } else {
    valid = verifyPassword(password, studentRow.salt, studentRow.password_hash);
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const student = getStudentData(studentRow.id);
  const token = createToken({ studentId: studentRow.id, email: studentRow.email, name: studentRow.name });

  // Generate or retrieve current analysis
  let analysis = buildOrRefreshStudentRoadmap(studentRow.id, studentRow.target_role || studentRow.interests);

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token,
    student,
    analysis,
  });
});

// ─── GET /api/auth/me ───────────────────────────────────────────────
authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload || !payload.studentId) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  const student = getStudentData(payload.studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const analysis = buildOrRefreshStudentRoadmap(student.id, student.target_role || student.interests);

  res.json({
    success: true,
    student,
    analysis,
  });
});

// ─── POST /api/auth/logout ──────────────────────────────────────────
authRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});