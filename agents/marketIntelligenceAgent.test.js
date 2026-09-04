/**
 * Market Intelligence Agent — Test Runner
 *
 * Tests analyzeMarket() against the seeded career_compass.db.
 *
 * Prerequisites: npm run seed   (must be run first)
 * Usage:         node agents/marketIntelligenceAgent.test.js
 */
import { initDatabase, dbAll } from '../database/db.js';
import { analyzeMarket } from './marketIntelligenceAgent.js';

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

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}  →  ${actual} (expected ${expected})`);
}

// The db object exposes the same interface the agent expects
const db = { dbAll };

// ── Bootstrap ─────────────────────────────────────────────────
async function runTests() {
  await initDatabase();

  // ── Test 1: Exact domain match — "Data & AI" ──────────────
  console.log('\nTest 1: Exact domain — "Data & AI"');
  console.log('────────────────────────────────────');

  const r1 = analyzeMarket(db, 'Data & AI');

  assertEqual(r1.role_title, 'AI/ML Engineer', 'Role title');
  assertEqual(r1.local_demand, 78, 'Local demand');
  assertEqual(r1.remote_demand, 92, 'Remote demand');
  assertEqual(r1.growth_trend, 'High Growth', 'Growth trend');
  assertEqual(r1.source, 'exact', 'Source is exact match');
  assert(typeof r1.marketSummary === 'string' && r1.marketSummary.length > 40, 'Market summary is non-trivial string');
  assert(r1.marketSummary.includes('78%'), 'Summary contains local demand %');
  assert(r1.marketSummary.includes('92%'), 'Summary contains remote demand %');
  assert(r1.marketSummary.includes('Toptal') || r1.marketSummary.includes('Turing'), 'Summary mentions remote platforms');

  console.log(`\n  Summary: "${r1.marketSummary}"\n`);

  // ── Test 2: Exact domain match — "Web" ─────────────────────
  console.log('Test 2: Exact domain — "Web"');
  console.log('────────────────────────────────────');

  const r2 = analyzeMarket(db, 'Web');

  assertEqual(r2.role_title, 'Full Stack Web Developer', 'Role title');
  assertEqual(r2.local_demand, 85, 'Local demand');
  assertEqual(r2.remote_demand, 88, 'Remote demand');
  assertEqual(r2.growth_trend, 'Stable High', 'Growth trend');
  assertEqual(r2.source, 'exact', 'Source is exact match');
  assert(r2.marketSummary.includes('85%'), 'Summary contains local demand %');
  assert(r2.marketSummary.includes('88%'), 'Summary contains remote demand %');

  console.log(`\n  Summary: "${r2.marketSummary}"\n`);

  // ── Test 3: Exact role title match ─────────────────────────
  console.log('Test 3: Exact role title — "Data Analyst"');
  console.log('────────────────────────────────────');

  const r3 = analyzeMarket(db, 'Data Analyst');

  assertEqual(r3.role_title, 'Data Analyst', 'Role title');
  assertEqual(r3.local_demand, 80, 'Local demand');
  assertEqual(r3.remote_demand, 84, 'Remote demand');
  assertEqual(r3.growth_trend, 'Growing', 'Growth trend');
  assertEqual(r3.source, 'exact', 'Source is exact match');

  // ── Test 4: Case-insensitive match ─────────────────────────
  console.log('\nTest 4: Case-insensitive — "data & ai"');
  console.log('────────────────────────────────────');

  const r4 = analyzeMarket(db, 'data & ai');

  assertEqual(r4.role_title, 'AI/ML Engineer', 'Role title (case-insensitive)');
  assertEqual(r4.local_demand, 78, 'Local demand');
  assertEqual(r4.source, 'exact', 'Source is exact match');

  // ── Test 5: Partial match — "AI" ───────────────────────────
  console.log('\nTest 5: Partial match — "AI"');
  console.log('────────────────────────────────────');

  const r5 = analyzeMarket(db, 'AI');

  assert(r5.role_title === 'AI/ML Engineer' || r5.role_title === 'Data Analyst', 'Partial match finds a role');
  assertEqual(r5.source, 'partial', 'Source is partial match');
  assert(r5.local_demand > 0, 'Local demand is populated');

  // ── Test 6: Partial match — "Developer" ────────────────────
  console.log('\nTest 6: Partial match — "Developer"');
  console.log('────────────────────────────────────');

  const r6 = analyzeMarket(db, 'Developer');

  assertEqual(r6.role_title, 'Full Stack Web Developer', 'Partial match on role title');
  assertEqual(r6.source, 'partial', 'Source is partial match');
  assertEqual(r6.local_demand, 85, 'Local demand');

  // ── Test 7: Unmatched role — fallback baseline ─────────────
  console.log('\nTest 7: Unmatched — "Blockchain Engineer"');
  console.log('────────────────────────────────────');

  const r7 = analyzeMarket(db, 'Blockchain Engineer');

  assertEqual(r7.role_title, 'General Tech Role', 'Fallback role title');
  assertEqual(r7.local_demand, 70, 'Fallback local demand');
  assertEqual(r7.remote_demand, 75, 'Fallback remote demand');
  assertEqual(r7.growth_trend, 'Moderate', 'Fallback growth trend');
  assertEqual(r7.source, 'baseline', 'Source is baseline');
  assert(typeof r7.marketSummary === 'string' && r7.marketSummary.length > 20, 'Fallback summary exists');

  // ── Test 8: Null / empty input ─────────────────────────────
  console.log('\nTest 8: Null / empty input');
  console.log('────────────────────────────────────');

  const r8a = analyzeMarket(db, null);
  assertEqual(r8a.source, 'baseline', 'Null input returns baseline');

  const r8b = analyzeMarket(db, '');
  assertEqual(r8b.source, 'baseline', 'Empty string returns baseline');

  const r8c = analyzeMarket(db, '   ');
  assertEqual(r8c.source, 'baseline', 'Whitespace-only returns baseline');

  // ── Summary ────────────────────────────────────────────────
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
