import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Heart, Sparkles, Save, Loader2, AlertTriangle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

/**
 * Edit Profile dialog — pre-filled with the current student's data.
 * Save persists via PATCH; Cancel / X / Escape discards without
 * touching the database.
 */
export default function EditProfileModal({ open, student, saving, error, onClose, onSave }) {
  const { t } = useLang();
  const [education, setEducation] = useState('Intermediate');
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');

  // Re-seed local state every time the dialog opens (discard-on-cancel semantics)
  useEffect(() => {
    if (open && student) {
      setEducation(student.education_level || 'Intermediate');
      setInterests(student.interests || '');
      setSkills((student.skills || []).join(', '));
    }
  }, [open, student]);

  // Escape closes the dialog
  useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = e => {
    e.preventDefault();
    if (saving) return;
    onSave({
      education_level: education,
      interests: interests.trim(),
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const fieldClass =
    'w-full bg-cream border border-line rounded-xl px-4 py-2.5 text-sm text-brownDark placeholder-mocha/60 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/15 transition';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brown-dark/45 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('edit.title')}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-lg bg-parchment rounded-3xl border border-line shadow-card-hover overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-cream/60">
              <h3 className="font-display text-lg font-bold text-brownDark">{t('edit.title')}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('edit.cancel')}
                className="w-8 h-8 rounded-xl border border-line bg-parchment flex items-center justify-center text-mocha hover:text-clay hover:border-clay/30 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="p-6 space-y-5">
              {/* Education level */}
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mocha mb-2">
                  <GraduationCap size={13} className="text-gold-dark" /> {t('edit.education')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['Intermediate', 'Graduate'].map(level => (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setEducation(level)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                        education === level
                          ? 'bg-gold/15 text-gold-dark border-gold/40'
                          : 'bg-cream text-mocha border-line hover:border-gold/30'
                      }`}
                    >
                      {t(level === 'Graduate' ? 'profile.graduate' : 'profile.intermediate')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label
                  htmlFor="edit-interests"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mocha mb-2"
                >
                  <Heart size={13} className="text-gold-dark" /> {t('edit.interests')}
                </label>
                <textarea
                  id="edit-interests"
                  rows={2}
                  value={interests}
                  onChange={e => setInterests(e.target.value)}
                  className={fieldClass}
                />
                <p className="mt-1.5 text-[11px] text-mocha">{t('edit.interestsHint')}</p>
              </div>

              {/* Skills */}
              <div>
                <label
                  htmlFor="edit-skills"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-mocha mb-2"
                >
                  <Sparkles size={13} className="text-brown" /> {t('edit.skills')}
                </label>
                <textarea
                  id="edit-skills"
                  rows={2}
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  className={fieldClass}
                />
                <p className="mt-1.5 text-[11px] text-mocha">{t('edit.skillsHint')}</p>
              </div>

              {/* Save error */}
              {error && (
                <div className="flex items-start gap-2 bg-clay/10 border border-clay/25 text-clay text-xs rounded-xl px-3.5 py-2.5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-mocha hover:text-brownDark hover:border-brown/25 transition-colors disabled:opacity-50"
                >
                  {t('edit.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-brown text-white text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? t('edit.saving') : t('edit.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
