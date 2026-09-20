import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  GraduationCap,
  BarChart2,
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
  Users
} from 'lucide-react';

const Navbar = () => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'var(--primary-gradient)',
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}>
            <GraduationCap size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              UniAssist <span style={{ color: 'var(--primary)', fontSize: '0.9rem', background: 'rgba(59, 130, 246, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>University Student Support</div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'none', gap: '0.5rem', alignItems: 'center' }} className="desktop-nav">
          <Link
            to="/"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive('/') ? 'var(--primary)' : 'var(--text-secondary)',
              background: isActive('/') ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            Home
          </Link>

          {user && (
            <>
              <Link
                to={role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/student/dashboard') || isActive('/faculty/dashboard') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/student/dashboard') || isActive('/faculty/dashboard') ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <BarChart2 size={16} /> Dashboard
              </Link>

              <Link
                to="/attendance"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/attendance') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/attendance') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Attendance
              </Link>

              <Link
                to="/assignments"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/assignments') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/assignments') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Assignments
              </Link>

              <Link
                to="/academic-tools"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/academic-tools') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/academic-tools') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Academic Tools
              </Link>

              <Link
                to="/career-hub"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/career-hub') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/career-hub') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Career Hub
              </Link>

              <Link
                to="/campus-services"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/campus-services') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/campus-services') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Campus Services
              </Link>

              <Link
                to="/community"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/community') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/community') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Community
              </Link>

              <Link
                to="/analytics"
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/analytics') ? 'var(--primary)' : 'var(--text-secondary)',
                  background: isActive('/analytics') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                Analytics
              </Link>

              <Link
                to="/chat"
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
              >
                <Sparkles size={15} /> AI Assistant
              </Link>
            </>
          )}
        </nav>

        {/* Action Controls & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {user ? (
            <>
              {/* Role Toggle Switcher for instant demo */}
              <button
                onClick={() => switchRole(role === 'faculty' ? 'student' : 'faculty')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.75rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
                title="Toggle between Student and Faculty view"
              >
                <Users size={13} />
                Mode: <strong style={{ color: 'var(--primary)' }}>{role.toUpperCase()}</strong>
              </button>

              {/* Notification Button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    position: 'relative',
                    padding: '0.4rem'
                  }}
                >
                  <Bell size={20} />
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--danger)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%'
                    }}
                  />
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div
                    className="glass-panel animate-fade-in"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '120%',
                      width: '300px',
                      padding: '1rem',
                      zIndex: 200,
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notifications</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', cursor: 'pointer' }}>Mark all read</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                        <div style={{ fontWeight: 600 }}>Problem Set 1 Due Soon</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CS-301 assignment deadline in 3 days.</div>
                      </div>
                      <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--danger)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>Attendance Warning</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>CS-305 attendance is at 72.2% (&lt;75%).</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {user.fullName ? user.fullName[0] : 'U'}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }} className="desktop-name">
                  {user.fullName ? user.fullName.split(' ')[0] : 'Account'}
                </span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem' }}>
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none'
            }}
            className="mobile-hamburger"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          {user && (
            <>
              <Link to={role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/attendance" onClick={() => setMobileMenuOpen(false)}>Attendance</Link>
              <Link to="/assignments" onClick={() => setMobileMenuOpen(false)}>Assignments</Link>
              <Link to="/faqs" onClick={() => setMobileMenuOpen(false)}>FAQs</Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>AI Assistant</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 859px) {
          .mobile-hamburger { display: block !important; }
          .desktop-name { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
