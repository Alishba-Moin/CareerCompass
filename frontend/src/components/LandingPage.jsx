import { motion } from 'framer-motion';
import {
  Compass, Sparkles, Zap, User, Bot, Map, TrendingUp, Check, Circle,
} from 'lucide-react';
import { STEPS } from './CommandCenter.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

/* ── Motion presets — consistent with the dashboard's fade-up easeOut style ── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeScale = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
};

/* ── How It Works steps (step 2 carries the 6-agent preview) ── */
const HOW_STEPS = [
  { icon: User, titleKey: 'landing.step1Title', descKey: 'landing.step1Desc' },
  { icon: Bot, titleKey: 'landing.step2Title', descKey: 'landing.step2Desc', agents: true },
  { icon: Map, titleKey: 'landing.step3Title', descKey: 'landing.step3Desc' },
  { icon: TrendingUp, titleKey: 'landing.step4Title', descKey: 'landing.step4Desc' },
];

/* Mock roadmap content for the product preview frame */
const MOCK_WEEKS = [
  { n: 1, done: 3, tasks: ['Python crash course', 'Pandas data drills', 'Portfolio project setup'] },
  { n: 2, done: 1, tasks: ['SQL joins practice', 'ML fundamentals course', 'Kaggle mini project'] },
];

/** Compact grid of the six pipeline agents (reuses the Command Center registry). */
function AgentPreview() {
  const { t } = useLang();
  return (
    <div className="mt-4 pt-4 border-t border-line">
      <p className="text-[11px] font-bold text-mocha mb-2">{t('landing.agentsPreview')}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {STEPS.map(a => {
          const Icon = a.icon;
          return (
            <div
              key={a.key}
              className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg bg-sand border border-line"
            >
              <Icon size={13} className="text-gold-dark" />
              <span className="text-[9px] font-semibold text-brownDark text-center leading-tight">
                {t(a.nameKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Hero({ onOpenAuth }) {
  const { t } = useLang();
  return (
    <section className="relative overflow-hidden">
      {/* Decorative theme-colored glows — clipped by overflow-hidden, no page overflow */}
      <div aria-hidden="true" className="pointer-events-none absolute top-[-6rem] end-[-6rem] w-72 h-72 rounded-full bg-gold/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-8rem] start-[-6rem] w-80 h-80 rounded-full bg-brown/10 blur-3xl" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-24 sm:pb-24">
        <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col items-center text-center">
          <motion.div variants={fadeUp}>
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#b8860b] to-[#a0522d] flex items-center justify-center shadow-2xl"
            >
              <Compass size={38} className="text-white" />
            </motion.div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="mt-8 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-brownDark leading-tight">
            {t('app.name')}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-lg sm:text-xl font-semibold text-mocha">
            {t('app.tagline')}
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 text-base text-mocha max-w-xl leading-relaxed">
            {t('landing.heroBody')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => onOpenAuth('signup')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-gold-dark to-brown text-white font-bold text-base shadow-lg hover:opacity-90 transition-opacity"
            >
              <Sparkles size={18} />
              {t('auth.signup')}
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border-2 border-[#b8860b]/40 text-[#6b3f1f] font-bold text-base hover:border-[#b8860b] hover:bg-[#b8860b]/5 transition-all"
            >
              <Zap size={18} />
              {t('auth.demo')}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useLang();
  return (
    <section className="bg-parchment border-y border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brownDark">
              {t('landing.howTitle')}
            </h2>
            <p className="mt-3 text-base text-mocha">{t('landing.howSubtitle')}</p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.titleKey}
                  variants={fadeUp}
                  className="bg-cream rounded-3xl border border-line shadow-card p-6 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-brown flex items-center justify-center text-white shadow-sm">
                      <Icon size={20} />
                    </span>
                    <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-mocha">
                      {t('landing.stepBadge', { n: i + 1 })}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-brownDark leading-snug">{t(s.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-mocha leading-relaxed">{t(s.descKey)}</p>
                  {s.agents && <AgentPreview />}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ProductPreview() {
  const { t } = useLang();
  return (
    <section className="bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
          <motion.div variants={fadeUp} className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brownDark">
              {t('landing.previewTitle')}
            </h2>
            <p className="mt-3 text-base text-mocha">{t('landing.previewSubtitle')}</p>
          </motion.div>

          <motion.div variants={fadeScale}>
            {/* Browser-window frame */}
            <div className="rounded-2xl border border-line bg-parchment shadow-card-hover overflow-hidden">
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-sand border-b border-line">
                <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                  <span className="w-2.5 h-2.5 rounded-full bg-clay/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 flex justify-center min-w-0">
                  <span className="px-3 sm:px-4 py-1 rounded-full bg-parchment border border-line text-[10px] font-medium text-mocha truncate">
                    careercompass.pk/dashboard
                  </span>
                </div>
                <div className="w-10 shrink-0" aria-hidden="true" />
              </div>

              {/* Simplified dashboard mockup */}
              <div className="p-3 sm:p-5 bg-cream space-y-3 sm:space-y-4">
                {/* Mini brand row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-gold to-brown flex items-center justify-center">
                      <Compass size={12} className="text-white" />
                    </span>
                    <span className="text-xs font-bold text-brownDark">{t('app.name')}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-[9px] font-bold text-success">
                    {t('cc.complete')}
                  </span>
                </div>

                {/* Agent Command Center tiles */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
                  {STEPS.map(a => {
                    const Icon = a.icon;
                    return (
                      <div
                        key={a.key}
                        className="relative rounded-xl border border-line bg-parchment p-2 sm:p-2.5 flex flex-col items-center gap-1"
                      >
                        <span className="absolute top-1 end-1 w-3.5 h-3.5 rounded-full bg-success flex items-center justify-center">
                          <Check size={8} className="text-white" />
                        </span>
                        <Icon size={13} className="text-gold-dark" />
                        <span className="text-[8px] sm:text-[9px] font-semibold text-brownDark text-center leading-tight">
                          {t(a.nameKey)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress + score */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-brownDark">{t('cc.title')}</span>
                      <span className="text-[10px] font-semibold text-mocha">5/6</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-sand overflow-hidden">
                      <div className="h-full w-5/6 rounded-full bg-gradient-to-r from-gold to-brown" />
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-gold-dark to-brown text-white text-[10px] font-bold">
                    72/100
                  </span>
                </div>

                {/* Roadmap weeks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {MOCK_WEEKS.map(w => (
                    <div key={w.n} className="rounded-xl border border-line bg-parchment p-2.5 sm:p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-brownDark">{t('common.week', { n: w.n })}</span>
                        <span className="text-[9px] font-semibold text-mocha">{w.done}/{w.tasks.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {w.tasks.map((task, idx) => {
                          const done = idx < w.done;
                          return (
                            <div key={task} className="flex items-center gap-2">
                              {done ? (
                                <Check size={10} className="shrink-0 text-success" />
                              ) : (
                                <Circle size={10} className="shrink-0 text-brown-light" />
                              )}
                              <span className={`text-[9px] sm:text-[10px] text-mocha ${done ? 'line-through' : ''}`}>
                                {task}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-5 text-center text-xs text-mocha">
            {t('landing.previewCaption')}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const { t } = useLang();
  return (
    <footer className="bg-parchment border-t border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center space-y-2">
        <p className="text-sm font-semibold text-brownDark">{t('landing.free')}</p>
        <p className="text-xs text-mocha">{t('landing.builtFor')}</p>
      </div>
    </footer>
  );
}

/**
 * Landing page for logged-out visitors: animated hero, How It Works walkthrough,
 * product preview mockup, and footer. Auth actions open the shared AuthModal
 * on the tab matching the clicked CTA ('signup' | 'login').
 */
export default function LandingPage({ onOpenAuth }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Hero onOpenAuth={onOpenAuth} />
      <HowItWorks />
      <ProductPreview />
      <div className="flex-1" aria-hidden="true" />
      <LandingFooter />
    </div>
  );
}
