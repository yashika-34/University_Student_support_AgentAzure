import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { mockData } from '../services/api.js';
import {
  Menu, Sun, Moon, Bell, LogOut, User, Settings, Lock, ChevronDown,
  GraduationCap, Briefcase
} from 'lucide-react';

/**
 * ProfileDropdown — Glassmorphic dropdown with user info, quick links, and logout.
 * Renders inline in the topbar; closes on outside-click or Escape.
 */
const ProfileDropdown = ({ onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const student = mockData.student;
  const faculty = mockData.faculty;
  const isStudent = role === 'student';

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || (isStudent ? student.name : faculty.name);
  const displayEmail = user?.email || (isStudent ? student.email : faculty.email);
  const displayId = user?.id || (isStudent ? student.id : faculty.id);
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    onClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      {/* Invisible backdrop to close on outside click */}
      <div className="profile-dropdown-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="profile-dropdown" role="menu" aria-label="Profile menu">
        {/* Header — avatar + identity */}
        <div className="profile-dropdown-header">
          <div className="profile-dropdown-header-avatar" aria-hidden="true">
            {initials}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="profile-dropdown-name">{displayName}</div>
            <div className="profile-dropdown-email">{displayEmail}</div>
            <div className="profile-dropdown-role">
              <span className={`badge ${isStudent ? 'badge-primary' : 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>
                {isStudent ? '🎓 Student' : '👨‍🏫 Faculty'} · {displayId}
              </span>
            </div>
          </div>
        </div>

        {/* Body — action items */}
        <div className="profile-dropdown-body">
          <button className="profile-dropdown-item" role="menuitem" onClick={() => handleNavigate('/profile')}>
            <span className="profile-dropdown-item-icon"><User size={16} /></span>
            My Profile
          </button>

          <button className="profile-dropdown-item" role="menuitem" onClick={() => handleNavigate('/profile#edit')}>
            <span className="profile-dropdown-item-icon"><Settings size={16} /></span>
            Edit Profile
          </button>

          <button className="profile-dropdown-item" role="menuitem" onClick={() => handleNavigate('/profile#security')}>
            <span className="profile-dropdown-item-icon"><Lock size={16} /></span>
            Change Password
          </button>

          <div className="profile-dropdown-separator" />

          <button className="profile-dropdown-item" role="menuitem" onClick={() => handleNavigate(isStudent ? '/student/dashboard' : '/faculty/dashboard')}>
            <span className="profile-dropdown-item-icon">{isStudent ? <GraduationCap size={16} /> : <Briefcase size={16} />}</span>
            {isStudent ? 'Student Dashboard' : 'Faculty Dashboard'}
          </button>

          <div className="profile-dropdown-separator" />

          <button className="profile-dropdown-item danger" role="menuitem" onClick={handleLogout}>
            <span className="profile-dropdown-item-icon"><LogOut size={16} /></span>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Navbar / Topbar — Adapts between public header and dashboard topbar.
 * Now includes a clickable profile avatar with dropdown on both layouts.
 */
const Navbar = ({ showSidebar = false, onMenuClick, sidebarCollapsed }) => {
  const { user, role, logout, toggleTheme, theme, isAuthenticated, switchRole } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    if (dropdownOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compute initials
  const getInitials = () => {
    if (!user) return 'U';
    const first = (user.firstName || user.fullName?.split(' ')[0] || 'U')[0];
    const last = (user.lastName || user.fullName?.split(' ')[1] || '')[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  // ── Public (no sidebar) top navigation ─────────────────────────────────
  if (!showSidebar) {
    return (
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        height: 'var(--topbar-height)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 90
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>U</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem',
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>
            UniAssist AI
          </span>
        </Link>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {isAuthenticated ? (
            <>
              <Link to={role === 'faculty' ? '/faculty/dashboard' : '/student/dashboard'} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Dashboard
              </Link>

              {/* Profile Avatar with Dropdown */}
              <div className="profile-dropdown-wrapper" ref={dropdownRef}>
                <button
                  className="profile-avatar-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="Open profile menu"
                  title={user?.fullName || 'Profile'}
                >
                  {getInitials()}
                  <span className="avatar-status-dot" />
                </button>

                {dropdownOpen && (
                  <ProfileDropdown onClose={() => setDropdownOpen(false)} />
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Get Started</Link>
            </>
          )}
        </div>
      </header>
    );
  }

  // ── Dashboard topbar (sidebar is shown) ────────────────────────────────
  return (
    <header className="topbar">
      {/* Left: Mobile menu button */}
      <div className="topbar-left">
        <button className="icon-btn" onClick={onMenuClick} aria-label="Toggle sidebar" title="Menu">
          <Menu size={18} />
        </button>
      </div>

      {/* Right: Theme, notifications, profile avatar */}
      <div className="topbar-right">
        {/* Demo role switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demo:</span>
          <button
            className={`btn ${role === 'student' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            onClick={() => { switchRole('student'); navigate('/student/dashboard'); }}
          >
            Student
          </button>
          <button
            className={`btn ${role === 'faculty' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            onClick={() => { switchRole('faculty'); navigate('/faculty/dashboard'); }}
          >
            Faculty
          </button>
        </div>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <button className="icon-btn" title="Notifications" aria-label="Notifications" style={{ position: 'relative' }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--danger)', border: '1.5px solid var(--bg-sidebar)'
          }} />
        </button>

        {/* Profile Avatar with Dropdown */}
        <div className="profile-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="profile-avatar-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="Open profile menu"
            title={user?.fullName || 'Profile'}
          >
            {getInitials()}
            <span className="avatar-status-dot" />
          </button>

          {dropdownOpen && (
            <ProfileDropdown onClose={() => setDropdownOpen(false)} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
