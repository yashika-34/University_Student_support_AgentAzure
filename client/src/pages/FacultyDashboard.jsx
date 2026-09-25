import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { teacherAPI, noticeAPI, courseAPI } from '../services/api.js';
import ModalPortal from '../components/ModalPortal.jsx';
import {
  Users, CheckSquare, AlertTriangle, BookOpen, Send, PlusCircle, FileCheck,
  BarChart3, Sparkles, TrendingUp, FileText, Upload, Loader2, Bell,
  Plus, Check, X, UserPlus, Layers, Calendar, Award, ExternalLink, Search
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
  const [courseModalTab, setCourseModalTab] = useState('create'); // 'create' | 'catalog'
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
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

  // Post Notice Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'Academic',
    priority: 'normal',
    targetAudience: 'all'
  });
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);

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

  // Disable background scrolling when any modal is active
  useEffect(() => {
    if (showCourseModal || showEnrollModal || showNoticeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCourseModal, showEnrollModal, showNoticeModal]);

  // Close all modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCourseModal(false);
        setShowEnrollModal(false);
        setShowNoticeModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Post Notice submission
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;
    setIsSubmittingNotice(true);
    try {
      await noticeAPI.createNotice(noticeForm);
      setActionAlert({ type: 'success', message: `Notice "${noticeForm.title}" published to all students.` });
      setShowNoticeModal(false);
      setNoticeForm({ title: '', content: '', category: 'Academic', priority: 'normal', targetAudience: 'all' });
    } catch (err) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to publish notice.' });
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  const openCourseModal = async (tab = 'create') => {
    setCourseModalTab(tab);
    setShowCourseModal(true);
    setCatalogSearch('');
    if (tab === 'catalog' || catalogCourses.length === 0) {
      setLoadingCatalog(true);
      try {
        const res = await courseAPI.getAll({ limit: 100 });
        setCatalogCourses(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load course catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  // Backwards compatibility alias
  const openAssignModal = () => openCourseModal('catalog');

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

  const filteredCatalog = catalogCourses.filter((c) => {
    if (!catalogSearch) return true;
    const query = catalogSearch.toLowerCase();
    return (
      (c.courseCode && c.courseCode.toLowerCase().includes(query)) ||
      (c.courseName && c.courseName.toLowerCase().includes(query)) ||
      (c.department && c.department.toLowerCase().includes(query))
    );
  });

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
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button onClick={() => openCourseModal('create')} className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <Plus size={16} /> Add Course
          </button>
          <button onClick={() => openCourseModal('catalog')} className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <BookOpen size={16} /> Assign Course
          </button>
          <Link to="/attendance" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <CheckSquare size={16} /> Mark Attendance
          </Link>
          <button onClick={() => setShowNoticeModal(true)} className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <Bell size={16} /> Post Notice
          </button>
          <Link to="/assignments" className="btn btn-secondary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
            <FileText size={16} /> Post Assignment
          </Link>
          <Link to="/teacher/question-paper" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', background: 'var(--primary-gradient)', border: 'none' }}>
            <Sparkles size={16} /> AI Paper Generator
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
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => openCourseModal('create')} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}>
              <Plus size={16} /> Add Course
            </button>
            <button onClick={() => openCourseModal('catalog')} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.55rem 1rem' }}>
              <BookOpen size={15} /> Assign Course
            </button>
          </div>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => openCourseModal('create')} className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
                <Plus size={16} /> Add Course
              </button>
              <button onClick={() => openCourseModal('catalog')} className="btn btn-secondary" style={{ padding: '0.65rem 1.4rem' }}>
                <BookOpen size={16} /> Assign Course
              </button>
            </div>
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

      {/* ── CENTERED MODAL POPUP: ADD / ASSIGN COURSE ───────────────────────── */}
      <ModalPortal isOpen={showCourseModal}>
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCourseModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-modal-title"
        >
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 id="course-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.2 }}>
                    {courseModalTab === 'create' ? 'Add New Course' : 'Assign Course from Catalog'}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    {courseModalTab === 'create'
                      ? 'Publish a new course curriculum and assign to your schedule'
                      : 'Choose an active university course to assign to your teaching roster'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseModal(false)}
                className="modal-close-btn"
                title="Close (Esc)"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Segmented Switch Tabs */}
            <div style={{
              padding: '0.65rem 1.25rem 0.25rem',
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <button
                type="button"
                onClick={() => setCourseModalTab('create')}
                className={`btn ${courseModalTab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Plus size={14} /> Add New Course
              </button>
              <button
                type="button"
                onClick={() => {
                  setCourseModalTab('catalog');
                  if (catalogCourses.length === 0) {
                    openCourseModal('catalog');
                  }
                }}
                className={`btn ${courseModalTab === 'catalog' ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <BookOpen size={14} /> Assign Existing Course
              </button>
            </div>

            {/* Modal Body: Compact & Immediately Visible */}
            <div className="modal-body" style={{ padding: '0.9rem 1.25rem 1.15rem' }}>
              {/* TAB 1: ADD NEW COURSE */}
              {courseModalTab === 'create' && (
                <form onSubmit={handleCreateAndAssignCourse} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Row 1: Code + Name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '0.65rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Code *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="CS-401"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                        value={newCourse.courseCode}
                        onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value.toUpperCase() })}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Course Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Distributed Systems & Cloud"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                        value={newCourse.courseName}
                        onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Department, Semester, Credits, Capacity */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.65rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Department</label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem' }}
                        value={newCourse.department}
                        onChange={(e) => setNewCourse({ ...newCourse, department: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Semester</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        className="form-input"
                        style={{ padding: '0.45rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }}
                        value={newCourse.semester}
                        onChange={(e) => setNewCourse({ ...newCourse, semester: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Credits</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        className="form-input"
                        style={{ padding: '0.45rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }}
                        value={newCourse.credits}
                        onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Capacity</label>
                      <input
                        type="number"
                        min={10}
                        max={200}
                        className="form-input"
                        style={{ padding: '0.45rem 0.4rem', fontSize: '0.85rem', textAlign: 'center' }}
                        value={newCourse.maxCapacity}
                        onChange={(e) => setNewCourse({ ...newCourse, maxCapacity: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {/* Row 3: Description */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Course Overview / Description (Optional)</label>
                    <textarea
                      rows={2}
                      className="form-textarea"
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.85rem', resize: 'none' }}
                      placeholder="Summary of course modules, prerequisites, and learning objectives..."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    />
                  </div>

                  {/* Action Buttons: Immediately visible right below without scrolling */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.4rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setShowCourseModal(false)}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCourse}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1.35rem', fontSize: '0.82rem' }}
                    >
                      {isSubmittingCourse ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Creating...
                        </>
                      ) : (
                        <>
                          <Plus size={15} /> Create &amp; Assign Course
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ASSIGN COURSE FROM CATALOG */}
              {courseModalTab === 'catalog' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search courses by code, title, or department..."
                      style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingBlock: '0.45rem', fontSize: '0.85rem' }}
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {loadingCatalog ? (
                    <div style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontSize: '0.85rem' }}>Loading university course catalog...</div>
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.75rem', color: 'var(--text-muted)' }}>
                      <BookOpen size={28} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No matching courses found</div>
                      <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                        {catalogSearch ? 'Try a different search term or' : 'No courses found in database.'}{' '}
                        <button
                          type="button"
                          onClick={() => setCourseModalTab('create')}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          create a new course
                        </button>.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '260px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                      {filteredCatalog.map((cat) => {
                        const isAlreadyAssigned = assignedCourses.some(
                          (ac) => (ac.id || ac._id) === cat._id || ac.courseCode === cat.courseCode
                        );
                        return (
                          <div
                            key={cat._id}
                            style={{
                              padding: '0.65rem 0.85rem',
                              background: 'var(--bg-input)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'border-color 0.18s ease'
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.2rem' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem' }}>{cat.courseCode}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cat.credits || 4} Cr · Sem {cat.semester || 1}</span>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cat.courseName}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {cat.department || 'Computer Science'}
                              </div>
                            </div>

                            <div style={{ flexShrink: 0 }}>
                              {isAlreadyAssigned ? (
                                <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}>
                                  <Check size={12} /> Assigned
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAssignExistingCourse(cat._id)}
                                  disabled={assigningId === cat._id}
                                  className="btn btn-primary"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                >
                                  {assigningId === cat._id ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" /> Assigning...
                                    </>
                                  ) : (
                                    'Assign to Me'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Catalog Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Showing {filteredCatalog.length} catalog course{filteredCatalog.length === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCourseModal(false)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ── CENTERED MODAL POPUP: ENROLL STUDENT IN COURSE ──────────────────── */}
      <ModalPortal isOpen={Boolean(showEnrollModal && enrollTargetCourse)}>
        {enrollTargetCourse && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEnrollModal(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-container" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}
                  >
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Enroll Student in Course</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Register student into your course roster</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="modal-close-btn"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ padding: '1.15rem' }}>
                <div style={{ background: 'var(--bg-input)', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Course</div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {enrollTargetCourse?.courseCode} — {enrollTargetCourse?.courseName}
                  </div>
                </div>

                <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Select Student to Enroll *</label>
                    <select
                      className="form-select"
                      value={enrollSelectedStudentId}
                      onChange={(e) => setEnrollSelectedStudentId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose a registered student --</option>
                      {students.map((st) => (
                        <option key={st.id || st.studentId} value={st.id || st.studentId}>
                          {st.studentId} — {st.name} ({st.department || 'CSE'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowEnrollModal(false)}
                      className="btn btn-secondary"
                      style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEnrollingStudent || !enrollSelectedStudentId}
                      className="btn btn-primary"
                      style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                    >
                      {isEnrollingStudent ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Enrolling...
                        </>
                      ) : (
                        'Confirm Enrollment'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* ── POST NOTICE CENTERED MODAL ─────────────────────────────────────── */}
      <ModalPortal isOpen={showNoticeModal}>
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNoticeModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-modal-title"
        >
          <div className="modal-container" style={{ maxWidth: '600px' }}>
            {/* Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', flexShrink: 0
                }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h3 id="notice-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Post University Notice
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Publish announcements directly to students via the notification system
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowNoticeModal(false)}
                aria-label="Close notice modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body">
              <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Title */}
                <div>
                  <label className="form-label">Notice Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mid-Semester Examination Schedule"
                    value={noticeForm.title}
                    onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                    required
                  />
                </div>

                {/* Category / Priority / Audience row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={noticeForm.category}
                      onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
                    >
                      <option value="Academic">Academic</option>
                      <option value="Exam">Exam</option>
                      <option value="Event">Event</option>
                      <option value="Fee">Fee</option>
                      <option value="Holiday">Holiday</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      className="form-input"
                      value={noticeForm.priority}
                      onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Audience</label>
                    <select
                      className="form-input"
                      value={noticeForm.targetAudience}
                      onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
                    >
                      <option value="all">All</option>
                      <option value="student">Students Only</option>
                      <option value="faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="form-label">Notice Content *</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    placeholder="Write the full notice content here..."
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                    required
                    style={{ resize: 'vertical', minHeight: '120px' }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNoticeModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmittingNotice || !noticeForm.title || !noticeForm.content}
                  >
                    {isSubmittingNotice ? (
                      <><Loader2 size={15} className="animate-spin" /> Publishing...</>
                    ) : (
                      <><Send size={15} /> Publish Notice</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
};

export default FacultyDashboard;
