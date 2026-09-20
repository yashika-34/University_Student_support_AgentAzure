import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  GraduationCap,
  Shield,
  Save,
  Check,
  Edit2,
  Lock,
  Users
} from 'lucide-react';

const ProfilePage = () => {
  const { user, role, switchRole } = useAuth();
  const student = mockData.student;
  const faculty = mockData.faculty;

  const isStudent = role === 'student';

  const [phone, setPhone] = useState(isStudent ? '+1-555-0123' : '+1-555-0144');
  const [emergency] = useState(student.emergencyContact);
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            User Account &amp; Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your personal identity, contact details, emergency contacts, and security preferences.
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

      {savedSuccess && (
        <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={18} /> Profile changes saved successfully to your university record.
        </div>
      )}

      {/* Main Profile Card */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            boxShadow: 'var(--shadow-glow)'
          }}>
            {user && user.fullName ? user.fullName[0] : (isStudent ? 'A' : 'D')}
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              {user && user.fullName ? user.fullName : (isStudent ? student.name : faculty.name)}
            </h2>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.35rem' }}>
              <span className="badge badge-primary">{role.toUpperCase()}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ID: <strong>{isStudent ? student.id : faculty.id}</strong>
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            
            <div className="form-group">
              <label className="form-label">University Email</label>
              <input
                type="email"
                disabled
                className="form-input"
                value={user && user.email ? user.email : (isStudent ? student.email : faculty.email)}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                disabled={!isEditing}
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                disabled
                className="form-input"
                value={isStudent ? student.department : faculty.department}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            {isStudent ? (
              <div className="form-group">
                <label className="form-label">Degree Program</label>
                <input
                  type="text"
                  disabled
                  className="form-input"
                  value={student.degreeProgram}
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Office Location</label>
                <input
                  type="text"
                  disabled
                  className="form-input"
                  value={faculty.cabinOffice}
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            )}

          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
            {isEditing ? (
              <>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Save Changes
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditing(true)} className="btn btn-secondary">
                <Edit2 size={16} /> Edit Phone &amp; Contact
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Role-Specific Secondary Cards */}
      {isStudent && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Academic Mentor / Advisor Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={20} color="var(--primary)" /> Academic Advisor
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{student.advisor}</div>
              <div>Department of Computer Science</div>
              <div>Office: Turing Hall, Room 302</div>
              <div style={{ marginTop: '0.75rem' }}>
                <a href={`mailto:advisor@university.edu`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                  Send Email to Advisor &rarr;
                </a>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="var(--accent-purple)" /> Emergency Contact
            </h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <div>Contact Name: <strong style={{ color: 'var(--text-primary)' }}>{emergency.name}</strong></div>
              <div>Relationship: <strong>{emergency.relationship}</strong></div>
              <div>Emergency Phone: <strong style={{ color: 'var(--text-primary)' }}>{emergency.phone}</strong></div>
            </div>
          </div>

        </div>
      )}

      {/* Security & Password Settings */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={18} color="var(--accent-cyan)" /> Security &amp; Credentials
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Password protected by 256-bit salted bcrypt encryption and multi-factor authentication.
        </p>
        <button
          type="button"
          onClick={() => alert('Password reset link sent to your verified university email.')}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          Request Password Reset
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;
