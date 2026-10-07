import React from 'react';
import { Link } from 'react-router-dom';
import { Users, MessageSquare, Loader2, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';

const StudyGroupMatcher = ({ studyGroupMatches, groupMatchExpanded, setGroupMatchExpanded, isMatchingGroup, onRefreshMatches }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(236,72,153,0.07) 50%, rgba(59,130,246,0.05) 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
        marginBottom: groupMatchExpanded ? '1.5rem' : 0,
        paddingBottom: groupMatchExpanded ? '1.25rem' : 0,
        borderBottom: groupMatchExpanded ? '1px solid var(--border-subtle)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}>
            <Users size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Smart Study Group Matchmaker</h2>
              <span className="badge" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', fontSize: '0.75rem' }}>🤝 AI Matched</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              AI matched ideal classmates based on complementary strengths, schedules & learning styles.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            onClick={onRefreshMatches}
            disabled={isMatchingGroup}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            id="refresh-matches-btn"
          >
            {isMatchingGroup ? <><Loader2 size={14} className="animate-spin" /> Matching...</> : <><Shuffle size={14} /> Re-Match</>}
          </button>
          <button
            onClick={() => setGroupMatchExpanded(!groupMatchExpanded)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            id="group-match-toggle"
          >
            {groupMatchExpanded ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> View Matches</>}
          </button>
        </div>
      </div>

      {groupMatchExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {studyGroupMatches.map((match, idx) => (
            <div
              key={idx}
              style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.85rem', transition: 'all 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              {/* Avatar + Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>
                  {match.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{match.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{match.style} · {match.schedule}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#a78bfa' }}>{match.match}%</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Match</div>
                </div>
              </div>

              {/* Match Bar */}
              <div className="progress-track" style={{ height: '6px' }}>
                <div className="progress-fill" style={{ width: `${match.match}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
              </div>

              {/* Strengths & Weakness Tags */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {match.strengths.map((s, sIdx) => (
                  <span key={sIdx} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px' }}>✓ {s}</span>
                ))}
                <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '100px' }}>Weak: {match.weakness}</span>
              </div>

              <Link
                to="/chat"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: '1px solid rgba(139,92,246,0.35)', color: '#a78bfa' }}
              >
                <MessageSquare size={13} /> Invite to Study Group
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyGroupMatcher;
