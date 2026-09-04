import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import ScorePanel from './components/ScorePanel.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import CommandCenter from './components/CommandCenter.jsx';
import SkillsSection from './components/SkillsSection.jsx';
import MarketSection from './components/MarketSection.jsx';
import PlanSection from './components/PlanSection.jsx';
import EditProfileModal from './components/EditProfileModal.jsx';
import { fetchStudents, fetchStudent, analyze, toggleTask, updateStudent } from './api.js';
import { useLang } from './i18n/LanguageContext.jsx';

const N_STEPS = 6; // matches STEPS in CommandCenter.jsx
const STEP_MS = 650; // per-step animation cadence while the pipeline runs
const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Composes the coach's final reply from structured pipeline data — NOT the
 * backend's Roman-Urdu string — so English mode is clean English and Urdu
 * mode is proper Urdu script, switched purely via the dictionaries.
 */
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

/** Per-step result summaries shown under each completed Command Center step. */
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

  // Students + active student
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [student, setStudent] = useState(null);

  // Analysis + chat
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [running, setRunning] = useState(false);
  const [typing, setTyping] = useState(false);

  // Command Center
  const [ccPhase, setCcPhase] = useState('idle'); // idle | running | complete | error
  const [stepStates, setStepStates] = useState(Array(N_STEPS).fill('idle'));
  const [stepSummaries, setStepSummaries] = useState(Array(N_STEPS).fill(null));
  const [ccError, setCcError] = useState(null);

  // Edit Profile modal
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Guards against stale async writes after a student switch
  const studentIdRef = useRef(null);
  const timersRef = useRef([]);
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const resetCommandCenter = () => {
    clearTimers();
    setStepStates(Array(N_STEPS).fill('idle'));
    setStepSummaries(Array(N_STEPS).fill(null));
    setCcPhase('idle');
    setCcError(null);
  };

  // ── Boot: list all seeded students, default to the first ──
  useEffect(() => {
    let alive = true;
    fetchStudents()
      .then(data => {
        if (!alive || !data || !Array.isArray(data.students) || data.students.length === 0) return;
        setStudents(data.students);
        setStudentId(prev => (prev == null ? data.students[0].id : prev));
      })
      .catch(() => {
        /* Backend offline at boot — switcher stays empty; errors surface on Analyze. */
      });
    return () => {
      alive = false;
    };
  }, []);

  // ── Load the full record whenever the selected student changes ──
  useEffect(() => {
    if (studentId == null) return;
    let alive = true;
    studentIdRef.current = studentId;
    setStudent(null);
    setAnalysis(null);
    setMessages([]);
    setRunning(false);
    setTyping(false);
    resetCommandCenter();
    fetchStudent(studentId)
      .then(data => {
        if (alive) setStudent(data);
      })
      .catch(err => {
        if (!alive) return;
        const msg = err instanceof TypeError ? t('cc.errNetwork') : err.message;
        setMessages([{ role: 'coach', error: true, text: `${t('common.error')}: ${msg}` }]);
      });
    return () => {
      alive = false;
    };
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectStudent = id => {
    if (id === studentId) return;
    setStudentId(id);
  };

  // ── Analyze: run the pipeline with the live step animation ──
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

    // Animate IDLE → EXECUTING → COMPLETE per step while the request is in flight
    for (let i = 0; i < N_STEPS; i++) {
      timersRef.current.push(
        setTimeout(() => {
          setStepStates(prev => prev.map((s, j) => (j === i ? 'executing' : s)));
        }, i * STEP_MS)
      );
      timersRef.current.push(
        setTimeout(() => {
          setStepStates(prev => prev.map((s, j) => (j === i ? 'complete' : s)));
        }, (i + 1) * STEP_MS)
      );
    }

    try {
      const data = await request;
      if (studentIdRef.current !== sid) return; // student switched mid-run — discard
      if (!data || data.success === false) throw new Error((data && data.error) || 'Pipeline failed');

      // Let the step animation finish before revealing results
      const remaining = N_STEPS * STEP_MS + 80 - (performance.now() - startedAt);
      if (remaining > 0) await sleep(remaining);
      if (studentIdRef.current !== sid) return;

      clearTimers();
      setStepStates(Array(N_STEPS).fill('complete'));
      setStepSummaries(buildSummaries(data, t));
      setCcPhase('complete');
      setAnalysis(data);
      setStudent(s =>
        s
          ? {
              ...s,
              readiness_score: data.readinessScore,
              skill_match_pct: data.skillAnalysis.matchPercentage,
              remote_demand_pct: data.marketAnalysis.remote_demand,
            }
          : s
      );
    } catch (err) {
      if (studentIdRef.current !== sid) return;
      clearTimers();
      const msg = err instanceof TypeError ? t('cc.errNetwork') : err.message;
      setStepStates(prev => prev.map(s => (s === 'executing' ? 'idle' : s)));
      setCcPhase('error');
      setCcError(msg);
      setMessages(m => [...m, { role: 'coach', error: true, text: `${t('common.error')}: ${msg}` }]);
    } finally {
      if (studentIdRef.current === sid) {
        setTyping(false);
        setRunning(false);
      }
    }
  }

  // ── Task toggle: optimistic update, server-synced score ──
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
      setStudent(s =>
        s
          ? {
              ...s,
              readiness_score: res.readiness_score,
              progress: { total_tasks: res.total_tasks, completed_tasks: res.completed_tasks },
            }
          : s
      );
    } catch (err) {
      if (studentIdRef.current !== sid) return;
      setAnalysis(prevAnalysis); // revert the optimistic state
      const msg = err instanceof TypeError ? t('cc.errNetwork') : err.message;
      setMessages(m => [
        ...m,
        { role: 'coach', error: true, text: `${t('coach.toggleFail', { task: taskId })} (${msg})` },
      ]);
    }
  }

  // ── Edit Profile: PATCH, then refresh in place ──
  async function handleEditSave(fields) {
    if (!student || studentId == null) return;
    const sid = studentId;
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await updateStudent(sid, fields);
      if (studentIdRef.current !== sid) return;
      setStudent(prev => ({ ...prev, ...updated }));
      setStudents(list =>
        list.map(s => (s.id === sid ? { ...s, education_level: updated.education_level } : s))
      );
      // Skills/interests changed → the previous analysis is stale; drop it
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

  // Final coach reply — re-composed whenever the active language changes
  const finalReply = useMemo(
    () => (ccPhase === 'complete' && analysis ? composeReply(analysis, t) : null),
    [ccPhase, analysis, lang] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loading = studentId != null && !student;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar students={students} studentId={studentId} onSelectStudent={handleSelectStudent} />

      <main id="dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  targetRole={analysis?.targetRole || null}
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
        onClose={() => {
          if (!editSaving) {
            setEditOpen(false);
            setEditError(null);
          }
        }}
        onSave={handleEditSave}
      />
    </div>
  );
}
