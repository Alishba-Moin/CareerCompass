/**
 * Career Coach Orchestrator — End-to-End Test Runner
 *
 * Runs the full multi-agent pipeline with student ID 1 (Ali Khan)
 * and query "AI/ML Engineer". Verifies all agent outputs against
 * seed data.
 *
 * Prerequisites: npm run seed
 * Usage:         node agents/careerCoachOrchestrator.test.js
 */
import { initDatabase, dbRun, dbAll } from '../database/db.js';
import { runPipeline } from './careerCoachOrchestrator.js';

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

async function runTests() {
  await initDatabase();

  // ════════════════════════════════════════════════════════════════
  //  Test 1: Ali Khan — query "AI/ML Engineer"
  // ════════════════════════════════════════════════════════════════

  console.log('\n═══ Orchestrator: Ali Khan + "AI/ML Engineer" ═══\n');

  const r = runPipeline(db, 1, 'AI/ML Engineer');

  // ── Top-level structure ─────────────────────────────────────
  console.log('Top-level response structure');
  console.log('────────────────────────────────────');

  assert(r.success === true, 'Pipeline succeeded');
  assertEqual(r.targetRole, 'AI/ML Engineer', 'Target role resolved');
  assert(typeof r.recommendation === 'string' && r.recommendation.length > 100, 'Recommendation is non-trivial');

  // ── Student profile ─────────────────────────────────────────
  console.log('\nStudent profile');
  console.log('────────────────────────────────────');

  assertEqual(r.student.id, 1, 'Student ID');
  assertEqual(r.student.name, 'Ali Khan', 'Student name');
  assertEqual(r.student.education_level, 'Graduate', 'Education level');
  assert(r.student.stream_or_degree.includes('FAST NUCES'), 'Stream includes FAST NUCES');

  // ── Skill Analysis (Agent 1) ────────────────────────────────
  console.log('\nSkill Analysis (SkillAssessmentAgent)');
  console.log('────────────────────────────────────');

  const sk = r.skillAnalysis;
  assert(Array.isArray(sk.strengths), 'Strengths is array');
  assert(sk.strengths.includes('Python'), 'Python is a strength');
  assertEqual(sk.gaps.length, 3, '3 skill gaps');
  assert(sk.gaps.includes('Pandas'), 'Pandas is a gap');
  assert(sk.gaps.includes('Scikit-Learn'), 'Scikit-Learn is a gap');
  assert(sk.gaps.includes('PyTorch'), 'PyTorch is a gap');
  assertEqual(sk.matchPercentage, 25, 'Match percentage is 25%');

  // ── Market Analysis (Agent 2) ───────────────────────────────
  console.log('\nMarket Analysis (MarketIntelligenceAgent)');
  console.log('────────────────────────────────────');

  const mk = r.marketAnalysis;
  assertEqual(mk.role_title, 'AI/ML Engineer', 'Role title');
  assertEqual(mk.local_demand, 78, 'Local demand');
  assertEqual(mk.remote_demand, 92, 'Remote demand');
  assertEqual(mk.growth_trend, 'High Growth', 'Growth trend');
  assert(mk.marketSummary.includes('92%'), 'Summary mentions remote demand');
  assert(mk.marketSummary.includes('Toptal') || mk.marketSummary.includes('Turing'), 'Summary mentions remote platforms');

  // ── Career Path (Agent 3) — via portfolio project ───────────
  console.log('\nCareer Path + Roadmap (CareerPathAgent → RoadmapGeneratorAgent)');
  console.log('────────────────────────────────────');

  // Portfolio project comes from the path → roadmap pipeline
  const pp = r.portfolioProject;
  assertEqual(pp.title, 'Spam Email Classifier using Scikit-Learn', 'Portfolio project title');
  assert(pp.description.length > 50, 'Portfolio description is detailed');
  assert(pp.tech_stack.includes('Scikit-Learn'), 'Tech stack includes Scikit-Learn');
  assert(pp.tech_stack.includes('Python'), 'Tech stack includes Python');
  assertEqual(pp.impact, 'High', 'Impact rating');

  // ── Weekly Tasks (Agent 4 — Roadmap Generator) ─────────────
  console.log('\nWeekly Tasks (RoadmapGeneratorAgent)');
  console.log('────────────────────────────────────');

  assertEqual(r.weeklyTasks.length, 4, '4 weeks');
  assertEqual(r.weeklyTasks[0].tasks.length, 4, 'Week 1: 4 tasks (3 gap + 1 generic)');
  assertEqual(r.weeklyTasks[1].tasks.length, 4, 'Week 2: 4 tasks');
  assertEqual(r.weeklyTasks[2].tasks.length, 4, 'Week 3: 4 tasks');
  assertEqual(r.weeklyTasks[3].tasks.length, 4, 'Week 4: 4 tasks');

  const totalTasks = r.weeklyTasks.reduce((sum, w) => sum + w.tasks.length, 0);
  assertEqual(totalTasks, 16, '16 total tasks');

  // Week 1 tasks target the gap skills
  assert(r.weeklyTasks[0].tasks[0].text.includes('Pandas'), 'Week 1 task 1 → Pandas');
  assert(r.weeklyTasks[0].tasks[1].text.includes('Scikit-Learn'), 'Week 1 task 2 → Scikit-Learn');
  assert(r.weeklyTasks[0].tasks[2].text.includes('PyTorch'), 'Week 1 task 3 → PyTorch');

  // Week 4 includes job readiness tasks
  assert(r.weeklyTasks[3].tasks.some(t => t.text.includes('LinkedIn')), 'Week 4 → LinkedIn optimization');
  assert(r.weeklyTasks[3].tasks.some(t => t.text.includes('GitHub')), 'Week 4 → GitHub optimization');

  // ── Readiness Score (Agent 5 — Progress Tracker) ───────────
  console.log('\nReadiness Score (ProgressTrackerAgent)');
  console.log('────────────────────────────────────');

  // 25*0.50 + 92*0.30 + (2/16)*20 = 12.5 + 27.6 + 2.5 = 42.6 → 43
  assertEqual(r.readinessScore, 43, 'Readiness score = 43');

  // ── Agent Log ──────────────────────────────────────────────
  console.log('\nAgent Execution Log');
  console.log('────────────────────────────────────');

  assertEqual(r.agentLog.length, 7, '7 log entries (profile + resolver + 5 agents)');

  const agentNames = r.agentLog.map(e => e.agent);
  assert(agentNames.includes('StudentProfile'), 'Log includes StudentProfile');
  assert(agentNames.includes('TargetResolver'), 'Log includes TargetResolver');
  assert(agentNames.includes('SkillAssessmentAgent'), 'Log includes SkillAssessmentAgent');
  assert(agentNames.includes('MarketIntelligenceAgent'), 'Log includes MarketIntelligenceAgent');
  assert(agentNames.includes('CareerPathAgent'), 'Log includes CareerPathAgent');
  assert(agentNames.includes('RoadmapGeneratorAgent'), 'Log includes RoadmapGeneratorAgent');
  assert(agentNames.includes('ProgressTrackerAgent'), 'Log includes ProgressTrackerAgent');

  // All entries have timestamps
  assert(r.agentLog.every(e => e.startedAt && e.completedAt), 'All entries have start/completed timestamps');
  assert(r.agentLog.every(e => e.status), 'All entries have status');

  // ── Bilingual Recommendation ────────────────────────────────
  console.log('\nBilingual Recommendation');
  console.log('────────────────────────────────────');

  assert(r.recommendation.includes('Ali Khan'), 'Recommendation includes student name');
  assert(r.recommendation.includes('AI/ML Engineer'), 'Recommendation mentions target role');
  // Roman Urdu markers
  assert(r.recommendation.includes('bohat') || r.recommendation.includes('zabardast') || r.recommendation.includes('seekhna'), 'Recommendation contains Roman Urdu');
  // English technical content
  assert(r.recommendation.includes('Spam Email Classifier'), 'Recommendation mentions portfolio project');
  assert(r.recommendation.includes('92%') || r.recommendation.includes('remote'), 'Recommendation mentions market data');

  console.log(`\n  Recommendation:\n  "${r.recommendation}"\n`);

  // ── JSON serialization check ────────────────────────────────
  console.log('JSON Serialization');
  console.log('────────────────────────────────────');

  let valid = false;
  try {
    const json = JSON.stringify(r);
    const parsed = JSON.parse(json);
    valid = parsed.success === true && parsed.readinessScore === 43;
  } catch { valid = false; }
  assert(valid, 'Full response survives JSON roundtrip');

  // ════════════════════════════════════════════════════════════════
  //  Test 2: Ali Khan — query "Web Dev" (different path)
  // ════════════════════════════════════════════════════════════════

  console.log('\n═══ Orchestrator: Ali Khan + "Web Dev" ═══\n');

  const r2 = runPipeline(db, 1, 'Web Dev');

  assert(r2.success === true, 'Pipeline succeeded');
  assertEqual(r2.targetRole, 'Full Stack Web Developer', 'Target: Full Stack Web Developer');
  assertEqual(r2.skillAnalysis.matchPercentage, 0, '0% skill match (no JS/React/Node/SQL)');
  assertEqual(r2.skillAnalysis.gaps.length, 4, '4 skill gaps');
  assertEqual(r2.marketAnalysis.local_demand, 85, 'Local demand 85%');
  assertEqual(r2.marketAnalysis.remote_demand, 88, 'Remote demand 88%');
  assertEqual(r2.portfolioProject.title, 'TaskFlow — Real-time Task Manager', 'FS portfolio project');

  // ════════════════════════════════════════════════════════════════
  //  Test 3: Invalid student ID
  // ════════════════════════════════════════════════════════════════

  console.log('\n═══ Orchestrator: Invalid student ID ═══\n');

  const r3 = runPipeline(db, 999, 'AI/ML');

  assert(r3.success === false, 'Pipeline returns failure');
  assert(r3.error.includes('not found'), 'Error mentions student not found');
  assert(Array.isArray(r3.agentLog), 'Agent log still present');

  // ════════════════════════════════════════════════════════════════
  //  Test 4: Empty query — falls back to interests
  // ════════════════════════════════════════════════════════════════

  console.log('\n═══ Orchestrator: Ali Khan + empty query (interest fallback) ═══\n');

  const r4 = runPipeline(db, 1, '');

  assert(r4.success === true, 'Pipeline succeeded with empty query');
  assert(r4.targetRole !== null, 'Target resolved from interests');
  // Ali's interests: "AI, Machine Learning, Web Dev" — should match a domain
  assert(typeof r4.skillAnalysis.matchPercentage === 'number', 'Skill match is numeric');

  // ── Summary ─────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log('══════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
