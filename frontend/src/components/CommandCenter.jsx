import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Target,
  LineChart,
  Route,
  Map,
  TrendingUp,
  Check,
  Loader2,
  Circle,
  AlertTriangle,
  Radio,
  Activity,
  ChevronDown,
  CheckCircle2,
  CircleDot,
  Compass,
  FolderKanban,
  GraduationCap,
  ListChecks,
  User,
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

/** The six pipeline agents — lucide icons only, no emoji. */
export const STEPS = [
  { key: 'coach', icon: Bot, nameKey: 'cc.agentCoach', actionKey: 'cc.stepCoach' },
  { key: 'skill', icon: Target, nameKey: 'cc.agentSkill', actionKey: 'cc.stepSkill' },
  { key: 'market', icon: LineChart, nameKey: 'cc.agentMarket', actionKey: 'cc.stepMarket' },
  { key: 'path', icon: Route, nameKey: 'cc.agentPath', actionKey: 'cc.stepPath' },
  { key: 'roadmap', icon: Map, nameKey: 'cc.agentRoadmap', actionKey: 'cc.stepRoadmap' },
  { key: 'progress', icon: TrendingUp, nameKey: 'cc.agentProgress', actionKey: 'cc.stepProgress' },
];

const STATE_STYLES = {
  idle: { badge: 'bg-sand text-mocha border-line', icon: Circle, spin: false },
  executing: { badge: 'bg-gold/15 text-gold-dark border-gold/35', icon: Loader2, spin: true },
  complete: { badge: 'bg-success/10 text-success border-success/30', icon: Check, spin: false },
};

/** Gold glow applied to tiles while a step is EXECUTING. */
const GLOW = '0 0 0 4px rgba(201,162,39,0.16), 0 10px 26px -10px rgba(201,162,39,0.55)';
const NO_GLOW = '0 0 0 0px rgba(201,162,39,0), 0 0px 0px rgba(201,162,39,0)';

function StatusBadge({ state }) {
  const { t } = useLang();
  const cfg = STATE_STYLES[state] || STATE_STYLES.idle;
  const Icon = cfg.icon;
  return (
    <motion.span
      key={state}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide ${cfg.badge}`}
    >
      <Icon size={11} className={cfg.spin ? 'animate-spin' : ''} />
      {t(`cc.${state}`)}
    </motion.span>
  );
}

/** Overall header badge reflecting the whole pipeline phase (with a one-shot glass sweep on completion). */
function OverallBadge({ phase }) {
  const { t, lang } = useLang();
  const rtl = lang === 'ur';
  const sweepFrom = rtl ? '210%' : '-110%';
  const sweepTo = rtl ? '-110%' : '210%';

  if (phase === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gold/35 bg-gold/15 text-gold-dark text-[11px] font-bold">
        <motion.span
          className="w-2 h-2 rounded-full bg-gold"
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {t('cc.executing')}
      </span>
    );
  }
  if (phase === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-clay/30 bg-clay/10 text-clay text-[11px] font-bold">
        <AlertTriangle size={11} /> {t('cc.error')}
      </span>
    );
  }
  if (phase === 'idle') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-line bg-sand text-mocha text-[11px] font-bold">
        <Circle size={11} /> {t('cc.idle')}
      </span>
    );
  }
  return (
    <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-success/30 bg-success/10 text-success text-[11px] font-bold overflow-hidden">
      <Check size={11} /> {t('cc.complete')}
      {phase === 'complete' && (
        <motion.span
          key="sweep"
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
          initial={{ x: sweepFrom }}
          animate={{ x: sweepTo }}
          transition={{ duration: 0.7, ease: 'easeInOut', delay: 0.15 }}
        />
      )}
    </span>
  );
}

/** Slim overall progress track: fills as steps flip to COMPLETE. */
function ProgressTrack({ completed, total, running, rtl }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="px-6 pt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-mocha">
          <Activity size={11} className="text-gold-dark" />
        </span>
        <span className="text-[10px] font-bold text-brownDark tabular-nums">
          {completed} / {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-sand overflow-hidden">
        <motion.div
          className="relative h-full rounded-full bg-gradient-to-r from-gold-light via-gold to-brown overflow-hidden"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        >
          {/* Travelling highlight while the pipeline runs */}
          {running && (
            <motion.span
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              initial={false}
              animate={{ x: rtl ? ['100%', '-300%'] : ['-100%', '300%'] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Small labelled demand bar used inside result cards. */
function MiniBar({ label, pct }) {
  const v = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-mocha">{label}</span>
      <span className="relative w-14 h-1.5 bg-sand rounded-full overflow-hidden">
        <motion.span
          className="absolute inset-y-0 start-0 bg-gradient-to-r from-gold to-brown rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </span>
      <span className="text-[10px] font-bold text-brownDark tabular-nums">{pct}%</span>
    </span>
  );
}

function Chip({ tone, children }) {
  const tones = {
    gold: 'bg-gold/10 text-gold-dark border-gold/20',
    brown: 'bg-brown/10 text-brown border-brown/15',
    plain: 'bg-sand text-mocha border-line',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Structured result detail per completed step, derived from the pipeline
 * response. All labels come from existing i18n keys — no dictionary changes.
 */
function buildDetail(step, analysis, t) {
  if (!analysis) return null;
  switch (step.key) {
    case 'coach': {
      const s = analysis.student || {};
      const items = [];
      if (s.name) {
        items.push(
          <Chip key="n" tone="gold">
            <User size={10} /> {s.name}
          </Chip>
        );
      }
      if (s.education_level) {
        items.push(
          <Chip key="e" tone="brown">
            <GraduationCap size={10} />{' '}
            {t(s.education_level === 'Graduate' ? 'profile.graduate' : 'profile.intermediate')}
          </Chip>
        );
      }
      return items.length > 0 ? items : null;
    }
    case 'skill': {
      const { strengths = [], gaps = [], matchPercentage } = analysis.skillAnalysis || {};
      return (
        <>
          <Chip tone="gold">
            <Target size={10} /> {t('score.skillMatch')}: {matchPercentage}%
          </Chip>
          {strengths.map(s => (
            <Chip key={`s-${s}`} tone="gold">
              <CheckCircle2 size={10} /> {s}
            </Chip>
          ))}
          {gaps.map(g => (
            <Chip key={`g-${g}`} tone="brown">
              <CircleDot size={10} /> {g}
            </Chip>
          ))}
        </>
      );
    }
    case 'market': {
      const m = analysis.marketAnalysis || {};
      return (
        <>
          <MiniBar label={t('market.local')} pct={m.local_demand} />
          <MiniBar label={t('market.remote')} pct={m.remote_demand} />
          {m.growth_trend && (
            <Chip tone="gold">
              <TrendingUp size={10} /> {m.growth_trend}
            </Chip>
          )}
        </>
      );
    }
    case 'path': {
      const role = analysis.targetRole;
      if (!role) return null;
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-gold to-brown text-white text-[11px] font-bold shadow-sm">
          <Compass size={11} /> {t('score.targetRole')}: {role}
        </span>
      );
    }
    case 'roadmap': {
      const weeks = analysis.weeklyTasks || [];
      const total = weeks.reduce((sum, w) => sum + (w.tasks || []).length, 0);
      const project = analysis.portfolioProject;
      return (
        <>
          <Chip tone="plain">
            <ListChecks size={10} /> {t('plan.badge', { n: total })}
          </Chip>
          {project && project.title && (
            <Chip tone="gold">
              <FolderKanban size={10} /> {project.title}
            </Chip>
          )}
        </>
      );
    }
    case 'progress': {
      return (
        <motion.span
          className="inline-flex items-baseline gap-1 font-display font-bold text-brownDark"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          <span className="text-2xl leading-none">{analysis.readinessScore}</span>
          <span className="text-[10px] text-mocha font-body">/ 100</span>
        </motion.span>
      );
    }
    default:
      return null;
  }
}

export default function CommandCenter({ phase, stepStates, stepSummaries, error, analysis }) {
  const { t, lang } = useLang();
  const rtl = lang === 'ur';
  const [collapsed, setCollapsed] = useState(() => new Set());

  // Stable keyframe target — prevents the executing pulse from restarting on unrelated re-renders
  const executingScale = useMemo(() => [1, 1.09, 1], []);

  // A new run re-opens every result card
  useEffect(() => {
    if (phase === 'running') setCollapsed(new Set());
  }, [phase]);

  const completedCount = stepStates.filter(s => s === 'complete').length;

  const toggleRow = key =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <motion.div
      id="pipeline"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="bg-parchment rounded-3xl border border-line shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-line px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brown to-brown-dark flex items-center justify-center">
            <Radio size={16} className="text-gold-light" />
          </div>
          <div>
            <h3 className="font-semibold text-brownDark text-sm">{t('cc.title')}</h3>
            <p className="text-[11px] text-mocha">{t('cc.subtitle')}</p>
          </div>
        </div>
        <OverallBadge phase={phase} />
      </div>

      {/* Overall progress */}
      <ProgressTrack completed={completedCount} total={STEPS.length} running={phase === 'running'} rtl={rtl} />

      {/* Agent strip — compact overview of all six agents */}
      <div className="px-6 pt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STEPS.map((step, i) => {
          const st = stepStates[i] || 'idle';
          return (
            <motion.div
              key={step.key}
              animate={{
                borderColor:
                  st === 'executing' ? 'rgba(201,162,39,0.5)' : st === 'complete' ? 'rgba(62,107,62,0.35)' : '#E7DCC6',
                backgroundColor: st === 'executing' ? 'rgba(201,162,39,0.08)' : st === 'complete' ? 'rgba(62,107,62,0.06)' : '#FFFFFF',
                boxShadow: st === 'executing' ? GLOW : NO_GLOW,
              }}
              transition={{ duration: 0.35 }}
              className="relative border rounded-xl px-2 py-2.5 flex flex-col items-center gap-1.5"
            >
              {/* Completion pop ring */}
              {st === 'complete' && (
                <motion.span
                  className="absolute inset-0 rounded-xl border-2 border-success pointer-events-none"
                  initial={{ opacity: 0.9, scale: 0.7 }}
                  animate={{ opacity: 0, scale: 1.3 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              )}
              <step.icon
                size={17}
                className={
                  st === 'executing' ? 'text-gold-dark' : st === 'complete' ? 'text-success' : 'text-mocha/60'
                }
              />
              <span className="text-[10px] font-medium text-brownDark text-center leading-tight">
                {t(step.nameKey)}
              </span>
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  backgroundColor:
                    st === 'executing' ? '#C9A227' : st === 'complete' ? '#3E6B3E' : '#E7DCC6',
                  scale: st === 'executing' ? [1, 1.4, 1] : 1,
                }}
                transition={{ duration: 1, repeat: st === 'executing' ? Infinity : 0 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Execution stream */}
      <div className="p-6 space-y-0">
        {STEPS.map((step, i) => {
          const st = stepStates[i] || 'idle';
          const summary = stepSummaries[i];
          const detail = st === 'complete' && analysis ? buildDetail(step, analysis, t) : null;
          const hasDetail = detail != null;
          const rowOpen = hasDetail && !collapsed.has(step.key);

          return (
            <div key={step.key} className="relative flex gap-4">
              {/* Connector — fills gold as data flows down to this step */}
              {i > 0 && (
                <div className="absolute start-[19px] -top-3 w-0.5 h-3 bg-line overflow-hidden rounded-full">
                  <motion.div
                    className="w-full h-full origin-top rounded-full"
                    style={{ background: 'linear-gradient(to bottom, #C9A227, #6F4E2E)' }}
                    initial={false}
                    animate={{ scaleY: st === 'idle' ? 0 : 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              )}

              {/* Icon tile — glow + pulse + ripple while executing, pop ring on completion */}
              <motion.div
                animate={{
                  boxShadow: st === 'executing' ? GLOW : NO_GLOW,
                  scale: st === 'executing' ? executingScale : 1,
                }}
                transition={{
                  boxShadow: { duration: 0.35 },
                  scale: { duration: 1.05, repeat: st === 'executing' ? Infinity : 0, ease: 'easeInOut' },
                }}
                className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                  st === 'executing'
                    ? 'bg-gold/15 border-gold/40'
                    : st === 'complete'
                      ? 'bg-success/10 border-success/30'
                      : 'bg-sand border-line'
                }`}
              >
                {st === 'executing' && (
                  <motion.span
                    className="absolute inset-0 rounded-xl border-2 border-gold/70 pointer-events-none"
                    initial={{ opacity: 0.7, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.4 }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                {st === 'complete' && (
                  <motion.span
                    className="absolute inset-0 rounded-xl border-2 border-success pointer-events-none"
                    initial={{ opacity: 0.9, scale: 0.7 }}
                    animate={{ opacity: 0, scale: 1.3 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                  />
                )}
                <step.icon
                  size={17}
                  className={
                    st === 'executing' ? 'text-gold-dark' : st === 'complete' ? 'text-success' : 'text-mocha/60'
                  }
                />
              </motion.div>

              <div className="flex-1 min-w-0 pb-4">
                {/* Row header — click toggles the result card */}
                <div
                  onClick={hasDetail ? () => toggleRow(step.key) : undefined}
                  className={`flex items-start justify-between gap-3 flex-wrap ${hasDetail ? 'cursor-pointer select-none' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-brownDark">[{t(step.nameKey)}]</span>{' '}
                      <span className="text-mocha">{t(step.actionKey)}</span>
                    </p>
                    <AnimatePresence>
                      {summary && st === 'complete' && (
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-1 text-xs font-semibold text-success flex items-center gap-1.5"
                        >
                          <Check size={12} /> {summary}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className="flex items-center gap-2 shrink-0">
                    {hasDetail && (
                      <ChevronDown
                        size={13}
                        className={`text-mocha transition-transform duration-300 ${rowOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                    <StatusBadge state={st} />
                  </span>
                </div>

                {/* Expanded result card */}
                <AnimatePresence initial={false}>
                  {rowOpen && (
                    <motion.div
                      key="detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2.5 bg-success/[0.04] border border-success/15 rounded-xl px-3.5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        {detail}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Error row */}
        <AnimatePresence>
          {phase === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-4 pt-1"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-clay/10 border border-clay/30">
                <AlertTriangle size={17} className="text-clay" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-clay">[{t('cc.error')}]</p>
                <p className="text-xs text-clay mt-0.5">{error || t('cc.errRetry')}</p>
                <p className="text-xs text-mocha mt-1">{t('cc.errRetry')}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
