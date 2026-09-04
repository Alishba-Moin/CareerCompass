import { motion } from 'framer-motion';
import { GraduationCap, Heart, Sparkles, Pencil, Check } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function ProfileCard({ student, onEdit }) {
  const { t } = useLang();
  if (!student) return null;

  const initials = student.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const interests = (student.interests || '')
    .split(',')
    .map(i => i.trim())
    .filter(Boolean);
  const skills = student.skills || [];
  const levels = ['Intermediate', 'Graduate'];

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
      }}
      whileHover={{ boxShadow: '0 2px 4px rgba(63,46,30,0.06), 0 16px 40px -16px rgba(63,46,30,0.18)' }}
      className="bg-parchment rounded-3xl border border-line shadow-card p-6 sm:p-8 h-full"
    >
      {/* Header */}
      <div className="flex items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-brown flex items-center justify-center shrink-0 shadow-sm">
          <span className="font-display text-2xl font-bold text-white">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold text-brownDark truncate">{student.name}</h2>
          <p className="text-sm text-mocha mt-0.5">{student.stream_or_degree || '—'}</p>

          {/* Education level badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {levels.map(l => (
              <span
                key={l}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border ${
                  l === student.education_level
                    ? 'bg-gold/15 text-gold-dark border-gold/30 font-semibold'
                    : 'bg-sand text-mocha border-line'
                }`}
              >
                <GraduationCap size={12} />
                {t(l === 'Graduate' ? 'profile.graduate' : 'profile.intermediate')}
                {l === student.education_level && <Check size={11} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="mt-6">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mocha mb-2.5">
          <Heart size={12} className="text-gold-dark" /> {t('profile.interests')}
        </p>
        <div className="flex flex-wrap gap-2">
          {interests.length > 0 ? (
            interests.map(i => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-gold/10 text-gold-dark text-xs border border-gold/20"
              >
                {i}
              </span>
            ))
          ) : (
            <span className="text-xs text-mocha">—</span>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-mocha mb-2.5">
          <Sparkles size={12} className="text-brown" /> {t('profile.skills')}
        </p>
        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? (
            skills.map(s => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg bg-brown/10 text-brown text-xs border border-brown/15"
              >
                {s}
              </span>
            ))
          ) : (
            <span className="text-xs text-mocha">—</span>
          )}
        </div>
      </div>

      {/* Edit profile */}
      <button
        onClick={onEdit}
        className="mt-7 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/40 text-gold-dark text-sm font-semibold hover:bg-gold/10 transition-colors"
      >
        <Pencil size={14} /> {t('profile.editProfile')}
      </button>
    </motion.div>
  );
}
