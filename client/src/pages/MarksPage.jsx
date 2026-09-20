import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api, { mockData } from '../services/api.js';
import {
  Award, BookOpen, TrendingUp, BarChart2, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Grade color map
const gradeColors = { O: '#10b981', 'A+': '#3b82f6', A: '#6366f1', 'B+': '#8b5cf6', B: '#f59e0b', C: '#f97316', D: '#ef4444', F: '#dc2626' };

// Mock marks data for demo
const MOCK_MARKS = [
  { id: 1, course: { courseCode: 'CS-301', courseName: 'Algorithms & Complexity', credits: 4 }, examType: 'internal_1', examLabel: 'Unit Test 1', marksObtained: 78, maxMarks: 100, percentage: 78, grade: 'B+', gradePoints: 7, semester: 5, isPublished: true },
  { id: 2, course: { courseCode: 'CS-301', courseName: 'Algorithms & Complexity', credits: 4 }, examType: 'midterm', examLabel: 'Mid Semester Exam', marksObtained: 85, maxMarks: 100, percentage: 85, grade: 'A+', gradePoints: 9, semester: 5, isPublished: true },
  { id: 3, course: { courseCode: 'CS-305', courseName: 'Cloud Computing', credits: 3 }, examType: 'internal_1', examLabel: 'Unit Test 1', marksObtained: 62, maxMarks: 100, percentage: 62, grade: 'B', gradePoints: 6, semester: 5, isPublished: true },
  { id: 4, course: { courseCode: 'CS-309', courseName: 'AI & Neural Networks', credits: 4 }, examType: 'internal_1', examLabel: 'Quiz 1', marksObtained: 92, maxMarks: 100, percentage: 92, grade: 'O', gradePoints: 10, semester: 5, isPublished: true },
  { id: 5, course: { courseCode: 'CS-309', courseName: 'AI & Neural Networks', credits: 4 }, examType: 'midterm', examLabel: 'Mid Semester Exam', marksObtained: 88, maxMarks: 100, percentage: 88, grade: 'A+', gradePoints: 9, semester: 5, isPublished: true }
];

const EXAM_TYPE_LABELS = {
  internal_1: 'Unit Test 1', internal_2: 'Unit Test 2',
  midterm: 'Mid Semester', final: 'Final Exam',
  quiz: 'Quiz', practical: 'Practical', project: 'Project', assignment: 'Assignment'
};

const MarksPage = () => {
  const { user, role } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Faculty state for entering marks
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: '', courseId: '', examType: 'internal_1', marksObtained: '', maxMarks: 100, examLabel: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        if (role === 'student') {
          const res = await api.get('/marks/my');
          setMarks(res.data.marks || []);
        } else {
          // Faculty: would fetch course marks
          setMarks([]);
        }
      } catch {
        setMarks(MOCK_MARKS);
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [role]);

  // For demo: use mock data
  const displayMarks = marks.length > 0 ? marks : MOCK_MARKS;

  // Group by course
  const byCourse = displayMarks.reduce((acc, m) => {
    const code = m.course?.courseCode || 'Unknown';
    if (!acc[code]) acc[code] = { course: m.course, entries: [] };
    acc[code].entries.push(m);
    return acc;
  }, {});

  // Overall stats
  const published = displayMarks.filter(m => m.isPublished);
  const totalCredits = published.reduce((a, m) => a + (m.course?.credits || 3), 0);
  const weighted = published.reduce((a, m) => a + ((m.course?.credits || 3) * m.gradePoints), 0);
  const cgpa = totalCredits > 0 ? (weighted / totalCredits).toFixed(2) : '—';

  // Chart data: marks performance
  const chartData = Object.entries(byCourse).map(([code, { entries }]) => ({
    course: code,
    avg: entries.length ? Math.round(entries.reduce((a, e) => a + e.percentage, 0) / entries.length) : 0
  }));

  const handleAddMarks = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/marks', addForm);
      setShowAddForm(false);
      setAddForm({ studentId: '', courseId: '', examType: 'internal_1', marksObtained: '', maxMarks: 100, examLabel: '' });
    } catch (err) {
      alert('Demo mode: Marks entry simulated successfully.');
      setShowAddForm(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading marks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <Award size={16} /> {role === 'faculty' ? 'Grade Management' : 'Academic Performance'}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Marks & Grades</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {role === 'faculty' ? 'Manage and publish student grades' : 'Your academic performance record'}
          </p>
        </div>
        {role === 'faculty' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Award size={16} /> {showAddForm ? 'Cancel' : '+ Add Marks'}
          </button>
        )}
      </div>

      {/* Add Marks Form (Faculty) */}
      {showAddForm && role === 'faculty' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Enter Student Marks</h3>
          <form onSubmit={handleAddMarks} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input className="form-input" placeholder="STU-2024-8842" value={addForm.studentId} onChange={e => setAddForm({...addForm, studentId: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Course ID</label>
              <input className="form-input" placeholder="Course ObjectId" value={addForm.courseId} onChange={e => setAddForm({...addForm, courseId: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Exam Type</label>
              <select className="form-select" value={addForm.examType} onChange={e => setAddForm({...addForm, examType: e.target.value})}>
                {Object.entries(EXAM_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Exam Label</label>
              <input className="form-input" placeholder="e.g. Unit Test 1" value={addForm.examLabel} onChange={e => setAddForm({...addForm, examLabel: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Marks Obtained</label>
              <input className="form-input" type="number" min={0} max={addForm.maxMarks} value={addForm.marksObtained} onChange={e => setAddForm({...addForm, marksObtained: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Max Marks</label>
              <input className="form-input" type="number" min={1} value={addForm.maxMarks} onChange={e => setAddForm({...addForm, maxMarks: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Marks'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel stat-card">
          <div className="stat-label">CGPA / GPA</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{cgpa}</div>
          <div className="stat-sub">Based on published marks</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">Exams Recorded</div>
          <div className="stat-value">{published.length}</div>
          <div className="stat-sub">Across {Object.keys(byCourse).length} courses</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">Highest Grade</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {published.length ? published.reduce((a, m) => m.percentage > a.percentage ? m : a, published[0]).grade : '—'}
          </div>
          <div className="stat-sub">Best performing exam</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">
            {published.length ? Math.round(published.reduce((a, m) => a + m.percentage, 0) / published.length) : '—'}%
          </div>
          <div className="stat-sub">Across all exams</div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} color="var(--primary)" /> Course Performance Overview
        </h3>
        <div className="chart-container" style={{ minHeight: 220 }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="course" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}
                formatter={(v) => [`${v}%`, 'Avg Score']}
              />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course-wise Marks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {Object.entries(byCourse).map(([code, { course, entries }]) => {
          const isExpanded = expandedCourse === code;
          const avgPct = entries.length ? Math.round(entries.reduce((a, e) => a + e.percentage, 0) / entries.length) : 0;

          return (
            <div key={code} className="glass-panel">
              {/* Course header */}
              <div
                style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setExpandedCourse(isExpanded ? null : code)}
                role="button"
                aria-expanded={isExpanded}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{code}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{course?.courseName} • {course?.credits} Credits</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, color: avgPct >= 75 ? 'var(--success)' : 'var(--danger)' }}>{avgPct}% avg</span>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>
              </div>

              {/* Expanded entries */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '1rem 1.5rem 1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {entries.map((entry, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.examLabel || EXAM_TYPE_LABELS[entry.examType] || entry.examType}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Semester {entry.semester}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{entry.marksObtained}/{entry.maxMarks}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Marks</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: 700 }}>{entry.percentage}%</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score</div>
                          </div>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: `${gradeColors[entry.grade] || '#64748b'}22`,
                            border: `2px solid ${gradeColors[entry.grade] || '#64748b'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.85rem', color: gradeColors[entry.grade] || '#64748b'
                          }}>
                            {entry.grade}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayMarks.length === 0 && (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Award size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>No marks published yet. Check back after your exams.</p>
        </div>
      )}
    </div>
  );
};

export default MarksPage;
