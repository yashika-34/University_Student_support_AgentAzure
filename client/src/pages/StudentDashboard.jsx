import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ModalPortal from '../components/ModalPortal.jsx';
import FlashcardModal from '../components/flashcards/FlashcardModal.jsx';
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
  Award, Sparkles, BarChart2, AlertTriangle, Clock, BookOpen, HelpCircle,
  FileText, CalendarCheck, MessageSquare, TrendingUp, Bell, ChevronRight, Loader2, X, MapPin, Compass,
  Flame, Layers, CheckCircle2, Bookmark, Zap, Brain, RotateCcw, Play
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [profRes, attRes, asgRes, marksRes, examRes, notRes, fcStatsRes, fcRecRes, catchUpRes] = await Promise.allSettled([
          studentAPI.getMyProfile(),
          attendanceAPI.getMySummary(),
          assignmentAPI.getMyPending(),
          marksAPI.getMyMarks(),
          examAPI.getSchedules({ status: 'upcoming' }),
          noticeAPI.getNotices(),
          flashcardAPI.getStats(),
          flashcardAPI.getRecommended(),
          attendanceAPI.getCatchUpData()
        ]);

        if (profRes.status === 'fulfilled' && profRes.value.data?.data) {
          setProfile(profRes.value.data.data);
        }
        if (attRes.status === 'fulfilled' && attRes.value.data?.overallSummary) {
          setAttendanceList(attRes.value.data.overallSummary);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your academic profile from database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Sparkles size={16} /> Student Academic Portal
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Welcome back, {studentName}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Roll No: <strong style={{ color: 'var(--text-primary)' }}>{rollNo}</strong> | {degree} (Semester {semester})
          </p>
        </div>
        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-full)' }}>
          <Sparkles size={16} /> Ask AI Assistant
        </Link>
      </div>

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

      {/* 4 Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Cumulative GPA</div>
            <Award size={18} color="var(--primary)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {cgpa} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 10.0</span>
          </div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>Top 10% in Department</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Aggregate Attendance</div>
            <BarChart2 size={18} color="var(--accent-purple)" />
          </div>
          <div className="stat-value" style={{ color: Number(avgAttendance) >= 75 ? 'var(--text-primary)' : 'var(--danger)' }}>{avgAttendance}%</div>
          <div className="stat-sub">{attendanceList.length} Active Courses</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Earned Credits</div>
            <BookOpen size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{completedCredits} / 120</div>
          <div className="stat-sub">{Math.round((completedCredits / 120) * 100)}% Degree Progress</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Pending Tasks</div>
            <Clock size={18} color="var(--warning)" />
          </div>
          <div className="stat-value">{assignments.length} Due</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>Action required</div>
        </div>
      </div>

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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent marks published yet.</p>
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming exams scheduled.</p>
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
    </div>
  );
};

export default StudentDashboard;
