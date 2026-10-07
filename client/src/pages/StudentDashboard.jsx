import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ModalPortal from '../components/ModalPortal.jsx';
import FlashcardModal from '../components/flashcards/FlashcardModal.jsx';
import GhostModeSimulatorModal from '../components/exam/GhostModeSimulatorModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  studentAPI,
  attendanceAPI,
  assignmentAPI,
  marksAPI,
  examAPI,
  noticeAPI,
  flashcardAPI
} from '../services/api.js';
import {
  Sparkles, AlertTriangle, Clock, BookOpen, HelpCircle,
  CalendarCheck, MessageSquare, TrendingUp, Bell, Loader2, X, MapPin, Compass,
  Flame, Layers, CheckCircle2, Zap, Brain, Play, LifeBuoy,
  Cpu
} from 'lucide-react';
import { SkeletonStatGrid, SkeletonChart, SkeletonCard, SkeletonTable } from '../components/common/Skeleton.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
// ── Extracted Sub-Components (Phase 1 Refactor) ──────────────────────────────
import WelcomeBanner from '../components/dashboard/WelcomeBanner.jsx';
import StatsGrid from '../components/dashboard/StatsGrid.jsx';
import GpaSimulator from '../components/dashboard/GpaSimulator.jsx';
import KnowledgeGraph from '../components/dashboard/KnowledgeGraph.jsx';
import StudyGroupMatcher from '../components/dashboard/StudyGroupMatcher.jsx';
import StudySchedule from '../components/dashboard/StudySchedule.jsx';

// Animated Counter Component for dynamic stats
const AnimatedNumber = ({ value, duration = 1200, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = parseFloat(value) || 0;
    if (target === 0) {
      setDisplayValue(0);
      return;
    }
    const startTime = performance.now();
    let animFrame;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = ease * target;
      setDisplayValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        animFrame = requestAnimationFrame(update);
      }
    };

    animFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrame);
  }, [value, duration, decimals]);

  return <span>{decimals > 0 ? Number(displayValue).toFixed(decimals) : displayValue}</span>;
};

const StudentDashboard = () => {
  const { user, theme, toggleTheme } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [isAnalyzingScreen, setIsAnalyzingScreen] = useState(false);
  const [stuckContextMessage, setStuckContextMessage] = useState("");
  const [language, setLanguage] = useState('EN');

  // Smart AI Flashcard & Revision State
  const [flashcardStats, setFlashcardStats] = useState({
    dailyStreak: 3,
    totalReviewed: 34,
    totalKnown: 26,
    totalNeedsRevision: 8,
    completionPercentage: 76,
    weakTopics: ['Dynamic Programming', 'Distributed Caching', 'STAR Method'],
    bookmarkedCount: 5,
    recentDecks: []
  });
  const [flashcardRecommendations, setFlashcardRecommendations] = useState([]);
  const [activeFlashcardModal, setActiveFlashcardModal] = useState({
    isOpen: false,
    cards: [],
    title: '',
    sourceModule: 'dashboard',
    category: 'Daily Revision'
  });
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);

  // Academic Catch-Up Assistant State
  const [catchUpData, setCatchUpData] = useState(null);
  const [catchUpExpanded, setCatchUpExpanded] = useState(false);
  const [activeCatchUpTab, setActiveCatchUpTab] = useState('lectures'); // 'lectures' | 'assignments' | 'notices' | 'roadmap'

  // AI Academic Advisor & Student Assistant State
  const [aiAssistant, setAiAssistant] = useState(null);

  // ── Feature 6: GPA What-If Predictor State ──
  const [gpaSimCourses, setGpaSimCourses] = useState([
    { name: 'Data Structures', credits: 4, currentGrade: 8.5, predictedGrade: 8.5 },
    { name: 'Computer Networks', credits: 3, currentGrade: 7.0, predictedGrade: 7.0 },
    { name: 'Operating Systems', credits: 4, currentGrade: 9.0, predictedGrade: 9.0 },
    { name: 'Database Systems', credits: 3, currentGrade: 6.5, predictedGrade: 6.5 },
    { name: 'Software Engineering', credits: 3, currentGrade: 8.0, predictedGrade: 8.0 },
  ]);
  const [gpaSimExpanded, setGpaSimExpanded] = useState(false);

  // ── Feature 7: Study Group Matchmaker State ──
  const [studyGroupMatches, setStudyGroupMatches] = useState([
    { name: 'Priya Sharma', match: 94, strengths: ['Machine Learning', 'Python'], weakness: 'Databases', avatar: 'PS', schedule: 'Evenings', style: 'Visual Learner' },
    { name: 'Arjun Mehta', match: 89, strengths: ['Databases', 'SQL'], weakness: 'Algorithms', avatar: 'AM', schedule: 'Mornings', style: 'Problem Solver' },
    { name: 'Riya Kapoor', match: 85, strengths: ['Algorithms', 'DSA'], weakness: 'Networks', avatar: 'RK', schedule: 'Evenings', style: 'Discussion-Based' },
  ]);
  const [groupMatchExpanded, setGroupMatchExpanded] = useState(false);
  const [isMatchingGroup, setIsMatchingGroup] = useState(false);

  // ── Feature 8: Degree Knowledge Graph State ──
  const [knowledgeGraph, setKnowledgeGraph] = useState([
    { subject: 'Data Structures & Algorithms', mastery: 82, color: '#10b981', semester: 3, credits: 4 },
    { subject: 'Computer Networks', mastery: 63, color: '#f59e0b', semester: 4, credits: 3 },
    { subject: 'Operating Systems', mastery: 91, color: '#10b981', semester: 4, credits: 4 },
    { subject: 'Database Systems', mastery: 48, color: '#ef4444', semester: 5, credits: 3 },
    { subject: 'Software Engineering', mastery: 74, color: '#10b981', semester: 5, credits: 3 },
    { subject: 'Machine Learning', mastery: 35, color: '#ef4444', semester: 6, credits: 4 },
    { subject: 'Cloud Computing', mastery: 20, color: '#8b5cf6', semester: 7, credits: 3 },
    { subject: 'Distributed Systems', mastery: 15, color: '#8b5cf6', semester: 7, credits: 3 },
  ]);
  const [graphExpanded, setGraphExpanded] = useState(false);

  // ── Feature 9: Personalized Study Schedule State ──
  const [studySchedule, setStudySchedule] = useState(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);
  const defaultSchedule = [
    { day: 'Monday', slots: [{ time: '7–9 AM', subject: 'Data Structures', type: 'Practice', icon: '💻' }, { time: '8–10 PM', subject: 'Machine Learning', type: 'Weak Topic Fix', icon: '⚡' }] },
    { day: 'Tuesday', slots: [{ time: '6–8 PM', subject: 'Computer Networks', type: 'Revision', icon: '📖' }, { time: '9–10 PM', subject: 'Database Systems', type: 'Flashcards', icon: '🃏' }] },
    { day: 'Wednesday', slots: [{ time: '7–9 AM', subject: 'Operating Systems', type: 'Practice', icon: '💻' }, { time: '7–9 PM', subject: 'DSA Mock Test', type: 'Ghost Exam', icon: '👻' }] },
    { day: 'Thursday', slots: [{ time: '6–8 PM', subject: 'Machine Learning', type: 'Weak Topic Fix', icon: '⚡' }, { time: '9–10 PM', subject: 'Software Engineering', type: 'Assignment', icon: '📝' }] },
    { day: 'Friday', slots: [{ time: '7–9 AM', subject: 'Full Revision', type: 'Review All', icon: '🔄' }] },
    { day: 'Saturday', slots: [{ time: '10 AM–1 PM', subject: 'Mock Interview Prep', type: 'Placement Prep', icon: '🎯' }] },
    { day: 'Sunday', slots: [{ time: 'Rest Day', subject: 'Light Reading', type: 'Optional', icon: '☕' }] },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [profRes, attRes, asgRes, marksRes, examRes, notRes, fcStatsRes, fcRecRes, catchUpRes, aiAssistRes] = await Promise.allSettled([
          studentAPI.getMyProfile(),
          attendanceAPI.getMySummary(),
          assignmentAPI.getMyPending(),
          marksAPI.getMyMarks(),
          examAPI.getSchedules({ status: 'upcoming' }),
          noticeAPI.getNotices(),
          flashcardAPI.getStats(),
          flashcardAPI.getRecommended(),
          attendanceAPI.getCatchUpData(),
          studentAPI.getAIAssistant()
        ]);

        if (profRes.status === 'fulfilled' && profRes.value.data?.data) {
          setProfile(profRes.value.data.data);
        }
        if (attRes.status === 'fulfilled' && attRes.value.data?.overallSummary) {
          const summary = attRes.value.data.overallSummary;
          setAttendanceList(summary);
          if (Array.isArray(summary) && summary.length > 0) {
            setGpaSimCourses(summary.map(item => ({
              name: item.courseName || item.courseCode,
              credits: item.credits || 3,
              currentGrade: Number((item.percentage / 10).toFixed(1)) || 8.0,
              predictedGrade: Math.min(10, Math.max(4, Math.round((item.percentage / 10) * 2) / 2))
            })));
            setKnowledgeGraph(summary.map((item, idx) => ({
              subject: item.courseName || item.courseCode,
              mastery: Math.round(item.percentage || 75),
              color: item.percentage >= 80 ? '#10b981' : item.percentage >= 65 ? '#f59e0b' : '#ef4444',
              semester: item.semester || (idx < 3 ? 4 : 5),
              credits: item.credits || 3
            })));
          }
        }
        if (asgRes.status === 'fulfilled' && asgRes.value.data?.data) {
          setAssignments(asgRes.value.data.data);
        }
        if (marksRes.status === 'fulfilled' && marksRes.value.data?.marks) {
          setRecentMarks(marksRes.value.data.marks.slice(0, 5));
        }
        if (examRes.status === 'fulfilled' && examRes.value.data?.data) {
          setUpcomingExams(examRes.value.data.data.slice(0, 4));
        }
        if (notRes.status === 'fulfilled' && notRes.value.data?.data) {
          setNotices(notRes.value.data.data.slice(0, 3));
        }
        if (fcStatsRes.status === 'fulfilled' && fcStatsRes.value.data?.data) {
          setFlashcardStats(fcStatsRes.value.data.data);
        }
        if (fcRecRes.status === 'fulfilled' && fcRecRes.value.data?.data) {
          setFlashcardRecommendations(fcRecRes.value.data.data);
        }
        if (catchUpRes.status === 'fulfilled' && catchUpRes.value.data?.data) {
          setCatchUpData(catchUpRes.value.data.data);
        }
        if (aiAssistRes.status === 'fulfilled' && aiAssistRes.value.data?.data) {
          setAiAssistant(aiAssistRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const studentProfile = profile || user?.profile || {};
  const studentName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student';
  const rollNo = studentProfile.studentId || user?.id || '—';
  const degree = studentProfile.degreeProgram || 'Computer Science';
  const semester = studentProfile.currentSemester || 5;
  const rawCgpa = studentProfile.cgpa;
  const cgpa = rawCgpa ? (rawCgpa <= 4.0 ? (rawCgpa * 2.5).toFixed(2) : Number(rawCgpa).toFixed(2)) : '8.65';
  const completedCredits = studentProfile.completedCredits || 74;

  // Calculate overall average attendance
  const avgAttendance = attendanceList.length > 0
    ? (attendanceList.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceList.length).toFixed(1)
    : '85.0';

  const lowAttendanceCourses = attendanceList.filter((item) => item.isLowAttendance);
  const hasLowAttendance = lowAttendanceCourses.length > 0;

  // Flashcard Handlers
  const handleLaunchTodayDeck = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'dashboard',
        type: 'daily_revision',
        title: `Today's Daily Revision Deck`,
        context: {
          weakTopics: flashcardStats?.weakTopics || [],
          degree,
          semester,
          upcomingExams: upcomingExams.map(e => `${e.courseCode}: ${e.courseName}`)
        },
        count: 8,
        save: true
      });
      const cards = res.data?.data?.cards || res.data?.cards || [];
      if (cards.length > 0) {
        setActiveFlashcardModal({
          isOpen: true,
          cards,
          title: `Today's Spaced Repetition Deck`,
          sourceModule: 'dashboard',
          category: 'Daily Streak'
        });
      }
    } catch (err) {
      console.error('Failed to generate today deck:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleStudyRecommendation = async (rec) => {
    setIsGeneratingFlashcards(true);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: rec.sourceModule || 'recommendation',
        type: rec.type || 'exam_revision',
        title: rec.title,
        context: {
          reason: rec.reason,
          subject: rec.subject,
          description: rec.description
        },
        count: 8,
        save: true
      });
      const cards = res.data?.data?.cards || res.data?.cards || [];
      if (cards.length > 0) {
        setActiveFlashcardModal({
          isOpen: true,
          cards,
          title: rec.title,
          sourceModule: rec.sourceModule || 'recommendation',
          category: rec.urgency === 'high' ? 'High Yield' : 'Recommended'
        });
      }
    } catch (err) {
      console.error('Failed to generate recommended cards:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleStudyWeakTopic = async (topic) => {
    setIsGeneratingFlashcards(true);
    try {
      const res = await flashcardAPI.generate({
        sourceModule: 'remedial',
        type: 'weak_topics',
        title: `${topic} — Targeted Remedial Deck`,
        context: { topic, studentLevel: 'University' },
        count: 6,
        save: true
      });
      const cards = res.data?.data?.cards || res.data?.cards || [];
      if (cards.length > 0) {
        setActiveFlashcardModal({
          isOpen: true,
          cards,
          title: `${topic} — Weak Topic Remedial Deck`,
          sourceModule: 'remedial',
          category: 'Weak Area Fix'
        });
      }
    } catch (err) {
      console.error('Failed to generate weak topic deck:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleLaunchCatchUpFlashcards = async () => {
    if (!catchUpData) return;
    setIsGeneratingFlashcards(true);
    try {
      if (catchUpData.suggestedFlashcards && catchUpData.suggestedFlashcards.length > 0) {
        setActiveFlashcardModal({
          isOpen: true,
          cards: catchUpData.suggestedFlashcards,
          title: `Academic Catch-Up: Missed Lectures Revision Deck`,
          sourceModule: 'catch_up',
          category: 'Catch-Up & Recovery'
        });
      } else {
        const res = await flashcardAPI.generate({
          sourceModule: 'catch_up',
          type: 'exam_revision',
          title: 'Missed Lectures Academic Catch-Up Deck',
          context: {
            missedLectures: catchUpData.missedLectures || [],
            missedAssignments: catchUpData.missedAssignments || []
          },
          count: 8,
          save: true
        });
        const cards = res.data?.data?.cards || res.data?.cards || [];
        if (cards.length > 0) {
          setActiveFlashcardModal({
            isOpen: true,
            cards,
            title: `Academic Catch-Up: Missed Lectures Revision Deck`,
            sourceModule: 'catch_up',
            category: 'Catch-Up & Recovery'
          });
        }
      }
    } catch (err) {
      console.error('Failed to generate catch-up flashcards:', err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleOpenSavedDeck = (deck) => {
    setActiveFlashcardModal({
      isOpen: true,
      cards: deck.cards,
      title: deck.title,
      sourceModule: deck.sourceModule || 'saved_deck',
      category: deck.category || 'Saved Deck'
    });
  };

  // ── GPA Predictor: Calculate simulated CGPA ──
  const calcSimulatedCgpa = () => {
    const totalCredits = gpaSimCourses.reduce((a, c) => a + c.credits, 0);
    const totalPoints = gpaSimCourses.reduce((a, c) => a + c.predictedGrade * c.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };
  const calcCurrentCgpa = () => {
    const totalCredits = gpaSimCourses.reduce((a, c) => a + c.credits, 0);
    const totalPoints = gpaSimCourses.reduce((a, c) => a + c.currentGrade * c.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };
  const simulatedCgpa = calcSimulatedCgpa();
  const currentSimCgpa = calcCurrentCgpa();
  const cgpaDelta = (simulatedCgpa - currentSimCgpa).toFixed(2);

  // ── Study Group Matchmaker: Re-shuffle ──
  const handleRefreshMatches = () => {
    setIsMatchingGroup(true);
    setTimeout(() => {
      setStudyGroupMatches(prev => [...prev].sort(() => Math.random() - 0.5));
      setIsMatchingGroup(false);
    }, 1800);
  };

  // ── Study Schedule Generator ──
  const handleGenerateSchedule = () => {
    setIsGeneratingSchedule(true);
    setTimeout(() => {
      setStudySchedule(defaultSchedule);
      setIsGeneratingSchedule(false);
      setScheduleExpanded(true);
    }, 2200);
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <SkeletonCard lines={2} />
        <SkeletonStatGrid count={4} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <SkeletonChart height={280} />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Welcome Banner — extracted to WelcomeBanner.jsx */}
      <WelcomeBanner
        studentName={studentName}
        rollNo={rollNo}
        degree={degree}
        semester={semester}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Critical Attendance Warning from Database */}
      {hasLowAttendance && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--danger)', color: '#fff', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.95rem' }}>Attendance Threshold Warning (&lt;75%)</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Your attendance in <strong>{lowAttendanceCourses.map(c => `${c.courseCode} (${c.percentage}%)`).join(', ')}</strong> is below 75%. You risk examination debarment.
              </div>
            </div>
          </div>
          <Link to="/attendance" className="btn btn-danger" style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}>View Calculator</Link>
        </div>
      )}

      {/* ── Academic Catch-Up Assistant (Missed Lectures, Assignments, Deadlines & Flashcards) ── */}
      {catchUpData && catchUpData.hasAbsences && (
        <div
          className="glass-panel"
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(245,158,11,0.08) 50%, rgba(139,92,246,0.06) 100%)',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }}
              >
                <CalendarCheck size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Academic Catch-Up Assistant
                  </h3>
                  <span className="badge badge-warning" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    ⚠️ {catchUpData.missedLecturesCount} Missed Session{catchUpData.missedLecturesCount !== 1 ? 's' : ''} Detected
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                  Intelligent absence remediation with missed lectures, pending assignments, urgent notices, and recovery roadmap.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleLaunchCatchUpFlashcards}
                disabled={isGeneratingFlashcards}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
                  border: 'none',
                  fontSize: '0.85rem',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.3)'
                }}
              >
                {isGeneratingFlashcards ? (
                  <><Loader2 size={15} className="animate-spin" /> Preparing...</>
                ) : (
                  <><Sparkles size={15} /> 1-Click Catch-Up Flashcards</>
                )}
              </button>
              <button
                onClick={() => setCatchUpExpanded(!catchUpExpanded)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem' }}
              >
                {catchUpExpanded ? 'Hide Details ▲' : 'View Catch-Up Roadmap ▼'}
              </button>
            </div>
          </div>

          {/* Expanded Breakdown */}
          {catchUpExpanded && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
                <button
                  onClick={() => setActiveCatchUpTab('lectures')}
                  className={`btn ${activeCatchUpTab === 'lectures' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Missed Lectures ({catchUpData.missedLectures?.length || 0})
                </button>
                <button
                  onClick={() => setActiveCatchUpTab('assignments')}
                  className={`btn ${activeCatchUpTab === 'assignments' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Pending Assignments ({catchUpData.missedAssignments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveCatchUpTab('notices')}
                  className={`btn ${activeCatchUpTab === 'notices' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Missed Notices ({catchUpData.missedNotices?.length || 0})
                </button>
                <button
                  onClick={() => setActiveCatchUpTab('roadmap')}
                  className={`btn ${activeCatchUpTab === 'roadmap' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Catch-Up Roadmap 🗺️
                </button>
              </div>

              {/* Tab 1: Missed Lectures */}
              {activeCatchUpTab === 'lectures' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {catchUpData.missedLectures?.map((lecture, idx) => (
                    <div key={idx} style={{ padding: '0.85rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>{lecture.courseCode}</span>
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Absent ({lecture.sessionType})</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{lecture.courseName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{lecture.topic}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>📅 {new Date(lecture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: Missed Assignments */}
              {activeCatchUpTab === 'assignments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {catchUpData.missedAssignments?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending assignments associated with the missed classes.</p>
                  ) : (
                    catchUpData.missedAssignments?.map((asg, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{asg.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asg.courseCode} &bull; Max Score: {asg.maxScore} pts</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span className={`badge ${asg.isOverdue ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.72rem' }}>
                            {asg.isOverdue ? 'Overdue' : 'Due Soon'}: {new Date(asg.dueDate).toLocaleDateString()}
                          </span>
                          <Link to="/assignments" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>Submit →</Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Missed Notices */}
              {activeCatchUpTab === 'notices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {catchUpData.missedNotices?.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No urgent campus notices were posted during your absence.</p>
                  ) : (
                    catchUpData.missedNotices?.map((n, idx) => (
                      <div key={idx} style={{ padding: '0.75rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.category} &bull; {new Date(n.date).toLocaleDateString()}</div>
                        </div>
                        <span className={`badge ${n.priority === 'urgent' || n.priority === 'high' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.72rem' }}>
                          {n.priority}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Catch-Up Roadmap */}
              {activeCatchUpTab === 'roadmap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {catchUpData.roadmap?.map((phase, idx) => (
                    <div key={idx} style={{ padding: '0.85rem 1.15rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{phase.phase}</strong>
                        <span className={`badge ${phase.status === 'urgent' ? 'badge-danger' : phase.status === 'high' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                          {phase.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>{phase.focus}</div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {phase.actionItems?.map((item, aIdx) => (
                          <li key={aIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI Academic Advisor & Student Assistant Briefing ── */}
      {aiAssistant && (
        <div
          className="glass-panel"
          style={{
            padding: '1.75rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(16, 185, 129, 0.06) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Brain size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    AI Academic Advisor &amp; Student Assistant
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                    Live Analytics &bull; RAG Powered
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                  Real-time synthesis of your attendance records, coursework deadlines, exam performance, and study recommendations.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <Link to="/chat" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}>
                <Sparkles size={14} color="var(--primary)" /> Consult Advisor in Chat
              </Link>
            </div>
          </div>

          {/* 4 Core Pillars: Missed Classes, Assignment Priorities, Exam Priorities, Personalized Study Suggestions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            
            {/* 1. Missed Classes Summary */}
            <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--warning)' }}>
                <Clock size={16} /> Missed Classes &amp; Catch-Up
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {aiAssistant.missedClassesSummary}
              </div>
            </div>

            {/* 2. Upcoming Assignment Priorities */}
            <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)' }}>
                <CheckCircle2 size={16} /> Assignment Priorities
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {aiAssistant.upcomingAssignmentPriorities}
              </div>
            </div>

            {/* 3. Exam Preparation Priorities */}
            <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                <TrendingUp size={16} /> Exam Preparation Focus
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {aiAssistant.examPreparationPriorities}
              </div>
            </div>

            {/* 4. Personalized Study Suggestions */}
            <div style={{ background: 'var(--bg-input)', padding: '1.15rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--success)' }}>
                <Zap size={16} /> Personalized Study Suggestions
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', lineHeight: 1.45 }}>
                {aiAssistant.personalizedStudySuggestions?.map((sug, sIdx) => (
                  <li key={sIdx}>{sug}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* Stats Grid — extracted to StatsGrid.jsx */}
      <StatsGrid
        cgpa={cgpa}
        avgAttendance={avgAttendance}
        attendanceList={attendanceList}
        completedCredits={completedCredits}
        assignments={assignments}
      />

      {/* ── 9. Student Dashboard: Today's AI Flashcards & Spaced Repetition Suite ── */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(139,92,246,0.08) 50%, rgba(59,130,246,0.06) 100%)',
        border: '1px solid rgba(236,72,153,0.25)',
        borderRadius: 'var(--radius-md)'
      }}>
        {/* Top Header & Streak */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(249,115,22,0.35)'
            }}>
              <Flame size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Today's AI Flashcards &amp; Spaced Repetition
                </h2>
                <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', fontWeight: 700, fontSize: '0.78rem' }}>
                  🔥 {flashcardStats?.dailyStreak || 1} Day Streak
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                Continuous learning engine with AI automated weak topic identification and memory consolidation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleLaunchTodayDeck}
              disabled={isGeneratingFlashcards}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(236,72,153,0.3)',
                padding: '0.55rem 1.15rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              {isGeneratingFlashcards ? (
                <><Loader2 size={16} className="animate-spin" /> Preparing Deck...</>
              ) : (
                <><Play size={15} fill="currentColor" /> Practice Today's Deck</>
              )}
            </button>
            <Link
              to="/academic-tools?tab=flashcards"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.88rem',
                padding: '0.55rem 1rem',
                border: '1px solid rgba(236,72,153,0.35)',
                color: '#f472b6'
              }}
            >
              <BookOpen size={15} /> Chapter Flashcard Studio →
            </Link>
          </div>
        </div>

        {/* 2-Column Grid: Progress Tracker + Smart Recommendations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          
          {/* Left: Progress Tracking & Weak Topics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Completion Percentage Bar */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Flashcard Mastery &amp; Completion
                </span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {flashcardStats?.completionPercentage || 76}%
                </strong>
              </div>
              <div className="progress-track" style={{ height: '8px' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${flashcardStats?.completionPercentage || 76}%`,
                    background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)'
                  }}
                />
              </div>

              {/* Mini Stats Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Reviewed</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{flashcardStats?.totalReviewed || 0}</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.06)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Known (Mastered)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>{flashcardStats?.totalKnown || 0}</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.06)', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>Needs Revision</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger)' }}>{flashcardStats?.totalNeedsRevision || 0}</div>
                </div>
              </div>
            </div>

            {/* Smart AI Identified Weak Topics */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                <Brain size={16} color="#ec4899" />
                <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>AI-Identified Weak Topics</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Concepts flagged from quizzes, mock interviews, or cards marked "Needs Revision":
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(flashcardStats?.weakTopics && flashcardStats.weakTopics.length > 0
                  ? flashcardStats.weakTopics
                  : ['Dynamic Programming', 'Distributed Caching', 'STAR Method']
                ).map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStudyWeakTopic(topic)}
                    disabled={isGeneratingFlashcards}
                    className="btn btn-secondary"
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '100px',
                      background: 'rgba(236,72,153,0.08)',
                      border: '1px solid rgba(236,72,153,0.25)',
                      color: '#f472b6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title="Click to generate targeted revision cards for this weak topic"
                  >
                    ⚡ {topic} &bull; Fix
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Smart AI Recommendations (Module 10) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.95rem' }}>
                <Sparkles size={16} color="var(--primary)" /> Smart AI Recommendations
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Proactive Triggers</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Dynamic AI Recommendations or contextual smart defaults */}
              {(flashcardRecommendations.length > 0
                ? flashcardRecommendations
                : [
                    {
                      reason: upcomingExams.length > 0 ? `🗓️ Upcoming Exam in ${upcomingExams[0].courseCode}` : '🗓️ Mid-Term Examination Prep',
                      title: upcomingExams.length > 0 ? `${upcomingExams[0].courseCode} High-Yield Exam Revision` : 'Algorithms & Data Structures High-Yield Deck',
                      description: 'Review critical formulas, theorems, and chapter revision cards before test date.',
                      type: 'exam_revision',
                      sourceModule: 'paper_generator',
                      urgency: 'high'
                    },
                    {
                      reason: '💼 Technical & Placement Interview Season',
                      title: 'Role-Specific Technical & STAR Method Flashcards',
                      description: 'Master behavioral questions, system design tradeoffs, and technical vocabulary.',
                      type: 'role_interview',
                      sourceModule: 'mock_interview',
                      urgency: 'medium'
                    },
                    {
                      reason: '⚠️ Low Quiz Score Remedial Alert',
                      title: 'Deep Neural Networks & Concurrency Remedial Cards',
                      description: 'Clarify questions missed in the recent AI Quiz Studio practice sessions.',
                      type: 'quiz_remedial',
                      sourceModule: 'quiz',
                      urgency: 'high'
                    }
                  ]
              ).slice(0, 3).map((rec, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    padding: '1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: rec.urgency === 'high' ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: rec.urgency === 'high' ? '#f87171' : 'var(--primary)' }}>
                      {rec.reason}
                    </span>
                    <span className={`badge ${rec.urgency === 'high' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                      AI Recommended
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rec.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{rec.description}</div>
                  <div style={{ marginTop: '0.35rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleStudyRecommendation(rec)}
                      disabled={isGeneratingFlashcards}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.78rem',
                        padding: '0.3rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: 'var(--primary)'
                      }}
                    >
                      <Layers size={13} /> Study Recommended Deck →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Saved Decks Row (if any) */}
        {flashcardStats?.recentDecks && flashcardStats.recentDecks.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Your Recently Generated Decks
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {flashcardStats.recentDecks.map((deck) => (
                <div
                  key={deck._id}
                  onClick={() => handleOpenSavedDeck(deck)}
                  style={{
                    minWidth: '220px',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>{deck.sourceModule?.toUpperCase()}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deck.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{deck.cards?.length || 0} Flashcards &bull; {deck.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Attendance + Assignments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

        {/* Attendance Summary */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Course Attendance</h3>
            <Link to="/attendance" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Full Details →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {attendanceList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No enrolled course attendance records found.</p>
            ) : (
              attendanceList.map((course, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong>{course.courseCode}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({course.courseName})</span>
                    </div>
                    <span className={`badge ${course.percentage >= 80 ? 'badge-success' : course.percentage >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                      {course.percentage}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{
                      width: `${Math.min(100, course.percentage)}%`,
                      background: course.percentage >= 80 ? 'var(--success)' : course.percentage >= 75 ? 'var(--warning)' : 'var(--danger)'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Attended {course.attendedClasses} of {course.totalClasses} lectures
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upcoming Assignments</h3>
            <Link to="/assignments" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🎉 You are all caught up! No pending assignments due.
              </div>
            ) : (
              assignments.map((item) => (
                <div key={item.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span className="badge badge-primary">{item.courseCode}</span>
                    <span className={`badge ${item.isSubmitted ? 'badge-success' : 'badge-warning'}`}>{item.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={13} /> Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Marks + Exam Preview Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

        {/* Recent Marks Widget */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={17} color="var(--accent-purple)" /> Recent Published Marks
            </h3>
            <Link to="/marks" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>All Marks →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentMarks.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No published marks"
                description="New exam and assessment grades will display here once verified by your professors."
              />
            ) : (
              recentMarks.map((m) => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="badge badge-primary">{m.course?.courseCode || 'Course'}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.examLabel}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.marksObtained}/{m.maxMarks}</span>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '2px solid var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)'
                    }}>{m.grade}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exam Schedule Preview */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarCheck size={17} color="var(--primary)" /> Examination Schedule
            </h3>
            <Link to="/exam-schedule" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Full Timetable →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingExams.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming exams"
                description="Your semester timetable currently has no upcoming exams scheduled."
              />
            ) : (
              upcomingExams.map((exam) => {
                const examDate = new Date(exam.date);
                const diffDays = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.85rem',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-sm)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="badge badge-primary">{exam.courseCode}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{exam.courseName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {exam.startTime} - {exam.endTime} · {exam.venue}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: diffDays > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                      {diffDays > 0 ? `In ${diffDays}d` : 'Today'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* University Notices & Announcements from Database */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bell size={18} color="var(--warning)" /> University Notices &amp; Bulletins
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live Campus Feeds</span>
        </div>
        {notices.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No campus notices"
            description="There are no active bulletins or university announcements at this moment."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {notices.map((n) => (
              <div
                key={n._id}
                onClick={() => setSelectedNotice(n)}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: n.priority === 'urgent' ? '4px solid var(--danger)' : '4px solid var(--primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className="badge badge-secondary">{n.category}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(n.publishedAt).toLocaleDateString()}</span>
                </div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.35rem' }}>{n.title}</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {n.content}
                </p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  Click to view bulletin →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notice Details Modal via ModalPortal ── */}
      <ModalPortal isOpen={Boolean(selectedNotice)}>
        {selectedNotice && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={() => setSelectedNotice(null)}
          >
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '560px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-surface, #1e293b)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                overflow: 'hidden',
                zIndex: 100000
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div style={{
                position: 'sticky',
                top: 0,
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface, #1e293b)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Bell size={18} color="var(--warning)" />
                  <span className="badge badge-secondary">{selectedNotice.category}</span>
                  <span className={`badge ${selectedNotice.priority === 'urgent' ? 'badge-danger' : 'badge-primary'}`}>
                    {selectedNotice.priority}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedNotice.title}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Published: {new Date(selectedNotice.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
                  {selectedNotice.content}
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'var(--bg-surface, #1e293b)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="btn btn-primary"
                >
                  Close Bulletin
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── Exam Details Modal via ModalPortal ── */}
      <ModalPortal isOpen={Boolean(selectedExam)}>
        {selectedExam && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={() => setSelectedExam(null)}
          >
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90vw',
                maxWidth: '520px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-surface, #1e293b)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                overflow: 'hidden',
                zIndex: 100000
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Header */}
              <div style={{
                position: 'sticky',
                top: 0,
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface, #1e293b)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CalendarCheck size={18} color="var(--primary)" />
                  <span className="badge badge-primary">{selectedExam.courseCode}</span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    Examination Timetable
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedExam(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedExam.courseName}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {new Date(selectedExam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timing</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {selectedExam.startTime} - {selectedExam.endTime}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <MapPin size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exam Hall / Venue</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedExam.venue}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  ⚠️ Please arrive 15 minutes prior to start time with your student identification card. Calculators permitted per instructor instructions.
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{
                position: 'sticky',
                bottom: 0,
                padding: '1rem 1.5rem',
                borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'var(--bg-surface, #1e293b)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedExam(null)}
                  className="btn btn-primary"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 6: GPA WHAT-IF PREDICTOR — extracted to GpaSimulator.jsx
      ═══════════════════════════════════════════════════════════════════ */}
      <GpaSimulator
        gpaSimCourses={gpaSimCourses}
        setGpaSimCourses={setGpaSimCourses}
        gpaSimExpanded={gpaSimExpanded}
        setGpaSimExpanded={setGpaSimExpanded}
      />

      {/* FEATURE 7: SMART STUDY GROUP MATCHMAKER — extracted to StudyGroupMatcher.jsx */}
      <StudyGroupMatcher
        studyGroupMatches={studyGroupMatches}
        groupMatchExpanded={groupMatchExpanded}
        setGroupMatchExpanded={setGroupMatchExpanded}
        isMatchingGroup={isMatchingGroup}
        onRefreshMatches={handleRefreshMatches}
      />


      {/* FEATURE 8: DEGREE KNOWLEDGE GRAPH — extracted to KnowledgeGraph.jsx */}
      <KnowledgeGraph
        knowledgeGraph={knowledgeGraph}
        graphExpanded={graphExpanded}
        setGraphExpanded={setGraphExpanded}
        onStudyWeakTopic={handleStudyWeakTopic}
        isGeneratingFlashcards={isGeneratingFlashcards}
      />

      {/* FEATURE 9: AI STUDY SCHEDULE — extracted to StudySchedule.jsx */}
      <StudySchedule
        studySchedule={studySchedule}
        setStudySchedule={setStudySchedule}
        scheduleExpanded={scheduleExpanded}
        setScheduleExpanded={setScheduleExpanded}
        isGeneratingSchedule={isGeneratingSchedule}
        onGenerateSchedule={handleGenerateSchedule}
      />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: graphExpanded ? '1.5rem' : 0, paddingBottom: graphExpanded ? '1.25rem' : 0, borderBottom: graphExpanded ? '1px solid var(--border-subtle)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
              <Map size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Degree Knowledge Graph</h2>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>🗺️ Mastery Map</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
                Visual mastery map of your entire degree — green = mastered, red = needs urgent work.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--success)' }}>●</span> Mastered &nbsp;
              <span style={{ color: 'var(--warning)' }}>●</span> On Track &nbsp;
              <span style={{ color: 'var(--danger)' }}>●</span> Weak
            </div>
            <button onClick={() => setGraphExpanded(!graphExpanded)} className="btn btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {graphExpanded ? <><ChevronUp size={15}/> Hide</> : <><ChevronDown size={15}/> View Map</>}
            </button>
          </div>
        </div>

        {graphExpanded && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Mastered (>75%)', count: knowledgeGraph.filter(k => k.mastery >= 75).length, color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
                { label: 'On Track (50-75%)', count: knowledgeGraph.filter(k => k.mastery >= 50 && k.mastery < 75).length, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
                { label: 'Needs Work (<50%)', count: knowledgeGraph.filter(k => k.mastery < 50).length, color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)' },
              ].map((stat, idx) => (
                <div key={idx} style={{ padding: '0.85rem', background: stat.bg, borderRadius: 'var(--radius-sm)', border: `1px solid ${stat.color}30`, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>{stat.count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {knowledgeGraph.map((node, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: `1px solid ${node.mastery >= 75 ? 'rgba(16,185,129,0.3)' : node.mastery >= 50 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.3)'}`, transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${node.mastery >= 75 ? '#10b981' : node.mastery >= 50 ? '#f59e0b' : '#ef4444'} ${node.mastery * 3.6}deg, var(--bg-card, #1e293b) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 3px var(--bg-surface), 0 0 0 5px ${node.mastery >= 75 ? '#10b98140' : node.mastery >= 50 ? '#f59e0b40' : '#ef444440'}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', color: node.mastery >= 75 ? '#10b981' : node.mastery >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {node.mastery}%
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <span>{node.subject}</span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'var(--bg-card, #0f172a)', borderRadius: '100px', color: 'var(--text-muted)' }}>Sem {node.semester}</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'var(--bg-card, #0f172a)', borderRadius: '100px', color: 'var(--text-muted)' }}>{node.credits} Cr</span>
                      </div>
                    </div>
                    <div className="progress-track" style={{ height: '6px' }}>
                      <div className="progress-fill" style={{ width: `${node.mastery}%`, background: node.mastery >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : node.mastery >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)' }} />
                    </div>
                    {node.mastery < 50 && <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ Weak area — prioritize in next study session</div>}
                  </div>
                  {node.mastery < 50 && (
                    <button onClick={() => handleStudyWeakTopic(node.subject)} disabled={isGeneratingFlashcards} className="btn btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', flexShrink: 0 }}>
                      ⚡ Fix Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 9: AI PERSONALIZED STUDY SCHEDULE GENERATOR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(249,115,22,0.06) 50%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: scheduleExpanded ? '1.5rem' : 0, paddingBottom: scheduleExpanded ? '1.25rem' : 0, borderBottom: scheduleExpanded ? '1px solid var(--border-subtle)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
              <Target size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>AI Study Schedule Generator</h2>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>📅 Personalized</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
                AI analyzes your weak topics, exam dates &amp; attendance to build your optimal weekly study plan.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {!studySchedule ? (
              <button onClick={handleGenerateSchedule} disabled={isGeneratingSchedule} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', border: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', padding: '0.55rem 1.15rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {isGeneratingSchedule ? <><Loader2 size={15} className="animate-spin"/> Building Plan...</> : <><Sparkles size={15}/> Generate My Weekly Plan</>}
              </button>
            ) : (
              <>
                <button onClick={() => { setStudySchedule(null); setScheduleExpanded(false); }} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RotateCcw size={14}/> Regenerate
                </button>
                <button onClick={() => setScheduleExpanded(!scheduleExpanded)} className="btn btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {scheduleExpanded ? <><ChevronUp size={15}/> Hide</> : <><ChevronDown size={15}/> View Schedule</>}
                </button>
              </>
            )}
          </div>
        </div>

        {isGeneratingSchedule && (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            <Loader2 size={36} className="animate-spin" color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>AI is analyzing your exams, weak spots &amp; attendance...</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Building your optimal personalized study timetable ✨</div>
          </div>
        )}

        {studySchedule && scheduleExpanded && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            {studySchedule.map((day, dIdx) => (
              <div key={dIdx} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {day.day === 'Sunday' ? <Coffee size={14} color="var(--text-muted)"/> : day.day === 'Saturday' ? <Star size={14} color="#fbbf24"/> : <BookOpen size={14} color="var(--primary)"/>}
                  {day.day}
                </div>
                {day.slots.map((slot, sIdx) => (
                  <div key={sIdx} style={{ padding: '0.6rem 0.75rem', background: slot.type === 'Ghost Exam' ? 'rgba(139,92,246,0.1)' : slot.type === 'Weak Topic Fix' ? 'rgba(239,68,68,0.08)' : slot.type === 'Placement Prep' ? 'rgba(245,158,11,0.1)' : slot.type === 'Optional' ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.07)', borderRadius: '6px', border: `1px solid ${slot.type === 'Ghost Exam' ? 'rgba(139,92,246,0.25)' : slot.type === 'Weak Topic Fix' ? 'rgba(239,68,68,0.2)' : 'transparent'}` }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{slot.icon} {slot.subject}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{slot.time} · {slot.type}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE 10: GHOST MODE EXAM SIMULATOR QUICK-LAUNCH
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(30,27,75,0.5) 0%, rgba(88,28,135,0.15) 50%, rgba(139,92,246,0.1) 100%)',
        border: '1px solid rgba(139,92,246,0.4)',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'linear-gradient(135deg, #581c87 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(139,92,246,0.5)', fontSize: '2rem', flexShrink: 0 }}>
              👻
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #c4b5fd, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Ghost Mode Exam Simulator
                </h2>
                <span className="badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.4)', fontSize: '0.75rem', fontWeight: 700 }}>🔮 AI Proctor</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0, maxWidth: '520px', lineHeight: 1.5 }}>
                AI analyzes your weak points from quizzes &amp; flashcards, generates a personalized timed mock exam, and acts as a live proctor — giving Socratic hints if you get stuck, never direct answers.
              </p>
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'AI-Tailored Questions', icon: '🎯' },
                  { label: 'Timed Exam Mode', icon: '⏱️' },
                  { label: 'Socratic Hints Only', icon: '💭' },
                  { label: 'Auto Performance Report', icon: '📊' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>{f.icon}</span><span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', alignItems: 'center' }}>
            <Link to="/academic-tools?tab=quiz" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', border: 'none', boxShadow: '0 6px 20px rgba(139,92,246,0.5)', padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-full)' }}>
              <Cpu size={18}/> Enter Ghost Mode
            </Link>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              {upcomingExams.length > 0 ? `🗓️ Next exam: ${upcomingExams[0].courseCode} in ${Math.ceil((new Date(upcomingExams[0].date) - new Date()) / (1000 * 60 * 60 * 24))}d` : '🎓 Practice anytime'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <Link to="/career-counselor" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Compass size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Career Counselor</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Azure AI (gpt-4.1-mini)</div>
          </div>
        </Link>
        <Link to="/academic-tools?tab=quiz" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BookOpen size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Quiz Studio</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Azure AI (gpt-4.1-mini)</div>
          </div>
        </Link>
        <Link to="/attendance" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BarChart2 size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Attendance Simulator</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculate safe absences</div>
          </div>
        </Link>
        <Link to="/analytics" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <TrendingUp size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Academic Analytics</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GPA &amp; cohort trends</div>
          </div>
        </Link>
        <Link to="/faqs" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <HelpCircle size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>University FAQs</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official regulations</div>
          </div>
        </Link>
        <Link to="/chat" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <MessageSquare size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Support Agent</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live assistant with RAG</div>
          </div>
        </Link>
      </div>

      {/* Smart AI Flashcard Deck Modal */}
      <FlashcardModal
        isOpen={activeFlashcardModal.isOpen}
        onClose={() => setActiveFlashcardModal((prev) => ({ ...prev, isOpen: false }))}
        initialCards={activeFlashcardModal.cards}
        cards={activeFlashcardModal.cards}
        title={activeFlashcardModal.title}
        deckTitle={activeFlashcardModal.title}
        sourceModule={activeFlashcardModal.sourceModule}
        category={activeFlashcardModal.category}
      />

      {/* Floating "I'm Stuck" Button */}
      <button
        onClick={() => {
          setIsStuckModalOpen(true);
          setIsAnalyzingScreen(true);
          // Simulate AI Vision Analysis delay
          setTimeout(() => {
            const urgentTask = assignments.length > 0 ? assignments[0].title : (upcomingExams.length > 0 ? upcomingExams[0].courseName : "your current coursework");
            setStuckContextMessage(`I noticed you have "${urgentTask}" coming up. Are you stuck trying to prepare for this?`);
            setIsAnalyzingScreen(false);
          }, 2500);
        }}
        className="btn-primary animate-float animate-pulse-ring"
        style={{
          position: 'fixed',
          bottom: 'clamp(1rem, 3vw, 2rem)',
          right: 'clamp(1rem, 3vw, 2rem)',
          width: 'clamp(52px, 6vw, 64px)',
          height: 'clamp(52px, 6vw, 64px)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 35px rgba(239, 68, 68, 0.45)',
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s ease'
        }}
        title="I'm Stuck! Get AI Contextual Help"
      >
        <span className="animate-badge-blink" style={{
          position: 'absolute',
          top: '-6px',
          right: '-4px',
          background: '#10b981',
          color: '#ffffff',
          fontSize: '0.62rem',
          fontWeight: 800,
          padding: '2px 6px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(16,185,129,0.6)',
          letterSpacing: '0.04em'
        }}>
          AI 24/7
        </span>
        <LifeBuoy size={28} color="white" />
      </button>

      {/* "I'm Stuck" Modal Portal */}
      <ModalPortal isOpen={isStuckModalOpen}>
        {isStuckModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={() => setIsStuckModalOpen(false)}
          >
            <div
              style={{
                width: '90vw',
                maxWidth: '480px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
                overflow: 'hidden',
                zIndex: 100000,
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, transparent 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--danger)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LifeBuoy size={16} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    AI Screen Analysis
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStuckModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {isAnalyzingScreen ? (
                  <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <strong>AI Vision Agent:</strong> Analyzing your screen...
                    </div>
                    <div className="progress-track" style={{ height: '4px', maxWidth: '200px', margin: '0 auto' }}>
                      <div className="progress-fill animate-pulse" style={{ width: '100%', background: 'var(--danger)' }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {stuckContextMessage}
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.85rem' }}>
                        💡 Give me a conceptual hint (No direct answers)
                      </button>
                      <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '0.85rem' }}>
                        📚 Show me the relevant lecture slide for this
                      </button>
                      <button className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '0.85rem', background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.3)' }}>
                        <MessageSquare size={16} /> Open full AI Chat context
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};

export default StudentDashboard;
