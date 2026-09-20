import React, { useState, useEffect, useCallback, useRef } from 'react';
import { teacherAPI } from '../../services/api.js';
import {
  Users, Search, Plus, Edit3, Trash2, CheckCircle, XCircle,
  Filter, ChevronDown, ChevronLeft, ChevronRight, User, Mail,
  Phone, BookOpen, Award, Calendar, Loader2, AlertTriangle,
  RefreshCw, Building, GraduationCap, ShieldCheck, ShieldX,
  Eye, MoreVertical, Check, X, UserCheck, UserX, Download,
  Layers, TrendingUp, Hash
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'All',
  'Computer Science',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Mathematics',
  'Physics'
];

const SEMESTERS = ['All', 1, 2, 3, 4, 5, 6, 7, 8];
const STATUS_OPTIONS = ['All', 'Active', 'Inactive'];
const DEGREE_PROGRAMS = [
  'Bachelor of Technology',
  'Bachelor of Science',
  'Bachelor of Engineering',
  'Master of Technology',
  'Master of Science',
  'PhD'
];

// ── Empty form state ──────────────────────────────────────────────────────
const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  password: 'Student@1234',
  phoneNumber: '',
  studentId: '',
  department: 'Computer Science',
  degreeProgram: 'Bachelor of Technology',
  currentSemester: 1,
  admissionYear: new Date().getFullYear(),
  batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
  cgpa: 0,
  completedCredits: 0,
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: 'Parent'
});

// ── Avatar component ──────────────────────────────────────────────────────
const StudentAvatar = ({ name, size = 40 }) => {
  const initials = name
    ? name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
  const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[colorIdx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, color: '#fff',
      flexShrink: 0, letterSpacing: '0.05em'
    }}>
      {initials}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ isActive }) => (
  <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
    {isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

// ── CGPA Color helper ─────────────────────────────────────────────────────
const cgpaColor = (cgpa) => {
  if (cgpa >= 8.5) return 'var(--success)';
  if (cgpa >= 7.0) return 'var(--primary)';
  if (cgpa >= 5.0) return 'var(--warning)';
  return 'var(--danger)';
};

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const StudentManagementPage = () => {
  // ── State ────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [deptStats, setDeptStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type, message }

  // Filters & search
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterSem, setFilterSem] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'delete' | 'approve'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [formErrors, setFormErrors] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);

  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        search: opts.search ?? search,
        department: opts.department ?? filterDept,
        semester: opts.semester ?? filterSem,
        status: opts.status ?? filterStatus,
        page: opts.page ?? page,
        limit: 15
      };
      const res = await teacherAPI.getManageStudents(params);
      if (res.data?.success) {
        setStudents(res.data.students || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.count || 0);
      }
    } catch (err) {
      showAlert('error', 'Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterSem, filterStatus, page]);

  const fetchDeptStats = async () => {
    try {
      const res = await teacherAPI.getDepartmentStats();
      if (res.data?.success) setDeptStats(res.data);
    } catch { }
  };

  useEffect(() => {
    fetchStudents();
    fetchDeptStats();
  }, []);

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchStudents({ search: val, page: 1 });
    }, 400);
  };

  const applyFilter = (key, val) => {
    setPage(1);
    if (key === 'department') { setFilterDept(val); fetchStudents({ department: val, page: 1 }); }
    if (key === 'semester') { setFilterSem(val); fetchStudents({ semester: val, page: 1 }); }
    if (key === 'status') { setFilterStatus(val); fetchStudents({ status: val, page: 1 }); }
  };

  const changePage = (p) => {
    setPage(p);
    fetchStudents({ page: p });
  };

  // ── Alert helper ──────────────────────────────────────────────────────────
  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData(emptyForm());
    setFormErrors({});
    setModal('add');
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      studentId: student.studentId,
      department: student.department,
      degreeProgram: student.degreeProgram,
      currentSemester: student.currentSemester,
      admissionYear: student.admissionYear,
      batch: student.batch,
      cgpa: student.cgpa,
      completedCredits: student.completedCredits || 0,
      emergencyContactName: student.emergencyContact?.name || '',
      emergencyContactPhone: student.emergencyContact?.phone || '',
      emergencyContactRelation: student.emergencyContact?.relationship || 'Parent'
    });
    setFormErrors({});
    setModal('edit');
    setActiveMenuId(null);
  };

  const openViewModal = (student) => {
    setSelectedStudent(student);
    setModal('view');
    setActiveMenuId(null);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setModal('delete');
    setActiveMenuId(null);
  };

  // ── Form validation ──────────────────────────────────────────────────────
  const validateForm = (data, isEdit = false) => {
    const errors = {};
    if (!data.firstName.trim()) errors.firstName = 'First name is required';
    if (!data.lastName.trim()) errors.lastName = 'Last name is required';
    if (!isEdit && !data.email.trim()) errors.email = 'Email is required';
    if (!isEdit && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Invalid email address';
    }
    if (!data.department) errors.department = 'Department is required';
    if (data.cgpa < 0 || data.cgpa > 10) errors.cgpa = 'CGPA must be between 0 and 10';
    return errors;
  };

  // ── CRUD Handlers ────────────────────────────────────────────────────────
  const handleAddStudent = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData, false);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setActionLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password || 'Student@1234',
        phoneNumber: formData.phoneNumber,
        studentId: formData.studentId,
        department: formData.department,
        degreeProgram: formData.degreeProgram,
        currentSemester: Number(formData.currentSemester),
        admissionYear: Number(formData.admissionYear),
        batch: formData.batch,
        cgpa: Number(formData.cgpa),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        }
      };
      const res = await teacherAPI.addStudent(payload);
      if (res.data?.success) {
        showAlert('success', res.data.message);
        setModal(null);
        fetchStudents();
        fetchDeptStats();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to add student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditStudent = async (e) => {
    e.preventDefault();
    const errors = validateForm(formData, true);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setActionLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        degreeProgram: formData.degreeProgram,
        currentSemester: Number(formData.currentSemester),
        admissionYear: Number(formData.admissionYear),
        batch: formData.batch,
        cgpa: Number(formData.cgpa),
        completedCredits: Number(formData.completedCredits),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelation
        }
      };
      const res = await teacherAPI.editStudent(selectedStudent._id, payload);
      if (res.data?.success) {
        showAlert('success', `Student ${selectedStudent.studentId} updated successfully.`);
        setModal(null);
        fetchStudents();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    setActionLoading(true);
    try {
      const res = await teacherAPI.deleteStudent(selectedStudent._id);
      if (res.data?.success) {
        showAlert('success', res.data.message);
        setModal(null);
        fetchStudents();
        fetchDeptStats();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to deactivate student.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveStudent = async (student, action) => {
    setActionLoading(true);
    try {
      const res = await teacherAPI.approveStudent(student._id, action);
      if (res.data?.success) {
        showAlert('success', res.data.message);
        fetchStudents();
        fetchDeptStats();
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to update student status.');
    } finally {
      setActionLoading(false);
      setActiveMenuId(null);
    }
  };

  const handleFormChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: '' }));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Alert Toast */}
      {alert && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
          background: alert.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${alert.type === 'success' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.9rem',
          backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-lg)', maxWidth: '420px', animation: 'fadeIn 0.2s ease'
        }}>
          {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          {alert.message}
          <button onClick={() => setAlert(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            <Users size={16} /> Student Administration Panel
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Student Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Add, edit, search, filter, approve, and manage all registered university students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => fetchStudents()} className="btn btn-secondary" style={{ gap: '0.4rem', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={openAddModal} className="btn btn-primary" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Students', value: deptStats?.totalStudents ?? '—', icon: Users, color: 'var(--primary)' },
          { label: 'Active Accounts', value: deptStats?.activeStudents ?? '—', icon: UserCheck, color: 'var(--success)' },
          { label: 'Inactive Accounts', value: deptStats?.inactiveStudents ?? '—', icon: UserX, color: 'var(--danger)' },
          { label: 'Departments', value: deptStats?.departments?.length ?? '—', icon: Building, color: 'var(--accent-purple)' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              type="text"
              className="form-input"
              placeholder="Search by name, ID, email, department..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ paddingLeft: '2.5rem', borderRadius: 'var(--radius-sm)' }}
            />
          </div>

          {/* Department Filter */}
          <select
            className="form-input"
            value={filterDept}
            onChange={(e) => applyFilter('department', e.target.value)}
            style={{ flex: '0 1 200px', borderRadius: 'var(--radius-sm)' }}
          >
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d === 'All' ? '🏛 All Departments' : d}</option>)}
          </select>

          {/* Semester Filter */}
          <select
            className="form-input"
            value={filterSem}
            onChange={(e) => applyFilter('semester', e.target.value)}
            style={{ flex: '0 1 160px', borderRadius: 'var(--radius-sm)' }}
          >
            {SEMESTERS.map(s => <option key={s} value={s}>{s === 'All' ? '📚 All Semesters' : `Semester ${s}`}</option>)}
          </select>

          {/* Status Filter */}
          <select
            className="form-input"
            value={filterStatus}
            onChange={(e) => applyFilter('status', e.target.value)}
            style={{ flex: '0 1 150px', borderRadius: 'var(--radius-sm)' }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? '⚡ All Status' : s}</option>)}
          </select>

          {/* Count */}
          <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> students found
          </div>
        </div>
      </div>

      {/* ── Student Table ─────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1rem' }}>
            <Loader2 size={36} className="animate-spin" color="var(--primary)" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading students from MongoDB...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.4rem' }}>No students found</p>
            <p style={{ fontSize: '0.85rem' }}>
              {search || filterDept !== 'All' || filterSem !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Add the first student to get started'}
            </p>
            <button onClick={openAddModal} className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
              <Plus size={16} /> Add First Student
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 1.4fr 1.2fr 1fr 1fr 0.9fr 1.1fr',
              padding: '0.85rem 1.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.02)'
            }}>
              <span>Student</span>
              <span>Department</span>
              <span>Roll No</span>
              <span>Sem</span>
              <span>CGPA</span>
              <span>Status</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {/* Table Rows */}
            {students.map((student) => (
              <div
                key={student._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5fr 1.4fr 1.2fr 1fr 1fr 0.9fr 1.1fr',
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  alignItems: 'center',
                  transition: 'background 0.15s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Student Name & Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                  <StudentAvatar name={student.name} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {student.email}
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{student.department}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.batch}</div>
                </div>

                {/* Student ID */}
                <div>
                  <span className="badge badge-secondary" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {student.studentId}
                  </span>
                </div>

                {/* Semester */}
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-purple)' }}>
                  Sem {student.currentSemester}
                </div>

                {/* CGPA */}
                <div style={{ fontWeight: 800, fontSize: '1rem', color: cgpaColor(student.cgpa) }}>
                  {student.cgpa > 0 ? student.cgpa.toFixed(2) : '—'}
                </div>

                {/* Status */}
                <StatusBadge isActive={student.isActive} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                  {/* Quick Approve/Suspend */}
                  {!student.isActive ? (
                    <button
                      onClick={() => handleApproveStudent(student, 'approve')}
                      title="Approve / Activate"
                      className="btn btn-success"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <ShieldCheck size={13} /> Approve
                    </button>
                  ) : null}

                  {/* View */}
                  <button
                    onClick={() => openViewModal(student)}
                    title="View Profile"
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <Eye size={14} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(student)}
                    title="Edit Student"
                    style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* More menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveMenuId(prev => prev === student._id ? null : student._id)}
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.35rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      <MoreVertical size={14} />
                    </button>
                    {activeMenuId === student._id && (
                      <div style={{
                        position: 'absolute', right: 0, top: '110%', zIndex: 1000,
                        background: 'var(--bg-surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                        minWidth: '160px', overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => openEditModal(student)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}
                        >
                          <Edit3 size={14} /> Edit Profile
                        </button>
                        {student.isActive ? (
                          <button
                            onClick={() => { handleApproveStudent(student, 'suspend'); }}
                            style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--warning)' }}
                          >
                            <ShieldX size={14} /> Suspend Account
                          </button>
                        ) : (
                          <button
                            onClick={() => { handleApproveStudent(student, 'approve'); }}
                            style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--success)' }}
                          >
                            <ShieldCheck size={14} /> Approve Account
                          </button>
                        )}
                        <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />
                        <button
                          onClick={() => openDeleteModal(student)}
                          style={{ width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--danger)' }}
                        >
                          <Trash2 size={14} /> Deactivate / Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => changePage(page - 1)}
                    disabled={page === 1}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, page - 2);
                    const pg = start + i;
                    if (pg > totalPages) return null;
                    return (
                      <button
                        key={pg}
                        onClick={() => changePage(pg)}
                        className={pg === page ? 'btn btn-primary' : 'btn btn-secondary'}
                        style={{ padding: '0.4rem 0.65rem', minWidth: '36px' }}
                      >{pg}</button>
                    );
                  })}
                  <button
                    onClick={() => changePage(page + 1)}
                    disabled={page === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Department Overview ───────────────────────────────────────────── */}
      {deptStats?.departments?.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} color="var(--accent-purple)" /> Department Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {deptStats.departments.map((dept) => (
              <div key={dept.name} style={{
                padding: '1rem 1.25rem',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <GraduationCap size={20} color="var(--accent-purple)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dept.name}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span><strong style={{ color: 'var(--primary)' }}>{dept.count}</strong> students</span>
                    {dept.avgCgpa > 0 && <span>Avg CGPA: <strong style={{ color: cgpaColor(dept.avgCgpa) }}>{dept.avgCgpa}</strong></span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────
          ── ADD STUDENT MODAL
          ─────────────────────────────────────────────────────────────── */}
      {(modal === 'add' || modal === 'edit') && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '760px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 1
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                  {modal === 'add' ? '➕ Add New Student' : '✏️ Edit Student Profile'}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {modal === 'add'
                    ? 'Create a new student account with academic profile'
                    : `Editing: ${selectedStudent?.name} (${selectedStudent?.studentId})`}
                </p>
              </div>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.35rem' }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={modal === 'add' ? handleAddStudent : handleEditStudent} style={{ padding: '1.75rem' }}>
              {/* Section: Personal Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} /> Personal Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className={`form-input ${formErrors.firstName ? 'input-error' : ''}`}
                      value={formData.firstName} onChange={(e) => handleFormChange('firstName', e.target.value)}
                      placeholder="Arjun" />
                    {formErrors.firstName && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{formErrors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className={`form-input ${formErrors.lastName ? 'input-error' : ''}`}
                      value={formData.lastName} onChange={(e) => handleFormChange('lastName', e.target.value)}
                      placeholder="Sharma" />
                    {formErrors.lastName && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{formErrors.lastName}</div>}
                  </div>
                  {modal === 'add' && (
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input className={`form-input ${formErrors.email ? 'input-error' : ''}`}
                        type="email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)}
                        placeholder="arjun.sharma@university.edu.in" />
                      {formErrors.email && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{formErrors.email}</div>}
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" value={formData.phoneNumber}
                      onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                      placeholder="+91 98765 43210" />
                  </div>
                  {modal === 'add' && (
                    <div className="form-group">
                      <label className="form-label">Temporary Password</label>
                      <input className="form-input" value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="Student@1234" />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Student must change on first login</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Academic Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={14} /> Academic Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {modal === 'add' && (
                    <div className="form-group">
                      <label className="form-label">Student ID / Roll No.</label>
                      <input className="form-input" value={formData.studentId}
                        onChange={(e) => handleFormChange('studentId', e.target.value)}
                        placeholder="Auto-generated if blank (e.g. STU-2024-12345)" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select className={`form-input ${formErrors.department ? 'input-error' : ''}`}
                      value={formData.department} onChange={(e) => handleFormChange('department', e.target.value)}>
                      {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Degree Program</label>
                    <select className="form-input" value={formData.degreeProgram}
                      onChange={(e) => handleFormChange('degreeProgram', e.target.value)}>
                      {DEGREE_PROGRAMS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Semester</label>
                    <select className="form-input" value={formData.currentSemester}
                      onChange={(e) => handleFormChange('currentSemester', e.target.value)}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admission Year</label>
                    <input className="form-input" type="number" min="2000" max="2040"
                      value={formData.admissionYear} onChange={(e) => handleFormChange('admissionYear', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch (e.g. 2024-2028)</label>
                    <input className="form-input" value={formData.batch}
                      onChange={(e) => handleFormChange('batch', e.target.value)}
                      placeholder="2024-2028" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CGPA</label>
                    <input className={`form-input ${formErrors.cgpa ? 'input-error' : ''}`}
                      type="number" step="0.01" min="0" max="10"
                      value={formData.cgpa} onChange={(e) => handleFormChange('cgpa', e.target.value)} />
                    {formErrors.cgpa && <div style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '0.25rem' }}>{formErrors.cgpa}</div>}
                  </div>
                  {modal === 'edit' && (
                    <div className="form-group">
                      <label className="form-label">Completed Credits</label>
                      <input className="form-input" type="number" min="0" max="240"
                        value={formData.completedCredits}
                        onChange={(e) => handleFormChange('completedCredits', e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={14} /> Emergency Contact
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Name</label>
                    <input className="form-input" value={formData.emergencyContactName}
                      onChange={(e) => handleFormChange('emergencyContactName', e.target.value)}
                      placeholder="Ramesh Sharma" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-input" value={formData.emergencyContactPhone}
                      onChange={(e) => handleFormChange('emergencyContactPhone', e.target.value)}
                      placeholder="+91 99887 76655" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <select className="form-input" value={formData.emergencyContactRelation}
                      onChange={(e) => handleFormChange('emergencyContactRelation', e.target.value)}>
                      {['Parent', 'Guardian', 'Sibling', 'Spouse', 'Other'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading
                    ? <><Loader2 size={16} className="animate-spin" /> Saving...</>
                    : <><Check size={16} /> {modal === 'add' ? 'Add Student' : 'Save Changes'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW PROFILE MODAL ─────────────────────────────────────────── */}
      {modal === 'view' && selectedStudent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Header */}
            <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Student Profile</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.75rem' }}>
              {/* Avatar & name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                <StudentAvatar name={selectedStudent.name} size={64} />
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedStudent.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{selectedStudent.email}</div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>{selectedStudent.studentId}</span>
                    <StatusBadge isActive={selectedStudent.isActive} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {[
                  { label: 'Department', value: selectedStudent.department, icon: Building },
                  { label: 'Degree', value: selectedStudent.degreeProgram, icon: GraduationCap },
                  { label: 'Current Semester', value: `Semester ${selectedStudent.currentSemester}`, icon: BookOpen },
                  { label: 'Batch', value: selectedStudent.batch, icon: Calendar },
                  { label: 'CGPA', value: selectedStudent.cgpa > 0 ? selectedStudent.cgpa.toFixed(2) : '—', icon: Award, valueColor: cgpaColor(selectedStudent.cgpa) },
                  { label: 'Credits Earned', value: `${selectedStudent.completedCredits || 0} / 120`, icon: Hash },
                  { label: 'Phone', value: selectedStudent.phoneNumber || '—', icon: Phone },
                  { label: 'Admission Year', value: selectedStudent.admissionYear || '—', icon: Calendar },
                ].map(({ label, value, icon: Icon, valueColor }) => (
                  <div key={label} style={{ padding: '0.9rem 1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Icon size={12} /> {label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: valueColor || 'var(--text-primary)' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Enrolled Courses */}
              {selectedStudent.enrolledCourses?.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                    Enrolled Courses ({selectedStudent.enrolledCourses.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedStudent.enrolledCourses.map((c, i) => (
                      <span key={i} className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                        {c.courseCode || 'Course'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedStudent.emergencyContact?.name && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--danger)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Contact</h4>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{selectedStudent.emergencyContact.name}</strong>
                    {selectedStudent.emergencyContact.relationship && ` (${selectedStudent.emergencyContact.relationship})`}
                    {selectedStudent.emergencyContact.phone && ` — ${selectedStudent.emergencyContact.phone}`}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={() => { setModal(null); openEditModal(selectedStudent); }} className="btn btn-primary" style={{ flex: 1 }}>
                  <Edit3 size={15} /> Edit Profile
                </button>
                <button onClick={() => setModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE / DEACTIVATE MODAL ─────────────────────────────────── */}
      {modal === 'delete' && selectedStudent && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '440px',
            padding: '2rem', boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Trash2 size={28} color="var(--danger)" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Deactivate Student?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                This will deactivate <strong>{selectedStudent.name}</strong> ({selectedStudent.studentId})'s account. They will no longer be able to log in. This action can be reversed.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setModal(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleDeleteStudent} className="btn btn-danger" disabled={actionLoading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menus on outside click */}
      {activeMenuId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setActiveMenuId(null)}
        />
      )}
    </div>
  );
};

export default StudentManagementPage;
