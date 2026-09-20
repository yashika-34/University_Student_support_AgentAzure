import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Calculator,
  AlertCircle,
  CheckSquare,
  Info
} from 'lucide-react';

const AttendancePage = () => {
  const { role } = useAuth();
  const [courses] = useState(mockData.attendance);
  const [selectedCourse, setSelectedCourse] = useState(courses[0].courseCode);
  const [hypotheticalAction, setHypotheticalAction] = useState('miss'); // 'miss' or 'attend'
  const [hypotheticalCount, setHypotheticalCount] = useState(2);

  // Faculty Batch Marking State
  const [facultyCourse, setFacultyCourse] = useState('CS-301');
  const [roster, setRoster] = useState([
    { id: 'STU-2024-8842', name: 'Alex Mercer', status: 'present' },
    { id: 'STU-2024-9102', name: 'Emma Watson', status: 'present' },
    { id: 'STU-2024-7731', name: 'Liam Smith', status: 'absent' },
    { id: 'STU-2024-4421', name: 'Sophia Chen', status: 'present' }
  ]);
  const [batchSaved, setBatchSaved] = useState(false);

  // Find active course for simulator
  const currentSimCourse = courses.find((c) => c.courseCode === selectedCourse) || courses[0];

  // Simulator calculation
  const simTotal = currentSimCourse.totalClasses + hypotheticalCount;
  const simAttended = hypotheticalAction === 'attend'
    ? currentSimCourse.attendedClasses + hypotheticalCount
    : currentSimCourse.attendedClasses;
  const simPercentage = ((simAttended / simTotal) * 100).toFixed(1);

  // How many more classes can the student miss while staying >= 75%?
  // (attended) / (total + x) >= 0.75 => total + x <= attended / 0.75 => x <= (attended / 0.75) - total
  const maxSafeMisses = Math.max(0, Math.floor((currentSimCourse.attendedClasses / 0.75) - currentSimCourse.totalClasses));

  // If below 75%, how many consecutive classes must be attended to reach 75%?
  // (attended + y) / (total + y) >= 0.75 => attended + y >= 0.75*total + 0.75*y => 0.25*y >= 0.75*total - attended
  const neededToReach75 = currentSimCourse.percentage < 75
    ? Math.max(0, Math.ceil((0.75 * currentSimCourse.totalClasses - currentSimCourse.attendedClasses) / 0.25))
    : 0;

  const handleRosterStatusChange = (index, newStatus) => {
    const updated = [...roster];
    updated[index].status = newStatus;
    setRoster(updated);
  };

  const handleSaveBatch = (e) => {
    e.preventDefault();
    setBatchSaved(true);
    setTimeout(() => setBatchSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Attendance Tracking &amp; Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor your semester attendance percentages, simulate hypothetical absences, and avoid examination disqualification.
        </p>
      </div>

      {/* Course Attendance Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {courses.map((c) => (
          <div key={c.courseCode} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>{c.courseCode}</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.courseName}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Credits: {c.credits}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: c.percentage >= 80 ? 'var(--success)' : c.percentage >= 75 ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {c.percentage}%
                </div>
                <span className={`badge ${c.percentage >= 80 ? 'badge-success' : c.percentage >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                  {c.statusLabel}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-full)', overflow: 'hidden', margin: '1rem 0 0.5rem' }}>
              <div style={{
                width: `${c.percentage}%`,
                height: '100%',
                background: c.percentage >= 80 ? 'var(--success)' : c.percentage >= 75 ? 'var(--warning)' : 'var(--danger)'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Attended: <strong>{c.attendedClasses}</strong> / {c.totalClasses} classes</span>
              <span>Min required: 75%</span>
            </div>

            {c.isLowAttendance && (
              <div style={{
                marginTop: '1rem',
                padding: '0.65rem',
                background: 'rgba(239, 68, 68, 0.12)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={15} /> Must attend next consecutive classes to be exam eligible!
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Attendance Simulator & Bunk Calculator */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Calculator size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Interactive Attendance Simulator</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Forecast your resulting percentage before planning any leave.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          
          {/* Controls */}
          <div>
            <div className="form-group">
              <label className="form-label">Select Course</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.courseCode} value={c.courseCode}>
                    {c.courseCode} - {c.courseName} ({c.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Scenario Action</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setHypotheticalAction('miss')}
                  className={`btn ${hypotheticalAction === 'miss' ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  If I Miss...
                </button>
                <button
                  type="button"
                  onClick={() => setHypotheticalAction('attend')}
                  className={`btn ${hypotheticalAction === 'attend' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                >
                  If I Attend...
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Classes ({hypotheticalCount})</label>
              <input
                type="range"
                min="1"
                max="10"
                value={hypotheticalCount}
                onChange={(e) => setHypotheticalCount(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Results Display */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Projected Attendance for <strong>{currentSimCourse.courseCode}</strong>
            </div>

            <div style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: Number(simPercentage) >= 75 ? 'var(--success)' : 'var(--danger)',
              marginBottom: '0.5rem'
            }}>
              {simPercentage}%
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {hypotheticalAction === 'miss'
                ? `Missing ${hypotheticalCount} more classes drops your attendance from ${currentSimCourse.percentage}% to ${simPercentage}%.`
                : `Attending ${hypotheticalCount} more classes raises your attendance from ${currentSimCourse.percentage}% to ${simPercentage}%.`}
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.85rem'
            }}>
              {currentSimCourse.percentage >= 75 ? (
                <div>
                  &#10004; You can safely miss up to <strong style={{ color: 'var(--primary)' }}>{maxSafeMisses}</strong> more classes and still remain above 75%.
                </div>
              ) : (
                <div style={{ color: 'var(--danger)' }}>
                  &#9888; You must attend the next <strong style={{ color: 'var(--danger)' }}>{neededToReach75}</strong> consecutive classes to regain the 75% exam cut-off!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Faculty Attendance Marking Panel (Visible in Faculty Mode or on Demand) */}
      {role === 'faculty' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} color="var(--primary)" /> Faculty Roster Attendance Entry
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mark session attendance for your assigned lecture.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={facultyCourse}
                onChange={(e) => setFacultyCourse(e.target.value)}
              >
                <option value="CS-301">CS-301 (Algorithms)</option>
                <option value="CS-305">CS-305 (Cloud Computing)</option>
              </select>
              <input type="date" className="form-input" defaultValue={new Date().toISOString().split('T')[0]} style={{ width: 'auto' }} />
            </div>
          </div>

          {batchSaved && (
            <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: '6px', color: 'var(--success)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              &#10003; Batch attendance recorded and synchronized with student portals.
            </div>
          )}

          <form onSubmit={handleSaveBatch}>
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Student ID</th>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Present</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Absent</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Late</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student, idx) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{student.id}</td>
                      <td style={{ padding: '0.75rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`status-${student.id}`}
                          checked={student.status === 'present'}
                          onChange={() => handleRosterStatusChange(idx, 'present')}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`status-${student.id}`}
                          checked={student.status === 'absent'}
                          onChange={() => handleRosterStatusChange(idx, 'absent')}
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`status-${student.id}`}
                          checked={student.status === 'late'}
                          onChange={() => handleRosterStatusChange(idx, 'late')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              Submit Attendance Roster
            </button>
          </form>
        </div>
      )}

      {/* Institutional Policy Notice */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <Info size={20} color="var(--primary)" />
        <span>
          <strong>University Regulation 4.2:</strong> Students must maintain a minimum of 75% attendance in each registered subject. Absences due to documented illness or official university extracurricular events must be submitted to the Dean's office via Form MED-1 within 3 working days.
        </span>
      </div>

    </div>
  );
};

export default AttendancePage;
