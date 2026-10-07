import React, { useState, useEffect, useCallback } from 'react';
import { riskAPI, studentAPI } from '../../services/api';
import {
  AlertTriangle, Shield, Activity, Users, Zap, CheckCircle,
  Clock, ChevronDown, ChevronUp, RefreshCw, Target, BookOpen,
  TrendingUp, TrendingDown, Calendar, Eye, CheckSquare, Trash2,
  Brain, BarChart2, UserCheck, Award, Search, Filter, XCircle,
  ArrowUpRight, Loader, Info
} from 'lucide-react';

// ── Risk level config ────────────────────────────────────────────────────────
const RISK_CONFIG = {
  safe:     { label: 'Safe',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  icon: Shield,        emoji: '🟢' },
  monitor:  { label: 'Monitor',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: Eye,           emoji: '🟡' },
  at_risk:  { label: 'At Risk',   color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: AlertTriangle, emoji: '🟠' },
  critical: { label: 'Critical',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: Zap,           emoji: '🔴' }
};

const FACTOR_ICONS = { Attendance: Calendar, Marks: Award, Assignments: BookOpen, Engagement: Brain };

// ── Score Ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, strokeWidth = 7, color }) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth}/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

// ── Factor Bar ────────────────────────────────────────────────────────────────
function FactorBar({ factor }) {
  const Icon = FACTOR_ICONS[factor.factor] || Activity;
  const statusColors = { safe: '#22c55e', warning: '#f59e0b', danger: '#f97316', critical: '#ef4444' };
  const clr = statusColors[factor.status] || '#6b7280';
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={14} color={clr}/>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>{factor.factor}</span>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: clr }}>{factor.score}/100</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${factor.score}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${clr}88, ${clr})`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)'
        }}/>
      </div>
      <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.25rem', lineHeight: 1.4 }}>{factor.detail}</p>
    </div>
  );
}

// ── Student Risk Card ─────────────────────────────────────────────────────────
function RiskCard({ alert, onAcknowledge, onViewDetail }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RISK_CONFIG[alert.riskLevel] || RISK_CONFIG.monitor;
  const RIcon = cfg.icon;
  const student = alert.student;
  const name = student?.userId?.fullName ||
    `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`.trim() ||
    student?.studentId || 'Unknown Student';

  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      border: `1px solid ${cfg.border}`,
      borderRadius: '1rem',
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      animation: 'fadeSlideIn 0.4s ease forwards'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>

      {/* Card header */}
      <div style={{
        padding: '1.1rem 1.25rem',
        background: cfg.bg,
        display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        {/* Score ring with icon overlay */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={alert.overallRiskScore} size={70} color={cfg.color}/>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '0.8rem', fontWeight: 800, color: cfg.color
          }}>{alert.overallRiskScore}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              color: cfg.color, borderRadius: 99, padding: '0.15rem 0.6rem',
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em'
            }}>
              <RIcon size={10}/> {cfg.label.toUpperCase()}
            </span>
            {alert.isAcknowledged && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                borderRadius: 99, padding: '0.15rem 0.6rem',
                fontSize: '0.65rem', fontWeight: 600
              }}>
                <CheckCircle size={9}/> Acknowledged
              </span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', margin: 0, truncate: true }}>{name}</h3>
          <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.15rem 0 0' }}>
            {student?.studentId} · Sem {student?.currentSemester} · {student?.department}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
          <button
            onClick={() => onViewDetail(alert)}
            style={{
              padding: '0.4rem 0.7rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: '0.72rem', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
            <Eye size={12}/> View
          </button>
          <button
            onClick={() => setExpanded(p => !p)}
            style={{
              padding: '0.4rem 0.7rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontSize: '0.72rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
            {expanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
          <span style={{ color: '#818cf8', fontWeight: 600 }}>🤖 AI: </span>
          {alert.aiSummary}
        </p>
      </div>

      {/* Snapshot metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 0, borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {[
          { label: 'Attendance', value: `${alert.snapshotData?.attendancePercent || 0}%`, warn: (alert.snapshotData?.attendancePercent || 0) < 75 },
          { label: 'Avg Marks', value: `${alert.snapshotData?.avgMarksPercent || 0}%`, warn: (alert.snapshotData?.avgMarksPercent || 0) < 50 },
          { label: 'Assignments', value: `${alert.snapshotData?.assignmentSubmissionRate || 0}%`, warn: (alert.snapshotData?.assignmentSubmissionRate || 0) < 70 },
          { label: 'CGPA', value: (alert.snapshotData?.cgpa || 0).toFixed(1), warn: (alert.snapshotData?.cgpa || 0) < 5 }
        ].map((m, i) => (
          <div key={i} style={{
            padding: '0.65rem',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: m.warn ? '#f97316' : '#f1f5f9' }}>{m.value}</div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.1rem' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Expanded: Factor Breakdown + Recovery Plan */}
      {expanded && (
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Factor Bars */}
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Risk Breakdown
              </p>
              {(alert.riskFactors || []).map((f, i) => <FactorBar key={i} factor={f}/>)}
            </div>

            {/* Recovery Plan */}
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Recovery Plan
              </p>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.6rem' }}>
                {alert.recoveryPlan?.headline}
              </p>
              {(alert.recoveryPlan?.steps || []).map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.6rem', marginBottom: '0.5rem',
                  background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', padding: '0.5rem 0.65rem'
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 99,
                    background: step.owner === 'faculty' ? 'rgba(139,92,246,0.2)' : 'rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.65rem', fontWeight: 800,
                    color: step.owner === 'faculty' ? '#a78bfa' : '#818cf8'
                  }}>{step.priority}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#e2e8f0', lineHeight: 1.4 }}>{step.action}</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.65rem', color: '#64748b' }}>
                      <Clock size={9} style={{ display: 'inline', marginRight: 3 }}/>{step.deadline}
                      {' · '}
                      <span style={{ textTransform: 'capitalize', color: step.owner === 'faculty' ? '#a78bfa' : '#818cf8' }}>
                        {step.owner}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
              {alert.recoveryPlan?.estimatedRecoveryWeeks > 0 && (
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Target size={11}/> Est. recovery: {alert.recoveryPlan.estimatedRecoveryWeeks} weeks
                </p>
              )}
            </div>
          </div>

          {/* Acknowledge button */}
          {!alert.isAcknowledged && (
            <button
              onClick={() => onAcknowledge(alert._id)}
              style={{
                marginTop: '1rem', width: '100%', padding: '0.6rem',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', borderRadius: '0.6rem', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
              }}>
              <CheckSquare size={14}/> Mark as Acknowledged
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ alert, onClose, onAcknowledge }) {
  if (!alert) return null;
  const cfg = RISK_CONFIG[alert.riskLevel] || RISK_CONFIG.monitor;
  const student = alert.student;
  const name = student?.userId?.fullName ||
    `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`.trim() || 'Student';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: `1px solid ${cfg.border}`,
        borderRadius: '1.25rem', maxWidth: 760, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: `0 0 60px ${cfg.color}33`
      }} onClick={e => e.stopPropagation()}>

        {/* Modal Header */}
        <div style={{
          padding: '1.5rem', background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ position: 'relative' }}>
            <ScoreRing score={alert.overallRiskScore} size={90} strokeWidth={8} color={cfg.color}/>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: cfg.color }}>{alert.overallRiskScore}</div>
              <div style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '-2px' }}>SCORE</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block', background: cfg.bg, border: `1px solid ${cfg.border}`,
              color: cfg.color, borderRadius: 99, padding: '0.2rem 0.75rem',
              fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem'
            }}>{cfg.emoji} {cfg.label} Risk</span>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#f1f5f9' }}>{name}</h2>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              ID: {student?.studentId} · Sem {student?.currentSemester} · {student?.department} · CGPA {alert.snapshotData?.cgpa?.toFixed(1)}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8',
            borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer'
          }}><XCircle size={20}/></button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Summary */}
          <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: '0.8rem', padding: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🤖 AI Analysis</p>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{alert.aiSummary}</p>
          </div>

          {/* Factor Breakdown */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Factor Breakdown</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {(alert.riskFactors || []).map((f, i) => {
                const statusColors = { safe: '#22c55e', warning: '#f59e0b', danger: '#f97316', critical: '#ef4444' };
                const clr = statusColors[f.status] || '#6b7280';
                return (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem',
                    padding: '0.85rem', border: `1px solid rgba(255,255,255,0.07)`
                  }}>
                    <FactorBar factor={f}/>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recovery Plan */}
          <div style={{ background: 'rgba(139,92,246,0.08)', borderRadius: '0.8rem', padding: '1.25rem', border: '1px solid rgba(139,92,246,0.2)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🗺️ Recovery Plan</p>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#c4b5fd', margin: '0 0 1rem' }}>{alert.recoveryPlan?.headline}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {(alert.recoveryPlan?.steps || []).map((step, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.75rem'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 99, flexShrink: 0,
                    background: step.owner === 'faculty' ? 'rgba(139,92,246,0.25)' : 'rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem',
                    color: step.owner === 'faculty' ? '#a78bfa' : '#818cf8'
                  }}>{step.priority}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 600, color: '#e2e8f0' }}>{step.action}</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                      ⏰ {step.deadline} · 
                      <span style={{ color: step.owner === 'faculty' ? '#a78bfa' : '#818cf8', fontWeight: 600, marginLeft: '0.25rem', textTransform: 'capitalize' }}>
                        {step.owner}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {alert.recoveryPlan?.estimatedRecoveryWeeks > 0 && (
              <div style={{
                marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600
              }}>
                <Target size={14}/> Estimated full recovery: {alert.recoveryPlan.estimatedRecoveryWeeks} weeks
              </div>
            )}
          </div>

          {/* Actions */}
          {!alert.isAcknowledged && (
            <button
              onClick={() => { onAcknowledge(alert._id); onClose(); }}
              style={{
                padding: '0.85rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none', borderRadius: '0.75rem', color: 'white', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}>
              <CheckSquare size={16}/> Acknowledge & Take Action
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RiskEarlyWarningPage() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterAck, setFilterAck] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [batchDept, setBatchDept] = useState('');
  const [batchSem, setBatchSem] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        riskAPI.getAlerts({ riskLevel: filterLevel || undefined, acknowledged: filterAck !== '' ? filterAck : undefined }),
        riskAPI.getDashboardStats()
      ]);
      setAlerts(alertsRes.data?.data || []);
      setStats(statsRes.data?.data || null);
    } catch (err) {
      showToast('Failed to load risk data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterAck]);

  const loadStudents = async () => {
    try {
      const res = await studentAPI.getAll({ limit: 200 });
      setStudents(res.data?.data || res.data?.students || []);
    } catch (_) {}
  };

  useEffect(() => { loadData(); loadStudents(); }, [loadData]);

  const handleAnalyzeSingle = async () => {
    if (!selectedStudentId) { showToast('Select a student first', 'error'); return; }
    setAnalyzing(true);
    try {
      await riskAPI.analyzeStudent(selectedStudentId);
      showToast('✅ Risk analysis complete!');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async () => {
    setBatchRunning(true);
    try {
      const res = await riskAPI.batchAnalyze({ department: batchDept || undefined, semester: batchSem || undefined });
      const s = res.data?.summary;
      showToast(`✅ Batch done: ${s?.total} students — ${s?.critical} critical, ${s?.at_risk} at-risk`);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Batch analysis failed', 'error');
    } finally {
      setBatchRunning(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await riskAPI.acknowledgeAlert(alertId);
      showToast('Alert acknowledged');
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isAcknowledged: true } : a));
      if (stats) setStats(prev => ({ ...prev, unacknowledgedCount: Math.max(0, (prev?.unacknowledgedCount || 0) - 1) }));
    } catch (_) {
      showToast('Failed to acknowledge', 'error');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (!searchTerm) return true;
    const name = a.student?.userId?.fullName || a.student?.studentId || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || a.student?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const statCards = [
    { label: 'Total Students', value: stats?.counts?.total || 0, icon: Users, color: '#818cf8', sub: 'analyzed' },
    { label: 'Critical', value: stats?.counts?.critical || 0, icon: Zap, color: '#ef4444', sub: 'immediate action' },
    { label: 'At Risk', value: stats?.counts?.at_risk || 0, icon: AlertTriangle, color: '#f97316', sub: 'intervention needed' },
    { label: 'Monitoring', value: stats?.counts?.monitor || 0, icon: Eye, color: '#f59e0b', sub: 'watch closely' },
    { label: 'Safe', value: stats?.counts?.safe || 0, icon: Shield, color: '#22c55e', sub: 'on track' },
    { label: 'Unacknowledged', value: stats?.unacknowledgedCount || 0, icon: Clock, color: '#a78bfa', sub: 'need attention' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1224 40%, #0f0a1e 100%)', padding: '2rem', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:rgba(255,255,255,0.02); }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:99px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)',
          color: 'white', borderRadius: '0.75rem', padding: '0.85rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 600, backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'fadeSlideIn 0.3s ease'
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem', animation: 'fadeSlideIn 0.5s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '0.75rem',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(239,68,68,0.4)'
          }}>
            <AlertTriangle size={22} color="white"/>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1 }}>
              AI Backlog Risk & Early Warning
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Powered by Azure OpenAI · Real-time academic risk intelligence
            </p>
          </div>
          {stats?.unacknowledgedCount > 0 && (
            <div style={{
              marginLeft: 'auto', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem',
              padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 99, background: '#ef4444', animation: 'pulse 1.5s infinite' }}/>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
                {stats.unacknowledgedCount} alerts need attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.5rem' }}>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
          { key: 'alerts', label: 'Risk Alerts', icon: AlertTriangle },
          { key: 'analyze', label: 'Run Analysis', icon: Zap }
        ].map(tab => {
          const TIcon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: '0.6rem 1.25rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: active ? '#818cf8' : '#64748b', fontWeight: active ? 700 : 500,
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
              transition: 'all 0.2s'
            }}>
              <TIcon size={15}/> {tab.label}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {statCards.map((c, i) => {
              const CIcon = c.icon;
              return (
                <div key={i} style={{
                  background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '0.875rem', padding: '1.25rem', backdropFilter: 'blur(12px)',
                  animation: `fadeSlideIn 0.4s ease ${i * 0.06}s forwards`, opacity: 0,
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '0.6rem',
                      background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <CIcon size={18} color={c.color}/>
                    </div>
                    <ArrowUpRight size={14} color="#475569"/>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', marginTop: '0.3rem' }}>{c.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.15rem' }}>{c.sub}</div>
                </div>
              );
            })}
          </div>

          {/* Recent Critical Alerts */}
          <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '1rem', padding: '1.5rem', backdropFilter: 'blur(12px)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="#ef4444"/> Immediate Attention Required
            </h3>
            {(stats?.recentCritical || []).length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>
                🎉 No critical alerts at this time. Run an analysis to get started.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(stats?.recentCritical || []).map((a, i) => {
                  const name = a.student?.userId?.fullName || a.student?.studentId || 'Student';
                  const cfg = RISK_CONFIG[a.riskLevel] || RISK_CONFIG.critical;
                  const RIcon = cfg.icon;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      background: 'rgba(239,68,68,0.06)', borderRadius: '0.6rem', padding: '0.75rem 1rem',
                      border: '1px solid rgba(239,68,68,0.15)'
                    }}>
                      <RIcon size={16} color={cfg.color}/>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem' }}>{name}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '0.5rem' }}>
                          Score: {a.overallRiskScore}/100 · {a.student?.department}
                        </span>
                      </div>
                      <button onClick={() => { setActiveTab('alerts'); }} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5', borderRadius: '0.4rem', padding: '0.3rem 0.6rem',
                        fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                      }}>View Alert</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALERTS TAB */}
      {activeTab === 'alerts' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}/>
              <input
                placeholder="Search by student name or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem',
                  background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.6rem', color: '#f1f5f9', fontSize: '0.83rem', outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{
              padding: '0.6rem 1rem', background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem',
              color: '#f1f5f9', fontSize: '0.83rem', cursor: 'pointer', outline: 'none'
            }}>
              <option value="">All Risk Levels</option>
              <option value="critical">🔴 Critical</option>
              <option value="at_risk">🟠 At Risk</option>
              <option value="monitor">🟡 Monitor</option>
              <option value="safe">🟢 Safe</option>
            </select>
            <select value={filterAck} onChange={e => setFilterAck(e.target.value)} style={{
              padding: '0.6rem 1rem', background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem',
              color: '#f1f5f9', fontSize: '0.83rem', cursor: 'pointer', outline: 'none'
            }}>
              <option value="">All Status</option>
              <option value="false">Unacknowledged</option>
              <option value="true">Acknowledged</option>
            </select>
            <button onClick={loadData} style={{
              padding: '0.6rem 1rem', background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8',
              borderRadius: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.83rem', fontWeight: 600
            }}>
              <RefreshCw size={14}/> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }}/>
              <p>Loading risk alerts...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem',
              background: 'rgba(15,23,42,0.7)', borderRadius: '1rem',
              border: '1px solid rgba(255,255,255,0.07)'
            }}>
              <Shield size={40} color="#22c55e" style={{ marginBottom: '1rem' }}/>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem' }}>No alerts found</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Run an analysis to generate student risk reports.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1rem' }}>
              {filteredAlerts.map((alert, i) => (
                <RiskCard
                  key={alert._id || i}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onViewDetail={setSelectedAlert}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYZE TAB */}
      {activeTab === 'analyze' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Single Student Analysis */}
          <div style={{
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '1rem', padding: '1.75rem', backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} color="#818cf8"/>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Single Student Analysis</h3>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#64748b' }}>Deep-dive risk analysis for one student</p>
              </div>
            </div>

            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', marginBottom: '1rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.6rem', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none',
                boxSizing: 'border-box'
              }}>
              <option value="">Select a student...</option>
              {students.map(s => {
                const name = s.userId?.fullName || `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.trim() || s.studentId;
                return <option key={s._id} value={s._id}>{name} ({s.studentId})</option>;
              })}
            </select>

            <button
              onClick={handleAnalyzeSingle}
              disabled={!selectedStudentId || analyzing}
              style={{
                width: '100%', padding: '0.85rem',
                background: (!selectedStudentId || analyzing) ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none', borderRadius: '0.75rem',
                color: (!selectedStudentId || analyzing) ? '#64748b' : 'white',
                fontWeight: 700, fontSize: '0.9rem', cursor: (!selectedStudentId || analyzing) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: (!selectedStudentId || analyzing) ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'all 0.2s'
              }}>
              {analyzing ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }}/> Analyzing...</> : <><Zap size={16}/> Run AI Risk Analysis</>}
            </button>

            <div style={{ marginTop: '1.25rem', background: 'rgba(99,102,241,0.06)', borderRadius: '0.6rem', padding: '0.85rem' }}>
              <p style={{ margin: 0, fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <Info size={12} style={{ display: 'inline', marginRight: 5, color: '#818cf8' }}/>
                This analysis aggregates <strong style={{ color: '#818cf8' }}>attendance records</strong>, <strong style={{ color: '#818cf8' }}>exam marks</strong>, <strong style={{ color: '#818cf8' }}>assignment submissions</strong>, and <strong style={{ color: '#818cf8' }}>AI learning engagement</strong> to compute a risk score and generate an Azure OpenAI recovery plan.
              </p>
            </div>
          </div>

          {/* Batch Analysis */}
          <div style={{
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '1rem', padding: '1.75rem', backdropFilter: 'blur(12px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '0.6rem', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} color="#f87171"/>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Batch Department Scan</h3>
                <p style={{ margin: 0, fontSize: '0.73rem', color: '#64748b' }}>Analyze all students at once (up to 50)</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                placeholder="Department (optional)"
                value={batchDept}
                onChange={e => setBatchDept(e.target.value)}
                style={{
                  flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem',
                  color: '#f1f5f9', fontSize: '0.83rem', outline: 'none'
                }}
              />
              <input
                placeholder="Semester"
                value={batchSem}
                onChange={e => setBatchSem(e.target.value)}
                type="number" min="1" max="12"
                style={{
                  width: 100, padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.6rem',
                  color: '#f1f5f9', fontSize: '0.83rem', outline: 'none'
                }}
              />
            </div>

            <button
              onClick={handleBatchAnalyze}
              disabled={batchRunning}
              style={{
                width: '100%', padding: '0.85rem',
                background: batchRunning ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                border: 'none', borderRadius: '0.75rem',
                color: batchRunning ? '#94a3b8' : 'white',
                fontWeight: 700, fontSize: '0.9rem', cursor: batchRunning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: batchRunning ? 'none' : '0 4px 20px rgba(239,68,68,0.35)',
                transition: 'all 0.2s'
              }}>
              {batchRunning ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }}/> Running Batch Analysis...</> : <><Activity size={16}/> Run Batch Analysis</>}
            </button>

            <div style={{ marginTop: '1rem' }}>
              {[
                { icon: '🎯', text: 'AI generates full recovery plans for at-risk & critical students' },
                { icon: '⚡', text: 'Lightweight analysis for safe/monitor students to save API quota' },
                { icon: '📊', text: 'Leave filters empty to scan all departments and semesters' }
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: '0.8rem' }}>{tip.icon}</span>
                  <p style={{ margin: 0, fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.5 }}>{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level Legend */}
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '1rem', padding: '1.25rem', backdropFilter: 'blur(12px)'
          }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Risk Scoring Methodology
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {Object.entries(RISK_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const thresholds = { safe: '≥ 80', monitor: '60–79', at_risk: '40–59', critical: '< 40' };
                const factors_desc = {
                  safe: 'Attendance ≥ 75% · Marks ≥ 60% · Assignments ≥ 80%',
                  monitor: 'One metric showing early warning signs',
                  at_risk: 'Multiple metrics below thresholds',
                  critical: 'Severe issues across attendance, marks, and submissions'
                };
                return (
                  <div key={key} style={{
                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                    borderRadius: '0.75rem', padding: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Icon size={16} color={cfg.color}/>
                      <span style={{ fontWeight: 700, color: cfg.color, fontSize: '0.85rem' }}>{cfg.label}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 800, color: cfg.color }}>{thresholds[key]}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5 }}>{factors_desc[key]}</p>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99,102,241,0.06)', borderRadius: '0.6rem', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p style={{ margin: 0, fontSize: '0.73rem', color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#818cf8' }}>Weighted Score:</strong> Attendance (30%) + Marks (30%) + Assignments (25%) + Digital Twin Engagement (15%) = Overall Risk Score
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAlert && (
        <DetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
}
