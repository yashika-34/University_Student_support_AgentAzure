import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Users, Search, ChevronDown, ChevronUp, BarChart2, AlertTriangle, Award, CalendarCheck, ExternalLink } from 'lucide-react';

// Mock student list for demo
const MOCK_STUDENTS = [
  { id: '1', studentId: 'STU-2024-8842', name: 'Alex Mercer', email: 'alex.student@university.edu', department: 'CSE', semester: 5, cgpa: 3.82, attendancePercentage: 85, isLowAttendance: false },
  { id: '2', studentId: 'STU-2024-9102', name: 'Emma Watson', email: 'emma.student@university.edu', department: 'CSE', semester: 5, cgpa: 3.56, attendancePercentage: 72, isLowAttendance: true },
  { id: '3', studentId: 'STU-2024-7731', name: 'Liam Smith', email: 'liam.student@university.edu', department: 'CSE', semester: 5, cgpa: 3.10, attendancePercentage: 66, isLowAttendance: true },
  { id: '4', studentId: 'STU-2024-6621', name: 'Priya Patel', email: 'priya.student@university.edu', department: 'CSE', semester: 5, cgpa: 3.91, attendancePercentage: 95, isLowAttendance: false },
  { id: '5', studentId: 'STU-2024-5510', name: 'Carlos Rivera', email: 'carlos.student@university.edu', department: 'CSE', semester: 5, cgpa: 3.40, attendancePercentage: 83, isLowAttendance: false }
];

const MOCK_MARKS = [
  { examType: 'internal_1', examLabel: 'Unit Test 1', marksObtained: 78, maxMarks: 100, percentage: 78, grade: 'B+', course: { courseCode: 'CS-301', courseName: 'Algorithms' } },
  { examType: 'midterm', examLabel: 'Mid Semester', marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A+', course: { courseCode: 'CS-301', courseName: 'Algorithms' } }
];

const MOCK_ATTENDANCE = [
  { courseCode: 'CS-301', courseName: 'Algorithms & Complexity', attended: 21, total: 24, percentage: 87 },
  { courseCode: 'CS-305', courseName: 'Cloud Computing', attended: 13, total: 18, percentage: 72 }
];

const StudentProgressPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [filterLow, setFilterLow] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/teacher/students');
        setStudents(res.data.students || []);
      } catch {
        setStudents(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleExpand = async (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setStudentDetail(null);
      return;
    }
    setExpandedStudent(studentId);
    try {
      const res = await api.get(`/teacher/students/${studentId}`);
      setStudentDetail(res.data);
    } catch {
      // Mock detail
      setStudentDetail({
        student: MOCK_STUDENTS.find(s => s.id === studentId),
        attendance: MOCK_ATTENDANCE,
        marks: MOCK_MARKS
      });
    }
  };

  const displayStudents = (students.length > 0 ? students : MOCK_STUDENTS)
    .filter(s => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesFilter = !filterLow || s.isLowAttendance;
      return matchesSearch && matchesFilter;
    });

  const lowCount = (students.length > 0 ? students : MOCK_STUDENTS).filter(s => s.isLowAttendance).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          <Users size={16} /> Student Progress Monitoring
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Student Progress</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Track individual student attendance, marks, and academic performance
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <button
          className={`btn ${filterLow ? 'btn-danger' : 'btn-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '0.5rem 0.9rem' }}
          onClick={() => setFilterLow(!filterLow)}
        >
          <AlertTriangle size={14} />
          Low Attendance ({lowCount})
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {displayStudents.length} student{displayStudents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Student List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {displayStudents.map(student => {
          const isExpanded = expandedStudent === student.id;

          return (
            <div key={student.id} className="glass-panel">
              {/* Student Row */}
              <div
                style={{ padding: '1.15rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: '0.75rem' }}
                onClick={() => handleExpand(student.id)}
                role="button"
                aria-expanded={isExpanded}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '200px' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: student.isLowAttendance ? 'var(--danger-bg)' : 'rgba(59,130,246,0.15)',
                    border: `2px solid ${student.isLowAttendance ? 'var(--danger)' : 'var(--primary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem', color: student.isLowAttendance ? 'var(--danger)' : 'var(--primary)',
                    flexShrink: 0
                  }}>
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{student.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {student.studentId} · {student.email}
                    </div>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{student.cgpa}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CGPA</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: student.attendancePercentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                      {student.attendancePercentage}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attendance</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className={`badge ${student.isLowAttendance ? 'badge-danger' : 'badge-success'}`}>
                      {student.isLowAttendance ? 'At Risk' : 'Good'}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && studentDetail && (
                <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {/* Attendance per course */}
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                        <CalendarCheck size={16} color="var(--primary)" /> Course Attendance
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {(studentDetail.attendance || MOCK_ATTENDANCE).map((att, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="badge badge-primary" style={{ minWidth: 55 }}>{att.courseCode}</span>
                            <div style={{ flex: 1 }}>
                              <div className="progress-track">
                                <div className="progress-fill" style={{
                                  width: `${att.percentage}%`,
                                  background: att.percentage >= 75 ? 'var(--success)' : 'var(--danger)'
                                }} />
                              </div>
                            </div>
                            <span style={{
                              fontWeight: 700, fontSize: '0.85rem', minWidth: 40, textAlign: 'right',
                              color: att.percentage >= 75 ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {att.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Marks */}
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                        <Award size={16} color="var(--accent-purple)" /> Recent Marks
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(studentDetail.marks || MOCK_MARKS).map((m, idx) => (
                          <div key={idx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem', background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)', fontSize: '0.85rem'
                          }}>
                            <div>
                              <span className="badge badge-primary" style={{ marginRight: '0.5rem' }}>{m.course?.courseCode}</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{m.examLabel}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 600 }}>{m.marksObtained}/{m.maxMarks}</span>
                              <span className={`badge ${m.percentage >= 75 ? 'badge-success' : m.percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                {m.grade}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayStudents.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No students match your search.</p>
        </div>
      )}
    </div>
  );
};

export default StudentProgressPage;
