import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { BarChart3, Users, CheckSquare, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Mock data for demo
const MOCK_DASHBOARD = {
  stats: { totalCourses: 2, totalStudents: 114, pendingGrading: 8, lowAttendanceAlerts: 3 },
  courses: [
    { id: '1', courseCode: 'CS-301', courseName: 'Algorithms & Complexity', credits: 4 },
    { id: '2', courseCode: 'CS-305', courseName: 'Cloud Computing', credits: 3 }
  ]
};

const MOCK_ANALYTICS = {
  attendance: { above90: 42, above75: 55, below75: 17, avgAttendance: 81.4 },
  gradeDistribution: [
    { _id: 'O', count: 12 }, { _id: 'A+', count: 28 }, { _id: 'A', count: 35 },
    { _id: 'B+', count: 22 }, { _id: 'B', count: 10 }, { _id: 'F', count: 7 }
  ],
  assignmentSubmissionRates: [
    { title: 'Problem Set 1', submitted: 95, total: 114, rate: 83 },
    { title: 'Lab 2: Docker', submitted: 72, total: 114, rate: 63 },
    { title: 'Mini Project', submitted: 45, total: 114, rate: 39 }
  ]
};

const TeacherAnalyticsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/teacher/dashboard');
        setDashboard(res.data.dashboard);
        if (res.data.dashboard?.courses?.length > 0) {
          const firstCourse = res.data.dashboard.courses[0];
          setSelectedCourse(firstCourse.id);
          const analyticsRes = await api.get(`/teacher/analytics/${firstCourse.id}`);
          setAnalytics(analyticsRes.data.analytics);
        }
      } catch {
        setDashboard(MOCK_DASHBOARD);
        setAnalytics(MOCK_ANALYTICS);
        setSelectedCourse('mock-1');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    try {
      const res = await api.get(`/teacher/analytics/${courseId}`);
      setAnalytics(res.data.analytics);
    } catch {
      setAnalytics(MOCK_ANALYTICS);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  const stats = dashboard?.stats || MOCK_DASHBOARD.stats;
  const courses = dashboard?.courses || MOCK_DASHBOARD.courses;
  const att = analytics?.attendance || MOCK_ANALYTICS.attendance;
  const gradeData = analytics?.gradeDistribution || MOCK_ANALYTICS.gradeDistribution;
  const submissionData = analytics?.assignmentSubmissionRates || MOCK_ANALYTICS.assignmentSubmissionRates;

  const attendancePieData = [
    { name: '≥90%', value: att.above90 },
    { name: '75–89%', value: att.above75 },
    { name: '<75%', value: att.below75 }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <BarChart3 size={16} /> Course Analytics
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Teaching Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Comprehensive performance insights across your courses
          </p>
        </div>

        {/* Course selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Course:</label>
          <select
            className="form-select"
            style={{ width: 'auto' }}
            value={selectedCourse || ''}
            onChange={e => handleCourseChange(e.target.value)}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.courseCode} — {c.courseName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'var(--primary)', sub: 'This semester' },
          { label: 'Total Students', value: `${stats.totalStudents}`, icon: Users, color: 'var(--accent-purple)', sub: 'Enrolled across courses' },
          { label: 'Pending Grading', value: stats.pendingGrading, icon: CheckSquare, color: 'var(--warning)', sub: 'Submissions awaiting review' },
          { label: 'Low Attendance', value: stats.lowAttendanceAlerts, icon: AlertTriangle, color: 'var(--danger)', sub: 'Students below 75%' }
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="stat-label">{label}</div>
              <Icon size={18} color={color} />
            </div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Attendance Pie + Grade Distribution Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>

        {/* Attendance Distribution Pie */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={17} color="var(--success)" /> Attendance Distribution
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Average: {att.avgAttendance?.toFixed(1)}%
          </p>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {attendancePieData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#3b82f6', '#ef4444'][i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[['#10b981', '≥90%', att.above90], ['#3b82f6', '75–89%', att.above75], ['#ef4444', '<75%', att.below75]].map(([color, label, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                {label}: <strong>{val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution Bar */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={17} color="var(--primary)" /> Grade Distribution
          </h3>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="_id" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} formatter={(v) => [v, 'Students']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Assignment Submission Rates */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckSquare size={17} color="var(--warning)" /> Assignment Submission Rates
        </h3>
        <div className="chart-container" style={{ minHeight: 200 }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={submissionData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="title" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={100} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} formatter={v => [`${v}%`, 'Submission Rate']} />
              <Bar dataKey="rate" radius={[0, 6, 6, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Submission table */}
        <div style={{ marginTop: '1.25rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Assignment</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Submitted</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Rate</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {submissionData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{row.title}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.submitted}/{row.total}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span className={`badge ${row.rate >= 75 ? 'badge-success' : row.rate >= 50 ? 'badge-warning' : 'badge-danger'}`}>{row.rate}%</span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>Review</button>
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

export default TeacherAnalyticsPage;
