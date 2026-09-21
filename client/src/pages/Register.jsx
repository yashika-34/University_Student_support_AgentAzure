import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, ArrowRight, ShieldAlert, Briefcase, Phone, Mail, Lock, User, Building, BookOpen, Hash, DoorOpen } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    // Student-specific fields
    studentId: '',
    department: 'Computer Science',
    degreeProgram: 'B.S. in Computer Science',
    currentSemester: 1,
    admissionYear: new Date().getFullYear(),
    batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
    // Teacher-specific fields
    employeeId: '',
    designation: 'Assistant Professor',
    cabinOffice: 'Turing Hall, Room 302',
    specialization: 'Artificial Intelligence'
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        role: role === 'teacher' ? 'teacher' : 'student'
      };

      if (role === 'teacher' && typeof payload.specialization === 'string') {
        payload.specialization = payload.specialization.split(',').map(s => s.trim()).filter(Boolean);
      }

      const res = await register(payload);
      if (res && res.success) {
        if (role === 'teacher' || role === 'faculty') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setError(res?.message || 'Registration failed. Please check the provided information.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '2.5rem 2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            {role === 'teacher' ? (
              <Briefcase size={28} color="#ffffff" />
            ) : (
              <GraduationCap size={28} color="#ffffff" />
            )}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {role === 'teacher' ? 'Teacher Registration' : 'Student Registration'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Create your university account on the UniAssist AI Support Network
          </p>
        </div>

        {/* Role Segmented Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setRole('student'); setError(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: role === 'student' ? 'var(--primary)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              boxShadow: role === 'student' ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
            }}
          >
            <GraduationCap size={18} /> Student Account
          </button>
          <button
            type="button"
            onClick={() => { setRole('teacher'); setError(''); }}
            style={{
              padding: '0.65rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: role === 'teacher' ? 'var(--accent-purple)' : 'transparent',
              color: role === 'teacher' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              boxShadow: role === 'teacher' ? '0 2px 8px rgba(147, 51, 234, 0.3)' : 'none'
            }}
          >
            <Briefcase size={18} /> Teacher Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem'
          }}>
            <ShieldAlert size={16} /> {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* First & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">First Name</label>
              <input
                type="text"
                required
                name="firstName"
                className="form-input"
                placeholder={role === 'teacher' ? 'Alan' : 'Alex'}
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                required
                name="lastName"
                className="form-input"
                placeholder={role === 'teacher' ? 'Turing' : 'Mercer'}
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">University Email</label>
              <input
                type="email"
                required
                name="email"
                className="form-input"
                placeholder={role === 'teacher' ? 'dr.alan@university.edu' : 'alex.student@university.edu'}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                className="form-input"
                placeholder="+1-555-0199"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              name="password"
              className="form-input"
              placeholder="Create a secure password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* ── Student-Specific Fields ─────────────────────────────────── */}
          {role === 'student' && (
            <>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Student Academic Information
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Student Roll / ID</label>
                  <input
                    type="text"
                    required
                    name="studentId"
                    className="form-input"
                    placeholder="STU-2024-001"
                    value={formData.studentId}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    name="currentSemester"
                    className="form-input"
                    value={formData.currentSemester}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Degree Program</label>
                  <input
                    type="text"
                    name="degreeProgram"
                    className="form-input"
                    placeholder="B.S. in Computer Science"
                    value={formData.degreeProgram}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Admission Year</label>
                  <input
                    type="number"
                    name="admissionYear"
                    className="form-input"
                    value={formData.admissionYear}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Batch Cohort</label>
                  <input
                    type="text"
                    name="batch"
                    className="form-input"
                    placeholder="2024-2028"
                    value={formData.batch}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Teacher-Specific Fields ─────────────────────────────────── */}
          {role === 'teacher' && (
            <>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Teacher Faculty Information
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    required
                    name="employeeId"
                    className="form-input"
                    placeholder="FAC-CS-101"
                    value={formData.employeeId}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Designation</label>
                  <select
                    name="designation"
                    className="form-select"
                    value={formData.designation}
                    onChange={handleChange}
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                    <option value="Dean / HOD">Dean / HOD</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Department</label>
                  <select
                    name="department"
                    className="form-select"
                    value={formData.department}
                    onChange={handleChange}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cabin / Office Room</label>
                  <input
                    type="text"
                    required
                    name="cabinOffice"
                    className="form-input"
                    placeholder="Turing Hall, Room 302"
                    value={formData.cabinOffice}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Specialization / Domain</label>
                <input
                  type="text"
                  name="specialization"
                  className="form-input"
                  placeholder="e.g. Artificial Intelligence, Data Structures"
                  value={formData.specialization}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '0.95rem',
              marginTop: '0.5rem',
              background: role === 'teacher' ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' : undefined
            }}
            disabled={isLoading}
          >
            {isLoading
              ? 'Creating Account in MongoDB...'
              : role === 'teacher'
              ? 'Complete Teacher Registration'
              : 'Complete Student Registration'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
