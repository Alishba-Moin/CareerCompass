import { motion } from 'framer-motion';
import { CalendarRange, CheckSquare, FolderKanban, Layers, Clock, Star } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

const WEEK_ACCENTS = [
  { border: 'border-gold/30', badge: 'bg-gold/10 text-gold-dark' },
  { border: 'border-brown/25', badge: 'bg-brown/10 text-brown' },
  { border: 'border-gold-light/60', badge: 'bg-gold-light/30 text-gold-dark' },
  { border: 'border-brown-light/40', badge: 'bg-brown-light/20 text-brown' },
];

export default function PlanSection({ analysis, onToggleTask }) {
  const { t } = useLang();

  if (!analysis) {
    return (
      <motion.section
        id="plan"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        className="bg-parchment rounded-3xl border border-line shadow-card p-12 flex flex-col items-center text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-sand border border-line flex items-center justify-center">
          <CalendarRange size={24} className="text-brown-light" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-brownDark">{t('plan.empty')}</h3>
      </motion.section>
    );
  }

  const weeks = analysis.weeklyTasks;
  const totalTasks = weeks.reduce((s, w) => s + w.tasks.length, 0);
  const project = analysis.portfolioProject;

  return (
    <motion.section
      id="plan"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-brown flex items-center justify-center">
            <CalendarRange size={16} className="text-white" />
          </div>
          <h2 className="font-display text-xl font-bold text-brownDark">{t('plan.title')}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brown bg-brown/10 border border-brown/20 px-3 py-1.5 rounded-lg">
          <CheckSquare size={13} /> {t('plan.badge', { n: totalTasks })}
        </span>
      </div>

      {/* Weeks */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {weeks.map((w, wi) => {
          const accent = WEEK_ACCENTS[wi % WEEK_ACCENTS.length];
          return (
            <motion.div
              key={w.week}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: wi * 0.1, ease: 'easeOut' }}
              className={`bg-parchment rounded-3xl border ${accent.border} shadow-card p-5`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-sm font-bold text-brownDark">
                  {t('common.week', { n: w.week })}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${accent.badge}`}>
                  {w.theme.split('—')[0].trim()}
                </span>
              </div>

              <div className="space-y-2">
                {w.tasks.map(task => {
                  const id = task.id || task.task_id;
                  const done = task.status === 'completed';
                  return (
                    <label
                      key={id}
                      data-task-id={id}
                      className="flex items-start gap-2.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        data-task-id={id}
                        checked={done}
                        onChange={e => onToggleTask(id, e.target.checked)}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-gold cursor-pointer"
                      />
                      <span
                        className={`text-xs leading-relaxed transition-colors ${
                          done ? 'line-through text-mocha/60' : 'text-brownDark group-hover:text-brown'
                        }`}
                      >
                        {task.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Portfolio project */}
      {project && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-gradient-to-r from-sand via-parchment to-sand rounded-3xl border border-gold/30 shadow-card p-6 sm:p-7"
        >
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-brown flex items-center justify-center shrink-0">
              <FolderKanban size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-dark mb-1">
                {t('plan.portfolioTitle')}
              </p>
              <h3 className="font-display text-lg font-bold text-brownDark">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-mocha mt-1.5 leading-relaxed">{project.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Layers size={13} className="text-brown" />
                  <span className="text-[10px] font-semibold text-mocha uppercase">{t('plan.techStack')}:</span>
                  {(project.tech_stack || []).map(tech => (
                    <span
                      key={tech}
                      className="text-[10px] font-medium text-brown bg-brown/10 border border-brown/15 px-2 py-0.5 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <span className="flex items-center gap-1.5 text-xs text-brownDark">
                  <Clock size={13} className="text-gold-dark" />
                  <span className="font-semibold">{t('plan.duration')}:</span> ~{project.estimated_duration}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-brownDark">
                  <Star size={13} className="text-gold-dark" />
                  <span className="font-semibold">{t('plan.impact')}:</span> {project.impact}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
