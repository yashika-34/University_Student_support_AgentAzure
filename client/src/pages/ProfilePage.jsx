import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api, { authAPI } from '../services/api.js';
import {
  GraduationCap, Shield, Save, Check, Edit2, Lock, Users, User,
  Mail, Phone, Building, BookOpen, CalendarDays, Hash, Eye, EyeOff,
  ArrowLeft, AlertCircle, CheckCircle, X
} from 'lucide-react';

const ProfilePage = () => {
  const { user, role, switchRole, logout, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = role === 'student';
  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';
  const profile = user?.profile || {};

  // ── Active Section (from hash in URL) ──────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['edit', 'security'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('overview');
    }
  }, [location.hash]);

  // ── Profile Data from MongoDB / AuthContext ────────────────────────────
  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || (isStudent ? 'Alex Mercer' : 'Dr. Alan Turing');
  const displayEmail = user?.email || (isStudent ? 'alex.student@university.edu' : 'dr.alan@university.edu');
  const displayId = profile.studentId || profile.employeeId || user?.id || (isStudent ? 'STU-2024-8842' : 'FAC-CS-101');
  const displayDepartment = profile.department || 'Computer Science & Engineering';
  const displaySemester = profile.currentSemester || 5;

  const student = {
    name: displayName,
    email: displayEmail,
    id: displayId,
    department: displayDepartment,
    currentSemester: displaySemester,
    degreeProgram: profile.degreeProgram || 'B.S. in Computer Science',
    cgpa: profile.cgpa
      ? (profile.cgpa <= 4.0 ? Number((profile.cgpa * 2.5).toFixed(2)) : profile.cgpa)
      : 8.65,
    batch: profile.batch || '2022-2026',
    completedCredits: profile.completedCredits || 74,
    advisor: profile.academicAdvisor?.userId?.firstName 
      ? `Dr. ${profile.academicAdvisor.userId.firstName} ${profile.academicAdvisor.userId.lastName}` 
      : 'Dr. Alan Turing',
    emergencyContact: {
      name: profile.emergencyContact?.name || 'Mercer Family',
      relationship: profile.emergencyContact?.relationship || 'Parent',
      phone: profile.emergencyContact?.phone || '+1-555-9988'
    }
  };

  const faculty = {
    name: displayName,
    email: displayEmail,
    id: displayId,
    department: displayDepartment,
    designation: profile.designation || 'Professor',
    cabinOffice: profile.cabinOffice || 'Turing Hall, Room 302',
    officeHours: Array.isArray(profile.officeHours)
      ? profile.officeHours.map(h => `${h.dayOfWeek || ''} ${h.startTime || ''}-${h.endTime || ''}`).join(', ') || 'Tue/Thu 2:00 PM - 4:00 PM'
      : (profile.officeHours || 'Tue/Thu 2:00 PM - 4:00 PM')
  };

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  // ── Edit Profile State ─────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || displayName.split(' ')[0] || '',
    lastName: user?.lastName || displayName.split(' ').slice(1).join(' ') || '',
    phone: user?.phoneNumber || (isStudent ? '+1-555-0123' : '+1-555-0100'),
    emergencyName: student.emergencyContact?.name || '',
    emergencyPhone: student.emergencyContact?.phone || '',
    emergencyRelationship: student.emergencyContact?.relationship || '',
    cabinOffice: faculty.cabinOffice || '',
    officeHours: typeof faculty.officeHours === 'string' ? faculty.officeHours : ''
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // ── Change Password State ──────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwResult, setPwResult] = useState(null); // { type: 'success' | 'error', message: '...' }

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phone,
        ...(isStudent ? {
          emergencyContact: {
            name: editForm.emergencyName,
            relationship: editForm.emergencyRelationship,
            phone: editForm.emergencyPhone
          }
        } : {
          cabinOffice: editForm.cabinOffice,
          officeHours: editForm.officeHours
        })
      };

      const res = await authAPI.updateProfile(payload);
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwResult(null);

    if (pwForm.newPassword.length < 8) {
      setPwResult({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwResult({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }
    if (pwForm.currentPassword === pwForm.newPassword) {
      setPwResult({ type: 'error', message: 'New password must be different from current password.' });
      return;
    }

    setPwSaving(true);
    try {
      const res = await authAPI.updatePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwResult({
        type: 'success',
        message: res.data?.message || 'Password changed successfully! Please use your new password next time you login.'
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update password. Please check your current password.';
      setPwResult({ type: 'error', message: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Password strength indicator ────────────────────────────────────────
  const getPasswordStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 20, label: 'Weak', color: 'var(--danger)' };
    if (score <= 2) return { level: 40, label: 'Fair', color: 'var(--warning)' };
    if (score <= 3) return { level: 60, label: 'Good', color: 'var(--primary)' };
    if (score <= 4) return { level: 80, label: 'Strong', color: 'var(--accent-cyan)' };
    return { level: 100, label: 'Excellent', color: 'var(--success)' };
  };

  const pwStrength = getPasswordStrength(pwForm.newPassword);

  // ── Tab Navigation ─────────────────────────────────────────────────────
  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'edit', label: 'Edit Profile', icon: Edit2 },
    { key: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <User size={16} /> Account Settings
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage your personal information, contact details, and security settings.
          </p>
        </div>

        {/* Role Switcher Demo */}
        <button
          onClick={() => switchRole(role === 'faculty' ? 'student' : 'faculty')}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <Users size={16} /> Switch to {role === 'faculty' ? 'Student' : 'Faculty'} View
        </button>
      </div>

      {/* ── Success Banner ────────────────────────────────────────────────── */}
      {editSuccess && (
        <div className="animate-fade-in" style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} /> Profile changes saved successfully to your university record.
        </div>
      )}

      {/* ── Profile Identity Card ─────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Large Avatar */}
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'var(--primary-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.2rem', fontWeight: 800, color: '#fff',
          boxShadow: 'var(--shadow-glow)', flexShrink: 0,
          border: '3px solid rgba(59, 130, 246, 0.3)'
        }}>
          {initials}
        </div>

        {/* Identity Details */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.3rem' }}>{displayName}</h2>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            <span className={`badge ${isStudent ? 'badge-primary' : 'badge-purple'}`}>
              {isStudent ? '🎓 Student' : '👨‍🏫 Faculty'}
            </span>
            <span className="badge badge-cyan">{displayDepartment}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Mail size={14} color="var(--text-muted)" /> {displayEmail}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Hash size={14} color="var(--text-muted)" /> {displayId}</span>
            {isStudent && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={14} color="var(--text-muted)" /> Semester {displaySemester}</span>
            )}
          </div>
        </div>

        {/* Quick logout */}
        <button onClick={handleLogout} className="btn btn-danger" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
          <Lock size={14} /> Sign Out
        </button>
      </div>

      {/* ── Tab Switcher ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.7rem 1.1rem',
              fontSize: '0.88rem',
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: `2px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              marginBottom: '-1px'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TAB: Overview — Read-only profile details
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Info Grid */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary)" /> Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

              {/* Name */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Full Name</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{displayName}</div>
              </div>

              {/* Email */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>University Email</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} color="var(--primary)" /> {displayEmail}
                </div>
              </div>

              {/* Role */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Role</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{isStudent ? 'Student' : 'Faculty'}</div>
              </div>

              {/* Department */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Department</div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} color="var(--accent-purple)" /> {displayDepartment}
                </div>
              </div>

              {/* Student-specific fields */}
              {isStudent && (
                <>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Student ID</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Hash size={14} color="var(--accent-cyan)" /> {displayId}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Current Semester</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CalendarDays size={14} color="var(--warning)" /> Semester {displaySemester}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Degree Program</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <BookOpen size={14} color="var(--success)" /> {student.degreeProgram}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Cumulative GPA (out of 10.0)</div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                      {student.cgpa} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 10.0</span>
                    </div>
                  </div>
                </>
              )}

              {/* Faculty-specific fields */}
              {!isStudent && (
                <>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Employee ID</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{faculty.id}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Designation</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{faculty.designation}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Office</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{faculty.cabinOffice}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Office Hours</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{faculty.officeHours}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Student: Advisor + Emergency Contact */}
          {isStudent && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={20} color="var(--primary)" /> Academic Advisor
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{student.advisor}</div>
                  <div>Department of Computer Science</div>
                  <div>Office: Turing Hall, Room 302</div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <a href="mailto:advisor@university.edu" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                      Send Email to Advisor &rarr;
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Shield size={20} color="var(--accent-purple)" /> Emergency Contact
                </h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <div>Contact: <strong style={{ color: 'var(--text-primary)' }}>{student.emergencyContact?.name || 'Not specified'}</strong></div>
                  <div>Relationship: <strong>{student.emergencyContact?.relationship || 'Not specified'}</strong></div>
                  <div>Phone: <strong style={{ color: 'var(--text-primary)' }}>{student.emergencyContact?.phone || 'Not specified'}</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: Edit Profile — Editable form
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'edit' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit2 size={18} color="var(--primary)" /> Edit Profile Information
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Update your contact details and personal information. Email and ID fields are managed by the Registrar and cannot be changed here.
          </p>

          <form onSubmit={handleEditSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>

              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  className="form-input"
                  value={editForm.firstName}
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  className="form-input"
                  value={editForm.lastName}
                  onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  className="form-input"
                  value={displayEmail}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  className="form-input"
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+1-555-0123"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  className="form-input"
                  value={displayDepartment}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              {isStudent && (
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <input
                    className="form-input"
                    value={`Semester ${displaySemester}`}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              )}
            </div>

            {/* Emergency Contact (students only) */}
            {isStudent && (
              <>
                <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Shield size={16} color="var(--accent-purple)" /> Emergency Contact
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    <div className="form-group">
                      <label className="form-label">Contact Name</label>
                      <input
                        className="form-input"
                        value={editForm.emergencyName}
                        onChange={e => setEditForm({ ...editForm, emergencyName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Relationship</label>
                      <input
                        className="form-input"
                        value={editForm.emergencyRelationship}
                        onChange={e => setEditForm({ ...editForm, emergencyRelationship: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        value={editForm.emergencyPhone}
                        onChange={e => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Teacher Office Information */}
            {!isStudent && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1.5rem 0', paddingTop: '1.5rem' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={16} color="var(--primary)" /> Office & Working Hours
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Cabin / Office Room</label>
                    <input
                      className="form-input"
                      value={editForm.cabinOffice}
                      onChange={e => setEditForm({ ...editForm, cabinOffice: e.target.value })}
                      placeholder="e.g. Turing Hall, Room 302"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Office Hours</label>
                    <input
                      className="form-input"
                      value={editForm.officeHours}
                      onChange={e => setEditForm({ ...editForm, officeHours: e.target.value })}
                      placeholder="e.g. Tue/Thu 2:00 PM - 4:00 PM"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setActiveTab('overview')} className="btn btn-ghost">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={editSaving}>
                {editSaving ? (
                  <><span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB: Security — Change Password
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Change Password Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="var(--accent-cyan)" /> Change Password
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your password is protected by 256-bit salted bcrypt encryption. Choose a strong, unique password.
            </p>

            {/* Password result banner */}
            {pwResult && (
              <div className="animate-fade-in" style={{
                padding: '0.85rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: pwResult.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${pwResult.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: pwResult.type === 'success' ? 'var(--success)' : 'var(--danger)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.88rem', marginBottom: '1.25rem'
              }}>
                {pwResult.type === 'success' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                {pwResult.message}
                <button
                  onClick={() => setPwResult(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: '440px' }}>

                {/* Current Password */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={pwShow.current ? 'text' : 'password'}
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      required
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPwShow({ ...pwShow, current: !pwShow.current })}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        display: 'flex', padding: '0.25rem'
                      }}
                      aria-label={pwShow.current ? 'Hide password' : 'Show password'}
                    >
                      {pwShow.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={pwShow.new ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      style={{ paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setPwShow({ ...pwShow, new: !pwShow.new })}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        display: 'flex', padding: '0.25rem'
                      }}
                      aria-label={pwShow.new ? 'Hide password' : 'Show password'}
                    >
                      {pwShow.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {pwForm.newPassword && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div className="progress-track" style={{ height: 5 }}>
                        <div className="progress-fill" style={{ width: `${pwStrength.level}%`, background: pwStrength.color, transition: 'width 0.3s ease, background 0.3s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Min 8 characters</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={pwShow.confirm ? 'text' : 'password'}
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      required
                      style={{
                        paddingRight: '2.75rem',
                        borderColor: pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword ? 'var(--danger)' : undefined
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPwShow({ ...pwShow, confirm: !pwShow.confirm })}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        display: 'flex', padding: '0.25rem'
                      }}
                      aria-label={pwShow.confirm ? 'Hide password' : 'Show password'}
                    >
                      {pwShow.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertCircle size={13} /> Passwords do not match
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={pwSaving || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}>
                  {pwSaving ? (
                    <><span className="animate-spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Updating...</>
                  ) : (
                    <><Lock size={16} /> Update Password</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Account Info */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Shield size={18} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Account Security</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your account is protected with <strong>JWT-based authentication</strong> and <strong>bcrypt password hashing</strong>.
                Sessions expire after 24 hours of inactivity. For security concerns, contact the IT helpdesk at <strong>it-support@university.edu</strong>.
              </p>
            </div>
          </div>

          {/* Logout section */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Sign Out of All Devices</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>This will invalidate all active sessions and require re-login.</div>
            </div>
            <button className="btn btn-danger" onClick={handleLogout} style={{ fontSize: '0.85rem' }}>
              <Lock size={14} /> Sign Out Everywhere
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
