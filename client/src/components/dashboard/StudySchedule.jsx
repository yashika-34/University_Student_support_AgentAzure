import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Sparkles, Loader2, ChevronDown, ChevronUp, RotateCcw, BookOpen, Coffee, Star } from 'lucide-react';

const StudySchedule = ({ studySchedule, setStudySchedule, scheduleExpanded, setScheduleExpanded, isGeneratingSchedule, onGenerateSchedule }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(249,115,22,0.06) 50%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem',
        marginBottom: scheduleExpanded ? '1.5rem' : 0,
        paddingBottom: scheduleExpanded ? '1.25rem' : 0,
        borderBottom: scheduleExpanded ? '1px solid var(--border-subtle)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
            <Target size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>AI Study Schedule Generator</h2>
              <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem' }}>📅 Personalized</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              AI analyzes your weak topics, exam dates & attendance to build your optimal weekly study plan.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {!studySchedule ? (
            <button
              onClick={onGenerateSchedule}
              disabled={isGeneratingSchedule}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', border: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.3)', padding: '0.55rem 1.15rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              id="generate-schedule-btn"
            >
              {isGeneratingSchedule ? <><Loader2 size={15} className="animate-spin" /> Building Plan...</> : <><Sparkles size={15} /> Generate My Weekly Plan</>}
            </button>
          ) : (
            <>
              <button
                onClick={() => { setStudySchedule(null); setScheduleExpanded(false); }}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RotateCcw size={14} /> Regenerate
              </button>
              <button
                onClick={() => setScheduleExpanded(!scheduleExpanded)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                id="schedule-toggle"
              >
                {scheduleExpanded ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> View Schedule</>}
              </button>
            </>
          )}
        </div>
      </div>

      {isGeneratingSchedule && (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
          <Loader2 size={36} className="animate-spin" color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>AI is analyzing your exams, weak spots & attendance...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Building your optimal personalized study timetable ✨</div>
        </div>
      )}

      {studySchedule && scheduleExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {studySchedule.map((day, dIdx) => (
            <div key={dIdx} style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {day.day === 'Sunday' ? <Coffee size={14} color="var(--text-muted)" /> : day.day === 'Saturday' ? <Star size={14} color="#fbbf24" /> : <BookOpen size={14} color="var(--primary)" />}
                {day.day}
              </div>
              {day.slots.map((slot, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    padding: '0.6rem 0.75rem',
                    background: slot.type === 'Ghost Exam' ? 'rgba(139,92,246,0.1)' : slot.type === 'Weak Topic Fix' ? 'rgba(239,68,68,0.08)' : slot.type === 'Placement Prep' ? 'rgba(245,158,11,0.1)' : slot.type === 'Optional' ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.07)',
                    borderRadius: '6px',
                    border: `1px solid ${slot.type === 'Ghost Exam' ? 'rgba(139,92,246,0.25)' : slot.type === 'Weak Topic Fix' ? 'rgba(239,68,68,0.2)' : 'transparent'}`
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{slot.icon} {slot.subject}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{slot.time} · {slot.type}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudySchedule;
