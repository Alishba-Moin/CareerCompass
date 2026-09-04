/**
 * Progress Tracker Agent — Test Runner
 *
 * Tests calculateReadinessScore() (pure) and toggleTaskStatus() (DB integration).
 *
 * Prerequisites: npm run seed
 * Usage:         node agents/progressTrackerAgent.test.js
 */
import { initDatabase, dbRun, dbAll } from '../database/db.js';
import { calculateReadinessScore, toggleTaskStatus } from './progressTrackerAgent.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}  →  ${actual} (expected ${expected})`);
}

const db = { dbRun, dbAll };

// ════════════════════════════════════════════════════════════════
//  calculateReadinessScore — Pure Function Tests
// ════════════════════════════════════════════════════════════════

console.log('\n═══ calculateReadinessScore (pure) ═══\n');

// Test 1: Ali Khan's initial state (2/16 tasks, 25% match, 92% demand)
console.log('Test 1: Ali Khan initial — (25, 92, 0.125)');
console.log('────────────────────────────────────');
const s1 = calculateReadinessScore(25, 92, 2 / 16);
// 25*0.50 + 92*0.30 + 0.125*20 = 12.5 + 27.6 + 2.5 = 42.6 → 43
assertEqual(s1, 43, 'Score rounds to 43');

// Test 2: All zeros
console.log('\nTest 2: All zeros');
console.log('────────────────────────────────────');
assertEqual(calculateReadinessScore(0, 0, 0), 0, 'Score is 0');

// Test 3: All maxed (100, 100, 1.0)
console.log('\nTest 3: All maxed (100, 100, 1.0)');
console.log('────────────────────────────────────');
// 100*0.50 + 100*0.30 + 1.0*20 = 50 + 30 + 20 = 100
assertEqual(calculateReadinessScore(100, 100, 1.0), 100, 'Score is 100');

// Test 4: Cap at 100 even with overflow inputs
console.log('\nTest 4: Inputs exceeding range — clamped');
console.log('────────────────────────────────────');
// 150 clamped to 100 → 100*0.50 + 100*0.30 + 1.0*20 = 100
assertEqual(calculateReadinessScore(150, 200, 5), 100, 'Score capped at 100');

// Test 5: Negative inputs — clamped to 0
console.log('\nTest 5: Negative inputs — clamped');
console.log('────────────────────────────────────');
assertEqual(calculateReadinessScore(-10, -5, -0.5), 0, 'Score clamped to 0');

// Test 6: Sara Ahmed initial (0% match, 84% demand, 0 tasks)
console.log('\nTest 6: Sara Ahmed — (0, 84, 0)');
console.log('────────────────────────────────────');
// 0*0.50 + 84*0.30 + 0*20 = 25.2 → 25
assertEqual(calculateReadinessScore(0, 84, 0), 25, 'Score rounds to 25');

// Test 7: Deterministic — same inputs, same output
console.log('\nTest 7: Deterministic — repeated calls');
console.log('────────────────────────────────────');
const a = calculateReadinessScore(25, 92, 0.125);
const b = calculateReadinessScore(25, 92, 0.125);
assertEqual(a, b, 'Two identical calls return same value');

// Test 8: TypeError for non-numeric input
console.log('\nTest 8: TypeError for bad inputs');
console.log('────────────────────────────────────');
try { calculateReadinessScore('25', 92, 0.5); assert(false, 'Should throw'); }
catch (e) { assert(e instanceof TypeError, 'Throws TypeError for string input'); }

// ════════════════════════════════════════════════════════════════
//  toggleTaskStatus — DB Integration Tests
// ════════════════════════════════════════════════════════════════

console.log('\n\n═══ toggleTaskStatus (DB integration) ═══\n');

async function runDbTests() {
  await initDatabase();

  // ── Verify initial state ────────────────────────────────────
  const initialStudent = dbAll('SELECT readiness_score FROM students WHERE id = 1')[0];
  console.log('Initial state check:');
  console.log('────────────────────────────────────');
  assertEqual(initialStudent.readiness_score, 43, 'Ali Khan initial readiness = 43');

  // ── Test 9: Toggle w1t3 (pending → completed) ───────────────
  console.log('\nTest 9: Toggle w1t3 → completed');
  console.log('────────────────────────────────────');

  const r1 = toggleTaskStatus(db, 1, 'w1t3', 'completed');
  assert(r1.success === true, 'Toggle succeeded');
  assertEqual(r1.task_id, 'w1t3', 'Task ID correct');
  assertEqual(r1.status, 'completed', 'Status is completed');
  assertEqual(r1.completed_tasks, 3, '3 tasks completed');
  assertEqual(r1.total_tasks, 16, '16 total tasks');
  // 3/16 = 0.1875 → score = 12.5 + 27.6 + 3.75 = 43.85 → 44
  assertEqual(r1.readiness_score, 44, 'Score recalculated to 44');

  // Verify persisted in DB
  const afterR1 = dbAll('SELECT readiness_score FROM students WHERE id = 1')[0];
  assertEqual(afterR1.readiness_score, 44, 'Score persisted to DB');

  // ── Test 10: Toggle w1t4 (pending → completed) ──────────────
  console.log('\nTest 10: Toggle w1t4 → completed');
  console.log('────────────────────────────────────');

  const r2 = toggleTaskStatus(db, 1, 'w1t4', 'completed');
  assert(r2.success === true, 'Toggle succeeded');
  assertEqual(r2.completed_tasks, 4, '4 tasks completed');
  // 4/16 = 0.25 → score = 12.5 + 27.6 + 5 = 45.1 → 45
  assertEqual(r2.readiness_score, 45, 'Score recalculated to 45');

  // ── Test 11: Toggle w2t1 (pending → completed) ──────────────
  console.log('\nTest 11: Toggle w2t1 → completed');
  console.log('────────────────────────────────────');

  const r3 = toggleTaskStatus(db, 1, 'w2t1', 'completed');
  assert(r3.success === true, 'Toggle succeeded');
  assertEqual(r3.completed_tasks, 5, '5 tasks completed');
  // 5/16 = 0.3125 → score = 12.5 + 27.6 + 6.25 = 46.35 → 46
  assertEqual(r3.readiness_score, 46, 'Score recalculated to 46');

  // ── Test 12: Revert w1t3 (completed → pending) ──────────────
  console.log('\nTest 12: Revert w1t3 → pending (score decreases)');
  console.log('────────────────────────────────────');

  const r4 = toggleTaskStatus(db, 1, 'w1t3', 'pending');
  assert(r4.success === true, 'Revert succeeded');
  assertEqual(r4.status, 'pending', 'Status is pending');
  assertEqual(r4.completed_tasks, 4, 'Back to 4 completed');
  assertEqual(r4.readiness_score, 45, 'Score reverted to 45');

  // ── Test 13: Idempotent toggle (same status twice) ──────────
  console.log('\nTest 13: Idempotent — toggle completed task to completed again');
  console.log('────────────────────────────────────');

  const r5 = toggleTaskStatus(db, 1, 'w1t4', 'completed');
  assert(r5.success === true, 'Toggle succeeded');
  assertEqual(r5.completed_tasks, 4, 'Still 4 completed (no double-count)');
  assertEqual(r5.readiness_score, 45, 'Score unchanged');

  // ── Test 14: Invalid student ────────────────────────────────
  console.log('\nTest 14: Invalid student ID');
  console.log('────────────────────────────────────');

  const r6 = toggleTaskStatus(db, 999, 'w1t1', 'completed');
  assert(r6.success === false, 'Returns failure');
  assert(r6.error.includes('not found'), 'Error mentions student not found');

  // ── Test 15: Invalid task ID ────────────────────────────────
  console.log('\nTest 15: Invalid task ID');
  console.log('────────────────────────────────────');

  const r7 = toggleTaskStatus(db, 1, 'nonexistent', 'completed');
  assert(r7.success === false, 'Returns failure');
  assert(r7.error.includes('not found'), 'Error mentions task not found');

  // ── Test 16: Invalid status ─────────────────────────────────
  console.log('\nTest 16: Invalid status value');
  console.log('────────────────────────────────────');

  const r8 = toggleTaskStatus(db, 1, 'w2t2', 'in_progress');
  assert(r8.success === false, 'Returns failure');
  assert(r8.error.includes('pending'), 'Error mentions valid statuses');

  // ── Test 17: Null/empty task ID ─────────────────────────────
  console.log('\nTest 17: Null / empty task ID');
  console.log('────────────────────────────────────');

  const r9a = toggleTaskStatus(db, 1, null, 'completed');
  assert(r9a.success === false, 'Null taskId returns failure');

  const r9b = toggleTaskStatus(db, 1, '', 'completed');
  assert(r9b.success === false, 'Empty taskId returns failure');

  // ── Test 18: Verify DB state matches last toggle ────────────
  console.log('\nTest 18: Final DB state verification');
  console.log('────────────────────────────────────');

  const finalStudent = dbAll('SELECT readiness_score, skill_match_pct, remote_demand_pct FROM students WHERE id = 1')[0];
  assertEqual(finalStudent.readiness_score, 45, 'Final readiness = 45');
  assertEqual(finalStudent.skill_match_pct, 25, 'Skill match unchanged');
  assertEqual(finalStudent.remote_demand_pct, 92, 'Remote demand unchanged');

  const finalCounts = dbAll(
    `SELECT COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM progress_logs WHERE student_id = 1`
  )[0];
  assertEqual(finalCounts.completed, 4, '4 tasks completed in DB');
  assertEqual(finalCounts.total, 16, '16 total tasks in DB');

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log('══════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runDbTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
