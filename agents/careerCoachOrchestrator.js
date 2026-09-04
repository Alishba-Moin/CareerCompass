/**
 * Career Coach Orchestrator Agent
 *
 * The central coordination layer that wires all five specialist agents
 * into a single end-to-end pipeline.  When a student submits a career
 * query, the orchestrator:
 *
 *   1. Fetches the student profile from SQLite.
 *   2. Resolves a career target from the query (or student interests).
 *   3. Skill Assessment  → strengths, gaps, match percentage.
 *   4. Market Intelligence → Pakistani local/remote demand data.
 *   5. Career Path        → optimal path + milestones.
 *   6. Roadmap Generator  → 4-week plan + portfolio project.
 *   7. Progress Tracker   → readiness score.
 *
 * Returns a unified JSON response with bilingual (English + Roman Urdu)
 * recommendation and an agent execution log.
 *
 * Part of the CareerCompass multi-agent pipeline.
 */

import { evaluateSkills } from './skillAssessmentAgent.js';
import { analyzeMarket } from './marketIntelligenceAgent.js';
import { selectOptimalPath } from './careerPathAgent.js';
import { generateRoadmap } from './roadmapGeneratorAgent.js';
import { calculateReadinessScore } from './progressTrackerAgent.js';

// ── Internal helpers ────────────────────────────────────────────

/**
 * Resolves a career target from the user's free-text query.
 *
 * Resolution priority:
 *   1. Comparison query — if both AI/ML and Web keywords appear,
 *      pick the track with the highest remote demand.
 *   2. Exact match on full query (simple queries like "AI/ML Engineer").
 *   3. Partial match (query is a substring of role/domain, or vice versa).
 *   4. Weighted keyword scoring across all market_signals rows.
 *   5. Fallback: keyword match from student interests.
 */

/** AI/ML indicator keywords (lowercase) */
const AI_KEYWORDS = ['ai', 'ml', 'machine learning', 'artificial intelligence', 'deep learning', 'neural'];
/** Web / Full Stack indicator keywords (lowercase) */
const WEB_KEYWORDS = ['web', 'full stack', 'frontend', 'backend', 'react', 'node'];

function resolveTarget(db, student, query) {
  const search = (query && query.trim()) || '';
  const allSignals = db.dbAll('SELECT role_title, domain, required_skills, remote_demand FROM market_signals');

  if (search.length > 0) {
    const qLower = search.toLowerCase();

    // ── Priority 1: Comparison query detection ───────────────
    // When the user asks about TWO career tracks (e.g. "AI/ML vs Web"),
    // resolve to the track with the highest remote demand rather than
    // letting generic keyword overlap pick an unrelated role.
    const hasAI  = AI_KEYWORDS.some(k => qLower.includes(k));
    const hasWeb = WEB_KEYWORDS.some(k => qLower.includes(k));

    if (hasAI && hasWeb) {
      // Pick the highest remote_demand among AI and Web tracks
      let bestRow = null;
      let bestDemand = -1;
      for (const row of allSignals) {
        const roleLower = row.role_title.toLowerCase();
        const domLower  = (row.domain || '').toLowerCase();
        const isAI  = AI_KEYWORDS.some(k => roleLower.includes(k) || domLower.includes(k));
        const isWeb = WEB_KEYWORDS.some(k => roleLower.includes(k) || domLower.includes(k));
        if (isAI || isWeb) {
          const demand = row.remote_demand || 0;
          if (demand > bestDemand) {
            bestDemand = demand;
            bestRow = row;
          }
        }
      }
      if (bestRow) {
        return { targetRole: bestRow.role_title, requiredSkills: JSON.parse(bestRow.required_skills) };
      }
    }

    // ── Priority 2: Explicit AI/ML mention overrides ─────────
    // If AI/ML keywords appear but Web does not (not a comparison),
    // immediately resolve to the AI/ML track.
    if (hasAI && !hasWeb) {
      const aiRow = allSignals.find(r =>
        AI_KEYWORDS.some(k =>
          r.role_title.toLowerCase().includes(k) || (r.domain || '').toLowerCase().includes(k))
      );
      if (aiRow) {
        return { targetRole: aiRow.role_title, requiredSkills: JSON.parse(aiRow.required_skills) };
      }
    }

    // ── Priority 3: Exact match on full query ────────────────
    for (const row of allSignals) {
      if (row.role_title.toLowerCase() === qLower ||
          (row.domain || '').toLowerCase() === qLower) {
        return { targetRole: row.role_title, requiredSkills: JSON.parse(row.required_skills) };
      }
    }

    // ── Priority 4: Partial substring match ──────────────────
    for (const row of allSignals) {
      if (row.role_title.toLowerCase().includes(qLower) ||
          (row.domain || '').toLowerCase().includes(qLower) ||
          qLower.includes(row.role_title.toLowerCase()) ||
          qLower.includes((row.domain || '').toLowerCase())) {
        return { targetRole: row.role_title, requiredSkills: JSON.parse(row.required_skills) };
      }
    }

    // ── Priority 5: Weighted keyword scoring ─────────────────
    let bestMatch = null;
    let bestScore = 0;
    for (const row of allSignals) {
      let score = 0;
      const keywords = [
        ...row.role_title.split(/[\s\/&,]+/).filter(w => w.length > 1),
        ...(row.domain || '').split(/[\s\/&,]+/).filter(w => w.length > 1),
      ];
      for (const kw of keywords) {
        if (qLower.includes(kw.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = row;
      }
    }
    if (bestMatch) {
      return { targetRole: bestMatch.role_title, requiredSkills: JSON.parse(bestMatch.required_skills) };
    }
  }

  // ── Fallback: keyword match from student interests ───────────
  const interests = (student.interests || '').toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const row of allSignals) {
    let score = 0;
    const keywords = [
      ...row.role_title.split(/[\s\/&,]+/).filter(w => w.length > 1),
      ...(row.domain || '').split(/[\s\/&,]+/).filter(w => w.length > 1),
    ];
    for (const kw of keywords) {
      if (interests.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = row;
    }
  }
  if (bestMatch) {
    return { targetRole: bestMatch.role_title, requiredSkills: JSON.parse(bestMatch.required_skills) };
  }

  return { targetRole: null, requiredSkills: [] };
}

/**
 * Builds a bilingual (English + Roman Urdu) recommendation string
 * based on the pipeline results.
 */
function buildRecommendation(student, skillResult, marketResult, pathResult, roadmapResult, score) {
  const name = student.name || 'Student';
  const role = pathResult.recommended_path;
  const gaps = skillResult.gaps;
  const matchPct = skillResult.matchPercentage;

  let opening;
  if (matchPct >= 50) {
    opening = `${name}, bohat achi choice hai ${role}! Aap ke skills already strong hain.`;
  } else if (matchPct >= 25) {
    opening = `${name}, ${role} ek zabardast career path hai — aur aap ki foundation already solid hai.`;
  } else {
    opening = `${name}, ${role} chunna ek exciting decision hai. Abhi kuch important skills seekhne hain, lekin bilkul possible hai!`;
  }

  let skillNote;
  if (gaps.length <= 2) {
    skillNote = `Sirf ${gaps.length} skills seekhna baaki hain — ${gaps.join(', ')}.`;
  } else if (gaps.length > 0) {
    skillNote = `${gaps.length} important skills seekhna baaki hain — jaise ${gaps.slice(0, 2).join(', ')}. Step by step kaam karein, mushkil nahi hai!`;
  } else {
    skillNote = `Aap ke skills already target role se aligned hain — bohat achi baat hai!`;
  }

  const marketNote =
    marketResult.remote_demand >= 85
      ? `Pakistan mein ${role} ki remote demand ${marketResult.remote_demand}% hai — freelancing aur remote jobs kaafi promising hain.`
      : `Local market mein ${role} ki demand ${marketResult.local_demand}% hai — Lahore, Karachi, aur Islamabad mein kaafi opportunities hain.`;

  const projectNote = `Portfolio project: "${roadmapResult.portfolio_project.title}" — yeh project employers ko impress karega.`;
  const planNote = `4-week action plan ready hai. Har din thora kaam karein, aur Insha'Allah zaroor kamyabi milegi!`;

  return `${opening} ${skillNote} ${marketNote} ${projectNote} ${planNote}`;
}

// ── Main orchestrator ───────────────────────────────────────────

/**
 * Runs the full multi-agent pipeline for a student.
 *
 * @param {{ dbAll: Function, dbRun: Function }} db — Database helpers.
 * @param {number} studentId — Student primary key.
 * @param {string} query     — Free-text career query (English or Roman Urdu).
 * @returns {object} Unified pipeline response.
 */
export function runPipeline(db, studentId, query) {
  const agentLog = [];
  const mark = (name) => {
    const entry = { agent: name, startedAt: new Date().toISOString() };
    agentLog.push(entry);
    return entry;
  };
  const done = (entry, status = 'success') => {
    entry.completedAt = new Date().toISOString();
    entry.status = status;
  };

  // ── Step 0: Fetch student profile ─────────────────────────
  const step0 = mark('StudentProfile');
  const students = db.dbAll('SELECT * FROM students WHERE id = ?', [studentId]);

  if (students.length === 0) {
    done(step0, 'error');
    return { success: false, error: `Student with id ${studentId} not found.`, agentLog };
  }

  const student = students[0];
  const studentSkills = JSON.parse(student.skills || '[]');
  done(step0);

  // ── Step 1: Resolve career target ────────────────────────
  const step1 = mark('TargetResolver');
  const { targetRole, requiredSkills } = resolveTarget(db, student, query);
  done(step1, targetRole ? 'success' : 'no_match');

  // ── Step 2: Skill Assessment Agent ───────────────────────
  const step2 = mark('SkillAssessmentAgent');
  const skillResult = evaluateSkills(studentSkills, requiredSkills);
  done(step2);

  // ── Step 3: Market Intelligence Agent ────────────────────
  const step3 = mark('MarketIntelligenceAgent');
  const searchKey = targetRole || (student.interests || '').split(',')[0].trim();
  const marketResult = analyzeMarket(db, searchKey);
  done(step3, marketResult.source);

  // ── Step 4: Career Path Agent ────────────────────────────
  const step4 = mark('CareerPathAgent');
  const pathResult = selectOptimalPath(student, targetRole || query);
  done(step4);

  // ── Step 5: Roadmap Generator Agent ──────────────────────
  const step5 = mark('RoadmapGeneratorAgent');
  const roadmapResult = generateRoadmap(student, pathResult, skillResult.gaps);

  // Enrich roadmap tasks with actual progress_logs status from DB
  const progressLogs = db.dbAll(
    'SELECT task_id, status FROM progress_logs WHERE student_id = ?',
    [studentId]
  );
  const statusMap = {};
  for (const log of progressLogs) { statusMap[log.task_id] = log.status; }
  for (const week of roadmapResult.weeks) {
    for (const task of week.tasks) {
      if (statusMap[task.id]) {
        task.status = statusMap[task.id];
      }
    }
  }
  done(step5);

  // ── Step 6: Progress Tracker Agent ───────────────────────
  const step6 = mark('ProgressTrackerAgent');

  // Count completed tasks from DB
  const counts = db.dbAll(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
     FROM progress_logs WHERE student_id = ?`,
    [studentId]
  );
  const totalTasks = (counts[0] && counts[0].total) || 0;
  const completedTasks = (counts[0] && counts[0].completed) || 0;
  const ratio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  const readinessScore = calculateReadinessScore(
    skillResult.matchPercentage,
    marketResult.remote_demand,
    ratio
  );
  done(step6);

  // ── Persist readiness score to DB ──────────────────────────
  db.dbRun(
    'UPDATE students SET readiness_score = ?, skill_match_pct = ?, remote_demand_pct = ? WHERE id = ?',
    [readinessScore, skillResult.matchPercentage, marketResult.remote_demand, studentId]
  );

  // ── Bilingual recommendation ─────────────────────────────
  const recommendation = buildRecommendation(
    student, skillResult, marketResult, pathResult, roadmapResult, readinessScore
  );

  return {
    success: true,
    student: {
      id: student.id,
      name: student.name,
      education_level: student.education_level,
      stream_or_degree: student.stream_or_degree,
    },
    targetRole,
    recommendation,
    skillAnalysis: {
      strengths: skillResult.strengths,
      gaps: skillResult.gaps,
      matchPercentage: skillResult.matchPercentage,
    },
    marketAnalysis: {
      role_title: marketResult.role_title,
      local_demand: marketResult.local_demand,
      remote_demand: marketResult.remote_demand,
      growth_trend: marketResult.growth_trend,
      marketSummary: marketResult.marketSummary,
    },
    portfolioProject: roadmapResult.portfolio_project,
    weeklyTasks: roadmapResult.weeks,
    readinessScore,
    agentLog,
  };
}
