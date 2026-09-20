import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Users,
  CheckSquare,
  AlertTriangle,
  BookOpen,
  Send,
  PlusCircle,
  FileCheck
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const faculty = mockData.faculty;

  // Mock low attendance alert students for faculty
  const [alerts] = useState([
    { id: 'STU-2024-8842', name: 'Alex Mercer', course: 'CS-305', attended: 13, total: 18, percentage: 72.2 },
    { id: 'STU-2024-9102', name: 'Emma Watson', course: 'CS-301', attended: 15, total: 22, percentage: 68.1 },
    { id: 'STU-2024-7731', name: 'Liam Smith', course: 'CS-305', attended: 12, total: 18, percentage: 66.6 }
  ]);

  const [notifiedStudents, setNotifiedStudents] = useState([]);

  const handleSendWarning = (studentId) => {
    setNotifiedStudents([...notifiedStudents, studentId]);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <BookOpen size={16} /> Faculty Academic Portal
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Welcome back, {user ? user.fullName || faculty.name : faculty.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {faculty.designation}, Department of {faculty.department} | Office: <strong>{faculty.cabinOffice}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/attendance" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <CheckSquare size={16} /> Mark Attendance
          </Link>
          <Link to="/assignments" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Post Assignment
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Active Courses</span>
            <BookOpen size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>2 Courses</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            CS-301 &amp; CS-305
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Total Enrolled Students</span>
            <Users size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>114 Students</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Across 2 lecture batches
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Submissions to Grade</span>
            <FileCheck size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>8 Pending</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Problem Set 1 (CS-301)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span>Low Attendance Flag</span>
            <AlertTriangle size={18} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>3 Students</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
            &lt; 75% attendance threshold
          </div>
        </div>

      </div>

      {/* Low Attendance Alert Action List */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Students Requiring Attendance Intervention</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Automatic alerts for students below the mandatory 75% examination eligibility mark.</p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>Student ID</th>
                <th style={{ padding: '0.75rem' }}>Student Name</th>
                <th style={{ padding: '0.75rem' }}>Course</th>
                <th style={{ padding: '0.75rem' }}>Attended</th>
                <th style={{ padding: '0.75rem' }}>Current %</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.id}</td>
                  <td style={{ padding: '0.75rem' }}>{item.name}</td>
                  <td style={{ padding: '0.75rem' }}><span className="badge badge-primary">{item.course}</span></td>
                  <td style={{ padding: '0.75rem' }}>{item.attended} / {item.total}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge badge-danger">{item.percentage}%</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    {notifiedStudents.includes(item.id) ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Warning Sent &#10003;</span>
                    ) : (
                      <button
                        onClick={() => handleSendWarning(item.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        <Send size={12} /> Send Alert
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default FacultyDashboard;
