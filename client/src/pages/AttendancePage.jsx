import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { attendanceAPI, courseAPI, teacherAPI } from '../services/api.js';
import {
  Calculator,
  AlertCircle,
  CheckSquare,
  Info,
  Calendar,
  Save,
  Check,
  Loader2
} from 'lucide-react';

const AttendancePage = () => {
  const { role } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');
  const [hypotheticalAction, setHypotheticalAction] = useState('miss'); // 'miss' or 'attend'
  const [hypotheticalCount, setHypotheticalCount] = useState(2);
  const [loading, setLoading] = useState(true);

  // Faculty Batch Marking State
  const [facultyCourses, setFacultyCourses] = useState([]);
  const [selectedFacultyCourse, setSelectedFacultyCourse] = useState('');
  const [roster, setRoster] = useState([]);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchSaved, setBatchSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const initAttendance = async () => {
      setLoading(true);
      try {
        if (role === 'student') {
          const res = await attendanceAPI.getMySummary();
          const list = res.data?.overallSummary || [];
          setCourses(list);
          if (list.length > 0) {
            setSelectedCourseCode(list[0].courseCode);
          }
        } else {
          // Faculty
          const [courseRes, studentRes] = await Promise.allSettled([
            courseAPI.getMyCourses(),
            teacherAPI.getStudents()
          ]);

          let fCourses = [];
          if (courseRes.status === 'fulfilled' && courseRes.value.data?.data) {
            fCourses = courseRes.value.data.data;
            setFacultyCourses(fCourses);
            if (fCourses.length > 0) {
              setSelectedFacultyCourse(fCourses[0]._id);
            }
          }

          if (studentRes.status === 'fulfilled' && studentRes.value.data?.students) {
            const rawStudents = studentRes.value.data.students;
            setRoster(
              rawStudents.map((s) => ({
                studentId: s.id || s._id,
                rollNo: s.studentId,
                name: s.name || s.studentId,
                status: 'present'
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error loading attendance data:', err);
      } finally {
        setLoading(false);
      }
    };

    initAttendance();
  }, [role]);

  // Find active course for student simulator
  const currentSimCourse = courses.find((c) => c.courseCode === selectedCourseCode) || courses[0] || {
    courseCode: 'CS-301',
    courseName: 'Course',
    totalClasses: 24,
    attendedClasses: 21,
    percentage: 87.5
  };

  // Simulator calculation
  const simTotal = (currentSimCourse.totalClasses || 0) + Number(hypotheticalCount);
  const simAttended = hypotheticalAction === 'attend'
    ? (currentSimCourse.attendedClasses || 0) + Number(hypotheticalCount)
    : (currentSimCourse.attendedClasses || 0);
  const simPercentage = simTotal > 0 ? ((simAttended / simTotal) * 100).toFixed(1) : 100;

  // How many more classes can the student miss while staying >= 75%?
  const maxSafeMisses = Math.max(0, Math.floor(((currentSimCourse.attendedClasses || 0) / 0.75) - (currentSimCourse.totalClasses || 0)));

  // If below 75%, how many consecutive classes must be attended to reach 75%?
  const neededToReach75 = currentSimCourse.percentage < 75
    ? Math.max(0, Math.ceil((0.75 * (currentSimCourse.totalClasses || 0) - (currentSimCourse.attendedClasses || 0)) / 0.25))
    : 0;

  const handleRosterStatusChange = (index, newStatus) => {
    const updated = [...roster];
    updated[index].status = newStatus;
    setRoster(updated);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!selectedFacultyCourse) return;
    setSaveLoading(true);
    setSaveMessage('');

    try {
      const attendanceList = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        remarks: ''
      }));

      const res = await attendanceAPI.markBatch({
        courseId: selectedFacultyCourse,
        date: sessionDate,
        sessionType: 'lecture',
        attendanceList
      });

      setBatchSaved(true);
      setSaveMessage(`Successfully saved ${res.data?.count || roster.length} attendance records to database.`);
      setTimeout(() => setBatchSaved(false), 4000);
    } catch (err) {
      setSaveMessage(err.response?.data?.message || 'Failed to submit batch attendance.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading attendance details from database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Attendance Tracking &amp; Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Real-time attendance calculated from MongoDB database sessions. Simulate hypothetical absences to ensure exam clearance.
        </p>
      </div>

      {/* ── STUDENT VIEW: Interactive Course Grid + Simulator ── */}
      {role === 'student' && (
        <>
          {/* Active Courses Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {courses.length === 0 ? (
              <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active course attendance records found.
              </div>
            ) : (
              courses.map((course) => (
                <div
                  key={course.courseCode}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    border: selectedCourseCode === course.courseCode ? '2px solid var(--primary)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  onClick={() => setSelectedCourseCode(course.courseCode)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span className="badge badge-primary">{course.courseCode}</span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.35rem' }}>{course.courseName}</h3>
                    </div>
                    <span className={`badge ${course.percentage >= 80 ? 'badge-success' : course.percentage >= 75 ? 'badge-warning' : 'badge-danger'}`}>
                      {course.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-track" style={{ height: '8px', marginBottom: '0.75rem' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, course.percentage)}%`,
                        background: course.percentage >= 80 ? 'var(--success)' : course.percentage >= 75 ? 'var(--warning)' : 'var(--danger)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Attended: <strong>{course.attendedClasses}</strong> / {course.totalClasses}</span>
                    <span>Credits: {course.credits}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Attendance Simulator Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calculator size={22} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Hypothetical Attendance Simulator</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Select a registered course to project how upcoming absences or attendances will impact your university standing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="form-label">Select Course</label>
                  <select
                    className="form-input"
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                  >
                    {courses.map((c) => (
                      <option key={c.courseCode} value={c.courseCode}>
                        {c.courseCode} — {c.courseName} (Current: {c.percentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Simulation Action</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className={`btn ${hypotheticalAction === 'miss' ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => setHypotheticalAction('miss')}
                    >
                      Miss Classes
                    </button>
                    <button
                      type="button"
                      className={`btn ${hypotheticalAction === 'attend' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setHypotheticalAction('attend')}
                    >
                      Attend Classes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Number of Sessions: {hypotheticalCount}</label>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={hypotheticalCount}
                    onChange={(e) => setHypotheticalCount(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              </div>

              {/* Simulation Result Display */}
              <div style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Projected Percentage</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: simPercentage >= 75 ? 'var(--success)' : 'var(--danger)', marginBottom: '0.5rem' }}>
                  {simPercentage}%
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Current: <strong>{currentSimCourse.percentage}%</strong> ({currentSimCourse.attendedClasses}/{currentSimCourse.totalClasses})
                </div>

                {/* Regulation Advice */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} color="var(--primary)" />
                    <span>Safe classes you can afford to miss: <strong style={{ color: 'var(--primary)' }}>{maxSafeMisses}</strong></span>
                  </div>
                  {currentSimCourse.percentage < 75 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                      <AlertCircle size={16} />
                      <span>Must attend next <strong style={{ textDecoration: 'underline' }}>{neededToReach75}</strong> consecutive lectures to reach 75%.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── FACULTY VIEW: Batch Attendance Session Marking ── */}
      {role === 'faculty' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={20} color="var(--primary)" /> Daily Lecture Attendance Marking
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Select assigned course and mark session status. Saves directly to MongoDB collection.
              </p>
            </div>
            {batchSaved && (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.85rem' }}>
                <Check size={14} /> Batch Saved to DB
              </span>
            )}
          </div>

          {saveMessage && (
            <div style={{ padding: '0.75rem', background: batchSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {saveMessage}
            </div>
          )}

          <form onSubmit={handleSaveBatch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">Course</label>
                <select
                  className="form-input"
                  value={selectedFacultyCourse}
                  onChange={(e) => setSelectedFacultyCourse(e.target.value)}
                >
                  {facultyCourses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Session Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Roster Table */}
            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Roll Number</th>
                    <th style={{ padding: '0.75rem' }}>Student Name</th>
                    <th style={{ padding: '0.75rem' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student, idx) => (
                    <tr key={student.studentId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{student.rollNo}</td>
                      <td style={{ padding: '0.75rem' }}>{student.name}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className={`btn ${student.status === 'present' ? 'btn-success' : 'btn-secondary'}`}
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleRosterStatusChange(idx, 'present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`btn ${student.status === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleRosterStatusChange(idx, 'absent')}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            className={`btn ${student.status === 'excused' ? 'btn-warning' : 'btn-secondary'}`}
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleRosterStatusChange(idx, 'excused')}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
              disabled={saveLoading}
            >
              <Save size={16} /> {saveLoading ? 'Saving...' : 'Submit Session Attendance'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default AttendancePage;
