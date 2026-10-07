import React from 'react';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';

const KnowledgeGraph = ({ knowledgeGraph, graphExpanded, setGraphExpanded, onStudyWeakTopic, isGeneratingFlashcards }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(16,185,129,0.05) 50%, rgba(139,92,246,0.06) 100%)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
        marginBottom: graphExpanded ? '1.5rem' : 0,
        paddingBottom: graphExpanded ? '1.25rem' : 0,
        borderBottom: graphExpanded ? '1px solid var(--border-subtle)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}>
            <Map size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Degree Knowledge Graph</h2>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>🗺️ Mastery Map</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Visual mastery map of your entire degree — green = mastered, red = needs urgent work.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--success)' }}>●</span> Mastered &nbsp;
            <span style={{ color: 'var(--warning)' }}>●</span> On Track &nbsp;
            <span style={{ color: 'var(--danger)' }}>●</span> Weak
          </div>
          <button
            onClick={() => setGraphExpanded(!graphExpanded)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            id="knowledge-graph-toggle"
          >
            {graphExpanded ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> View Map</>}
          </button>
        </div>
      </div>

      {graphExpanded && (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Mastered (>75%)', count: knowledgeGraph.filter(k => k.mastery >= 75).length, color: 'var(--success)', bg: 'rgba(16,185,129,0.08)' },
              { label: 'On Track (50-75%)', count: knowledgeGraph.filter(k => k.mastery >= 50 && k.mastery < 75).length, color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)' },
              { label: 'Needs Work (<50%)', count: knowledgeGraph.filter(k => k.mastery < 50).length, color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)' },
            ].map((stat, idx) => (
              <div key={idx} style={{ padding: '0.85rem', background: stat.bg, borderRadius: 'var(--radius-sm)', border: `1px solid ${stat.color}30`, textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>{stat.count}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Subject Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {knowledgeGraph.map((node, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1rem', background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${node.mastery >= 75 ? 'rgba(16,185,129,0.3)' : node.mastery >= 50 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.3)'}`,
                  transition: 'all 0.2s ease', cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
              >
                {/* Conic Progress Ring */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${node.mastery >= 75 ? '#10b981' : node.mastery >= 50 ? '#f59e0b' : '#ef4444'} ${node.mastery * 3.6}deg, var(--bg-card, #1e293b) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 3px var(--bg-surface), 0 0 0 5px ${node.mastery >= 75 ? '#10b98140' : node.mastery >= 50 ? '#f59e0b40' : '#ef444440'}`
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', color: node.mastery >= 75 ? '#10b981' : node.mastery >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {node.mastery}%
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span>{node.subject}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'var(--bg-card, #0f172a)', borderRadius: '100px', color: 'var(--text-muted)' }}>Sem {node.semester}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', background: 'var(--bg-card, #0f172a)', borderRadius: '100px', color: 'var(--text-muted)' }}>{node.credits} Cr</span>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{ width: `${node.mastery}%`, background: node.mastery >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : node.mastery >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)' }} />
                  </div>
                  {node.mastery < 50 && <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>⚠️ Weak area — prioritize in next study session</div>}
                </div>

                {node.mastery < 50 && (
                  <button
                    onClick={() => onStudyWeakTopic(node.subject)}
                    disabled={isGeneratingFlashcards}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', flexShrink: 0 }}
                  >
                    ⚡ Fix Now
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
