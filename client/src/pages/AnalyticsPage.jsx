import React, { useState } from 'react';
import { mockData } from '../services/api.js';
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Award,
  Sparkles
} from 'lucide-react';

const AnalyticsPage = () => {
  const [analytics] = useState(mockData.analytics);
  const student = mockData.student;

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
            Top 8% in Computer Science Department
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Attendance Index</span>
            <BarChart2 size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>84.9%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
            1 Subject Below 75% Cutoff
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Study Hours Logged</span>
            <Clock size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>31 hrs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Past 7 days active learning
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Assignment Turnaround</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>100%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.2rem' }}>
            Zero late submissions
          </div>
        </div>
      </div>

      {/* Main Charts Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* Chart 1: GPA Trajectory Over 5 Semesters */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>5-Semester GPA Progression</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Alex Mercer vs Department Cohort Average</p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%' }} /> You
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#64748b', borderRadius: '50%' }} /> Cohort Average
              </span>
            </div>
          </div>

          {/* Responsive SVG Line Chart */}
          <div style={{ width: '100%', height: '240px' }}>
            <svg viewBox="0 0 500 240" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="40" y1="40" x2="480" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
              <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
              <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(255,255,255,0.06)" />

              {/* Y Axis Labels */}
              <text x="25" y="45" fill="#64748b" fontSize="10" textAnchor="end">4.0</text>
              <text x="25" y="95" fill="#64748b" fontSize="10" textAnchor="end">3.5</text>
              <text x="25" y="145" fill="#64748b" fontSize="10" textAnchor="end">3.0</text>
              <text x="25" y="195" fill="#64748b" fontSize="10" textAnchor="end">2.5</text>

              {/* Class Average Line (Points: Sem 1 to 5) */}
              {/* x: 70, 160, 250, 340, 430. y: scaled (4.0=40, 2.5=190 => 1.5 delta = 150px => 100px per 1.0 GPA) */}
              {/* 3.25 => 115, 3.30 => 110, 3.32 => 108, 3.35 => 105, 3.38 => 102 */}
              <polyline
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4"
                points="70,115 160,110 250,108 340,105 430,102"
              />

              {/* Student GPA Line */}
              {/* 3.65 => 75, 3.72 => 68, 3.80 => 60, 3.85 => 55, 3.82 => 58 */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                points="70,75 160,68 250,60 340,55 430,58"
              />

              {/* Student Data Points */}
              <circle cx="70" cy="75" r="5" fill="#3b82f6" />
              <circle cx="160" cy="68" r="5" fill="#3b82f6" />
              <circle cx="250" cy="60" r="5" fill="#3b82f6" />
              <circle cx="340" cy="55" r="5" fill="#3b82f6" />
              <circle cx="430" cy="58" r="6" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="2" />

              {/* Value labels */}
              <text x="70" y="65" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">3.65</text>
              <text x="160" y="58" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">3.72</text>
              <text x="250" y="50" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">3.80</text>
              <text x="340" y="45" fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="bold">3.85</text>
              <text x="430" y="48" fill="#60a5fa" fontSize="12" textAnchor="middle" fontWeight="bold">3.82</text>

              {/* X Axis Labels */}
              <text x="70" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">Sem 1</text>
              <text x="160" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">Sem 2</text>
              <text x="250" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">Sem 3</text>
              <text x="340" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">Sem 4</text>
              <text x="430" y="215" fill="#94a3b8" fontSize="11" textAnchor="middle">Sem 5</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Course Attendance Health Breakdown */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Course Attendance Distribution</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Compared with Mandatory 75% Debarment Cutoff</p>
            </div>
            <span className="badge badge-warning">Cutoff: 75%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '0.5rem' }}>
            {analytics.attendanceStats.map((item) => (
              <div key={item.course}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600 }}>{item.course}</span>
                  <span style={{ fontWeight: 800, color: item.percentage >= 80 ? 'var(--success)' : item.percentage >= 75 ? 'var(--warning)' : 'var(--danger)' }}>
                    {item.percentage}%
                  </span>
                </div>
                
                {/* Horizontal Progress Bar */}
                <div style={{ position: 'relative', width: '100%', height: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${item.percentage}%`,
                    height: '100%',
                    background: item.percentage >= 80 ? 'var(--success)' : item.percentage >= 75 ? 'var(--warning)' : 'var(--danger)',
                    borderRadius: 'var(--radius-full)'
                  }} />
                  {/* 75% Threshold indicator line */}
                  <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '2px', background: '#ffffff', opacity: 0.8 }} title="75% Cutoff" />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            * White vertical marker represents institutional 75% exam cut-off threshold.
          </div>
        </div>

      </div>

      {/* Chart 3: Weekly Study Time Distribution */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          Weekly Dedicated Study Hours
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          Daily tracked hours across problem sets, lecture revisions, and cloud labs. Total: 31 hours.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', padding: '0 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          {analytics.studyHoursDistribution.map((d) => {
            const heightPercent = (d.hours / 8.0) * 100;
            return (
              <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '42px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{d.hours}h</span>
                <div style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  background: 'var(--primary-gradient)',
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
