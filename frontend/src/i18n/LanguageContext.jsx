import { createContext, useContext, useEffect, useState } from 'react';
import en from './strings.en.json';
import ur from './strings.ur.json';

const DICTS = { en, ur };
const STORAGE_KEY = 'cc-lang';

const LanguageContext = createContext(null);

/**
 * Provides { lang, setLang, t } to the app.
 * - `t(path, vars)` resolves a dot-notation key from the active dictionary,
 *   falling back to English, with {var} interpolation.
 * - Language choice persists in localStorage.
 * - Urdu sets dir="rtl" on <html> and applies the Nastaliq font to <body>.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'ur' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.body.classList.toggle('font-urdu', lang === 'ur');
  }, [lang]);

  const t = (path, vars) => {
    const resolve = dict => path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), dict);
    let str = resolve(DICTS[lang]);
    if (str == null) str = resolve(en);
    if (str == null) return path;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.split(`{${k}}`).join(String(v));
      }
    }
    return str;
  };

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
