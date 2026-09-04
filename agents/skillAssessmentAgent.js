/**
 * Skill Assessment Agent
 *
 * Evaluates a student's existing skills against the required skills
 * for a target career role. All matching is deterministic — exact
 * string comparison with case-insensitive normalization.
 *
 * Part of the CareerCompass multi-agent pipeline.
 */

/**
 * Normalizes a skill string for comparison: lowercase + trimmed.
 * @param {string} skill
 * @returns {string}
 */
function normalize(skill) {
  return skill.trim().toLowerCase();
}

/**
 * Evaluates a student's skills against a target role's required skills.
 *
 * @param {string[]} studentSkills   — Skills the student currently has.
 * @param {string[]} targetRoleSkills — Skills required for the target role.
 * @returns {{
 *   strengths: string[],
 *   gaps: string[],
 *   matchPercentage: number,
 *   totalRequired: number,
 *   totalStrengths: number,
 *   totalGaps: number,
 * }}
 */
export function evaluateSkills(studentSkills, targetRoleSkills) {
  if (!Array.isArray(studentSkills) || !Array.isArray(targetRoleSkills)) {
    throw new TypeError('Both studentSkills and targetRoleSkills must be arrays.');
  }
  if (targetRoleSkills.length === 0) {
    return {
      strengths: [],
      gaps: [],
      matchPercentage: 0,
      totalRequired: 0,
      totalStrengths: 0,
      totalGaps: 0,
    };
  }

  // Build a normalized lookup set from the student's skills
  const studentNormalized = new Set(studentSkills.map(normalize));

  // Strengths: target skills the student already possesses (preserving target casing)
  const strengths = targetRoleSkills.filter(skill =>
    studentNormalized.has(normalize(skill))
  );

  // Gaps: target skills the student is missing (preserving target casing)
  const gaps = targetRoleSkills.filter(skill =>
    !studentNormalized.has(normalize(skill))
  );

  // Deterministic match percentage
  const matchPercentage = Math.round((strengths.length / targetRoleSkills.length) * 100);

  return {
    strengths,
    gaps,
    matchPercentage,
    totalRequired: targetRoleSkills.length,
    totalStrengths: strengths.length,
    totalGaps: gaps.length,
  };
}
