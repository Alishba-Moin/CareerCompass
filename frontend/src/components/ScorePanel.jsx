import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Target, Globe, ListChecks } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

/**
 * Animates from the PREVIOUS value to the new target — never resets to zero.
 */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setValue(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function ScoreRing({ score }) {
  const display = useCountUp(score);
  const size = 168;
  const stroke = 13;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#6F4E2E" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#EDE3CE" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#goldRing)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: circ - (circ * display) / 100 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold text-brownDark leading-none">{display}</span>
        <span className="text-xs text-mocha mt-1">/ 100</span>
      </div>
    </div>
  );
}

function StatBar({ icon, label, pct, text }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-brownDark">
          {icon} {label}
        </span>
        <span className="text-xs font-bold text-brownDark">{text}</span>
      </div>
      <div className="h-2 rounded-full bg-sand overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold to-brown"
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function ScorePanel({ score, skillMatch, remoteDemand, progress, targetRole }) {
  const { t } = useLang();
  const label =
    score >= 70 ? t('score.good') : score >= 40 ? t('score.moderate') : t('score.early');
  const taskPct =
    progress && progress.total_tasks > 0
      ? Math.round(((progress.completed_tasks ?? 0) / progress.total_tasks) * 100)
      : 0;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.12, ease: 'easeOut' } },
      }}
      className="bg-parchment rounded-3xl border border-line shadow-card p-6 sm:p-8 h-full flex flex-col"
    >
      <div className="flex items-center gap-5 sm:gap-6">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <h3 className="font-display text-xl font-bold text-brownDark">{t('score.title')}</h3>
          {targetRole && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-gold-dark bg-gold/10 border border-gold/20 rounded-lg px-2.5 py-1 font-semibold">
              <Target size={11} /> {t('score.targetRole')}: {targetRole}
            </p>
          )}
          <p className="mt-2 text-sm text-mocha leading-relaxed">{label}</p>
        </div>
      </div>

      <div className="mt-7 pt-6 border-t border-line space-y-5 flex-1">
        <StatBar
          icon={<Target size={13} className="text-gold-dark" />}
          label={t('score.skillMatch')}
          pct={skillMatch}
          text={`${skillMatch}%`}
        />
        <StatBar
          icon={<Globe size={13} className="text-brown" />}
          label={t('score.remoteDemand')}
          pct={remoteDemand}
          text={`${remoteDemand}%`}
        />
        <StatBar
          icon={<ListChecks size={13} className="text-brown-light" />}
          label={t('score.taskProgress')}
          pct={taskPct}
          text={
            progress
              ? t('score.tasksCompleted', {
                  completed: progress.completed_tasks ?? 0,
                  total: progress.total_tasks ?? 0,
                })
              : '—'
          }
        />
      </div>

      <div className="mt-6 flex items-center gap-2 text-[11px] text-mocha">
        <Gauge size={12} className="text-gold-dark" />
        {t('score.title')} · {t('score.formula')}
      </div>
    </motion.div>
  );
}
