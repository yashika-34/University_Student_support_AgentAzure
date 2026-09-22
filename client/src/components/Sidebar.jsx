import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  CalendarCheck,
  FileText,
  Sparkles,
  MessageSquare,
  User,
  Users,
  UserCog,
  GraduationCap,
  TrendingUp,
  ClipboardList,
  Upload,
  Mic,
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Briefcase,
  Globe,
  Handshake,
  Award,
  Compass
} from 'lucide-react';

// ── Navigation configs per role ─────────────────────────────────────────────
const STUDENT_NAV = [
  { section: 'Overview', items: [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'My Profile' }
  ]},
  { section: 'Academics', items: [
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/marks', icon: Award, label: 'Marks & Grades' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/exam-schedule', icon: ClipboardList, label: 'Exam Schedule' },
    { to: '/documents', icon: BookOpen, label: 'University Documents' }
  ]},
  { section: 'AI Tools', items: [
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/career-counselor', icon: Compass, label: 'Career Counselor' },
    { to: '/academic-tools', icon: Sparkles, label: 'Study Tools' }
  ]},
  { section: 'Campus', items: [
    { to: '/career-hub', icon: Briefcase, label: 'Career Hub' },
    { to: '/campus-services', icon: Globe, label: 'Campus Services' },
    { to: '/community', icon: Handshake, label: 'Community' },
    { to: '/faqs', icon: HelpCircle, label: 'FAQs' }
  ]}
];

const FACULTY_NAV = [
  { section: 'Overview', items: [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'My Profile' }
  ]},
  { section: 'Teaching', items: [
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/assignments', icon: FileText, label: 'Assignments' },
    { to: '/marks', icon: Award, label: 'Marks & Grades' }
  ]},
  { section: 'Management', items: [
    { to: '/teacher/students-manage', icon: UserCog, label: 'Student Management' },
    { to: '/teacher/students', icon: Users, label: 'Student Progress' }
  ]},
  { section: 'Analytics', items: [
    { to: '/teacher/analytics', icon: BarChart3, label: 'Course Analytics' },
    { to: '/teacher/report', icon: TrendingUp, label: 'Class Reports' }
  ]},
  { section: 'AI Tools', items: [
    { to: '/teacher/question-paper', icon: Sparkles, label: 'Question Paper AI' },
    { to: '/chat', icon: MessageSquare, label: 'AI Assistant' },
    { to: '/documents', icon: Upload, label: 'Knowledge & Documents' }
  ]},
  { section: 'Campus', items: [
    { to: '/faqs', icon: HelpCircle, label: 'FAQs' }
  ]}
];

// ── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';
  const navItems = isTeacherOrFaculty ? FACULTY_NAV : STUDENT_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${(user.firstName || user.fullName?.split(' ')[0] || 'U')[0]}${(user.lastName || user.fullName?.split(' ')[1] || '')[0] || ''}`.toUpperCase()
    : 'U';

  const sidebarClasses = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : ''
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={sidebarClasses} aria-label="Sidebar navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <GraduationCap size={20} color="white" />
          </div>
          <span className="sidebar-logo-text">UniAssist AI</span>

          {/* Collapse toggle (desktop) */}
          <button
            className="icon-btn"
            style={{ marginLeft: 'auto', width: 28, height: 28, flexShrink: 0 }}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div style={{ padding: '0.5rem 1.25rem 0' }}>
            <span className={`badge ${isTeacherOrFaculty ? 'badge-purple' : 'badge-primary'}`}>
              {role === 'faculty' ? '👨‍🏫 Faculty' : role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
            </span>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => setMobileOpen(false)}
                  aria-label={item.label}
                >
                  <span className="sidebar-link-icon">
                    <item.icon size={18} />
                  </span>
                  <span className="sidebar-link-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName || `${user?.firstName} ${user?.lastName}`}</div>
            <div className="sidebar-user-role">{user?.email}</div>
          </div>
          <button
            className="icon-btn"
            onClick={handleLogout}
            style={{ marginLeft: 'auto', flexShrink: 0, width: 32, height: 32 }}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
