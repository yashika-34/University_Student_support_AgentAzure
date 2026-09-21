import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ModalPortal from '../components/ModalPortal.jsx';
import {
  Briefcase,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  Send,
  Award,
  Upload,
  AlertCircle,
  X,
  Clock,
  MapPin,
  Users,
  Target,
  Star,
  TrendingUp,
  BookOpen,
  Zap,
  GraduationCap,
  RefreshCw,
  ChevronRight,
  DollarSign,
  BarChart3,
  MessageSquare,
  Loader2
} from 'lucide-react';

/* ─── Shared Modal Overlay Style ───────────────────────────────────── */
const overlayStyle = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1.5rem',
  animation: 'fadeIn 0.25s ease'
};
const modalBoxStyle = {
  background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-subtle)', width: '100%',
  maxWidth: '680px', maxHeight: '90vh', display: 'flex',
  flexDirection: 'column', animation: 'scaleIn 0.25s ease',
  boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
};
const modalHeaderStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)',
  position: 'sticky', top: 0, background: 'var(--bg-card)',
  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', zIndex: 1
};
const modalBodyStyle = {
  padding: '1.5rem', overflowY: 'auto', flex: 1
};

/* ─── Spinner Component ─────────────────────────────────────────────── */
const Spinner = ({ text = 'Loading...' }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-muted)' }}>
    <RefreshCw size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
    <span style={{ fontSize: '0.9rem' }}>{text}</span>
  </div>
);

/* ─── Stat Card ──────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', flex: 1, minWidth: '160px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
      <Icon size={16} color={color || 'var(--primary)'} />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color || 'var(--primary)', lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   CAREER HUB PAGE — Main Component
   ═══════════════════════════════════════════════════════════════════════ */
const CareerHubPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('placement');

  /* ── Placement State ───────────────────────────────────────────────── */
  const [studentCgpa, setStudentCgpa] = useState('');
  const [studentBacklogs, setStudentBacklogs] = useState('0');
  const [placements, setPlacements] = useState([]);
  const [placementsLoading, setPlacementsLoading] = useState(false);
  const [placementError, setPlacementError] = useState('');
  const [eligibleCount, setEligibleCount] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);

  // Registration modal
  const [registerModal, setRegisterModal] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  /* ── Resume Analyzer State ─────────────────────────────────────────── */
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Fullstack Cloud Engineer');
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  const [resumeError, setResumeError] = useState('');

  /* ── Career Counselor State ────────────────────────────────────────── */
  const [counselorInterest, setCounselorInterest] = useState('Cloud & AI Architecture');
  const [counselorSemester, setCounselorSemester] = useState('5');
  const [counselorData, setCounselorData] = useState(null);
  const [counselorLoading, setCounselorLoading] = useState(false);
  const [counselorModalOpen, setCounselorModalOpen] = useState(false);

  /* ── Mock Interview State ──────────────────────────────────────────── */
  const [interviewRole, setInterviewRole] = useState('Fullstack Engineer');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [interviewResult, setInterviewResult] = useState(null);
  const [isEvaluatingInterview, setIsEvaluatingInterview] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState([]);

  const interviewQuestions = [
    { id: 1, question: 'Explain how the React Virtual DOM diffing algorithm minimizes layout reflows and optimizes real-time state updates in enterprise single-page applications.', category: 'Frontend Engineering' },
    { id: 2, question: 'How do you structure database indexing in MongoDB to optimize queries with multiple filter keys?', category: 'Backend Architecture' },
    { id: 3, question: 'Describe a situation where an assignment deliverable had ambiguous requirements. How did you resolve it?', category: 'Behavioral / Teamwork' },
    { id: 4, question: 'Explain the differences between SQL and NoSQL databases. When would you choose one over the other?', category: 'Database Design' },
    { id: 5, question: 'What are microservices? Discuss the pros and cons compared to monolithic architecture.', category: 'System Design' },
    { id: 6, question: 'Describe how you would implement authentication and authorization in a REST API.', category: 'Backend Security' }
  ];

  /* ── Placement Fetch ───────────────────────────────────────────────── */
  const fetchPlacements = useCallback(async () => {
    setPlacementsLoading(true);
    setPlacementError('');
    try {
      const cgpaVal = parseFloat(studentCgpa) || 0;
      const backlogVal = parseInt(studentBacklogs, 10) || 0;
      const res = await api.post('/career/check-placement', {
        cgpa: cgpaVal,
        backlogs: backlogVal,
        department: user?.profile?.department || 'Computer Science'
      });
      if (res.data?.data?.companies) {
        setPlacements(res.data.data.companies);
        setEligibleCount(res.data.data.eligibleCount || 0);
        setTotalDrives(res.data.data.totalDrives || 0);
      }
    } catch (err) {
      console.error('Failed to fetch placements:', err);
      setPlacementError('Unable to load placement drives. Please try again.');
    } finally {
      setPlacementsLoading(false);
    }
  }, [studentCgpa, studentBacklogs, user]);

  // Auto-fetch on mount and when CGPA/backlogs change (debounced)
  useEffect(() => {
    // Set initial CGPA from user profile
    if (user?.profile?.cgpa && !studentCgpa) {
      const raw = Number(user.profile.cgpa);
      const val = raw <= 4.0 ? (raw * 2.5).toFixed(2) : String(raw);
      setStudentCgpa(val);
    } else if (!studentCgpa) {
      setStudentCgpa('8.65');
    }
  }, [user]);

  useEffect(() => {
    if (!studentCgpa) return;
    const timer = setTimeout(() => fetchPlacements(), 500);
    return () => clearTimeout(timer);
  }, [studentCgpa, studentBacklogs, fetchPlacements]);

  /* ── Resume ATS Analysis ───────────────────────────────────────────── */
  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      setResumeError('Please paste your resume content to analyze.');
      return;
    }
    setResumeError('');
    setIsAnalyzingResume(true);
    try {
      const res = await api.post('/career/analyze-resume', { resumeText, targetRole });
      if (res.data?.data) {
        setAtsAnalysis({
          score: res.data.data.atsScore,
          grade: res.data.data.grade,
          matched: res.data.data.matchedKeywords || [],
          missing: res.data.data.missingKeywords || [],
          feedback: res.data.data.feedback || []
        });
        setAtsModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to analyze resume:', err);
      setResumeError('Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzingResume(false);
    }
  };

  /* ── Career Counselor Fetch ────────────────────────────────────────── */
  const handleFetchCounseling = async () => {
    setCounselorLoading(true);
    try {
      const res = await api.post('/career/career-counseling', {
        primaryInterest: counselorInterest,
        semester: parseInt(counselorSemester, 10) || 5
      });
      if (res.data?.data) {
        setCounselorData(res.data.data);
        setCounselorModalOpen(true);
      }
    } catch (err) {
      console.error('Career counseling failed:', err);
    } finally {
      setCounselorLoading(false);
    }
  };

  /* ── Mock Interview Evaluation ─────────────────────────────────────── */
  const handleEvaluateInterview = async () => {
    if (!interviewAnswer.trim()) return;
    setIsEvaluatingInterview(true);
    try {
      const currentQ = interviewQuestions[currentQuestionIdx];
      const res = await api.post('/career/simulate-interview', {
        role: interviewRole,
        questionId: currentQ.id,
        answerText: interviewAnswer
      });
      if (res.data?.data) {
        setInterviewResult(res.data.data);
        setInterviewHistory(prev => [...prev, {
          question: currentQ.question,
          category: currentQ.category,
          score: res.data.data.score,
          answer: interviewAnswer.substring(0, 100) + '...'
        }]);
        setInterviewModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to evaluate interview:', err);
    } finally {
      setIsEvaluatingInterview(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIdx((prev) => (prev + 1) % interviewQuestions.length);
    setInterviewAnswer('');
    setInterviewResult(null);
    setInterviewModalOpen(false);
  };

  /* ── Registration Modal Handler ────────────────────────────────────── */
  const handleRegister = (drive) => {
    setRegisterModal(drive);
    setRegisterSuccess(false);
  };

  const confirmRegistration = () => {
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterModal(null);
      setRegisterSuccess(false);
    }, 2500);
  };

  /* ── Tab Configuration ─────────────────────────────────────────────── */
  const tabs = [
    { id: 'placement', label: 'Placement Eligibility', icon: Briefcase },
    { id: 'resume', label: 'ATS Resume Analyzer', icon: Upload },
    { id: 'counselor', label: 'AI Career Counselor', icon: Compass },
    { id: 'interview', label: 'Mock Interview', icon: Sparkles }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <Briefcase size={16} /> Corporate Placement &amp; Career Gateway
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Career &amp; Placement Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Evaluate corporate eligibility cutoffs, analyze your resume with ATS scoring, chart career roadmaps, and practice with AI mock interviews.
        </p>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.65rem 1.1rem', borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
         TAB 1 — Placement Eligibility Checker
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'placement' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="var(--primary)" /> On-Campus Recruitment Drives
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Screening based on verified academic credentials, CGPA cutoffs, and active backlog allowances.
              </p>
            </div>
          </div>

          {/* Editable CGPA / Backlogs Inputs */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: '0 0 170px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Your CGPA (out of 10.0)</label>
              <input
                type="number"
                className="form-input"
                value={studentCgpa}
                onChange={(e) => setStudentCgpa(e.target.value)}
                min="0" max="10" step="0.01"
                placeholder="e.g. 8.65"
                style={{ fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, flex: '0 0 160px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Active Backlogs</label>
              <input
                type="number"
                className="form-input"
                value={studentBacklogs}
                onChange={(e) => setStudentBacklogs(e.target.value)}
                min="0" max="20"
                style={{ fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
            <button onClick={fetchPlacements} className="btn btn-primary" style={{ height: '42px' }} disabled={placementsLoading}>
              <RefreshCw size={14} /> Check Eligibility
            </button>
          </div>

          {/* Summary Stats */}
          {!placementsLoading && placements.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <StatCard icon={Briefcase} label="Total Drives" value={totalDrives} color="var(--primary)" sub="Active on-campus drives" />
              <StatCard icon={CheckCircle2} label="Eligible" value={eligibleCount} color="var(--success)" sub="You can apply" />
              <StatCard icon={XCircle} label="Not Eligible" value={totalDrives - eligibleCount} color="var(--danger)" sub="Cutoff unmet" />
              <StatCard icon={TrendingUp} label="Match Rate" value={`${totalDrives > 0 ? Math.round((eligibleCount / totalDrives) * 100) : 0}%`} color="var(--accent-purple)" sub="Eligibility percentage" />
            </div>
          )}

          {/* Error / Loading / Drives List */}
          {placementError && (
            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} /> {placementError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {placementsLoading ? (
              <Spinner text="Fetching placement drives from database..." />
            ) : placements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p>No placement drives found. Check back soon or contact the placement cell.</p>
              </div>
            ) : placements.map((drive) => {
              const isEligible = drive.isEligible;
              const packageDisplay = drive.packageLPA ? `${drive.packageLPA} LPA` : 'Competitive';
              return (
                <div
                  key={drive.id}
                  style={{
                    padding: '1.5rem', background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${isEligible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '1.25rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => isEligible && handleRegister(drive)}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{drive.tier}</span>
                      <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}>
                        {isEligible ? '✅ Eligible' : '❌ Cutoff Unmet'}
                      </span>
                      {drive.openPositions && (
                        <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                          <Users size={11} /> {drive.openPositions} positions
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.2rem' }}>{drive.name}</h3>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.4rem' }}>
                      {drive.role} &bull; <span style={{ color: 'var(--success)' }}>₹{packageDisplay}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>Min CGPA: <strong>{drive.minCgpa} / 10</strong></span>
                      <span>Max Backlogs: <strong>{drive.maxBacklogs ?? 'N/A'}</strong></span>
                      <span><Clock size={12} /> Deadline: {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    {drive.statusReason && !isEligible && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--danger)', fontStyle: 'italic' }}>
                        ⚠️ {drive.statusReason}
                      </div>
                    )}
                  </div>

                  <div>
                    {isEligible ? (
                      <button className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }} onClick={(e) => { e.stopPropagation(); handleRegister(drive); }}>
                        <CheckCircle2 size={16} /> Register
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.85rem' }}>
                        <XCircle size={16} /> Ineligible
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 2 — ATS Resume Analyzer
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'resume' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--primary)" /> Intelligent Resume ATS Parser &amp; Scoring
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Paste your resume text to evaluate keyword match index, industry phrasing, and ATS rejection risks.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {/* Target Role */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Target Role</label>
              <select
                className="form-input"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              >
                <option value="Fullstack Cloud Engineer">Fullstack Cloud Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Cloud Architect">Cloud Architect</option>
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Software Development Engineer">Software Development Engineer</option>
              </select>
            </div>

            {/* Resume Text */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Resume Content / Experience Summary</label>
              <textarea
                rows={10}
                className="form-textarea"
                value={resumeText}
                onChange={(e) => { setResumeText(e.target.value); setResumeError(''); }}
                placeholder="Paste your full resume text here... Include your skills, experience, projects, education, and certifications for the most accurate ATS analysis."
                style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {resumeText.length} characters • {resumeText.split(/\s+/).filter(Boolean).length} words
                </span>
                {resumeText.length > 0 && resumeText.length < 200 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                    ⚠️ Add more content for accurate analysis (min 200 chars)
                  </span>
                )}
              </div>
            </div>

            {resumeError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={14} /> {resumeError}
              </div>
            )}

            <button onClick={handleAnalyzeResume} className="btn btn-primary" disabled={isAnalyzingResume} style={{ width: '100%', padding: '0.85rem' }}>
              {isAnalyzingResume ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Parsing Technical Keywords...</>
              ) : (
                <><BarChart3 size={16} /> Run ATS Match Analysis</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 3 — AI Career Counselor
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'counselor' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={20} color="var(--accent-purple)" /> Guided Career Counselor &amp; Roadmap
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Get AI-modeled competency paths tailored to your program and career interests.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Career Interest / Domain</label>
              <select
                className="form-input"
                value={counselorInterest}
                onChange={(e) => setCounselorInterest(e.target.value)}
              >
                <option value="Cloud & AI Architecture">Cloud & AI Architecture</option>
                <option value="Frontend Engineering">Frontend Engineering</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Product Management">Product Management</option>
                <option value="DevOps & SRE">DevOps & SRE</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Current Semester</label>
              <select
                className="form-input"
                value={counselorSemester}
                onChange={(e) => setCounselorSemester(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleFetchCounseling}
            className="btn btn-primary"
            disabled={counselorLoading}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {counselorLoading ? (
              <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Career Path...</>
            ) : (
              <><Compass size={16} /> Generate Personalized Career Roadmap</>
            )}
          </button>

          {/* Static Career Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
            <StatCard icon={DollarSign} label="Avg Starting Salary" value="₹18-30 LPA" color="var(--success)" sub="Cloud & AI roles" />
            <StatCard icon={TrendingUp} label="Market Growth" value="+34%" color="var(--primary)" sub="5-year projected demand" />
            <StatCard icon={Award} label="Top Skill" value="Kubernetes" color="var(--accent-purple)" sub="Most sought-after skill" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         TAB 4 — AI Mock Interview Simulator
         ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'interview' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary)" /> Interactive AI Mock Interview Studio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Answer realistic technical and behavioral questions. Receive real-time assessment and feedback.
          </p>

          {/* Interview Role Selection */}
          <div className="form-group" style={{ margin: '0 0 1.25rem 0' }}>
            <label className="form-label">Target Role</label>
            <select
              className="form-input"
              value={interviewRole}
              onChange={(e) => setInterviewRole(e.target.value)}
            >
              <option value="Fullstack Engineer">Fullstack Engineer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Cloud Engineer">Cloud Engineer</option>
              <option value="Data Engineer">Data Engineer</option>
            </select>
          </div>

          {/* Interview History Summary */}
          {interviewHistory.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                📊 Session Summary — {interviewHistory.length} question{interviewHistory.length > 1 ? 's' : ''} answered
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Avg Score: <strong style={{ color: 'var(--success)' }}>
                    {Math.round(interviewHistory.reduce((s, h) => s + h.score, 0) / interviewHistory.length)}
                  </strong>/100
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Best: <strong style={{ color: 'var(--primary)' }}>
                    {Math.max(...interviewHistory.map(h => h.score))}
                  </strong>/100
                </span>
              </div>
            </div>
          )}

          {/* Current Question */}
          <div style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                {interviewQuestions[currentQuestionIdx].category}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Question {currentQuestionIdx + 1} of {interviewQuestions.length}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5 }}>
              "{interviewQuestions[currentQuestionIdx].question}"
            </div>
          </div>

          <div className="form-group" style={{ margin: '0 0 1rem 0' }}>
            <label className="form-label">Your Response</label>
            <textarea
              rows={6}
              className="form-textarea"
              placeholder="State your conceptual answer, architectural heuristics, and practical trade-offs..."
              value={interviewAnswer}
              onChange={(e) => setInterviewAnswer(e.target.value)}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {interviewAnswer.length} characters • Tip: Include specific technical terms for higher scores
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handleEvaluateInterview} className="btn btn-primary" disabled={isEvaluatingInterview || !interviewAnswer.trim()} style={{ flex: 1 }}>
              {isEvaluatingInterview ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating...</>
              ) : (
                <><Send size={16} /> Submit for AI Critique</>
              )}
            </button>
            <button onClick={handleNextQuestion} className="btn" style={{ flex: '0 0 auto', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <ChevronRight size={16} /> Skip / Next
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — Placement Registration
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={!!registerModal}>
        {registerModal && (
          <div style={overlayStyle} onClick={() => setRegisterModal(null)}>
            <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Briefcase size={18} color="var(--primary)" />
                  {registerSuccess ? 'Registration Confirmed!' : 'Register for Placement Drive'}
                </h3>
                <button className="icon-btn" onClick={() => setRegisterModal(null)} style={{ width: 32, height: 32 }}>
                  <X size={16} />
                </button>
              </div>
              <div style={modalBodyStyle}>
                {registerSuccess ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <CheckCircle2 size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--success)' }}>
                      Successfully Registered!
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      You have been registered for <strong>{registerModal.name}</strong>. Check your email for further instructions.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem' }}>{registerModal.name}</h4>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{registerModal.role}</div>
                      <span className="badge badge-success">₹{registerModal.packageLPA} LPA</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min CGPA Required</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.minCgpa} / 10.0</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Backlogs</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.maxBacklogs}</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Open Positions</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.openPositions || 'N/A'}</div>
                      </div>
                      <div style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deadline</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{registerModal.deadline ? new Date(registerModal.deadline).toLocaleDateString() : 'TBD'}</div>
                      </div>
                    </div>

                    {registerModal.requiredSkills && registerModal.requiredSkills.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Required Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {registerModal.requiredSkills.map((skill) => (
                            <span key={skill} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} /> <strong>You meet all eligibility criteria for this drive.</strong>
                      </div>
                    </div>

                    <button onClick={confirmRegistration} className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}>
                      <CheckCircle2 size={16} /> Confirm Registration
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — ATS Resume Analysis Results
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={atsModalOpen}>
        <div style={overlayStyle} onClick={() => setAtsModalOpen(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="var(--primary)" /> ATS Analysis Report
              </h3>
              <button className="icon-btn" onClick={() => setAtsModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {atsAnalysis && (
                <>
                  {/* Score */}
                  <div style={{ textAlign: 'center', padding: '1.5rem 0 2rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ATS Compatibility Score</div>
                    <div style={{
                      fontSize: '4.5rem', fontWeight: 800, lineHeight: 1,
                      background: atsAnalysis.score >= 70 ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                      {atsAnalysis.score}%
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '0.3rem' }}>
                      <span className={`badge ${atsAnalysis.score >= 80 ? 'badge-success' : atsAnalysis.score >= 65 ? 'badge-primary' : 'badge-danger'}`}>
                        {atsAnalysis.grade || (atsAnalysis.score >= 80 ? 'Optimal Match' : atsAnalysis.score >= 65 ? 'Competitive' : 'Needs Work')}
                      </span>
                    </div>
                  </div>

                  {/* Matched Keywords */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={14} /> Matched Keywords ({atsAnalysis.matched.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {atsAnalysis.matched.map((k) => (
                        <span key={k} className="badge badge-success" style={{ fontSize: '0.75rem' }}>{k}</span>
                      ))}
                      {atsAnalysis.matched.length === 0 && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No keywords matched yet</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  {atsAnalysis.missing.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertCircle size={14} /> Missing Keywords ({atsAnalysis.missing.length})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {atsAnalysis.missing.map((k) => (
                          <span key={k} className="badge badge-danger" style={{ fontSize: '0.75rem' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Zap size={14} color="var(--primary)" /> Key Recommendations
                    </div>
                    <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                      {atsAnalysis.feedback.map((f, i) => (
                        <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.5 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — Career Counselor Roadmap
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={counselorModalOpen}>
        <div style={overlayStyle} onClick={() => setCounselorModalOpen(false)}>
          <div style={{ ...modalBoxStyle, maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={18} color="var(--accent-purple)" /> Your Career Roadmap
              </h3>
              <button className="icon-btn" onClick={() => setCounselorModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {counselorData && (
                <>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{counselorData.title}</h2>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <StatCard icon={DollarSign} label="Starting Salary" value={counselorData.expectedStartingSalary?.split('/')[0]?.trim() || '₹18+ LPA'} color="var(--success)" />
                    <StatCard icon={TrendingUp} label="Growth Outlook" value={counselorData.growthOutlook?.split('(')[0]?.trim() || '+30%'} color="var(--primary)" />
                  </div>

                  {/* Key Competencies */}
                  {counselorData.keyCompetencies && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Target size={14} color="var(--primary)" /> Core Competencies
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {counselorData.keyCompetencies.map((c) => (
                          <span key={c} className="badge badge-primary" style={{ fontSize: '0.78rem' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {counselorData.certificationsRecommended && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Award size={14} color="var(--accent-purple)" /> Recommended Certifications
                      </h4>
                      {counselorData.certificationsRecommended.map((cert, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0', borderBottom: i < counselorData.certificationsRecommended.length - 1 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.88rem' }}>
                          <GraduationCap size={14} color="var(--text-muted)" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Electives */}
                  {counselorData.nextElectives && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={14} color="var(--success)" /> Recommended Electives
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {counselorData.nextElectives.map((e) => (
                          <span key={e} className="badge badge-success" style={{ fontSize: '0.78rem' }}>{e}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestone Roadmap */}
                  {counselorData.milestones && (
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} color="var(--primary)" /> Semester Milestone Roadmap
                      </h4>
                      {counselorData.milestones.map((step, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '1rem',
                            padding: '1rem 1.25rem', marginBottom: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: idx === 0 ? 'rgba(59,130,246,0.08)' : 'var(--bg-input)',
                            border: idx === 0 ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border-subtle)'
                          }}
                        >
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: idx === 0 ? 'var(--primary)' : '#334155',
                            color: '#ffffff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{step.phase}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{step.goal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════
         MODAL — Interview Evaluation Result
         ═══════════════════════════════════════════════════════════════ */}
      <ModalPortal isOpen={interviewModalOpen}>
        <div style={overlayStyle} onClick={() => setInterviewModalOpen(false)}>
          <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={18} color="var(--primary)" /> AI Interview Assessment
              </h3>
              <button className="icon-btn" onClick={() => setInterviewModalOpen(false)} style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>
            <div style={modalBodyStyle}>
              {interviewResult && (
                <>
                  {/* Score Display */}
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
                    <div style={{
                      fontSize: '4rem', fontWeight: 800, lineHeight: 1,
                      background: interviewResult.score >= 80 ? 'linear-gradient(135deg, #10b981, #34d399)' : interviewResult.score >= 60 ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                      {interviewResult.score}/100
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className={`badge ${interviewResult.score >= 80 ? 'badge-success' : interviewResult.score >= 60 ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: '0.85rem' }}>
                        {interviewResult.score >= 90 ? '🏆 Exceptional' : interviewResult.score >= 80 ? '✅ Strong' : interviewResult.score >= 60 ? '📝 Good' : '⚠️ Needs Improvement'}
                      </span>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Assessment Notes</h4>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{interviewResult.notes}</p>
                  </div>

                  {/* Strengths */}
                  {interviewResult.strengths && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--success)' }}>💪 Strengths</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {interviewResult.strengths.map((s, i) => (
                          <span key={i} className="badge badge-success" style={{ fontSize: '0.78rem' }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvement Tip */}
                  <div style={{ padding: '1rem 1.25rem', background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.3rem' }}>💡 Improvement Tip</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{interviewResult.improvement}</p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleNextQuestion} className="btn btn-primary" style={{ flex: 1 }}>
                      <ChevronRight size={16} /> Next Question
                    </button>
                    <button onClick={() => setInterviewModalOpen(false)} className="btn" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                      Review Answer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
};

export default CareerHubPage;
