import { motion } from 'framer-motion';
import { Globe, TrendingUp, Wallet, Building2, Wifi, MapPin, Compass, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell,
} from 'recharts';
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

export default function MarketSection({ analysis }) {
  const { t, lang } = useLang();
  const isRtl = lang === 'ur';

  // Build horizontal bar data for demand comparison
  const demandData = analysis
    ? [
        { name: t('market.local'), value: analysis.marketAnalysis.local_demand, fill: '#C9A227' },
        { name: t('market.remote'), value: analysis.marketAnalysis.remote_demand, fill: '#6F4E2E' },
      ]
    : [];

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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
              <TrendingUp size={10} /> {analysis.marketAnalysis.growth_trend}
            </span>
          </div>
        )}
      </div>

      {/* ── Demand comparison bar chart ─────────────────── */}
      {analysis && demandData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="bg-parchment rounded-3xl border border-line shadow-card p-6 sm:p-7"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center">
              <BarChart3 size={16} className="text-gold-dark" />
            </div>
            <h3 className="font-semibold text-brownDark">{t('market.demandChartTitle')}</h3>
          </div>

          <div style={{ height: 140, direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={`${analysis.marketAnalysis.local_demand}-${analysis.marketAnalysis.remote_demand}`}
                data={demandData}
                layout="vertical"
                margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                barCategoryGap="30%"
              >
                <YAxis
                  dataKey="name"
                  type="category"
                  orientation={isRtl ? 'right' : 'left'}
                  reversed={isRtl}
                  tick={{ fontSize: 13, fill: '#7A6A58', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  reversed={isRtl}
                  tick={{ fontSize: 11, fill: '#7A6A58' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                  isAnimationActive
                  animationDuration={900}
                  animationEasing="ease-out"
                  label={{
                    position: isRtl ? 'insideLeft' : 'right',
                    fill: '#3F2E1E',
                    fontSize: 13,
                    fontWeight: 700,
                    formatter: v => `${v}%`,
                  }}
                >
                  {demandData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Written insight below the chart */}
          <p className="mt-4 text-xs text-mocha leading-relaxed border-t border-line pt-4">
            {analysis.marketAnalysis.marketSummary}
          </p>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
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
