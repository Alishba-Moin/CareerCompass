import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, Languages, Check, LogOut, UserPlus, User2, Sparkles } from 'lucide-react';
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

export default function Navbar({ currentUser, onLogout, onOpenAuth }) {
  const { t, lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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
        {currentUser && (
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
        )}

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

          {/* Auth area */}
          {currentUser ? (
            /* Logged-in user dropdown */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-xl border border-line bg-parchment px-2.5 py-1.5 hover:border-gold/50 transition-colors"
              >
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brown to-brown-dark text-white text-[11px] font-bold flex items-center justify-center">
                  {initials(currentUser.name)}
                </span>
                <span className="hidden md:block text-sm font-semibold text-brownDark max-w-[140px] truncate">
                  {currentUser.name}
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
                    {/* User info */}
                    <div className="px-4 pt-4 pb-3 border-b border-line">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown to-brown-dark text-white font-bold flex items-center justify-center text-sm">
                          {initials(currentUser.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-brownDark truncate">{currentUser.name}</p>
                          <p className="text-xs text-mocha truncate">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={() => { setOpen(false); onOpenAuth(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sand transition-colors text-left"
                      >
                        <span className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center">
                          <UserPlus size={15} className="text-gold-dark" />
                        </span>
                        <span className="text-sm font-semibold text-brownDark">{t('auth.newStudent')}</span>
                      </button>

                      <button
                        onClick={() => { setOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left group"
                      >
                        <span className="w-8 h-8 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center">
                          <LogOut size={15} className="text-red-500" />
                        </span>
                        <span className="text-sm font-semibold text-red-600">{t('auth.logout')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Logged-out: Sign In / Register CTA */
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#a0522d] text-white text-sm font-bold shadow hover:opacity-90 transition-opacity"
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">{t('auth.signup')} / {t('auth.login')}</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}