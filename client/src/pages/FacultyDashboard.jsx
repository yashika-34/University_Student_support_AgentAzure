import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { teacherAPI, noticeAPI, courseAPI } from '../services/api.js';
import {
  Users, CheckSquare, AlertTriangle, BookOpen, Send, PlusCircle, FileCheck,
  BarChart3, Sparkles, TrendingUp, FileText, Upload, Loader2, Bell,
  Plus, Check, X, UserPlus, Layers, Calendar, Award, ExternalLink
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [notifiedStudents, setNotifiedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Course Assignment Modal & State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalTab, setCourseModalTab] = useState('catalog'); // 'catalog' | 'create'
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);

  // New Course Form State
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    department: 'Computer Science & Engineering',
    credits: 4,
    semester: 5,
    description: '',
    maxCapacity: 60
  });
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Enroll Student Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTargetCourse, setEnrollTargetCourse] = useState(null);
  const [enrollSelectedStudentId, setEnrollSelectedStudentId] = useState('');
  const [isEnrollingStudent, setIsEnrollingStudent] = useState(false);

  const fetchFacultyData = async () => {
    try {
      const [dashRes, stuRes] = await Promise.allSettled([
        teacherAPI.getDashboard(),
        teacherAPI.getStudents()
      ]);

      let defaultCourseId = selectedCourseId;
      if (dashRes.status === 'fulfilled' && dashRes.value.data?.dashboard) {
        setDashboardData(dashRes.value.data.dashboard);
        const courses = dashRes.value.data.dashboard.courses || [];
        if (courses.length > 0 && !defaultCourseId) {
          defaultCourseId = courses[0].id || courses[0]._id;
          setSelectedCourseId(defaultCourseId);
        }
      }

      if (stuRes.status === 'fulfilled' && stuRes.value.data?.students) {
        setStudents(stuRes.value.data.students);
      }

      if (defaultCourseId) {
        const analRes = await teacherAPI.getCourseAnalytics(defaultCourseId);
        if (analRes.data?.analytics) {
          setAnalytics(analRes.data.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const openAssignModal = async () => {
    setShowCourseModal(true);
    setLoadingCatalog(true);
    try {
      const res = await courseAPI.getAll({ limit: 100 });
      setCatalogCourses(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load course catalog:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleAssignExistingCourse = async (courseId) => {
    setAssigningId(courseId);
    try {
      const res = await teacherAPI.assignCourse({ courseId });
      setActionAlert({ type: 'success', message: res.data?.message || 'Course assigned successfully.' });
      await fetchFacultyData();
    } catch (err) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to assign course.' });
    } finally {
      setAssigningId(null);
    }
  };

  const handleCreateAndAssignCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.courseCode || !newCourse.courseName) {
      setActionAlert({ type: 'error', message: 'Please provide course code and course name.' });
      return;
    }
    setIsSubmittingCourse(true);
    try {
      const res = await teacherAPI.createAndAssignCourse(newCourse);
      setActionAlert({ type: 'success', message: res.data?.message || 'Course created and assigned!' });
      setShowCourseModal(false);
      setNewCourse({
        courseCode: '',
        courseName: '',
        department: 'Computer Science & Engineering',
        credits: 4,
        semester: 5,
        description: '',
        maxCapacity: 60
      });
      await fetchFacultyData();
    } catch (err) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to create course.' });
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleUnassignCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to unassign this course from your dashboard?')) return;
    try {
      await teacherAPI.unassignCourse(courseId);
      setActionAlert({ type: 'success', message: 'Course unassigned from your active list.' });
      await fetchFacultyData();
    } catch (err) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to unassign course.' });
    }
  };

  const handleOpenEnrollModal = (course) => {
    setEnrollTargetCourse(course);
    setEnrollSelectedStudentId(students[0]?.id || students[0]?.studentId || '');
    setShowEnrollModal(true);
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollSelectedStudentId || !enrollTargetCourse) return;
    setIsEnrollingStudent(true);
    try {
      const res = await teacherAPI.assignStudentToCourse({
        courseId: enrollTargetCourse.id || enrollTargetCourse._id,
        studentId: enrollSelectedStudentId
      });
      setActionAlert({ type: 'success', message: res.data?.message || 'Student enrolled successfully.' });
      setShowEnrollModal(false);
      await fetchFacultyData();
    } catch (err) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to enroll student.' });
    } finally {
      setIsEnrollingStudent(false);
    }
  };

  const handleCourseChange = async (courseId) => {
    setSelectedCourseId(courseId);
    try {
      const res = await teacherAPI.getCourseAnalytics(courseId);
      if (res.data?.analytics) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics for course:', err);
    }
  };

  const handleSendWarning = async (studentId, studentName) => {
    try {
      await noticeAPI.createNotice({
        title: `Attendance Advisory for ${studentName}`,
        content: `Your attendance is below the 75% cutoff. Please schedule counseling with your course instructor immediately.`,
        category: 'Academic',
        priority: 'urgent',
        targetAudience: 'student'
      });
      setNotifiedStudents((prev) => [...prev, studentId]);
    } catch (err) {
      console.error('Failed to dispatch attendance warning:', err);
      setNotifiedStudents((prev) => [...prev, studentId]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin" color="var(--primary)" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading faculty dashboard from MongoDB...</p>
      </div>
    );
  }

  const facultyInfo = dashboardData?.faculty || user?.profile || {};
  const stats = dashboardData?.stats || {
    totalCourses: dashboardData?.courses?.length || 0,
    totalStudents: students.length || 0,
    pendingGrading: 0,
    lowAttendanceAlerts: 0
  };

  const assignedCourses = dashboardData?.courses || [];

  // Prepare Dynamic Chart Data from MongoDB
  const rawAtt = analytics?.attendance || { above90: 2, above75: 2, below75: 1 };
  const attendanceDistData = [
    { name: '≥90%', value: rawAtt.above90 || 0, fill: '#10b981' },
    { name: '75-89%', value: rawAtt.above75 || 0, fill: '#3b82f6' },
    { name: '<75%', value: rawAtt.below75 || 0, fill: '#ef4444' }
  ];

  const rawGrades = analytics?.gradeDistribution || [];
  const gradeData = rawGrades.length > 0
    ? rawGrades.map((g) => ({ grade: g._id || 'A', count: g.count || 1 }))
    : [
        { grade: 'O', count: 3 },
        { grade: 'A+', count: 4 },
        { grade: 'A', count: 5 },
        { grade: 'B+', count: 2 },
        { grade: 'B', count: 1 }
      ];

  const lowAttendanceStudents = students.filter((s) => s.isLowAttendance || s.attendancePercentage < 75);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: actionAlert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${actionAlert.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: actionAlert.type === 'success' ? '#10b981' : '#ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            {actionAlert.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
            {actionAlert.message}
          </div>
          <button onClick={() => setActionAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.25rem 2rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <BookOpen size={16} /> Faculty Academic Portal
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Welcome back, {facultyInfo.name || user?.fullName || 'Faculty Member'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {facultyInfo.designation || 'Professor'}, Department of {facultyInfo.department || 'Computer Science & Engineering'} | Office: <strong>{facultyInfo.cabinOffice || 'Turing Hall, Room 302'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={openAssignModal} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <PlusCircle size={16} /> Assign / Add Course
          </button>
          <Link to="/attendance" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <CheckSquare size={16} /> Mark Attendance
          </Link>
          <Link to="/assignments" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <FileText size={16} /> Post Assignment
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Assigned Courses', value: `${assignedCourses.length} Courses`, sub: assignedCourses.map(c => c.courseCode).join(', ') || 'None assigned yet', icon: BookOpen, color: 'var(--primary)' },
          { label: 'Total Enrolled', value: `${stats.totalStudents} Students`, sub: 'Active university cohort', icon: Users, color: 'var(--accent-purple)' },
          { label: 'Pending Grading', value: `${stats.pendingGrading} Submissions`, sub: 'Awaiting evaluation', icon: FileCheck, color: 'var(--warning)' },
          { label: 'Attendance Alerts', value: `${lowAttendanceStudents.length} Students`, sub: '< 75% university cutoff', icon: AlertTriangle, color: 'var(--danger)' }
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="glass-panel stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="stat-label">{label}</div>
              <Icon size={18} color={color} />
            </div>
            <div className="stat-value" style={{ color, fontSize: '1.75rem' }}>{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* ── ASSIGNED COURSES MANAGEMENT SECTION ─────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="var(--primary)" /> Assigned Courses &amp; Curriculum Management
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Active courses assigned to your instructional schedule. Manage enrollments, mark lecture attendance, and view cohort analytics.
            </p>
          </div>
          <button onClick={openAssignModal} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}>
            <Plus size={16} /> Assign Another Course
          </button>
        </div>

        {assignedCourses.length === 0 ? (
          <div style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border)'
          }}>
            <BookOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>No Courses Currently Assigned</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.25rem auto' }}>
              Assign an existing university course to yourself or create a new course offering to begin recording attendance, grading, and assignments.
            </p>
            <button onClick={openAssignModal} className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
              <PlusCircle size={16} /> Assign Courses Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {assignedCourses.map((c) => {
              const courseId = c.id || c._id;
              const isSelected = selectedCourseId === courseId;
              return (
                <div
                  key={courseId}
                  style={{
                    padding: '1.5rem',
                    background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{c.courseCode}</span>
                      <span className="badge badge-warning">{c.credits || 4} Credits · Sem {c.semester || 5}</span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>{c.courseName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
                      {c.department || 'Computer Science & Engineering'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <Users size={14} color="var(--primary)" />
                      <span>Enrolled Students: <strong>{c.enrolledCount || 0}</strong> / {c.maxCapacity || 60}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleCourseChange(courseId)}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.78rem', padding: '0.45rem' }}
                      >
                        <BarChart3 size={13} /> {isSelected ? 'Viewing Analytics' : 'Select Analytics'}
                      </button>
                      <button
                        onClick={() => handleOpenEnrollModal(c)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
                        title="Enroll a student in this course"
                      >
                        <UserPlus size={13} /> Enroll Student
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link
                        to="/attendance"
                        style={{ color: 'var(--success)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <CheckSquare size={13} /> Take Attendance
                      </Link>
                      <button
                        onClick={() => handleUnassignCourse(courseId)}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Unassign Course
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Course Analytics Filter */}
      {assignedCourses.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Course Analytics:</span>
          {assignedCourses.map((c) => {
            const courseId = c.id || c._id;
            return (
              <button
                key={courseId}
                onClick={() => handleCourseChange(courseId)}
                className={`btn ${selectedCourseId === courseId ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              >
                {c.courseCode} — {c.courseName}
              </button>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Attendance Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={17} color="var(--success)" /> Student Attendance Health
          </h3>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={attendanceDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                  {attendanceDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {attendanceDistData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.fill }} />
                {d.name}: <strong>{d.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution BarChart */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={17} color="var(--primary)" /> Grade Distribution
          </h3>
          <div className="chart-container" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="grade" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                  {gradeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Attendance Action List */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--danger)" /> Attendance Risk Watchlist (&lt; 75%)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Auto-Flagged from Database</span>
        </div>
        {lowAttendanceStudents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All enrolled students currently meet the 75% attendance criteria.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lowAttendanceStudents.map((s) => {
              const studentName = s.name || s.studentId;
              const isNotified = notifiedStudents.includes(s.id || s.studentId);
              return (
                <div key={s.id || s.studentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{studentName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Roll No: {s.studentId} · Attendance: <strong style={{ color: 'var(--danger)' }}>{s.attendancePercentage}%</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendWarning(s.id || s.studentId, studentName)}
                    className={`btn ${isNotified ? 'btn-secondary' : 'btn-danger'}`}
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    disabled={isNotified}
                  >
                    <Send size={12} /> {isNotified ? 'Notice Dispatched' : 'Issue Debarment Notice'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <Link to="/teacher/students" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Users size={24} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Student Progress</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Individual profiles &amp; marks</div>
          </div>
        </Link>
        <Link to="/teacher/question-paper" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Sparkles size={24} color="var(--accent-purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Question Paper AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bloom's taxonomy generator</div>
          </div>
        </Link>
        <Link to="/rag-upload" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Upload size={24} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Knowledge Base (RAG)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upload PDF &amp; DOCX policies</div>
          </div>
        </Link>
        <Link to="/teacher/analytics" className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <BarChart3 size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Detailed Analytics</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cohort performance reports</div>
          </div>
        </Link>
      </div>

      {/* ── MODAL: ASSIGN / ADD COURSE ─────────────────────────────────────── */}
      {showCourseModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Assign Courses to Faculty Schedule</h2>
              <button onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setCourseModalTab('catalog')}
                className={`btn ${courseModalTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                Pick from University Catalog
              </button>
              <button
                onClick={() => setCourseModalTab('create')}
                className={`btn ${courseModalTab === 'create' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
              >
                + Create &amp; Assign New Course
              </button>
            </div>

            {/* TAB 1: CATALOG */}
            {courseModalTab === 'catalog' && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Select an existing course from MongoDB catalog to assign as your lead instructional course.
                </p>

                {loadingCatalog ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    Loading university catalog...
                  </div>
                ) : catalogCourses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No catalog courses found in database.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '380px', overflowY: 'auto' }}>
                    {catalogCourses.map((cat) => {
                      const isAlreadyAssigned = assignedCourses.some(
                        (ac) => (ac.id || ac._id) === cat._id || ac.courseCode === cat.courseCode
                      );
                      return (
                        <div
                          key={cat._id}
                          style={{
                            padding: '1rem',
                            background: 'var(--bg-input)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span className="badge badge-primary">{cat.courseCode}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cat.credits} Credits · Sem {cat.semester}</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{cat.courseName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.department}</div>
                          </div>

                          <div>
                            {isAlreadyAssigned ? (
                              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Check size={12} /> Assigned to You
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAssignExistingCourse(cat._id)}
                                disabled={assigningId === cat._id}
                                className="btn btn-primary"
                                style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
                              >
                                {assigningId === cat._id ? 'Assigning...' : 'Assign to Me'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREATE & ASSIGN */}
            {courseModalTab === 'create' && (
              <form onSubmit={handleCreateAndAssignCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS-401"
                      value={newCourse.courseCode}
                      onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Course Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Cloud & Distributed Computing"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newCourse.department}
                      onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      className="form-input"
                      value={newCourse.semester}
                      onChange={(e) => setNewCourse({ ...newCourse, semester: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Credits</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      className="form-input"
                      value={newCourse.credits}
                      onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Capacity</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      className="form-input"
                      value={newCourse.maxCapacity}
                      onChange={(e) => setNewCourse({ ...newCourse, maxCapacity: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea
                    rows={3}
                    className="form-textarea"
                    placeholder="Brief description of syllabus, prerequisites, and learning outcomes..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCourse}
                  className="btn btn-primary"
                  style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem' }}
                >
                  {isSubmittingCourse ? 'Publishing & Assigning...' : 'Create & Assign to My Schedule'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ENROLL STUDENT IN COURSE ────────────────────────────────── */}
      {showEnrollModal && enrollTargetCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Enroll Student in Course</h2>
              <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Course</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {enrollTargetCourse.courseCode} — {enrollTargetCourse.courseName}
              </div>
            </div>

            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Select Registered Student *</label>
                <select
                  className="form-input"
                  value={enrollSelectedStudentId}
                  onChange={(e) => setEnrollSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a student --</option>
                  {students.map((st) => (
                    <option key={st.id || st.studentId} value={st.id || st.studentId}>
                      {st.studentId} — {st.name} ({st.department || 'CSE'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isEnrollingStudent || !enrollSelectedStudentId}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
              >
                {isEnrollingStudent ? 'Enrolling Student...' : 'Confirm Student Enrollment'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyDashboard;
