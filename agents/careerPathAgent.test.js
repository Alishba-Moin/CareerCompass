/**
 * Career Path + Roadmap Generator — Combined Test Runner
 *
 * Tests selectOptimalPath() and generateRoadmap() using:
 *   - Ali Khan (Graduate, AI/ML + Web Dev interests)
 *   - Sara Ahmed (Intermediate, Software Engineering + Data Science)
 *   - Edge cases
 *
 * Usage:  node agents/careerPathAgent.test.js
 */
import { selectOptimalPath } from './careerPathAgent.js';
import { generateRoadmap } from './roadmapGeneratorAgent.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.error(`  ✗ ${label}`); }
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}  →  ${actual} (expected ${expected})`);
}

function isValidJson(obj) {
  try { JSON.parse(JSON.stringify(obj)); return true; } catch { return false; }
}

// ── Ali Khan's profile ────────────────────────────────────────
const ali = {
  name: 'Ali Khan',
  education_level: 'Graduate',
  stream_or_degree: 'BS Computer Science — FAST NUCES',
  interests: 'AI, Machine Learning, Web Dev',
  skills: ['Python', 'Basic Math', 'HTML/CSS'],
};

// ── Sara Ahmed's profile ──────────────────────────────────────
const sara = {
  name: 'Sara Ahmed',
  education_level: 'Intermediate',
  stream_or_degree: 'Pre-Engineering',
  interests: 'Software Engineering, Data Science',
  skills: ['Mathematics', 'Physics'],
};

// ════════════════════════════════════════════════════════════════
//  CAREER PATH AGENT TESTS
// ════════════════════════════════════════════════════════════════

// ── Test 1: Ali Khan — no target preference ───────────────────
console.log('\n═══ Career Path Agent ═══\n');
console.log('Test 1: Ali Khan — no target preference');
console.log('────────────────────────────────────');

const cp1 = selectOptimalPath(ali);

assertEqual(cp1.recommended_path, 'AI/ML Engineer', 'Recommended path');
assertEqual(cp1.domain, 'Data & AI', 'Domain');
assert(cp1.overview.length > 30, 'Overview is non-trivial');
assert(cp1.milestones.length === 5, 'Has 5 milestones');
assert(cp1.score > 0, `Score is positive (${cp1.score})`);
assert(cp1.alternatives.length >= 2, 'Has alternatives');
assert(isValidJson(cp1), 'Output is valid JSON');

// ── Test 2: Ali Khan — explicit "Web Dev" preference ──────────
console.log('\nTest 2: Ali Khan — target "Web Dev"');
console.log('────────────────────────────────────');

const cp2 = selectOptimalPath(ali, 'Web Dev');

assertEqual(cp2.recommended_path, 'Full Stack Web Developer', 'Recommended path with Web Dev target');
assertEqual(cp2.domain, 'Web', 'Domain');
assert(cp2.score > cp1.score || cp2.recommended_path === 'Full Stack Web Developer', 'Preference overrides interest scoring');

// ── Test 3: Ali Khan — explicit "AI/ML" preference ────────────
console.log('\nTest 3: Ali Khan — target "AI/ML"');
console.log('────────────────────────────────────');

const cp3 = selectOptimalPath(ali, 'AI/ML');

assertEqual(cp3.recommended_path, 'AI/ML Engineer', 'Recommended path with AI/ML target');
assert(cp3.score >= cp1.score, 'Explicit target boosts score');

// ── Test 4: Sara Ahmed — Intermediate student ─────────────────
console.log('\nTest 4: Sara Ahmed — Intermediate');
console.log('────────────────────────────────────');

const cp4 = selectOptimalPath(sara);

assert(cp4.recommended_path === 'Computer Science Foundation' || cp4.recommended_path === 'Data Analytics Entry',
  `Intermediate student gets appropriate path (${cp4.recommended_path})`);
assertEqual(cp4.score > 0 ? 'pass' : 'fail', 'pass', 'Score is positive');
assert(isValidJson(cp4), 'Output is valid JSON');

// ── Test 5: Sara Ahmed — target "Data Science" ────────────────
console.log('\nTest 5: Sara Ahmed — target "Data Science"');
console.log('────────────────────────────────────');

const cp5 = selectOptimalPath(sara, 'Data Science');

assertEqual(cp5.recommended_path, 'Data Analytics Entry', 'Data Science target → Data Analytics Entry');

// ════════════════════════════════════════════════════════════════
//  ROADMAP GENERATOR AGENT TESTS
// ════════════════════════════════════════════════════════════════

console.log('\n\n═══ Roadmap Generator Agent ═══\n');

// Skill gaps from Skill Assessment Agent for Ali vs AI/ML Engineer
const aiMlGaps = ['Pandas', 'Scikit-Learn', 'PyTorch'];

// ── Test 6: Ali Khan — AI/ML path roadmap ─────────────────────
console.log('Test 6: Ali Khan — AI/ML roadmap');
console.log('────────────────────────────────────');

const rm1 = generateRoadmap(ali, cp1, aiMlGaps);

assertEqual(rm1.student_name, 'Ali Khan', 'Student name');
assertEqual(rm1.path, 'AI/ML Engineer', 'Path');
assertEqual(rm1.weeks.length, 4, 'Has 4 weeks');
assertEqual(rm1.total_tasks, 16, 'Total tasks (4 + 4 + 4 + 4)');
assert(isValidJson(rm1), 'Output is valid JSON');

// Week 1 checks
const w1 = rm1.weeks[0];
assertEqual(w1.week, 1, 'Week 1 number');
assert(w1.theme.includes('Foundation'), 'Week 1 theme contains Foundation');
assertEqual(w1.tasks.length, 4, 'Week 1 has 4 tasks (3 gap + 1 generic)');
assert(w1.tasks[0].text.includes('Pandas'), 'Week 1 task 1 targets Pandas');
assert(w1.tasks[0].resource !== null, 'Week 1 tasks include learning resources');
assert(w1.tasks[0].resource.platform === 'Kaggle', 'Pandas resource is Kaggle');

// Week 2 checks
const w2 = rm1.weeks[1];
assertEqual(w2.week, 2, 'Week 2 number');
assert(w2.theme.includes('Practice'), 'Week 2 theme');
assertEqual(w2.tasks.length, 4, 'Week 2 has 4 tasks');
assert(w2.tasks.some(t => t.resource && t.resource.platform === 'Kaggle'), 'Week 2 references free platform');

// Week 3 checks
const w3 = rm1.weeks[2];
assertEqual(w3.week, 3, 'Week 3 number');
assert(w3.theme.includes('Build'), 'Week 3 theme');
assert(w3.tasks.some(t => t.text.includes('portfolio')), 'Week 3 mentions portfolio project');

// Week 4 checks
const w4 = rm1.weeks[3];
assertEqual(w4.week, 4, 'Week 4 number');
assert(w4.theme.includes('Launch'), 'Week 4 theme');
assert(w4.tasks.some(t => t.text.includes('LinkedIn')), 'Week 4 includes LinkedIn optimization');
assert(w4.tasks.some(t => t.text.includes('GitHub')), 'Week 4 includes GitHub optimization');

// ── Test 7: Portfolio project for AI/ML ───────────────────────
console.log('\nTest 7: Portfolio project — AI/ML');
console.log('────────────────────────────────────');

const pp = rm1.portfolio_project;

assertEqual(pp.title, 'Spam Email Classifier using Scikit-Learn', 'Portfolio project title');
assert(pp.description.length > 50, 'Description is detailed');
assert(pp.tech_stack.includes('Scikit-Learn'), 'Tech stack includes Scikit-Learn');
assert(pp.tech_stack.includes('Python'), 'Tech stack includes Python');
assertEqual(pp.impact, 'High', 'Impact rating');
assertEqual(pp.estimated_duration, '1.5 weeks', 'Estimated duration');

// ── Test 8: Full Stack path roadmap ───────────────────────────
console.log('\nTest 8: Ali Khan — Full Stack roadmap');
console.log('────────────────────────────────────');

const fsGaps = ['JavaScript', 'React', 'Node.js', 'SQL'];
const rm2 = generateRoadmap(ali, cp2, fsGaps);

assertEqual(rm2.path, 'Full Stack Web Developer', 'Path');
assertEqual(rm2.portfolio_project.title, 'TaskFlow — Real-time Task Manager', 'FS portfolio project');
assertEqual(rm2.weeks.length, 4, 'Has 4 weeks');
assert(rm2.weeks[0].tasks.some(t => t.text.includes('JavaScript')), 'Week 1 targets JavaScript');
assert(rm2.weeks[0].tasks[0].resource.platform === 'YouTube', 'JS resource is YouTube');

// ── Test 9: Sara Ahmed — CS Foundation roadmap ────────────────
console.log('\nTest 9: Sara Ahmed — CS Foundation roadmap');
console.log('────────────────────────────────────');

const saraGaps = ['Python', 'C++', 'Problem Solving'];
const rm3 = generateRoadmap(sara, cp4, saraGaps);

assertEqual(rm3.student_name, 'Sara Ahmed', 'Student name');
assertEqual(rm3.weeks.length, 4, 'Has 4 weeks');
assert(rm3.portfolio_project.title.length > 5, 'Has a portfolio project');
assert(rm3.weeks[0].tasks[0].text.includes('Python'), 'Week 1 targets Python');

// ── Test 10: Empty gaps edge case ─────────────────────────────
console.log('\nTest 10: Edge case — no skill gaps');
console.log('────────────────────────────────────');

const rm4 = generateRoadmap(ali, cp1, []);

assertEqual(rm4.weeks[0].tasks.length, 1, 'Week 1 has 1 task (generic only, no gaps)');
assertEqual(rm4.weeks.length, 4, 'Still has 4 weeks structure');
assert(rm4.portfolio_project.title.length > 0, 'Still has portfolio project');

// ── Test 11: Full JSON serialization check ────────────────────
console.log('\nTest 11: JSON serialization roundtrip');
console.log('────────────────────────────────────');

const serialized = JSON.stringify(rm1);
const deserialized = JSON.parse(serialized);

assertEqual(deserialized.student_name, 'Ali Khan', 'Survives JSON roundtrip — name');
assertEqual(deserialized.weeks.length, 4, 'Survives JSON roundtrip — weeks');
assertEqual(deserialized.portfolio_project.title, 'Spam Email Classifier using Scikit-Learn', 'Survives JSON roundtrip — project');

// ── Print roadmap JSON for inspection ─────────────────────────
console.log('\n────────────────────────────────────');
console.log('Ali Khan — AI/ML Roadmap (JSON):');
console.log('────────────────────────────────────');
console.log(JSON.stringify(rm1, null, 2));

// ── Summary ───────────────────────────────────────────────────
console.log('\n══════════════════════════════════════');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);
console.log('══════════════════════════════════════\n');

if (failed > 0) process.exit(1);
