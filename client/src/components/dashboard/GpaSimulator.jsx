import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const GpaSimulator = ({ gpaSimCourses, setGpaSimCourses, gpaSimExpanded, setGpaSimExpanded }) => {
  const calcGpa = (key) => {
    const totalCredits = gpaSimCourses.reduce((a, c) => a + c.credits, 0);
    const totalPoints = gpaSimCourses.reduce((a, c) => a + c[key] * c.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  const simulatedCgpa = calcGpa('predictedGrade');
  const currentSimCgpa = calcGpa('currentGrade');
  const cgpaDelta = (simulatedCgpa - currentSimCgpa).toFixed(2);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(59,130,246,0.08) 50%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
        marginBottom: gpaSimExpanded ? '1.5rem' : 0,
        paddingBottom: gpaSimExpanded ? '1.25rem' : 0,
        borderBottom: gpaSimExpanded ? '1px solid var(--border-subtle)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            <Calculator size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>GPA What-If Predictor</h2>
              <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>🧮 Live Simulation</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Drag predicted grades to instantly see your projected CGPA before finals.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current → Projected</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: Number(cgpaDelta) > 0 ? 'var(--success)' : Number(cgpaDelta) < 0 ? 'var(--danger)' : 'var(--primary)' }}>
              {currentSimCgpa} → {simulatedCgpa}
              <span style={{ fontSize: '0.8rem', marginLeft: '0.35rem' }}>
                {Number(cgpaDelta) > 0 ? `▲+${cgpaDelta}` : Number(cgpaDelta) < 0 ? `▼${cgpaDelta}` : '◆ No Change'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setGpaSimExpanded(!gpaSimExpanded)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            id="gpa-sim-toggle"
          >
            {gpaSimExpanded ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> Simulate</>}
          </button>
        </div>
      </div>

      {gpaSimExpanded && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {gpaSimCourses.map((course, idx) => (
              <div key={idx} style={{ padding: '1rem 1.15rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{course.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{course.credits} Credits</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Predicted Grade</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: course.predictedGrade >= 8 ? 'var(--success)' : course.predictedGrade >= 6 ? 'var(--warning)' : 'var(--danger)' }}>
                      {course.predictedGrade.toFixed(1)}
                    </div>
                  </div>
                </div>
                <input
                  type="range" min="0" max="10" step="0.5"
                  value={course.predictedGrade}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setGpaSimCourses(prev => prev.map((c, i) => i === idx ? { ...c, predictedGrade: val } : c));
                  }}
                  style={{ width: '100%', accentColor: course.predictedGrade >= 8 ? '#10b981' : course.predictedGrade >= 6 ? '#f59e0b' : '#ef4444', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>0.0</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Current: {course.currentGrade}</span>
                  <span>10.0</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '1.25rem 1.5rem',
            background: Number(cgpaDelta) >= 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.1) 100%)' : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.08) 100%)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${Number(cgpaDelta) >= 0 ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>📊 Your Projected End-of-Semester CGPA</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: Number(cgpaDelta) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {simulatedCgpa} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10.0</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: Number(cgpaDelta) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                {Number(cgpaDelta) > 0 ? `🎉 You'll improve by +${cgpaDelta} points — keep it up!` : Number(cgpaDelta) < 0 ? `⚠️ You'll drop by ${cgpaDelta} points — revise now!` : '✅ Your CGPA stays the same with current performance.'}
              </div>
            </div>
            <button
              onClick={() => setGpaSimCourses(prev => prev.map(c => ({ ...c, predictedGrade: c.currentGrade })))}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RotateCcw size={14} /> Reset to Current
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GpaSimulator;
