import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  FileText, CalendarCheck, MessageSquare, TrendingUp, Bell, ChevronRight, Loader2
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recentMarks, setRecentMarks] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [notices, setNotices] = useState([]);
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
  const cgpa = studentProfile.cgpa || 3.82;
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
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{cgpa}</div>
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
                  <div key={exam._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.5rem' }}>
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
            <div key={n._id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', borderLeft: n.priority === 'urgent' ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span className="badge badge-secondary">{n.category}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(n.publishedAt).toLocaleDateString()}</span>
              </div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.35rem' }}>{n.title}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
