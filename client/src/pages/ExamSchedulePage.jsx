import React, { useState, useEffect } from 'react';
import { examAPI } from '../services/api.js';
import { CalendarCheck, Clock, MapPin, FileText, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

const ExamSchedulePage = () => {
  const [exams, setExams] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await examAPI.getSchedules();
        setExams(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch exam schedules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const filteredExams = filter === 'all'
    ? exams
    : exams.filter((e) => e.status === filter);

  const upcoming = exams.filter((e) => e.status === 'upcoming');
  const nextExam = upcoming.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading exam schedule from MongoDB...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <CalendarCheck size={16} /> Examination Timetable
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Semester Examination Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Official timetable, venue assignments, and digital admit card clearance retrieved from database.
        </p>
      </div>

      {/* Next Exam Alert */}
      {nextExam && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.08))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>Next Upcoming Exam</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0.25rem 0' }}>
              {nextExam.courseCode} — {nextExam.courseName}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {formatDate(nextExam.date)} · {nextExam.startTime} - {nextExam.endTime} · Venue: <strong>{nextExam.venue}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
              {getDaysUntil(nextExam.date)}d
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Countdown to Exam</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {['all', 'upcoming', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'all' ? 'All Assessments' : f}
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredExams.length === 0 ? (
          <div className="glass-panel" style={{ padding: '2rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            No examinations found for selected filter.
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div key={exam._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary">{exam.courseCode}</span>
                  <span className={`badge ${exam.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                    {exam.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{exam.courseName}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>{exam.examType}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CalendarCheck size={14} color="var(--primary)" /> {formatDate(exam.date)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} color="var(--accent-purple)" /> {exam.startTime} - {exam.endTime} ({exam.shift})
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--accent-cyan)" /> {exam.venue} · Seat: <strong>{exam.seatNumber}</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hall Ticket:</span>
                <span className={`badge ${exam.hallTicketStatus === 'available' ? 'badge-success' : exam.hallTicketStatus === 'pending' ? 'badge-warning' : 'badge-secondary'}`}>
                  {exam.hallTicketStatus === 'available' ? 'Verified / Clear' : exam.hallTicketStatus}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default ExamSchedulePage;
