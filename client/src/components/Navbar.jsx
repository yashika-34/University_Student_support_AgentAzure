import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { noticeAPI } from '../services/api.js';

import {
  Menu, Sun, Moon, Bell, LogOut, User, Settings, Lock,
  GraduationCap, Briefcase, CheckCheck, AlertCircle, BookOpen,
  Calendar, CreditCard, Megaphone, Ticket, X, RefreshCw
} from 'lucide-react';

// ── Icon map for notification types ─────────────────────────────────────────
const TYPE_ICON = {
  attendance_alert: <AlertCircle size={15} />,
  exam_reminder: <Calendar size={15} />,
  assignment_deadline: <BookOpen size={15} />,
  fee_due: <CreditCard size={15} />,
  system_announcement: <Megaphone size={15} />,
  ticket_update: <Ticket size={15} />
};

const PRIORITY_COLOR = {
  critical: 'var(--danger)',
  high: '#f97316',
  medium: 'var(--primary)',
  low: 'var(--text-muted)'
};

// ── Relative time helper ─────────────────────────────────────────────────────
const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ── NotificationPanel ────────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await noticeAPI.getMyNotifications();
      setNotifications(res.data?.data || []);
    } catch (err) {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkOne = async (id) => {
    try {
      await noticeAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await noticeAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_) {}
    setMarkingAll(false);
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="profile-dropdown-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="notif-panel" role="dialog" aria-label="Notifications">
        {/* Header */}
        <div className="notif-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={16} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
            {unread > 0 && (
              <span className="notif-badge-pill">{unread}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              className="notif-header-btn"
              onClick={fetchNotifications}
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
            {unread > 0 && (
              <button
                className="notif-header-btn"
                onClick={handleMarkAll}
                title="Mark all as read"
                disabled={markingAll}
              >
                <CheckCheck size={13} />
              </button>
            )}
            <button className="notif-header-btn" onClick={onClose} title="Close">
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="notif-panel-body">
          {loading ? (
            <div className="notif-empty">
              <div className="notif-spinner" />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <div className="notif-empty">
              <AlertCircle size={28} color="var(--danger)" />
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={32} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                You're all caught up! 🎉
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`notif-item${n.isRead ? '' : ' unread'}`}
                onClick={() => !n.isRead && handleMarkOne(n._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && !n.isRead && handleMarkOne(n._id)}
              >
                <div
                  className="notif-icon"
                  style={{ color: PRIORITY_COLOR[n.priority] || 'var(--primary)' }}
                >
                  {TYPE_ICON[n.type] || <Bell size={15} />}
                </div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{relativeTime(n.createdAt)}</div>
                </div>
                {!n.isRead && <div className="notif-unread-dot" />}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notif-panel-footer">
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * ProfileDropdown — Glassmorphic dropdown with user info, quick links, and logout.
 * Renders inline in the topbar; closes on outside-click or Escape.
 */
const ProfileDropdown = ({ onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const isStudent = role === 'student';
  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';
  const roleLabel = role === 'faculty' ? '👨‍🏫 Faculty' : role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student';

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || (!isTeacherOrFaculty ? 'Alex Mercer' : 'Dr. Alan Turing');
  const displayEmail = user?.email || (!isTeacherOrFaculty ? 'alex.student@university.edu' : 'dr.alan@university.edu');
  const displayId = user?.profile?.studentId || user?.profile?.employeeId || user?.id || (!isTeacherOrFaculty ? 'STU-2024-8842' : 'FAC-CS-101');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

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
              <span className={`badge ${!isTeacherOrFaculty ? 'badge-primary' : 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>
                {roleLabel} · {displayId}
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

          <button className="profile-dropdown-item" role="menuitem" onClick={() => handleNavigate(isTeacherOrFaculty ? '/faculty/dashboard' : '/student/dashboard')}>
            <span className="profile-dropdown-item-icon">{isTeacherOrFaculty ? <Briefcase size={16} /> : <GraduationCap size={16} />}</span>
            {isTeacherOrFaculty ? 'Teacher Dashboard' : 'Student Dashboard'}
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
  const { user, role, logout, toggleTheme, theme, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch unread count once on mount (for badge)
  useEffect(() => {
    if (!isAuthenticated) return;
    noticeAPI.getMyNotifications({ unreadOnly: 'true' })
      .then((res) => setUnreadCount(res.data?.unreadCount || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    if (dropdownOpen || notifOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [dropdownOpen, notifOpen]);

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
              <Link to={role === 'faculty' || role === 'teacher' ? '/faculty/dashboard' : '/student/dashboard'} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
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

        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications */}
        <div className="profile-dropdown-wrapper" ref={notifRef}>
          <button
            className="icon-btn"
            title="Notifications"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            style={{ position: 'relative' }}
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="notif-bell-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel onClose={() => { setNotifOpen(false); setUnreadCount(0); }} />
          )}
        </div>

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
