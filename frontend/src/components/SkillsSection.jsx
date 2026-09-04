import { motion } from 'framer-motion';
import { Trophy, Target, CheckCircle2, CircleDot, BarChart3 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

function EmptyState({ t }) {
  return (
    <div className="bg-parchment rounded-3xl border border-line shadow-card p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-sand border border-line flex items-center justify-center">
        <BarChart3 size={24} className="text-brown-light" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-brownDark">{t('skills.empty')}</h3>
      <p className="mt-1 text-sm text-mocha">{t('skills.emptySub')}</p>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: i => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12, ease: 'easeOut' },
  }),
};

export default function SkillsSection({ analysis }) {
  const { t } = useLang();
  if (!analysis) return <EmptyState t={t} />;

  const { strengths, gaps, matchPercentage } = analysis.skillAnalysis;

  return (
    <div id="skills" className="grid lg:grid-cols-2 gap-6">
      {/* Strengths */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="bg-parchment rounded-3xl border border-line shadow-card p-6 sm:p-7"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center">
              <Trophy size={16} className="text-gold-dark" />
            </div>
            <div>
              <h3 className="font-semibold text-brownDark">{t('skills.strengthsTitle')}</h3>
              <p className="text-[11px] text-mocha">{t('skills.strengthsSub')}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-gold-dark bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-lg">
            {matchPercentage}%
          </span>
        </div>

        <div className="space-y-2.5">
          {strengths.length === 0 ? (
            <p className="text-sm text-mocha italic">{t('skills.emptyStrengths')}</p>
          ) : (
            strengths.map(s => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2.5 bg-cream/60 border border-line rounded-xl px-3.5 py-2.5"
              >
                <CheckCircle2 size={16} className="text-gold-dark shrink-0" />
                <span className="text-sm text-brownDark font-medium">{s}</span>
                <span className="ms-auto text-[10px] font-bold text-gold-dark bg-gold/10 px-2 py-0.5 rounded-full">
                  {t('skills.matched')}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Gaps */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="bg-parchment rounded-3xl border border-line shadow-card p-6 sm:p-7"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brown/10 border border-brown/20 flex items-center justify-center">
              <Target size={16} className="text-brown" />
            </div>
            <div>
              <h3 className="font-semibold text-brownDark">{t('skills.gapsTitle')}</h3>
              <p className="text-[11px] text-mocha">{t('skills.gapsSub')}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-brown bg-brown/10 border border-brown/20 px-2.5 py-1 rounded-lg">
            {gaps.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {gaps.length === 0 ? (
            <p className="text-sm text-success font-medium">{t('skills.noGaps')}</p>
          ) : (
            gaps.map(g => (
              <motion.div
                key={g}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2.5 bg-cream/60 border border-line rounded-xl px-3.5 py-2.5"
              >
                <CircleDot size={16} className="text-brown shrink-0" />
                <span className="text-sm text-brownDark font-medium">{g}</span>
                <span className="ms-auto text-[10px] font-bold text-brown bg-brown/10 px-2 py-0.5 rounded-full">
                  {t('skills.toLearn')}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
