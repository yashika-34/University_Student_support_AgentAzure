import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.success) {
        if (res.user?.role === 'faculty') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setError(res?.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('Login error: ' + (err.message || 'Unable to connect to server'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsLoading(true);
    try {
      const res = await login(demoEmail, demoPass);
      if (res && res.success) {
        if (res.user?.role === 'faculty') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      } else {
        setError(res?.message || 'Login failed.');
      }
    } catch (err) {
      setError('Login error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem 1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <GraduationCap size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sign in to your UniAssist Student or Faculty Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">University Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Accounts Preset Buttons */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} color="var(--primary)" /> Quick One-Click Demo Sign In (MongoDB):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('dr.alan@university.edu', 'Faculty@1234')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'center' }}
              disabled={isLoading}
            >
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>👨‍🏫 Faculty Role</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dr. Alan Turing</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.student@university.edu', 'Student@1234')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem', alignItems: 'center' }}
              disabled={isLoading}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>🎓 Student Role</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alex Mercer (3.82 CGPA)</span>
            </button>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('emma.student@university.edu', 'Student@1234')}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem', textAlign: 'center' }}
              disabled={isLoading}
            >
              🎓 Student: Emma Watson (3.56 CGPA)
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Need an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create an account</Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
