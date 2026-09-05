import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Compass, Sparkles } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import CommandCenter from './components/CommandCenter.jsx';
import SkillsSection from './components/SkillsSection.jsx';
import MarketSection from './components/MarketSection.jsx';
import PlanSection from './components/PlanSection.jsx';
import EditProfileModal from './components/EditProfileModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import LandingPage from './components/LandingPage.jsx';
import {
  analyze, toggleTask, updateStudent, getMe, logout as apiLogout,
  getToken, setToken, fetchStudentRoadmap,
} from './api.js';
import { useLang } from './i18n/LanguageContext.jsx';

const N_STEPS = 6;
const STEP_MS = 650;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function composeReply(d, t) {
  const match = d.skillAnalysis.matchPercentage;
  const gaps = d.skillAnalysis.gaps || [];
  const role = d.targetRole || (d.marketAnalysis && d.marketAnalysis.role_title) || '';
  const name = (d.student && d.student.name) || '';
  const parts = [
    t(match >= 50 ? 'coach.recStrong' : match >= 25 ? 'coach.recModerate' : 'coach.recEarly', { name, role }),
  ];
  if (gaps.length === 0) parts.push(t('coach.recSkillsNone'));
  else if (gaps.length <= 2) parts.push(t('coach.recSkillsFew', { n: gaps.length, gaps: gaps.join(', ') }));
  else parts.push(t('coach.recSkillsMany', { n: gaps.length, gaps: gaps.slice(0, 2).join(', ') }));
  const m = d.marketAnalysis;
  parts.push(
    m.remote_demand >= 85
      ? t('coach.recMarketRemote', { role, pct: m.remote_demand })
      : t('coach.recMarketLocal', { role, pct: m.local_demand })
  );
  parts.push(t('coach.recProject', { project: (d.portfolioProject && d.portfolioProject.title) || '' }));
  parts.push(t('coach.recPlan'));
  parts.push(t('coach.recScore', { score: d.readinessScore }));
  return parts.join(' ');
}

function buildSummaries(d, t) {
  const role = d.targetRole || (d.marketAnalysis && d.marketAnalysis.role_title) || '';
  const totalTasks = (d.weeklyTasks || []).reduce((s, w) => s + w.tasks.length, 0);
  return [
    t('cc.sumProfile', { name: (d.student && d.student.name) || '' }),
    t('cc.sumStrengths', { s: d.skillAnalysis.strengths.length, g: d.skillAnalysis.gaps.length }),
    t('cc.sumDemand', { pct: d.marketAnalysis.remote_demand }),
    t('cc.sumPath', { role }),
    t('cc.sumTasks', { n: totalTasks, title: (d.portfolioProject && d.portfolioProject.title) || '' }),
    t('cc.sumScore', { score: d.readinessScore }),
  ];
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

function LoadingCard({ t }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
      }}
      className="bg-parchment rounded-3xl border border-line shadow-card p-12 flex flex-col items-center justify-center min-h-[280px]"
    >
      <Loader2 size={28} className="animate-spin text-gold-dark" />
      <p className="mt-4 text-sm text-mocha">{t('common.loading')}</p>
    </motion.div>
  );
}

export default function App() {
  const { t, lang } = useLang();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null); // full student object
  const [authLoading, setAuthLoading] = useState(true);  // checking stored token on boot
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // which tab the auth modal opens on

  // Student + analysis state
  const [student, setStudent] = useState(null);
  const [studentId, setStudentId] = useState(null);

  // Analysis + chat
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [typing, setTyping] = useState(false);

  // Command Center
  const [ccPhase, setCcPhase] = useState('idle');
  const [stepStates, setStepStates] = useState(Array(N_STEPS).fill('idle'));
  const [stepSummaries, setStepSummaries] = useState(Array(N_STEPS).fill(null));
  const [ccError, setCcError] = useState(null);

  // Edit Profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  const studentIdRef = useRef(null);
  const timersRef = useRef([]);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => () => clearTimers(), []);

  const resetCommandCenter = useCallback(() => {
    clearTimers();
    setStepStates(Array(N_STEPS).fill('idle'));
    setStepSummaries(Array(N_STEPS).fill(null));
    setCcPhase('idle');
    setCcError(null);
  }, []);

  /** Opens the auth modal on a specific tab ('login' | 'signup'). */
  const openAuth = useCallback(mode => {
    setAuthMode(mode || 'login');
    setAuthModalOpen(true);
  }, []);

  // ── Boot: restore session from stored token ──────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthLoading(false); return; }
    setAuthLoading(true);
    getMe()
      .then(res => {
        if (res && res.student) {
          applyAuthSuccess(res);
        }
      })
      .catch(() => {
        setToken(null); // invalid/expired token → clear
      })
      .finally(() => setAuthLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Shared handler for both login and signup success responses.
   * Expects: { token, student, analysis }
   */
  function applyAuthSuccess(res) {
    const s = res.student;
    setCurrentUser(s);
    setStudent(s);
    setStudentId(s.id);
    studentIdRef.current = s.id;
    setAuthModalOpen(false);
    setMessages([]);
    resetCommandCenter();

    // Hydrate dashboard with initial analysis if present
    if (res.analysis && res.analysis.success) {
      const a = res.analysis;
      setAnalysis(a);
      setCcPhase('complete');
      setStepStates(Array(N_STEPS).fill('complete'));
      setStepSummaries(buildSummaries(a, t));
      // Update student scores from analysis
      setStudent(prev => prev ? {
        ...prev,
        readiness_score: a.readinessScore,
        skill_match_pct: a.skillAnalysis?.matchPercentage ?? prev.skill_match_pct,
        remote_demand_pct: a.marketAnalysis?.remote_demand ?? prev.remote_demand_pct,
      } : prev);
    }
  }

  async function handleLogout() {
    try { await apiLogout(); } catch { /* ignore */ }
    setToken(null);
    setCurrentUser(null);
    setStudent(null);
    setStudentId(null);
    setAnalysis(null);
    setMessages([]);
    resetCommandCenter();
    setAuthModalOpen(false);
  }

  // ── Analyze: run the pipeline with the live step animation ──────
  async function handleSend(query) {
    if (running || studentId == null) return;
    const sid = studentId;
    setMessages(m => [...m, { role: 'user', text: query }]);
    setRunning(true);
    setTyping(true);
    setAnalysis(null);
    resetCommandCenter();
    setCcPhase('running');

    const startedAt = performance.now();
    const request = analyze(sid, query);

    for (let i = 0; i < N_STEPS; i++) {
      timersRef.current.push(setTimeout(() => {
        setStepStates(prev => prev.map((s, j) => (j === i ? 'executing' : s)));
      }, i * STEP_MS));
      timersRef.current.push(setTimeout(() => {
        setStepStates(prev => prev.map((s, j) => (j === i ? 'complete' : s)));
      }, (i + 1) * STEP_MS));
    }

    try {
      const data = await request;
      if (studentIdRef.current !== sid) return;
      if (!data || data.success === false) throw new Error((data && data.error) || 'Pipeline failed');

      const remaining = N_STEPS * STEP_MS + 80 - (performance.now() - startedAt);
      if (remaining > 0) await sleep(remaining);
      if (studentIdRef.current !== sid) return;

      clearTimers();
      setStepStates(Array(N_STEPS).fill('complete'));
      setStepSummaries(buildSummaries(data, t));
      setCcPhase('complete');
      setAnalysis(data);
      setStudent(s => s ? {
        ...s,
        readiness_score: data.readinessScore,
        skill_match_pct: data.skillAnalysis.matchPercentage,
        remote_demand_pct: data.marketAnalysis.remote_demand,
      } : s);
    } catch (err) {
      if (studentIdRef.current !== sid) return;
      clearTimers();
      const msg = err instanceof TypeError ? t('cc.errNetwork') : err.message;
      setStepStates(prev => prev.map(s => (s === 'executing' ? 'idle' : s)));
      setCcPhase('error');
      setCcError(msg);
      setMessages(m => [...m, { role: 'coach', error: true, text: `${t('common.error')}: ${msg}` }]);
    } finally {
      if (studentIdRef.current === sid) { setTyping(false); setRunning(false); }
    }
  }

  // ── Task toggle ──────────────────────────────────────────────────
  async function handleToggleTask(taskId, checked) {
    if (!analysis) return;
    const sid = studentId;
    const prevAnalysis = analysis;
    setAnalysis(a => {
      if (!a) return a;
      return {
        ...a,
        weeklyTasks: a.weeklyTasks.map(w => ({
          ...w,
          tasks: w.tasks.map(tk =>
            (tk.id || tk.task_id) === taskId ? { ...tk, status: checked ? 'completed' : 'pending' } : tk
          ),
        })),
      };
    });
    try {
      const res = await toggleTask(sid, taskId, checked ? 'completed' : 'pending');
      if (studentIdRef.current !== sid) return;
      setStudent(s => s ? {
        ...s,
        readiness_score: res.readiness_score,
        progress: { total_tasks: res.total_tasks, completed_tasks: res.completed_tasks },
      } : s);
    } catch (err) {
      if (studentIdRef.current !== sid) return;
      setAnalysis(prevAnalysis);
      const msg = err instanceof TypeError ? t('cc.errNetwork') : err.message;
      setMessages(m => [...m, { role: 'coach', error: true, text: `${t('coach.toggleFail', { task: taskId })} (${msg})` }]);
    }
  }

  // ── Edit Profile ─────────────────────────────────────────────────
  async function handleEditSave(fields) {
    if (!student || studentId == null) return;
    const sid = studentId;
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await updateStudent(sid, fields);
      if (studentIdRef.current !== sid) return;
      setStudent(prev => ({ ...prev, ...updated }));
      setCurrentUser(prev => prev ? { ...prev, ...updated } : prev);
      setAnalysis(null);
      resetCommandCenter();
      setMessages(m => [...m, { role: 'coach', text: t('coach.profileUpdated') }]);
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof TypeError ? t('cc.errNetwork') : err.message);
    } finally {
      setEditSaving(false);
    }
  }

  const finalReply = useMemo(
    () => (ccPhase === 'complete' && analysis ? composeReply(analysis, t) : null),
    [ccPhase, analysis, lang] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loading = studentId != null && !student;

  // ── Render: boot checking ────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b8860b] to-[#a0522d] flex items-center justify-center shadow-xl">
            <Compass size={30} className="text-white animate-pulse" />
          </span>
          <p className="text-sm text-mocha animate-pulse">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Render: landing when not logged in ───────────────────────────
  if (!currentUser) {
    return (
      <>
        <Navbar currentUser={null} onLogout={handleLogout} onOpenAuth={() => openAuth('login')} />
        <LandingPage onOpenAuth={openAuth} />
        <AuthModal
          open={authModalOpen}
          initialMode={authMode}
          onSuccess={applyAuthSuccess}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // ── Render: main dashboard ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream">
      <Navbar currentUser={currentUser} onLogout={handleLogout} onOpenAuth={() => openAuth('signup')} />

      <main id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome banner for newly signed-up students */}
        <AnimatePresence>
          {analysis && messages.length === 0 && (
            <motion.div
              key="welcome-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#b8860b]/15 to-[#a0522d]/10 border border-[#b8860b]/30 flex items-center gap-3"
            >
              <Sparkles size={18} className="text-[#b8860b] shrink-0" />
              <p className="text-sm font-semibold text-[#6b3f1f]">
                Welcome, {currentUser.name}! Your personalized career roadmap and skill analysis are ready below. Use the AI Coach to explore further.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-10">
          {/* Profile + readiness score */}
          <section className="grid lg:grid-cols-5 gap-6 items-stretch">
            <div className="lg:col-span-2">
              {loading ? <LoadingCard t={t} /> : <ProfileCard student={student} onEdit={() => setEditOpen(true)} />}
            </div>
            <div className="lg:col-span-3">
              {loading ? (
                <LoadingCard t={t} />
              ) : (
                <ScorePanel
                  score={student?.readiness_score ?? 0}
                  skillMatch={student?.skill_match_pct ?? 0}
                  remoteDemand={student?.remote_demand_pct ?? 0}
                  progress={student?.progress}
                  targetRole={analysis?.targetRole || student?.target_role || null}
                />
              )}
            </div>
          </section>

          {/* Coach chat + Agent Command Center */}
          <section className="grid lg:grid-cols-2 gap-6 items-start">
            <ChatPanel
              messages={messages}
              finalReply={finalReply}
              typing={typing}
              running={running}
              onSend={handleSend}
            />
            <CommandCenter
              phase={ccPhase}
              stepStates={stepStates}
              stepSummaries={stepSummaries}
              error={ccError}
              analysis={analysis}
            />
          </section>

          {/* Results */}
          <SkillsSection analysis={analysis} />
          <MarketSection analysis={analysis} />
          <PlanSection analysis={analysis} onToggleTask={handleToggleTask} />
        </motion.div>
      </main>

      <footer className="border-t border-line bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-center flex-wrap gap-2">
          <p className="text-xs text-mocha">
            {t('app.name')} — {t('app.tagline')}
          </p>
        </div>
      </footer>

      <EditProfileModal
        open={editOpen}
        student={student}
        saving={editSaving}
        error={editError}
        onClose={() => { if (!editSaving) { setEditOpen(false); setEditError(null); } }}
        onSave={handleEditSave}
      />

      <AuthModal
        open={authModalOpen}
        initialMode={authMode}
        onSuccess={applyAuthSuccess}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}