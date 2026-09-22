import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ModalPortal from '../components/ModalPortal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  studentAPI,
  attendanceAPI,
  assignmentAPI,
  marksAPI,
  examAPI,
  noticeAPI
} from '../services/api.js';
import {
  Award, Sparkles, BarChart2, AlertTriangle, Clock, BookOpen, HelpCircle,
  FileText, CalendarCheck, MessageSquare, TrendingUp, Bell, ChevronRight, Loader2, X, MapPin, Compass
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [profRes, attRes, asgRes, marksRes, examRes, notRes] = await Promise.allSettled([
          studentAPI.getMyProfile(),
          attendanceAPI.getMySummary(),
          assignmentAPI.getMyPending(),
          marksAPI.getMyMarks(),
          examAPI.getSchedules({ status: 'upcoming' }),
          noticeAPI.getNotices()
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
    </div>
  );
};

export default StudentDashboard;
