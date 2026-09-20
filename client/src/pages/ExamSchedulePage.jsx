import React, { useState } from 'react';
import { CalendarCheck, Clock, MapPin, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Mock exam schedule data
const EXAM_SCHEDULE = [
  {
    id: 1,
    courseCode: 'CS-301',
    courseName: 'Algorithms & Complexity',
    examType: 'Final Examination',
    date: '2026-12-10',
    startTime: '09:00',
    endTime: '12:00',
    shift: 'Morning',
    venue: 'Examination Hall A, Block 3',
    seatNumber: 'A-42',
    hallTicketStatus: 'available',
    status: 'upcoming'
  },
  {
    id: 2,
    courseCode: 'CS-305',
    courseName: 'Cloud Computing & Distributed Systems',
    examType: 'Final Examination',
    date: '2026-12-12',
    startTime: '14:00',
    endTime: '17:00',
    shift: 'Afternoon',
    venue: 'Examination Hall B, Block 3',
    seatNumber: 'B-17',
    hallTicketStatus: 'available',
    status: 'upcoming'
  },
  {
    id: 3,
    courseCode: 'CS-309',
    courseName: 'AI & Neural Networks',
    examType: 'Final Examination',
    date: '2026-12-15',
    startTime: '09:00',
    endTime: '12:00',
    shift: 'Morning',
    venue: 'Examination Hall A, Block 3',
    seatNumber: 'A-88',
    hallTicketStatus: 'pending',
    status: 'upcoming'
  },
  {
    id: 4,
    courseCode: 'CS-302',
    courseName: 'Database Management Systems',
    examType: 'Internal Assessment 2',
    date: '2026-11-22',
    startTime: '10:00',
    endTime: '11:30',
    shift: 'Morning',
    venue: 'LH-201',
    seatNumber: 'Roll Order',
    hallTicketStatus: 'not_required',
    status: 'completed'
  }
];

const ExamSchedulePage = () => {
  const [filter, setFilter] = useState('all');

  const filteredExams = filter === 'all'
    ? EXAM_SCHEDULE
    : EXAM_SCHEDULE.filter(e => e.status === filter);

  const upcoming = EXAM_SCHEDULE.filter(e => e.status === 'upcoming');
  const nextExam = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <CalendarCheck size={16} /> Examination Portal
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Exam Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Fall Semester 2026 — Final Examination Timetable
        </p>
      </div>

      {/* Next Exam Alert */}
      {nextExam && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={14} /> NEXT EXAM
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{nextExam.courseCode}: {nextExam.courseName}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{formatDate(nextExam.date)} • {nextExam.startTime} – {nextExam.endTime}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{getDaysUntil(nextExam.date)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>days remaining</div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Info size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div>
          <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Examination Guidelines</div>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingLeft: '1rem' }}>
            <li>Carry your University ID card and printed/digital Hall Ticket to each exam.</li>
            <li>Report at least 20 minutes before the scheduled start time.</li>
            <li>Electronic devices and programmable calculators are strictly prohibited.</li>
            <li>Students with attendance below 75% will be barred from appearing.</li>
          </ul>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['all', 'upcoming', 'completed'].map(f => (
          <button
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.83rem', padding: '0.4rem 0.9rem' }}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && ` (${EXAM_SCHEDULE.filter(e => e.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Exam Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredExams.map(exam => {
          const daysUntil = exam.status === 'upcoming' ? getDaysUntil(exam.date) : null;
          const isUrgent = daysUntil !== null && daysUntil <= 3;

          return (
            <div
              key={exam.id}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                borderColor: exam.status === 'completed' ? 'var(--border-subtle)' : isUrgent ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)',
                opacity: exam.status === 'completed' ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  {/* Course & exam type */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{exam.courseCode}</span>
                    <span className="badge badge-purple">{exam.examType}</span>
                    {exam.status === 'completed' && <span className="badge badge-success">Completed</span>}
                    {isUrgent && <span className="badge badge-danger">⚠ {daysUntil}d left</span>}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.75rem' }}>{exam.courseName}</h3>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <CalendarCheck size={15} color="var(--primary)" />
                      {formatDate(exam.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Clock size={15} color="var(--accent-purple)" />
                      {exam.startTime} – {exam.endTime} ({exam.shift})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={15} color="var(--accent-cyan)" />
                      {exam.venue}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <FileText size={15} color="var(--warning)" />
                      Seat: <strong style={{ color: 'var(--text-primary)' }}>{exam.seatNumber}</strong>
                    </div>
                  </div>
                </div>

                {/* Hall Ticket Status */}
                <div style={{ textAlign: 'center' }}>
                  {exam.hallTicketStatus === 'available' ? (
                    <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
                      <FileText size={14} /> Hall Ticket
                    </button>
                  ) : exam.hallTicketStatus === 'pending' ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={20} />
                      Pending<br />
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Available Dec 3)</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={20} />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredExams.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <CalendarCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No {filter} exams found.</p>
        </div>
      )}
    </div>
  );
};

export default ExamSchedulePage;
