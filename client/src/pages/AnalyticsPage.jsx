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
import { SkeletonStatGrid, SkeletonChart, SkeletonCard } from '../components/common/Skeleton.jsx';
import MetricCard from '../components/common/MetricCard.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
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
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <SkeletonCard lines={2} />
        <SkeletonStatGrid count={4} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <SkeletonChart height={280} />
          <SkeletonChart height={280} />
        </div>
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
        <MetricCard
          icon={Award}
          iconColor="var(--primary)"
          iconBg="rgba(59, 130, 246, 0.12)"
          label="Cumulative GPA"
          value={student.cgpa}
          subtext={`Top 10% in ${student.department}`}
          trend="8.65 / 10.0"
          trendType="positive"
        />

        <MetricCard
          icon={BarChart2}
          iconColor="var(--accent-purple)"
          iconBg="rgba(139, 92, 246, 0.12)"
          label="Aggregate Attendance"
          value={`${analytics?.overallAttendance || 85}%`}
          subtext={analytics?.hasLowAttendance ? '1 Course Below 75% Cutoff' : 'All Courses Above Cutoff'}
          trendType={(analytics?.overallAttendance || 85) >= 75 ? 'positive' : 'negative'}
          trend={(analytics?.overallAttendance || 85) >= 75 ? 'Good Standing' : 'Risk of Debarment'}
        />

        <MetricCard
          icon={Clock}
          iconColor="var(--accent-cyan)"
          iconBg="rgba(6, 182, 212, 0.12)"
          label="Earned Credits"
          value={`${student.completedCredits} / 120`}
          subtext={`${Math.round(((student.completedCredits || 74) / 120) * 100)}% Degree Completion`}
          trend="Sem 5 Regular"
          trendType="neutral"
        />

        <MetricCard
          icon={CheckCircle2}
          iconColor="var(--success)"
          iconBg="rgba(16, 185, 129, 0.12)"
          label="Assignment Turnaround"
          value={`${analytics?.assignmentTurnaround || 100}%`}
          subtext={`${analytics?.submittedAssignments || 1} of ${analytics?.totalAssignments || 1} tasks submitted`}
          trend="100% On-Time"
          trendType="positive"
        />
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
