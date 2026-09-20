import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Award, Sparkles, BarChart2, AlertTriangle, Clock, BookOpen, HelpCircle,
  FileText, CalendarCheck, MessageSquare, TrendingUp, GraduationCap
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const student = mockData.student;
  const attendanceList = mockData.attendance;
  const assignments = mockData.assignments;

  // Calculate overall average attendance
  const avgAttendance = (
    attendanceList.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceList.length
  ).toFixed(1);

  const hasLowAttendance = attendanceList.some((item) => item.isLowAttendance);

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
            Welcome back, {user ? user.fullName || student.name : student.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Roll No: <strong style={{ color: 'var(--text-primary)' }}>{student.id}</strong> | {student.degreeProgram} (Semester {student.currentSemester})
          </p>
        </div>
        <Link to="/chat" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-full)' }}>
          <Sparkles size={16} /> Ask AI Assistant
        </Link>
      </div>

      {/* Critical Attendance Warning */}
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
                Your attendance in <strong>CS-305 (Cloud Computing)</strong> is currently 72.2%. You risk examination debarment.
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
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{student.cgpa}</div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>Top 10% in Department</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Aggregate Attendance</div>
            <BarChart2 size={18} color="var(--accent-purple)" />
          </div>
          <div className="stat-value" style={{ color: avgAttendance >= 75 ? 'var(--text-primary)' : 'var(--danger)' }}>{avgAttendance}%</div>
          <div className="stat-sub">3 Active Courses</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Earned Credits</div>
            <BookOpen size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{student.completedCredits} / 120</div>
          <div className="stat-sub">61% Degree Progress</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Pending Tasks</div>
            <Clock size={18} color="var(--warning)" />
          </div>
          <div className="stat-value">1 Due</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>Due in 3 days</div>
        </div>
      </div>

      {/* Main Grid: Attendance + Assignments + Marks + Exams */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

        {/* Attendance Summary */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Course Attendance</h3>
            <Link to="/attendance" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Full Details →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {attendanceList.map((course, idx) => (
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
                    width: `${course.percentage}%`,
                    background: course.percentage >= 80 ? 'var(--success)' : course.percentage >= 75 ? 'var(--warning)' : 'var(--danger)'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Attended {course.attendedClasses} of {course.totalClasses} lectures
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upcoming Assignments</h3>
            <Link to="/assignments" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map((item) => (
              <div key={item.id} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span className="badge badge-primary">{item.courseCode}</span>
                  <span className={`badge ${item.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>{item.status}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={13} /> Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Marks + Exam Preview Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

        {/* Recent Marks Widget */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={17} color="var(--accent-purple)" /> Recent Marks
            </h3>
            <Link to="/marks" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>All Marks →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { courseCode: 'CS-301', exam: 'Mid Semester', marks: '85/100', grade: 'A+', color: '#3b82f6' },
              { courseCode: 'CS-309', exam: 'Unit Test 1', marks: '92/100', grade: 'O', color: '#10b981' },
              { courseCode: 'CS-305', exam: 'Unit Test 1', marks: '62/100', grade: 'B', color: '#f59e0b' }
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="badge badge-primary">{m.courseCode}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.exam}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.marks}</span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: `${m.color}22`,
                    border: `2px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem', color: m.color
                  }}>{m.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Schedule Preview */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CalendarCheck size={17} color="var(--primary)" /> Upcoming Exams
            </h3>
            <Link to="/exam-schedule" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Full Schedule →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { courseCode: 'CS-301', name: 'Algorithms', date: 'Dec 10, 2026', time: '09:00 AM', venue: 'Hall A', days: 81 },
              { courseCode: 'CS-305', name: 'Cloud Computing', date: 'Dec 12, 2026', time: '02:00 PM', venue: 'Hall B', days: 83 },
              { courseCode: 'CS-309', name: 'AI & Neural Networks', date: 'Dec 15, 2026', time: '09:00 AM', venue: 'Hall A', days: 86 }
            ].map((exam, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span className="badge badge-primary">{exam.courseCode}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{exam.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exam.date} · {exam.time} · {exam.venue}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{exam.days}d</span>
              </div>
            ))}
          </div>
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
        <Link to="/academic-tools" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Sparkles size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Study Tools</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notes, MCQs, study plans</div>
          </div>
        </Link>
        <Link to="/faqs" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <HelpCircle size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>University FAQs</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policies & guidelines</div>
          </div>
        </Link>
        <Link to="/chat" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <MessageSquare size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Support Agent</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>24/7 instant chat + voice</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
