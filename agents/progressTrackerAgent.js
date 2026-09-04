/**
 * Progress Tracker Agent
 *
 * Tracks task completion progress and recomputes the career
 * readiness score using a deterministic weighted formula.
 *
 * Formula:
 *   Readiness = min(100, round(
 *     skillMatchPct  * 0.50   — skill alignment     (max 50 pts)
 *   + remoteDemandPct * 0.30   — market demand       (max 30 pts)
 *   + completedTasksRatio * 20 — plan progress       (max 20 pts)
 *   ))
 *
 * Where:
 *   skillMatchPct    : 0–100  (percentage of target skills matched)
 *   remoteDemandPct  : 0–100  (remote market demand percentage)
 *   completedTasksRatio : 0–1  (completed / total tasks)
 *
 * Part of the CareerCompass multi-agent pipeline.
 */

/**
 * Calculates a deterministic career readiness score.
 *
 * @param {number} skillMatchPct       — 0–100
 * @param {number} remoteDemandPct     — 0–100
 * @param {number} completedTasksRatio — 0–1   (completed ÷ total)
 * @returns {number} 0–100 integer
 */
export function calculateReadinessScore(skillMatchPct, remoteDemandPct, completedTasksRatio) {
  if (typeof skillMatchPct !== 'number' || typeof remoteDemandPct !== 'number' || typeof completedTasksRatio !== 'number') {
    throw new TypeError('All inputs must be numbers.');
  }

  // Clamp inputs to valid ranges
  const skill = Math.max(0, Math.min(100, skillMatchPct));
  const demand = Math.max(0, Math.min(100, remoteDemandPct));
  const ratio = Math.max(0, Math.min(1, completedTasksRatio));

  return Math.min(100, Math.round(
    (skill * 0.50) + (demand * 0.30) + (ratio * 20)
  ));
}

/**
 * Toggles a task's status in progress_logs, then recomputes
 * and persists the student's readiness score.
 *
 * @param {{ dbRun: Function, dbAll: Function }} db — Database helpers.
 * @param {number} studentId — Student primary key.
 * @param {string} taskId    — Task identifier (e.g. 'w1t3').
 * @param {'pending'|'completed'} status — New status.
 * @returns {{
 *   success: boolean,
 *   student_id: number,
 *   task_id: string,
 *   status: string,
 *   readiness_score: number,
 *   completed_tasks: number,
 *   total_tasks: number,
 *   completed_tasks_ratio: number,
 * } | { success: false, error: string }}
 */
export function toggleTaskStatus(db, studentId, taskId, status) {
  // ── Validate inputs ───────────────────────────────────────
  if (!taskId || typeof taskId !== 'string') {
    return { success: false, error: 'taskId must be a non-empty string.' };
  }

  if (status !== 'pending' && status !== 'completed') {
    return { success: false, error: 'status must be "pending" or "completed".' };
  }

  // ── Verify student exists ─────────────────────────────────
  const students = db.dbAll('SELECT * FROM students WHERE id = ?', [studentId]);
  if (students.length === 0) {
    return { success: false, error: `Student with id ${studentId} not found.` };
  }
  const student = students[0];

  // ── Verify task exists ────────────────────────────────────
  const tasks = db.dbAll(
    'SELECT * FROM progress_logs WHERE student_id = ? AND task_id = ?',
    [studentId, taskId]
  );
  if (tasks.length === 0) {
    return { success: false, error: `Task "${taskId}" not found for student ${studentId}.` };
  }

  // ── Update task status ────────────────────────────────────
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  db.dbRun(
    'UPDATE progress_logs SET status = ?, completed_at = ? WHERE student_id = ? AND task_id = ?',
    [status, completedAt, studentId, taskId]
  );

  // ── Recompute task completion ratio ───────────────────────
  const counts = db.dbAll(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM progress_logs WHERE student_id = ?`,
    [studentId]
  );

  const totalTasks = counts[0].total;
  const completedTasks = counts[0].completed;
  const completedTasksRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // ── Recalculate readiness score ───────────────────────────
  const readinessScore = calculateReadinessScore(
    student.skill_match_pct || 0,
    student.remote_demand_pct || 0,
    completedTasksRatio
  );

  // ── Persist updated score ─────────────────────────────────
  db.dbRun(
    'UPDATE students SET readiness_score = ? WHERE id = ?',
    [readinessScore, studentId]
  );

  return {
    success: true,
    student_id: studentId,
    task_id: taskId,
    status,
    readiness_score: readinessScore,
    completed_tasks: completedTasks,
    total_tasks: totalTasks,
    completed_tasks_ratio: Math.round(completedTasksRatio * 1000) / 1000,
  };
}
