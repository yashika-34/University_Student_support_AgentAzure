import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

// Public Pages (Lazy Loaded)
const Home = lazy(() => import('./pages/Home.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const FaqPage = lazy(() => import('./pages/FaqPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));

// Student Pages (Lazy Loaded)
const StudentDashboard = lazy(() => import('./pages/StudentDashboard.jsx'));
const AcademicToolsPage = lazy(() => import('./pages/AcademicToolsPage.jsx'));
const CareerHubPage = lazy(() => import('./pages/CareerHubPage.jsx'));
const CampusServicesPage = lazy(() => import('./pages/CampusServicesPage.jsx'));
const CommunityHubPage = lazy(() => import('./pages/CommunityHubPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const ExamSchedulePage = lazy(() => import('./pages/ExamSchedulePage.jsx'));

// Faculty Pages (Lazy Loaded)
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard.jsx'));
const TeacherAnalyticsPage = lazy(() => import('./pages/teacher/TeacherAnalyticsPage.jsx'));
const AIPaperGenerator = lazy(() => import('./pages/AIPaperGenerator.jsx'));
const StudentProgressPage = lazy(() => import('./pages/teacher/StudentProgressPage.jsx'));
const StudentManagementPage = lazy(() => import('./pages/teacher/StudentManagementPage.jsx'));
const DigitalTwinPage = lazy(() => import('./pages/teacher/DigitalTwinPage.jsx'));
const AIAutoGraderPage = lazy(() => import('./pages/teacher/AIAutoGraderPage.jsx'));
const RiskEarlyWarningPage = lazy(() => import('./pages/teacher/RiskEarlyWarningPage.jsx'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

// Shared Protected Pages (Lazy Loaded)
const AttendancePage = lazy(() => import('./pages/AttendancePage.jsx'));
const AssignmentPage = lazy(() => import('./pages/AssignmentPage.jsx'));
const MarksPage = lazy(() => import('./pages/MarksPage.jsx'));
const AiChatbotPage = lazy(() => import('./pages/AiChatbotPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const RagUploadPage = lazy(() => import('./pages/RagUploadPage.jsx'));
const DigitalTwinChatPage = lazy(() => import('./pages/DigitalTwinChatPage.jsx'));

// Elegant loading placeholder for Suspense
const PageLoader = () => (
  <div
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: 'var(--text-secondary, #94a3b8)'
    }}
    aria-label="Loading page content"
    role="status"
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border-color, rgba(255, 255, 255, 0.1))',
        borderTopColor: 'var(--primary-color, #4f46e5)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}
    />
    <span style={{ fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.02em' }}>
      Loading UniAssist AI...
    </span>
  </div>
);

// PUBLIC PATHS that should NOT show sidebar
const PUBLIC_PATHS = ['/', '/login', '/register', '/faqs', '/forgot-password', '/reset-password'];

// Inner layout component
function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isPublicPage = PUBLIC_PATHS.includes(location.pathname) || location.pathname.startsWith('/reset-password');
  const showSidebar = isAuthenticated && !isPublicPage;

  return (
    <div className={`app-shell ${showSidebar ? '' : 'no-sidebar'}`}>
      {showSidebar && (
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
      )}

      <div
        className={`main-wrapper${showSidebar && sidebarCollapsed ? ' collapsed' : ''}${!showSidebar ? ' full-width' : ''}`}
        style={!showSidebar ? { marginLeft: 0 } : undefined}
      >
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Navbar
          showSidebar={showSidebar}
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main id="main-content" className="main-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public Routes ──────────────────────────────────────────── */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ForgotPasswordPage />} />
              <Route path="/faqs" element={<FaqPage />} />

              {/* ── Student Protected Routes ────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/academic-tools" element={<AcademicToolsPage />} />
                <Route path="/career-hub" element={<CareerHubPage />} />
                <Route path="/career-counselor" element={<CareerHubPage defaultTab="counselor" />} />
                <Route path="/campus-services" element={<CampusServicesPage />} />
                <Route path="/community" element={<CommunityHubPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/exam-schedule" element={<ExamSchedulePage />} />
              </Route>

              {/* ── Faculty Protected Routes ────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['faculty', 'teacher', 'admin', 'super_admin']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
                <Route path="/teacher/question-paper" element={<AIPaperGenerator />} />
                <Route path="/teacher/students" element={<StudentProgressPage />} />
                <Route path="/teacher/students-manage" element={<StudentManagementPage />} />
                <Route path="/teacher/report" element={<Navigate to="/teacher/analytics" replace />} />
                <Route path="/teacher/digital-twin" element={<DigitalTwinPage />} />
                <Route path="/teacher/auto-grader" element={<AIAutoGraderPage />} />
                <Route path="/teacher/risk-warning" element={<RiskEarlyWarningPage />} />
              </Route>

              {/* ── Admin Protected Routes ───────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
              </Route>

              {/* ── Shared Protected Routes ─────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'teacher', 'admin', 'super_admin']} />}>
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/assignments" element={<AssignmentPage />} />
                <Route path="/marks" element={<MarksPage />} />
                <Route path="/chat" element={<AiChatbotPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/documents" element={<RagUploadPage />} />
                <Route path="/rag-upload" element={<Navigate to="/documents" replace />} />
                <Route path="/digital-twin" element={<DigitalTwinChatPage />} />
                <Route path="/digital-twin/chat/:twinId" element={<DigitalTwinChatPage />} />
              </Route>

              {/* ── Role redirect ───────────────────────────────────────────── */}
              <Route
                path="/dashboard"
                element={<RoleRedirect />}
              />

              {/* ── Catch-all ───────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Redirect to appropriate dashboard based on role
function RoleRedirect() {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin' || role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';
  return <Navigate to={isTeacherOrFaculty ? '/faculty/dashboard' : '/student/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
