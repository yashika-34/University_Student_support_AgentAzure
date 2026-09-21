import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { marksAPI, courseAPI, teacherAPI } from '../services/api.js';
import ModalPortal from '../components/ModalPortal.jsx';
import {
  Award, BookOpen, TrendingUp, BarChart2, Filter,
  PlusCircle, Save, Check, Loader2, AlertCircle, X, Search, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const gradeColors = {
  O: '#10b981',
  'A+': '#3b82f6',
  A: '#6366f1',
  'B+': '#8b5cf6',
  B: '#f59e0b',
  C: '#f97316',
  D: '#ef4444',
  F: '#dc2626'
};

const EXAM_TYPE_LABELS = {
  internal_1: 'Unit Test 1',
  internal_2: 'Unit Test 2',
  midterm: 'Mid Semester',
  final: 'Final Exam',
  quiz: 'Quiz',
  practical: 'Practical Lab',
  assignment: 'Assignment',
  project: 'Project Evaluation'
};

const MarksPage = () => {
  const { role } = useAuth();
  const isFaculty = role === 'faculty' || role === 'teacher';

  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Faculty state
  const [facultyCourses, setFacultyCourses] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    studentId: '',
    courseId: '',
    examType: 'internal_1',
    examLabel: 'Unit Test 1',
    marksObtained: '',
    maxMarks: 100,
    semester: 5,
    remarks: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async (targetCourseId = selectedCourseFilter) => {
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      if (role === 'student') {
        const [marksRes, sumRes] = await Promise.allSettled([
          marksAPI.getMyMarks(),
          marksAPI.getMarksSummary()
        ]);
        if (marksRes.status === 'fulfilled') {
          setMarks(marksRes.value.data?.marks || []);
        }
        if (sumRes.status === 'fulfilled') {
          setSummary(sumRes.value.data?.summary || null);
        }
      } else {
        // Faculty / Teacher
        const [coursesRes, studentsRes] = await Promise.allSettled([
          courseAPI.getMyCourses(),
          teacherAPI.getStudents()
        ]);

        let loadedCourses = [];
        if (coursesRes.status === 'fulfilled' && coursesRes.value.data?.data) {
          loadedCourses = coursesRes.value.data.data;
          setFacultyCourses(loadedCourses);
        }

        let loadedStudents = [];
        if (studentsRes.status === 'fulfilled' && studentsRes.value.data?.students) {
          loadedStudents = studentsRes.value.data.students;
          setStudentsList(loadedStudents);
        }

        // Initialize form defaults if not set
        setAddForm((prev) => ({
          ...prev,
          courseId: prev.courseId || (loadedCourses[0]?._id || ''),
          studentId: prev.studentId || (loadedStudents[0]?.id || loadedStudents[0]?._id || '')
        }));

        // Load marks: if a course is selected or 'all'
        const courseMarks = await marksAPI.getCourseMarks(targetCourseId || 'all');
        setMarks(courseMarks.data?.marks || []);
      }
    } catch (err) {
      console.error('Error fetching marks data:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load grade records from database.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Handle Course Filter Change
  const handleCourseFilterChange = async (courseId) => {
    setSelectedCourseFilter(courseId);
    try {
      const res = await marksAPI.getCourseMarks(courseId);
      setMarks(res.data?.marks || []);
    } catch (err) {
      console.error('Failed to filter marks by course:', err);
    }
  };

  // Handle Faculty Upload Mark
  const handleAddMark = async (e) => {
    e.preventDefault();
    if (!addForm.studentId) {
      setStatusMsg({ type: 'error', text: 'Please select a student.' });
      return;
    }
    if (Number(addForm.marksObtained) > Number(addForm.maxMarks)) {
      setStatusMsg({ type: 'error', text: 'Marks obtained cannot exceed maximum marks.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await marksAPI.uploadMarks({
        ...addForm,
        marksObtained: Number(addForm.marksObtained),
        maxMarks: Number(addForm.maxMarks),
        semester: Number(addForm.semester)
      });

      setStatusMsg({
        type: 'success',
        text: 'Marks recorded and published to database successfully.'
      });
      setShowAddForm(false);

      // Reset marks input for next entry
      setAddForm((prev) => ({
        ...prev,
        marksObtained: '',
        remarks: ''
      }));

      // Reload marks
      const courseMarks = await marksAPI.getCourseMarks(selectedCourseFilter || 'all');
      setMarks(courseMarks.data?.marks || []);
    } catch (err) {
      console.error('Error saving marks:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save marks record.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Mark
  const handleDeleteMark = async (id) => {
    if (!window.confirm('Are you sure you want to delete this grade record? This action cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    try {
      await marksAPI.deleteMarks(id);
      setMarks((prev) => prev.filter((m) => m._id !== id));
      setStatusMsg({ type: 'success', text: 'Marks entry deleted successfully.' });
    } catch (err) {
      console.error('Failed to delete mark:', err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete marks entry.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter marks
  const filteredMarks = marks.filter((m) => {
    if (selectedSemester !== 'all' && m.semester !== Number(selectedSemester)) {
      return false;
    }
    if (selectedExamType !== 'all' && m.examType !== selectedExamType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = m.student?.userId
        ? `${m.student.userId.firstName} ${m.student.userId.lastName}`.toLowerCase()
        : '';
      const roll = m.student?.studentId?.toLowerCase() || '';
      const courseCode = m.course?.courseCode?.toLowerCase() || '';
      const courseName = m.course?.courseName?.toLowerCase() || '';
      const label = m.examLabel?.toLowerCase() || '';
      if (
        !studentName.includes(q) &&
        !roll.includes(q) &&
        !courseCode.includes(q) &&
        !courseName.includes(q) &&
        !label.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // Calculate dynamic stats
  const totalEntries = marks.length;
  const avgScore = totalEntries > 0
    ? Math.round(marks.reduce((a, m) => a + ((m.marksObtained / (m.maxMarks || 100)) * 100), 0) / totalEntries)
    : 0;
  const highestScore = totalEntries > 0
    ? Math.round(Math.max(...marks.map((m) => (m.marksObtained / (m.maxMarks || 100)) * 100)))
    : 0;

  // Group marks by course code for bar chart
  const byCourse = marks.reduce((acc, m) => {
    const code = m.course?.courseCode || m.subject || 'General';
    if (!acc[code]) acc[code] = { course: code, entries: [] };
    acc[code].entries.push(m);
    return acc;
  }, {});

  const chartData = Object.entries(byCourse).map(([code, { entries }]) => ({
    course: code,
    avg: entries.length
      ? Math.round(entries.reduce((a, e) => a + (e.marksObtained / (e.maxMarks || 100)) * 100, 0) / entries.length)
      : 0
  }));

  const semesters = ['all', ...Array.from(new Set(marks.map((m) => m.semester || 5))).sort((a, b) => a - b)];

  // Live preview grade in modal
  const previewPercentage = addForm.maxMarks > 0 && addForm.marksObtained !== ''
    ? Math.min(100, Math.max(0, Math.round((Number(addForm.marksObtained) / Number(addForm.maxMarks)) * 100)))
    : null;

  const calculatePreviewGrade = (pct) => {
    if (pct === null) return '—';
    if (pct >= 91) return 'O';
    if (pct >= 81) return 'A+';
    if (pct >= 71) return 'A';
    if (pct >= 61) return 'B+';
    if (pct >= 51) return 'B';
    if (pct >= 41) return 'C';
    if (pct >= 36) return 'D';
    return 'F';
  };

  if (loading && marks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading examination grades from database...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <Award size={16} /> Academic Performance Ledger
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Marks &amp; Grade Transcripts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Live records verified from MongoDB marks collection with GPA aggregations and semester breakdowns.
          </p>
        </div>

        {isFaculty && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.35rem', fontWeight: 600 }}
          >
            <PlusCircle size={18} /> Record Student Marks
          </button>
        )}
      </div>

      {/* Status Feedback Banner */}
      {statusMsg.text && (
        <div style={{
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          color: statusMsg.type === 'error' ? '#f87171' : '#34d399'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg({ type: '', text: '' })}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">{role === 'student' ? 'Cumulative GPA' : 'Class Average'}</div>
            <Award size={18} color="var(--primary)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {role === 'student'
              ? (summary?.cgpa ? summary.cgpa.toFixed(2) : (totalEntries > 0 ? (avgScore / 10).toFixed(2) : '0.00'))
              : (totalEntries > 0 ? `${avgScore}%` : 'N/A')}
          </div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>
            {role === 'student' ? 'Calculated from database credits' : 'Overall performance score'}
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">Total Graded Entries</div>
            <BookOpen size={18} color="var(--accent-purple)" />
          </div>
          <div className="stat-value">{totalEntries}</div>
          <div className="stat-sub">Across active courses</div>
        </div>

        <div className="glass-panel stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="stat-label">{role === 'student' ? 'Average Score' : 'Highest Recorded'}</div>
            <BarChart2 size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">
            {role === 'student'
              ? (totalEntries > 0 ? `${avgScore}%` : 'N/A')
              : (totalEntries > 0 ? `${highestScore}%` : 'N/A')}
          </div>
          <div className="stat-sub">
            {role === 'student' ? 'Aggregated performance' : 'Top score across entries'}
          </div>
        </div>
      </div>

      {/* Dynamic Performance Bar Chart */}
      {chartData.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Course-by-Course Average Performance (%)
          </h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="course" stroke="var(--text-muted)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="avg" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.avg >= 85 ? '#10b981' : entry.avg >= 70 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Marks List & Filters */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Published Examination Records</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filteredMarks.length} of {marks.length} records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder={isFaculty ? "Search student or course..." : "Search course or exam..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', width: 190, fontSize: '0.85rem' }}
              />
            </div>

            {/* Faculty Course Filter */}
            {isFaculty && (
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedCourseFilter}
                onChange={(e) => handleCourseFilterChange(e.target.value)}
              >
                <option value="all">All Courses</option>
                {facultyCourses.map((c) => (
                  <option key={c._id} value={c._id}>{c.courseCode} — {c.courseName}</option>
                ))}
              </select>
            )}

            {/* Exam Type Filter */}
            <select
              className="form-input"
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
            >
              <option value="all">All Exam Types</option>
              {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            {/* Semester Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                className="form-input"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All Semesters' : `Semester ${s}`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredMarks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Award size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
            <p style={{ margin: 0, fontWeight: 500 }}>No examination records found for selected filter.</p>
            {isFaculty && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary"
                style={{ marginTop: '1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusCircle size={15} /> Record First Student Mark
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  {isFaculty && <th style={{ padding: '0.75rem' }}>Student</th>}
                  <th style={{ padding: '0.75rem' }}>Course</th>
                  <th style={{ padding: '0.75rem' }}>Assessment</th>
                  <th style={{ padding: '0.75rem' }}>Score</th>
                  <th style={{ padding: '0.75rem' }}>Percentage</th>
                  <th style={{ padding: '0.75rem' }}>Grade</th>
                  <th style={{ padding: '0.75rem' }}>Semester</th>
                  {isFaculty && <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMarks.map((m) => {
                  const pct = Math.round((m.marksObtained / (m.maxMarks || 100)) * 100);
                  const color = gradeColors[m.grade] || '#3b82f6';
                  const studentName = m.student?.userId
                    ? `${m.student.userId.firstName} ${m.student.userId.lastName}`
                    : 'Enrolled Student';
                  const studentRoll = m.student?.studentId || '';

                  return (
                    <tr key={m._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {isFaculty && (
                        <td style={{ padding: '0.75rem' }}>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{studentName}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {studentRoll || 'ID N/A'}
                          </div>
                        </td>
                      )}
                      <td style={{ padding: '0.75rem' }}>
                        <strong>{m.course?.courseCode || m.subject || 'CS-101'}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {m.course?.courseName || m.subject}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div>{m.examLabel || EXAM_TYPE_LABELS[m.examType] || 'Assessment'}</div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          {EXAM_TYPE_LABELS[m.examType] || m.examType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                        {m.marksObtained} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {m.maxMarks}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>{pct}%</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: `${color}20`,
                          color,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: `1px solid ${color}`
                        }}>
                          {m.grade || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>Sem {m.semester}</td>
                      {isFaculty && (
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteMark(m._id)}
                            disabled={deletingId === m._id}
                            title="Delete marks record"
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.35rem 0.6rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.75rem',
                              transition: 'all 0.18s ease'
                            }}
                          >
                            {deletingId === m._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── FACULTY / TEACHER: Viewport Centered Modal Dialog via ModalPortal ── */}
      <ModalPortal isOpen={isFaculty && showAddForm}>
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddForm(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="marks-modal-title"
        >
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  <PlusCircle size={20} />
                </div>
                <div>
                  <h3 id="marks-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Record Student Examination Marks
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Enter scores to calculate GPA and persist directly into database
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddForm(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMark} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    <div>
                      <label className="form-label">Course</label>
                      <select
                        className="form-input"
                        value={addForm.courseId}
                        onChange={(e) => setAddForm({ ...addForm, courseId: e.target.value })}
                        required
                      >
                        {facultyCourses.length === 0 && (
                          <option value="">General Course Assessment</option>
                        )}
                        {facultyCourses.map((c) => (
                          <option key={c._id} value={c._id}>{c.courseCode} — {c.courseName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Student</label>
                      <select
                        className="form-input"
                        value={addForm.studentId}
                        onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                        required
                      >
                        {studentsList.length === 0 && (
                          <option value="">No registered students found</option>
                        )}
                        {studentsList.map((s) => (
                          <option key={s.id || s._id} value={s.id || s._id}>
                            {s.name || s.studentId} ({s.studentId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Exam Type</label>
                      <select
                        className="form-input"
                        value={addForm.examType}
                        onChange={(e) => setAddForm({
                          ...addForm,
                          examType: e.target.value,
                          examLabel: EXAM_TYPE_LABELS[e.target.value] || 'Exam'
                        })}
                      >
                        {Object.entries(EXAM_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Exam Title / Label</label>
                      <input
                        type="text"
                        className="form-input"
                        value={addForm.examLabel}
                        onChange={(e) => setAddForm({ ...addForm, examLabel: e.target.value })}
                        placeholder="e.g. Mid Semester Exam"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Marks Obtained</label>
                      <input
                        type="number"
                        min="0"
                        max={addForm.maxMarks}
                        className="form-input"
                        placeholder="e.g. 85"
                        value={addForm.marksObtained}
                        onChange={(e) => setAddForm({ ...addForm, marksObtained: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Max Marks</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        value={addForm.maxMarks}
                        onChange={(e) => setAddForm({ ...addForm, maxMarks: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Semester</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-input"
                        value={addForm.semester}
                        onChange={(e) => setAddForm({ ...addForm, semester: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Remarks (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Excellent conceptual clarity"
                        value={addForm.remarks}
                        onChange={(e) => setAddForm({ ...addForm, remarks: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Real-time score & grade preview indicator */}
                  {previewPercentage !== null && (
                    <div style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Score Preview:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <strong>{previewPercentage}%</strong>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: `${gradeColors[calculatePreviewGrade(previewPercentage)] || '#3b82f6'}25`,
                          color: gradeColors[calculatePreviewGrade(previewPercentage)] || '#3b82f6',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: `1px solid ${gradeColors[calculatePreviewGrade(previewPercentage)] || '#3b82f6'}`
                        }}>
                          Grade {calculatePreviewGrade(previewPercentage)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving Marks...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Publish Marks
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
};

export default MarksPage;
