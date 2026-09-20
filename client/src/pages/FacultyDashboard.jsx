import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Users, CheckSquare, AlertTriangle, BookOpen, Send, PlusCircle, FileCheck,
  BarChart3, Sparkles, TrendingUp, FileText, Upload
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const FacultyDashboard = () => {
  const { user } = useAuth();
  const faculty = mockData.faculty;

  const [alerts] = useState([
    { id: 'STU-2024-8842', name: 'Alex Mercer', course: 'CS-305', attended: 13, total: 18, percentage: 72.2 },
    { id: 'STU-2024-9102', name: 'Emma Watson', course: 'CS-301', attended: 15, total: 22, percentage: 68.1 },
    { id: 'STU-2024-7731', name: 'Liam Smith', course: 'CS-305', attended: 12, total: 18, percentage: 66.6 }
  ]);

  const [notifiedStudents, setNotifiedStudents] = useState([]);

  const handleSendWarning = (studentId) => {
    setNotifiedStudents([...notifiedStudents, studentId]);
  };

  // Chart data
  const attendanceDistData = [
    { name: '≥90%', value: 42, fill: '#10b981' },
    { name: '75-89%', value: 55, fill: '#3b82f6' },
    { name: '<75%', value: 17, fill: '#ef4444' }
  ];

  const gradeData = [
    { grade: 'O', count: 12 }, { grade: 'A+', count: 28 }, { grade: 'A', count: 35 },
    { grade: 'B+', count: 22 }, { grade: 'B', count: 10 }, { grade: 'F', count: 7 }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem'
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/attendance" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <CheckSquare size={16} /> Mark Attendance
          </Link>
          <Link to="/assignments" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Post Assignment
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Active Courses', value: '2 Courses', sub: 'CS-301 & CS-305', icon: BookOpen, color: 'var(--primary)' },
          { label: 'Total Students', value: '114 Students', sub: 'Across 2 batches', icon: Users, color: 'var(--accent-purple)' },
          { label: 'Pending Grading', value: '8 Pending', sub: 'Problem Set 1 (CS-301)', icon: FileCheck, color: 'var(--warning)' },
          { label: 'Low Attendance', value: '3 Students', sub: '< 75% threshold', icon: AlertTriangle, color: 'var(--danger)' }
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="stat-label">{label}</div>
              <Icon size={18} color={color} />
            </div>
            <div className="stat-value" style={{ color, fontSize: '1.75rem' }}>{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Attendance Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={17} color="var(--success)" /> Attendance Distribution
          </h3>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendanceDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {attendanceDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {attendanceDistData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill }} />
                {d.name}: <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={17} color="var(--primary)" /> Grade Distribution (CS-301)
          </h3>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="grade" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Link to="/teacher/analytics" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BarChart3 size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Course Analytics</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detailed performance insights</div>
          </div>
        </Link>
        <Link to="/teacher/question-paper" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Sparkles size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Question Paper AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate exam papers</div>
          </div>
        </Link>
        <Link to="/teacher/students" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Users size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student Progress</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monitor individual progress</div>
          </div>
        </Link>
        <Link to="/rag-upload" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Upload size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Upload Documents</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Build RAG knowledge base</div>
          </div>
        </Link>
      </div>

      {/* Low Attendance Alert Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Students Requiring Attendance Intervention</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Below the 75% examination eligibility threshold.</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>Student ID</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Warning Sent ✓</span>
                    ) : (
                      <button onClick={() => handleSendWarning(item.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
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
