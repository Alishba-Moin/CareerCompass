import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Eye, EyeOff, X, User, Mail, Lock, GraduationCap,
  Compass, ChevronRight, Zap, CheckCircle2, Sparkles, BookOpen, Target, Code2
} from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

const EDUCATION_LEVELS = ['Intermediate', 'Graduate'];

const TARGET_ROLES = [
  { value: 'AI/ML Engineer', label: 'AI/ML Engineer', icon: '🤖', color: 'from-violet-500 to-purple-600' },
  { value: 'Full Stack Web Developer', label: 'Full Stack Web Dev', icon: '💻', color: 'from-blue-500 to-cyan-600' },
  { value: 'Data Analyst', label: 'Data Analyst', icon: '📊', color: 'from-emerald-500 to-green-600' },
  { value: 'Cloud Engineer', label: 'Cloud Engineer', icon: '☁️', color: 'from-sky-500 to-blue-600' },
  { value: 'Cybersecurity Engineer', label: 'Cybersecurity', icon: '🔒', color: 'from-red-500 to-rose-600' },
  { value: 'Mobile App Developer', label: 'Mobile Developer', icon: '📱', color: 'from-orange-500 to-amber-600' },
];

const PRESET_SKILLS = [
  'Python', 'JavaScript', 'HTML/CSS', 'SQL', 'React', 'Node.js',
  'Java', 'C++', 'Git', 'Linux', 'Pandas', 'NumPy', 'Excel', 'Mathematics', 'Physics',
];

const DEGREE_SUGGESTIONS = [
  'BS Computer Science', 'BS Software Engineering', 'BS Data Science',
  'Pre-Engineering (ICS)', 'Pre-Engineering (FSc)', 'BS Electrical Engineering',
  'BS Information Technology', 'Associate Degree (CS)', 'A-Levels (Science)',
];

const DEMO_USERS = [
  { email: 'ali@careercompass.pk', password: 'password123', label: 'Ali Khan', sub: 'FAST CS Graduate · AI/ML Track', color: 'from-violet-500 to-purple-600', icon: '🎓' },
  { email: 'sara@careercompass.pk', password: 'password123', label: 'Sara Ahmed', sub: 'Pre-Engineering · Web Dev Track', color: 'from-emerald-500 to-teal-600', icon: '🌟' },
];

function InputField({ id, icon: Icon, label, type = 'text', value, onChange, placeholder, error, hint, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[#3d2b1f]">{label}</label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9c7c5a] pointer-events-none">
            <Icon size={16} />
          </span>
        )}
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border px-10 py-3 text-sm text-[#2d1a0e] bg-[#fdf8f0] placeholder-[#b89a7a] outline-none transition-all
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200' : 'border-[#e0cdb8] focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c7c5a] hover:text-[#3d2b1f] transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[#9c7c5a]">{hint}</p>}
    </div>
  );
}

function SkillTag({ skill, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#b8860b]/20 to-[#a0522d]/20 border border-[#b8860b]/40 text-xs font-semibold text-[#6b3f1f]">
      {skill}
      <button type="button" onClick={() => onRemove(skill)} className="hover:text-red-500 transition-colors ml-0.5">
        <X size={11} />
      </button>
    </span>
  );
}

export default function AuthModal({ open, onSuccess }) {
  const { t } = useLang();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup step 1
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Signup step 2
  const [educationLevel, setEducationLevel] = useState('Graduate');
  const [degree, setDegree] = useState('');
  const [interests, setInterests] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [showDegreeSuggestions, setShowDegreeSuggestions] = useState(false);
  const skillInputRef = useRef(null);

  const reset = () => {
    setMode('login');
    setStep(1);
    setError('');
    setFieldErrors({});
    setLoginEmail(''); setLoginPassword('');
    setName(''); setSignupEmail(''); setSignupPassword('');
    setEducationLevel('Graduate'); setDegree(''); setInterests(''); setTargetRole(''); setSkills([]); setSkillInput('');
  };

  useEffect(() => { if (open) reset(); }, [open]);

  function addSkill(s) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  }
  function removeSkill(s) { setSkills(prev => prev.filter(x => x !== s)); }

  function validateStep1() {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!signupEmail.trim() || !signupEmail.includes('@')) errs.signupEmail = 'Valid email is required.';
    if (signupPassword.length < 6) errs.signupPassword = 'Password must be at least 6 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const { login: loginFn, setToken } = await import('../api.js');
      const res = await loginFn(loginEmail, loginPassword);
      setToken(res.token);
      onSuccess(res);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demo) {
    setLoading(true); setError('');
    try {
      const { login: loginFn, setToken } = await import('../api.js');
      const res = await loginFn(demo.email, demo.password);
      setToken(res.token);
      onSuccess(res);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!targetRole) { setError('Please select your target career role.'); return; }
    if (skills.length === 0) { setError('Please add at least one existing skill.'); return; }
    setLoading(true); setError('');
    try {
      const { signup: signupFn, setToken } = await import('../api.js');
      const res = await signupFn({
        name: name.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        education_level: educationLevel,
        stream_or_degree: degree.trim() || educationLevel,
        interests: interests.trim() || targetRole,
        skills,
        target_role: targetRole,
      });
      setToken(res.token);
      onSuccess(res);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#fdf8f0] rounded-3xl shadow-2xl border border-[#e0cdb8]"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 pt-6 pb-4 bg-[#fdf8f0] border-b border-[#ede0cc] flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b8860b] to-[#a0522d] flex items-center justify-center shadow">
              <Compass size={20} className="text-white" />
            </span>
            <div className="flex-1">
              <h2 className="font-bold text-[#2d1a0e] text-lg leading-tight">CareerCompass</h2>
              <p className="text-xs text-[#9c7c5a]">{t('auth.welcomeBanner')}</p>
            </div>
          </div>

          <div className="px-6 pb-6 pt-4">
            {/* Tab switcher */}
            <div className="flex bg-[#f5ecd9] rounded-2xl p-1 mb-5">
              {[
                { key: 'login', label: t('auth.login') },
                { key: 'signup', label: t('auth.signup') },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setMode(tab.key); setStep(1); setError(''); setFieldErrors({}); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                    mode === tab.key
                      ? 'bg-gradient-to-r from-[#b8860b] to-[#a0522d] text-white shadow'
                      : 'text-[#9c7c5a] hover:text-[#3d2b1f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
                >
                  <span className="text-red-500 text-sm mt-0.5">⚠</span>
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── LOGIN MODE ── */}
            {mode === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <InputField
                  id="login-email"
                  icon={Mail}
                  label={t('auth.email')}
                  type="email"
                  value={loginEmail}
                  onChange={setLoginEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <InputField
                  id="login-password"
                  icon={Lock}
                  label={t('auth.password')}
                  type="password"
                  value={loginPassword}
                  onChange={setLoginPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#a0522d] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" />{t('auth.loggingIn')}</> : <><Zap size={16} />{t('auth.login')}</>}
                </button>

                {/* Demo logins */}
                <div className="pt-2 border-t border-[#ede0cc]">
                  <p className="text-xs text-center text-[#9c7c5a] mb-3 font-medium">{t('auth.demoHint')}</p>
                  <div className="flex flex-col gap-2">
                    {DEMO_USERS.map(demo => (
                      <button
                        key={demo.email}
                        type="button"
                        onClick={() => handleDemoLogin(demo)}
                        disabled={loading}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#e0cdb8] bg-[#fdf8f0] hover:bg-[#f5ecd9] hover:border-[#b8860b]/40 transition-all text-left disabled:opacity-50"
                      >
                        <span className={`w-9 h-9 rounded-lg bg-gradient-to-br ${demo.color} flex items-center justify-center text-lg shadow-sm`}>
                          {demo.icon}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[#2d1a0e]">{demo.label}</div>
                          <div className="text-xs text-[#9c7c5a]">{demo.sub}</div>
                        </div>
                        <ChevronRight size={14} className="text-[#b8860b]" />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs text-[#9c7c5a]">
                  {t('auth.noAccount')}{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-[#b8860b] font-semibold hover:underline">
                    {t('auth.signup')}
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── SIGNUP MODE ── */}
            {mode === 'signup' && (
              <motion.div key="signup-form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-5">
                  {[1, 2].map(n => (
                    <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${step >= n ? 'bg-gradient-to-r from-[#b8860b] to-[#a0522d]' : 'bg-[#e0cdb8]'}`} />
                  ))}
                </div>

                {/* Step 1: Account Info */}
                {step === 1 && (
                  <form onSubmit={e => { e.preventDefault(); if (validateStep1()) { setStep(2); setError(''); } }} className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={16} className="text-[#b8860b]" />
                      <h3 className="text-sm font-bold text-[#3d2b1f]">{t('auth.step1')}</h3>
                    </div>

                    <InputField
                      id="signup-name"
                      icon={User}
                      label={t('auth.name')}
                      value={name}
                      onChange={setName}
                      placeholder="e.g. Zainab Tariq"
                      error={fieldErrors.name}
                      autoComplete="name"
                    />
                    <InputField
                      id="signup-email"
                      icon={Mail}
                      label={t('auth.email')}
                      type="email"
                      value={signupEmail}
                      onChange={setSignupEmail}
                      placeholder="you@example.com"
                      error={fieldErrors.signupEmail}
                      autoComplete="email"
                    />
                    <InputField
                      id="signup-password"
                      icon={Lock}
                      label={t('auth.password')}
                      type="password"
                      value={signupPassword}
                      onChange={setSignupPassword}
                      placeholder="Min. 6 characters"
                      error={fieldErrors.signupPassword}
                      autoComplete="new-password"
                    />

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#a0522d] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      {t('auth.continue')} <ChevronRight size={16} />
                    </button>

                    <p className="text-center text-xs text-[#9c7c5a]">
                      {t('auth.haveAccount')}{' '}
                      <button type="button" onClick={() => setMode('login')} className="text-[#b8860b] font-semibold hover:underline">
                        {t('auth.login')}
                      </button>
                    </p>
                  </form>
                )}

                {/* Step 2: Education & Skills */}
                {step === 2 && (
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={16} className="text-[#b8860b]" />
                      <h3 className="text-sm font-bold text-[#3d2b1f]">{t('auth.step2')}</h3>
                    </div>

                    {/* Education Level */}
                    <div>
                      <label className="text-sm font-semibold text-[#3d2b1f] mb-2 block">
                        <GraduationCap size={14} className="inline mr-1.5 text-[#b8860b]" />Education Level
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {EDUCATION_LEVELS.map(lvl => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setEducationLevel(lvl)}
                            className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                              educationLevel === lvl
                                ? 'border-[#b8860b] bg-[#b8860b]/10 text-[#6b3f1f]'
                                : 'border-[#e0cdb8] text-[#9c7c5a] hover:border-[#b8860b]/50'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Degree */}
                    <div className="relative">
                      <label className="text-sm font-semibold text-[#3d2b1f] mb-1.5 block">{t('auth.degree')}</label>
                      <input
                        type="text"
                        value={degree}
                        onChange={e => { setDegree(e.target.value); setShowDegreeSuggestions(true); }}
                        onFocus={() => setShowDegreeSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDegreeSuggestions(false), 150)}
                        placeholder={t('auth.degreePlaceholder')}
                        className="w-full rounded-xl border border-[#e0cdb8] px-3 py-3 text-sm text-[#2d1a0e] bg-[#fdf8f0] placeholder-[#b89a7a] outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20"
                      />
                      {showDegreeSuggestions && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-[#e0cdb8] rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                          {DEGREE_SUGGESTIONS.filter(s => s.toLowerCase().includes((degree || '').toLowerCase())).map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={() => { setDegree(s); setShowDegreeSuggestions(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-[#3d2b1f] hover:bg-[#f5ecd9] transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Role */}
                    <div>
                      <label className="text-sm font-semibold text-[#3d2b1f] mb-2 block">
                        <Target size={14} className="inline mr-1.5 text-[#b8860b]" />{t('auth.targetRole')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {TARGET_ROLES.map(role => (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setTargetRole(role.value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                              targetRole === role.value
                                ? 'border-[#b8860b] bg-[#b8860b]/10 text-[#6b3f1f]'
                                : 'border-[#e0cdb8] text-[#9c7c5a] hover:border-[#b8860b]/40'
                            }`}
                          >
                            <span className="text-base">{role.icon}</span>
                            <span className="leading-tight">{role.label}</span>
                            {targetRole === role.value && <CheckCircle2 size={13} className="ml-auto text-[#b8860b]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <label className="text-sm font-semibold text-[#3d2b1f] mb-1.5 block">{t('auth.interests')}</label>
                      <input
                        type="text"
                        value={interests}
                        onChange={e => setInterests(e.target.value)}
                        placeholder={t('auth.interestsPlaceholder')}
                        className="w-full rounded-xl border border-[#e0cdb8] px-3 py-3 text-sm text-[#2d1a0e] bg-[#fdf8f0] placeholder-[#b89a7a] outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20"
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="text-sm font-semibold text-[#3d2b1f] mb-1.5 block">
                        <Code2 size={14} className="inline mr-1.5 text-[#b8860b]" />{t('auth.skills')}
                      </label>
                      {/* Preset chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {PRESET_SKILLS.filter(s => !skills.includes(s)).slice(0, 10).map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => addSkill(s)}
                            className="px-2.5 py-1 rounded-full border border-dashed border-[#b89a7a] text-xs text-[#9c7c5a] hover:border-[#b8860b] hover:text-[#b8860b] hover:bg-[#b8860b]/5 transition-all"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                      {/* Custom skill input */}
                      <div className="flex gap-2 mb-2">
                        <input
                          ref={skillInputRef}
                          type="text"
                          value={skillInput}
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                          placeholder={t('auth.skillsPlaceholder')}
                          className="flex-1 rounded-xl border border-[#e0cdb8] px-3 py-2 text-sm text-[#2d1a0e] bg-[#fdf8f0] placeholder-[#b89a7a] outline-none focus:border-[#b8860b] focus:ring-2 focus:ring-[#b8860b]/20"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill(skillInput)}
                          className="px-4 rounded-xl bg-[#b8860b]/15 border border-[#b8860b]/30 text-xs font-bold text-[#6b3f1f] hover:bg-[#b8860b]/25 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {/* Selected skills */}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#f5ecd9] rounded-xl min-h-[36px]">
                          {skills.map(s => <SkillTag key={s} skill={s} onRemove={removeSkill} />)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => { setStep(1); setError(''); }}
                        className="flex-none px-5 py-3 rounded-xl border border-[#e0cdb8] text-sm font-semibold text-[#9c7c5a] hover:border-[#b8860b]/40 hover:text-[#3d2b1f] transition-all"
                      >
                        {t('auth.back')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#a0522d] text-white font-bold text-sm shadow hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading
                          ? <><Loader2 size={16} className="animate-spin" />{t('auth.creating')}</>
                          : <><Sparkles size={16} />{t('auth.finish')}</>}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}