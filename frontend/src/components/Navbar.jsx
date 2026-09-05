import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ChevronDown, Languages, LogOut, UserPlus, LogIn, Menu, X } from 'lucide-react';
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

/** Segmented EN / اردو language toggle — shared by desktop bar and mobile panel. */
function LangToggle({ id }) {
  const { t, lang, setLang } = useLang();
  return (
    <div
      className="flex items-center rounded-xl border border-line bg-sand p-0.5"
      title={t('lang.label')}
      role="group"
      aria-label={t('lang.label')}
    >
      <Languages size={14} className="mx-1.5 text-brown-light" />
      {['en', 'ur'].map(code => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
            lang === code ? 'text-white' : 'text-brownDark'
          }`}
        >
          {lang === code && (
            <motion.span
              layoutId={`${id}-lang-pill`}
              className="absolute inset-0 bg-gradient-to-r from-gold-dark to-brown rounded-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">{code === 'en' ? 'EN' : 'اردو'}</span>
        </button>
      ))}
    </div>
  );
}

export default function Navbar({ currentUser, onLogout, onOpenAuth }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const headerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close mobile panel on outside click or Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onClick = e => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMobileOpen(false);
    };
    const onKey = e => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 bg-parchment/85 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* LEFT SIDE: Brand Logo & Title */}
        <a href="#dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-brown flex items-center justify-center shadow-sm">
            <Compass size={18} className="text-white" />
          </span>
          <span className="leading-tight">
            <span className="block font-display font-bold text-brownDark text-lg">{t('app.name')}</span>
            <span className="hidden sm:block text-[11px] text-mocha">{t('app.tagline')}</span>
          </span>
        </a>

        {/* CENTER: Navigation Links (Only logged in) */}
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

        {/* RIGHT SIDE: Language Toggle & Auth Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Toggle */}
          <div className="hidden sm:block">
            <LangToggle id="desktop" />
          </div>

          {/* Auth Button / Profile Dropdown */}
          {currentUser ? (
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
            <>
              {/* Desktop Login Button */}
              <button
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-dark to-brown text-white text-sm font-bold shadow hover:opacity-90 transition-opacity"
              >
                <LogIn size={14} />
                {t('auth.login')}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                aria-expanded={mobileOpen}
                aria-haspopup="menu"
                aria-label={t('landing.menu')}
                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-line bg-parchment text-brownDark hover:border-gold/50 transition-colors"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {!currentUser && mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="sm:hidden overflow-hidden border-t border-line bg-parchment"
          >
            <div className="px-4 py-4 flex flex-col items-stretch gap-3">
              <div className="flex justify-center">
                <LangToggle id="mobile" />
              </div>
              <button
                onClick={() => { setMobileOpen(false); onOpenAuth(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gold-dark to-brown text-white text-sm font-bold shadow hover:opacity-90 transition-opacity"
              >
                <LogIn size={16} />
                {t('auth.login')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}