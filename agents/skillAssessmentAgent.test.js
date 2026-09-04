/**
 * Skill Assessment Agent — Test Runner
 *
 * Verifies evaluateSkills() deterministic output against:
 *   1. Ali Khan (Graduate) vs AI/ML Engineer
 *   2. Ali Khan (Graduate) vs Full Stack Web Developer
 *   3. Sara Ahmed (Intermediate) vs Data Analyst
 *   4. Edge cases (empty arrays, case-insensitive matching)
 *
 * Usage:  node agents/skillAssessmentAgent.test.js
 */
import { evaluateSkills } from './skillAssessmentAgent.js';

// ── Test helpers ──────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

function assertArrayEqual(actual, expected, label) {
  const ok = actual.length === expected.length && expected.every(v => actual.includes(v));
  assert(ok, `${label}  →  [${actual.join(', ')}]`);
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}  →  ${actual} (expected ${expected})`);
}

// ── Test 1: Ali Khan vs AI/ML Engineer ────────────────────────
console.log('\nTest 1: Ali Khan vs AI/ML Engineer');
console.log('────────────────────────────────────');

const aliSkills = ['Python', 'Basic Math', 'HTML/CSS'];
const aiMlRequired = ['Python', 'Pandas', 'Scikit-Learn', 'PyTorch'];

const result1 = evaluateSkills(aliSkills, aiMlRequired);

assertArrayEqual(result1.strengths, ['Python'], 'Strengths');
assertArrayEqual(result1.gaps, ['Pandas', 'Scikit-Learn', 'PyTorch'], 'Gaps');
assertEqual(result1.matchPercentage, 25, 'Match percentage');
assertEqual(result1.totalRequired, 4, 'Total required');
assertEqual(result1.totalStrengths, 1, 'Total strengths');
assertEqual(result1.totalGaps, 3, 'Total gaps');

// ── Test 2: Ali Khan vs Full Stack Web Developer ──────────────
console.log('\nTest 2: Ali Khan vs Full Stack Web Developer');
console.log('────────────────────────────────────');

const fullStackRequired = ['JavaScript', 'React', 'Node.js', 'SQL'];

const result2 = evaluateSkills(aliSkills, fullStackRequired);

assertArrayEqual(result2.strengths, [], 'Strengths');
assertArrayEqual(result2.gaps, ['JavaScript', 'React', 'Node.js', 'SQL'], 'Gaps');
assertEqual(result2.matchPercentage, 0, 'Match percentage');
assertEqual(result2.totalRequired, 4, 'Total required');
assertEqual(result2.totalStrengths, 0, 'Total strengths');
assertEqual(result2.totalGaps, 4, 'Total gaps');

// ── Test 3: Sara Ahmed vs Data Analyst ────────────────────────
console.log('\nTest 3: Sara Ahmed vs Data Analyst');
console.log('────────────────────────────────────');

const saraSkills = ['Mathematics', 'Physics'];
const dataAnalystRequired = ['Python', 'SQL', 'Excel', 'PowerBI'];

const result3 = evaluateSkills(saraSkills, dataAnalystRequired);

assertArrayEqual(result3.strengths, [], 'Strengths');
assertArrayEqual(result3.gaps, ['Python', 'SQL', 'Excel', 'PowerBI'], 'Gaps');
assertEqual(result3.matchPercentage, 0, 'Match percentage');

// ── Test 4: Case-insensitive matching ─────────────────────────
console.log('\nTest 4: Case-insensitive matching');
console.log('────────────────────────────────────');

const result4 = evaluateSkills(['python', 'BASIC MATH'], ['Python', 'Pandas', 'Scikit-Learn']);

assertArrayEqual(result4.strengths, ['Python'], 'Case-insensitive match');
assertArrayEqual(result4.gaps, ['Pandas', 'Scikit-Learn'], 'Remaining gaps');
assertEqual(result4.matchPercentage, 33, 'Match percentage (1/3)');

// ── Test 5: Edge — empty student skills ──────────────────────
console.log('\nTest 5: Edge case — empty student skills');
console.log('────────────────────────────────────');

const result5 = evaluateSkills([], ['Python', 'SQL']);

assertArrayEqual(result5.strengths, [], 'No strengths');
assertArrayEqual(result5.gaps, ['Python', 'SQL'], 'All gaps');
assertEqual(result5.matchPercentage, 0, 'Match percentage');

// ── Test 6: Edge — empty target skills ───────────────────────
console.log('\nTest 6: Edge case — empty target skills');
console.log('────────────────────────────────────');

const result6 = evaluateSkills(['Python', 'SQL'], []);

assertArrayEqual(result6.strengths, [], 'No strengths');
assertArrayEqual(result6.gaps, [], 'No gaps');
assertEqual(result6.matchPercentage, 0, 'Match percentage');
assertEqual(result6.totalRequired, 0, 'Total required');

// ── Test 7: Perfect match ────────────────────────────────────
console.log('\nTest 7: Perfect match (100%)');
console.log('────────────────────────────────────');

const result7 = evaluateSkills(
  ['Python', 'Pandas', 'Scikit-Learn', 'PyTorch'],
  ['Python', 'Pandas', 'Scikit-Learn', 'PyTorch']
);

assertArrayEqual(result7.strengths, ['Python', 'Pandas', 'Scikit-Learn', 'PyTorch'], 'All strengths');
assertArrayEqual(result7.gaps, [], 'No gaps');
assertEqual(result7.matchPercentage, 100, 'Match percentage');

// ── Test 8: Deterministic — same input, same output ──────────
console.log('\nTest 8: Deterministic (repeated calls)');
console.log('────────────────────────────────────');

const a = evaluateSkills(aliSkills, aiMlRequired);
const b = evaluateSkills(aliSkills, aiMlRequired);
const c = evaluateSkills(aliSkills, aiMlRequired);

assert(
  a.matchPercentage === b.matchPercentage && b.matchPercentage === c.matchPercentage,
  'Three identical calls produce identical matchPercentage'
);
assert(
  JSON.stringify(a.strengths) === JSON.stringify(b.strengths) &&
  JSON.stringify(b.strengths) === JSON.stringify(c.strengths),
  'Three identical calls produce identical strengths'
);

// ── Summary ──────────────────────────────────────────────────
console.log('\n══════════════════════════════════════');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);
console.log('══════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
