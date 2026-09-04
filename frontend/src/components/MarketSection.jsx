import { motion } from 'framer-motion';
import { Globe, TrendingUp, Wallet, Building2, Wifi, MapPin, Compass } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

const SALARIES = [
  { key: 'salJrFS', range: '80K–150K' },
  { key: 'salJrML', range: '90K–160K' },
  { key: 'salMidReact', range: '150K–300K' },
  { key: 'salSrAI', range: '250K–500K' },
];

const HUBS = [
  { key: 'hubLahore', icon: Building2, color: 'text-gold-dark' },
  { key: 'hubKarachi', icon: Building2, color: 'text-brown' },
  { key: 'hubIslamabad', icon: Building2, color: 'text-brown-light' },
  { key: 'hubRemote', icon: Wifi, color: 'text-gold-dark' },
];

function DemandBar({ label, pct, accent }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-brownDark">{label}</span>
        <span className="text-sm font-bold text-brownDark">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-sand overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${accent}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function MarketSection({ analysis }) {
  const { t } = useLang();

  return (
    <motion.section
      id="market"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-brown flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-brownDark">{t('market.title')}</h2>
            {analysis && (
              <p className="text-[11px] text-mocha flex items-center gap-1">
                <Compass size={11} className="text-gold-dark" /> {t('score.targetRole')}: {analysis.marketAnalysis.role_title}
              </p>
            )}
          </div>
        </div>
        {analysis && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-dark bg-gold/10 border border-gold/25 px-3 py-1.5 rounded-lg">
            <TrendingUp size={13} /> {t('market.growth')}: {analysis.marketAnalysis.growth_trend}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Demand overview */}
        <div className="bg-parchment rounded-3xl border border-line shadow-card p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mocha mb-4">
            {analysis ? `${t('market.local')} / ${t('market.remote')}` : t('market.title')}
          </p>
          {analysis ? (
            <div className="space-y-5">
              <DemandBar label={t('market.local')} pct={analysis.marketAnalysis.local_demand} accent="bg-gradient-to-r from-gold-light to-gold" />
              <DemandBar label={t('market.remote')} pct={analysis.marketAnalysis.remote_demand} accent="bg-gradient-to-r from-gold to-brown" />
              <p className="text-xs text-mocha leading-relaxed border-t border-line pt-4">
                {analysis.marketAnalysis.marketSummary}
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Globe size={26} className="mx-auto text-brown-light/50" />
              <p className="mt-3 text-sm text-mocha">{t('market.empty')}</p>
            </div>
          )}
        </div>

        {/* Salary ranges */}
        <div className="bg-parchment rounded-3xl border border-line shadow-card p-6">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mocha mb-4">
            <Wallet size={12} className="text-gold-dark" /> {t('market.salaryTitle')}
          </p>
          <div className="space-y-3">
            {SALARIES.map(s => (
              <div key={s.key} className="flex justify-between items-center border-b border-line/60 pb-2.5 last:border-0">
                <span className="text-sm text-brownDark">{t(`market.${s.key}`)}</span>
                <span className="text-sm font-bold text-brownDark">{s.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hiring hubs */}
        <div className="bg-parchment rounded-3xl border border-line shadow-card p-6">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mocha mb-4">
            <MapPin size={12} className="text-gold-dark" /> {t('market.hubsTitle')}
          </p>
          <div className="space-y-3">
            {HUBS.map(h => (
              <div key={h.key} className="flex items-center gap-2.5">
                <h.icon size={15} className={h.color} />
                <span className="text-sm text-brownDark">{t(`market.${h.key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
