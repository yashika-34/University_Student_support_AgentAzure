import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading UniAssist Portal...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';

  const isAuthorized =
    allowedRoles.length === 0 ||
    allowedRoles.includes(role) ||
    (allowedRoles.includes('faculty') && role === 'teacher') ||
    (allowedRoles.includes('teacher') && role === 'faculty') ||
    role === 'admin' ||
    role === 'super_admin';

  if (!isAuthorized) {
    // Redirect to respective dashboard if unauthorized for this specific view
    return <Navigate to={isTeacherOrFaculty ? '/faculty/dashboard' : '/student/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
