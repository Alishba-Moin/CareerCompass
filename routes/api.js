import { Router } from 'express';
import { dbAll, dbRun } from '../database/db.js';
import { runPipeline } from '../agents/careerCoachOrchestrator.js';
import { toggleTaskStatus } from '../agents/progressTrackerAgent.js';
import { buildOrRefreshStudentRoadmap } from './auth.js';

export const apiRouter = Router();
const db = { dbAll, dbRun };

/** Safely parse a JSON string, returning a fallback on invalid input. */
function safeJsonParse(str, fallback) {
  try { return JSON.parse(str || fallback); }
  catch { return JSON.parse(fallback); }
}

/**
 * GET /api/students — Lists all students (for the student switcher).
 */
apiRouter.get('/students', (req, res) => {
  const rows = dbAll('SELECT id, name, education_level, stream_or_degree FROM students ORDER BY id');
  res.json({ students: rows });
});

/**
 * PATCH /api/students/:id — Updates profile fields (Edit Profile modal).
 * Body: { education_level?: string, interests?: string, skills?: string[] }
 */
apiRouter.patch('/students/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid student ID — must be a positive integer.' });
  }

  const rows = dbAll('SELECT * FROM students WHERE id = ?', [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const { education_level, interests, skills } = req.body;

  if (education_level !== undefined && education_level !== 'Intermediate' && education_level !== 'Graduate') {
    return res.status(400).json({ error: 'education_level must be "Intermediate" or "Graduate".' });
  }
  if (interests !== undefined && typeof interests !== 'string') {
    return res.status(400).json({ error: 'interests must be a string.' });
  }
  let skillsJson;
  if (skills !== undefined) {
    if (!Array.isArray(skills) || !skills.every(s => typeof s === 'string')) {
      return res.status(400).json({ error: 'skills must be an array of strings.' });
    }
    skillsJson = JSON.stringify(skills);
  }

  try {
    dbRun(
      `UPDATE students SET
         education_level = COALESCE(?, education_level),
         interests       = COALESCE(?, interests),
         skills          = COALESCE(?, skills)
       WHERE id = ?`,
      [education_level ?? null, interests ?? null, skillsJson ?? null, id]
    );
    const updated = dbAll('SELECT * FROM students WHERE id = ?', [id])[0];
    res.json({ ...updated, skills: safeJsonParse(updated.skills, '[]') });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/students/:id — Returns student profile data.
 */
apiRouter.get('/students/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid student ID — must be a positive integer.' });
  }

  const rows = dbAll('SELECT * FROM students WHERE id = ?', [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = rows[0];
  const skills = safeJsonParse(student.skills, '[]');

  // Fetch progress stats
  const counts = dbAll(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM progress_logs WHERE student_id = ?`,
    [id]
  );

  // Fetch progress logs
  const logs = dbAll(
    'SELECT task_id, status, completed_at FROM progress_logs WHERE student_id = ? ORDER BY task_id',
    [id]
  );

  res.json({
    ...student,
    skills,
    progress: {
      total_tasks: counts[0].total,
      completed_tasks: counts[0].completed,
    },
    progress_logs: logs,
  });
});

/**
 * GET /api/students/:id/roadmap — Returns the full stored roadmap and multi-agent analysis.
 */
apiRouter.get('/students/:id/roadmap', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid student ID — must be a positive integer.' });
  }

  const rows = dbAll('SELECT * FROM students WHERE id = ?', [id]);
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = rows[0];
  try {
    const analysis = buildOrRefreshStudentRoadmap(id, student.target_role || student.interests);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Roadmap fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch roadmap: ' + err.message });
  }
});

/**
 * POST /api/coach/analyze — Runs full multi-agent pipeline.
 * Body: { studentId: number, query: string }
 */
apiRouter.post('/coach/analyze', (req, res) => {
  const { studentId, query } = req.body;

  if (studentId === undefined || studentId === null) {
    return res.status(400).json({ error: 'studentId is required.' });
  }
  const sid = Number(studentId);
  if (!Number.isFinite(sid) || sid < 1) {
    return res.status(400).json({ error: 'studentId must be a positive integer.' });
  }
  if (query !== undefined && typeof query !== 'string') {
    return res.status(400).json({ error: 'query must be a string.' });
  }

  try {
    const result = runPipeline(db, sid, (typeof query === 'string' ? query : '').trim());
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Pipeline error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/progress/toggle — Toggles a task and recalculates readiness.
 * Body: { studentId: number, taskId: string, status: 'pending'|'completed' }
 */
apiRouter.post('/progress/toggle', (req, res) => {
  const { studentId, taskId, status } = req.body;

  if (studentId === undefined || studentId === null || !taskId || !status) {
    return res.status(400).json({ error: 'studentId, taskId, and status are required.' });
  }
  const sid = Number(studentId);
  if (!Number.isFinite(sid) || sid < 1) {
    return res.status(400).json({ error: 'studentId must be a positive integer.' });
  }
  if (typeof taskId !== 'string') {
    return res.status(400).json({ error: 'taskId must be a string.' });
  }
  if (status !== 'pending' && status !== 'completed') {
    return res.status(400).json({ error: 'status must be "pending" or "completed".' });
  }

  try {
    const result = toggleTaskStatus(db, sid, taskId, status);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('Toggle error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});