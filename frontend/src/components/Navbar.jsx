import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, Languages, Check } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

const NAV = [
  { href: '#dashboard', key: 'nav.dashboard' },
  { href: '#coach', key: 'nav.coach' },
  { href: '#pipeline', key: 'nav.pipeline' },
  { href: '#skills', key: 'nav.skills' },
  { href: '#market', key: 'nav.market' },
  { href: '#plan', key: 'nav.plan' },
];

function initials(name) {
  return (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar({ students, studentId, onSelectStudent }) {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const current = students.find(s => s.id === studentId);

  // Close the dropdown when clicking outside
  useEffect(() => {
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-parchment/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Brand */}
        <a href="#dashboard" className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-brown flex items-center justify-center shadow-sm">
            <Compass size={18} className="text-white" />
          </span>
          <span className="leading-tight">
            <span className="block font-display font-bold text-brownDark text-lg">{t('app.name')}</span>
            <span className="hidden sm:block text-[11px] text-mocha">{t('app.tagline')}</span>
          </span>
        </a>

        {/* Section nav */}
        <nav className="hidden lg:flex items-center gap-1 mx-auto">
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 text-sm text-brown-light hover:text-brown-dark hover:bg-sand rounded-lg transition-colors"
            >
              {t(n.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 ms-auto lg:ms-0">
          {/* Language toggle */}
          <div
            className="flex items-center rounded-xl border border-line bg-sand p-0.5"
            title={t('lang.label')}
          >
            <Languages size={14} className="mx-1.5 text-brown-light" />
            {['en', 'ur'].map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  lang === code ? 'text-white' : 'text-brown-light hover:text-brown-dark'
                }`}
              >
                {lang === code && (
                  <motion.span
                    layoutId="lang-pill"
                    className="absolute inset-0 bg-gradient-to-r from-gold to-brown rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{code === 'en' ? 'EN' : 'اردو'}</span>
              </button>
            ))}
          </div>

          {/* Student switcher */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-2 rounded-xl border border-line bg-parchment px-2.5 py-1.5 hover:border-gold/50 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brown to-brown-dark text-white text-[11px] font-bold flex items-center justify-center">
                {initials(current?.name)}
              </span>
              <span className="hidden md:block text-sm font-semibold text-brownDark max-w-[140px] truncate">
                {current?.name || t('student.select')}
              </span>
              <ChevronDown size={14} className={`text-brown-light transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="absolute end-0 mt-2 w-64 rounded-2xl border border-line bg-parchment shadow-card-hover overflow-hidden z-50"
                >
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-mocha">
                    {t('student.switch')}
                  </p>
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectStudent(s.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sand transition-colors ${
                        s.id === studentId ? 'bg-gold/10' : ''
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                          s.id === studentId ? 'bg-gradient-to-br from-gold to-brown' : 'bg-brown-light/60'
                        }`}
                      >
                        {initials(s.name)}
                      </span>
                      <span className="flex-1 text-start">
                        <span className="block text-sm font-semibold text-brownDark">{s.name}</span>
                        <span className="block text-[11px] text-mocha">
                          {t(s.education_level === 'Graduate' ? 'profile.graduate' : 'profile.intermediate')}
                        </span>
                      </span>
                      {s.id === studentId && <Check size={15} className="text-gold-dark shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
