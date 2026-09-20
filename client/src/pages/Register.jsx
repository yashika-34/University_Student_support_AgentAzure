import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, ArrowRight } from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Computer Science',
    degreeProgram: 'B.S. in Computer Science',
    currentSemester: 1,
    studentId: '',
    employeeId: '',
    designation: 'Assistant Professor'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ ...formData, role });
      navigate(role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '2.5rem 2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <GraduationCap size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Join the UniAssist AI Support Network</p>
        </div>

        {/* Role Segmented Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-input)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => setRole('student')}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: role === 'student' ? 'var(--primary)' : 'transparent',
              color: role === 'student' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => setRole('faculty')}
            style={{
              padding: '0.6rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              background: role === 'faculty' ? 'var(--primary)' : 'transparent',
              color: role === 'faculty' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Faculty Account
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                required
                name="firstName"
                className="form-input"
                placeholder="Alex"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                required
                name="lastName"
                className="form-input"
                placeholder="Mercer"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">University Email</label>
            <input
              type="email"
              required
              name="email"
              className="form-input"
              placeholder="alex.student@university.edu"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              name="password"
              className="form-input"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {/* Dynamic Role Fields */}
          {role === 'student' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Student Roll No</label>
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
                <div className="form-group">
                  <label className="form-label">Semester</label>
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

              <div className="form-group">
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
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
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
              <div className="form-group">
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
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Complete Registration'} <ArrowRight size={16} />
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
