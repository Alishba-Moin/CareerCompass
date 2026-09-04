/**
 * Market Intelligence Agent
 *
 * Queries the market_signals table for demand metrics on a given
 * domain or role title. Returns structured market data with a
 * human-readable summary contextualized for Pakistani graduates.
 *
 * Part of the CareerCompass multi-agent pipeline.
 */

// ── Fallback baseline when no match is found ───────────────
const BASELINE = {
  role_title: 'General Tech Role',
  domain: 'Technology',
  local_demand: 70,
  remote_demand: 75,
  required_skills: '[]',
  growth_trend: 'Moderate',
};

/**
 * Generates a human-readable market summary tailored for
 * Pakistani Intermediate / Graduate students.
 *
 * @param {object} row — A market_signals row.
 * @returns {string}
 */
function buildSummary(row) {
  const { role_title, local_demand, remote_demand, growth_trend } = row;

  // Demand tier labels
  const localTier =
    local_demand >= 85 ? 'very high' :
    local_demand >= 70 ? 'strong' :
    local_demand >= 50 ? 'moderate' : 'low';

  const remoteTier =
    remote_demand >= 85 ? 'very high' :
    remote_demand >= 70 ? 'strong' :
    remote_demand >= 50 ? 'moderate' : 'low';

  // Opportunity comparison
  let opportunity;
  if (remote_demand > local_demand + 10) {
    opportunity = 'Remote opportunities significantly outpace local demand — platforms like Toptal, Turing, and Upwork are strong options for Pakistani developers.';
  } else if (remote_demand > local_demand) {
    opportunity = 'Remote demand is slightly higher than local — consider freelancing platforms alongside local applications.';
  } else {
    opportunity = 'Local and remote demand are comparable — software houses in Lahore, Karachi, and Islamabad are actively hiring.';
  }

  // Trend note
  const trendNote =
    growth_trend === 'High Growth' ? ' This field is experiencing rapid growth in Pakistan\'s IT sector.' :
    growth_trend === 'Stable High' ? ' Consistently strong hiring across Pakistani tech companies and remote employers.' :
    growth_trend === 'Growing' ? ' Demand is steadily increasing — a good long-term investment.' :
    '';

  return `${role_title} has ${localTier} local demand (${local_demand}%) and ${remoteTier} remote demand (${remote_demand}%). ${opportunity}${trendNote}`;
}

/**
 * Analyzes market signals for a given domain or role title.
 *
 * Search strategy:
 *   1. Exact match on domain or role_title (case-insensitive).
 *   2. Partial LIKE match on domain or role_title.
 *   3. Fallback to baseline metrics if nothing matches.
 *
 * @param {{ dbAll: Function }} db — Database helper module with `dbAll(sql, params)`.
 * @param {string} domainOrRole  — Domain name or role title to search.
 * @returns {{
 *   role_title: string,
 *   local_demand: number,
 *   remote_demand: number,
 *   growth_trend: string,
 *   marketSummary: string,
 *   source: 'exact' | 'partial' | 'baseline',
 * }}
 */
export function analyzeMarket(db, domainOrRole) {
  if (!domainOrRole || typeof domainOrRole !== 'string') {
    return { ...BASELINE, marketSummary: buildSummary(BASELINE), source: 'baseline' };
  }

  const search = domainOrRole.trim();

  if (search.length === 0) {
    return { ...BASELINE, marketSummary: buildSummary(BASELINE), source: 'baseline' };
  }

  // 1. Exact match (case-insensitive)
  let rows = db.dbAll(
    `SELECT * FROM market_signals
     WHERE LOWER(domain) = LOWER(?) OR LOWER(role_title) = LOWER(?)`,
    [search, search]
  );

  if (rows.length > 0) {
    const row = rows[0];
    return { ...row, marketSummary: buildSummary(row), source: 'exact' };
  }

  // 2. Partial match (LIKE)
  rows = db.dbAll(
    `SELECT * FROM market_signals
     WHERE LOWER(domain) LIKE LOWER(?) OR LOWER(role_title) LIKE LOWER(?)`,
    [`%${search}%`, `%${search}%`]
  );

  if (rows.length > 0) {
    const row = rows[0];
    return { ...row, marketSummary: buildSummary(row), source: 'partial' };
  }

  // 3. Fallback baseline
  return { ...BASELINE, marketSummary: buildSummary(BASELINE), source: 'baseline' };
}
