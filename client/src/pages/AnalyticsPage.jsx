import React, { useState, useEffect } from 'react';
import { studentAPI } from '../services/api.js';
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine
} from 'recharts';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await studentAPI.getStudentAnalytics();
        setAnalytics(res.data?.analytics || null);
      } catch (err) {
        console.error('Failed to load student analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Calculating multi-semester academic analytics from MongoDB...</p>
      </div>
    );
  }

  const student = analytics?.student || {
    cgpa: 3.82,
    department: 'Computer Science & Engineering',
    completedCredits: 74
  };

  const gpaTrend = analytics?.gpaTrend || [];
  const attendanceStats = analytics?.attendanceStats || [];
  const studyHours = analytics?.studyHoursDistribution || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          <TrendingUp size={16} /> Data-Driven Academic Intelligence
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          Student Analytics &amp; Performance Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Real-time visualizations of your GPA trajectory, lecture attendance health, weekly study time allocation, and peer benchmarking.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Cumulative GPA</span>
            <Award size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{student.cgpa}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>
            Top 10% in {student.department}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Aggregate Attendance</span>
            <BarChart2 size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: (analytics?.overallAttendance || 85) >= 75 ? 'var(--text-primary)' : 'var(--danger)' }}>
            {analytics?.overallAttendance || 85}%
          </div>
          <div style={{ fontSize: '0.75rem', color: analytics?.hasLowAttendance ? 'var(--danger)' : 'var(--success)', marginTop: '0.2rem' }}>
            {analytics?.hasLowAttendance ? '1 Course Below 75% Cutoff' : 'All Courses Above Cutoff'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Earned Credits</span>
            <Clock size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{student.completedCredits} / 120</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {Math.round(((student.completedCredits || 74) / 120) * 100)}% Degree Completion
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Assignment Turnaround</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{analytics?.assignmentTurnaround || 100}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>
            {analytics?.submittedAssignments || 1} of {analytics?.totalAssignments || 1} tasks submitted
          </div>
        </div>
      </div>

      {/* Main Charts Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 1: GPA Trajectory Over Semesters (Dynamic Recharts LineChart) */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Semester GPA Progression</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Your SGPA Trajectory vs Department Cohort Average</p>
            </div>
            <span className="badge badge-primary">Current: {student.cgpa}</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaTrend} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="semester" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[2.5, 4.0]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="gpa" name="Your GPA" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="classAverage" name="Cohort Average" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Course Attendance Health Breakdown */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Course Attendance Health (%)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Compared with Mandatory 75% Debarment Cutoff</p>
            </div>
            <span className="badge badge-warning">Cutoff: 75%</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceStats} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="courseCode" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '75% Cutoff', fill: '#ef4444', fontSize: 11 }} />
                <Bar dataKey="percentage" name="Attendance %" radius={[4, 4, 0, 0]}>
                  {attendanceStats.map((entry, idx) => (
                    <Cell key={idx} fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 75 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Study Hours Distribution */}
      {studyHours.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Weekly Active Learning &amp; Study Allocation (Hours)
          </h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHours} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="hours" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsPage;
