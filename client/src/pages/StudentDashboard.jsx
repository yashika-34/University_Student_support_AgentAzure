import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Award,
  Sparkles,
  BarChart2,
  AlertTriangle,
  Clock,
  BookOpen,
  HelpCircle,
  FileText
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
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
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

        <Link
          to="/chat"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.4rem', borderRadius: 'var(--radius-full)' }}
        >
          <Sparkles size={16} /> Ask AI Assistant
        </Link>
      </div>

      {/* Critical Attendance Warning Banner if applicable */}
      {hasLowAttendance && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--danger)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.95rem' }}>
                Attendance Threshold Warning (&lt;75%)
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Your attendance in <strong>CS-305 (Cloud Computing)</strong> is currently 72.2%. You risk examination debarment.
              </div>
            </div>
          </div>
          <Link to="/attendance" className="btn btn-danger" style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}>
            View Calculator
          </Link>
        </div>
      )}

      {/* 4 Stat Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* Cumulative GPA */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Cumulative GPA</span>
            <Award size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{student.cgpa}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>
            Top 10% in Department
          </div>
        </div>

        {/* Aggregate Attendance */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Aggregate Attendance</span>
            <BarChart2 size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: avgAttendance >= 75 ? 'var(--text-primary)' : 'var(--danger)' }}>
            {avgAttendance}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            3 Active Courses
          </div>
        </div>

        {/* Credits Earned */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Earned Credits</span>
            <BookOpen size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{student.completedCredits} / 120</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            61% Degree Progress
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Pending Tasks</span>
            <Clock size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>1 Due</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
            Due in 3 days
          </div>
        </div>

      </div>

      {/* Main Split Grid: Attendance Summary + Upcoming Assignments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Attendance Summary Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Course Attendance</h3>
            <Link to="/attendance" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              Full Details &rarr;
            </Link>
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
                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${course.percentage}%`,
                    height: '100%',
                    background: course.percentage >= 80 ? 'var(--success)' : course.percentage >= 75 ? 'var(--warning)' : 'var(--danger)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Attended {course.attendedClasses} of {course.totalClasses} lectures
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deliverables Card */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Upcoming Assignments</h3>
            <Link to="/assignments" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              View All &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '1rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span className="badge badge-primary">{item.courseCode}</span>
                  <span className={`badge ${item.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={13} /> Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            <div style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px dashed var(--border-subtle)',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              Final Exams commence December 10, 2026. Hall tickets available next week.
            </div>
          </div>
        </div>

      </div>

      {/* Quick Access Action Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Link to="/attendance" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BarChart2 size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Attendance Simulator</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculate safe absences</div>
          </div>
        </Link>
        <Link to="/assignments" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <FileText size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Assignment Portal</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Submit lab solutions</div>
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
          <Sparkles size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Support Agent</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>24/7 instant chat</div>
          </div>
        </Link>
      </div>

    </div>
  );
};

export default StudentDashboard;
