import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import FaqPage from './pages/FaqPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

// Shared Protected Pages
import StudentDashboard from './pages/StudentDashboard.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import AssignmentPage from './pages/AssignmentPage.jsx';
import AiChatbotPage from './pages/AiChatbotPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import MarksPage from './pages/MarksPage.jsx';
import ExamSchedulePage from './pages/ExamSchedulePage.jsx';
import AcademicToolsPage from './pages/AcademicToolsPage.jsx';
import CareerHubPage from './pages/CareerHubPage.jsx';
import CampusServicesPage from './pages/CampusServicesPage.jsx';
import CommunityHubPage from './pages/CommunityHubPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import RagUploadPage from './pages/RagUploadPage.jsx';

// Faculty-Only Pages
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import TeacherAnalyticsPage from './pages/teacher/TeacherAnalyticsPage.jsx';
import QuestionPaperPage from './pages/teacher/QuestionPaperPage.jsx';
import StudentProgressPage from './pages/teacher/StudentProgressPage.jsx';

import StudentManagementPage from "./pages/teacher/StudentManagementPage";

// PUBLIC PATHS that should NOT show sidebar
const PUBLIC_PATHS = ['/', '/login', '/register', '/faqs', '/forgot-password', '/reset-password'];

// Inner layout component (needs access to router context)
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
        {/* Top bar only shown on public/non-sidebar pages OR always for mobile menu */}
        <Navbar
          showSidebar={showSidebar}
          onMenuClick={() => setMobileOpen(!mobileOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <main className="main-content">
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
            <Route element={<ProtectedRoute allowedRoles={['faculty', 'teacher']} />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
              <Route path="/teacher/question-paper" element={<QuestionPaperPage />} />
              <Route path="/teacher/students" element={<StudentProgressPage />} />
              <Route path="/teacher/students-manage" element={<StudentManagementPage />} />
              <Route path="/teacher/report" element={<TeacherAnalyticsPage />} />
            </Route>

            {/* ── Shared Protected Routes (student + faculty + teacher) ────── */}
            <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'teacher']} />}>
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/assignments" element={<AssignmentPage />} />
              <Route path="/marks" element={<MarksPage />} />
              <Route path="/chat" element={<AiChatbotPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/documents" element={<RagUploadPage />} />
              <Route path="/rag-upload" element={<RagUploadPage />} />
            </Route>

            {/* ── Role redirect ───────────────────────────────────────────── */}
            <Route
              path="/dashboard"
              element={<RoleRedirect />}
            />

            {/* ── Catch-all ───────────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Redirect to appropriate dashboard based on role
function RoleRedirect() {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const isTeacherOrFaculty = role === 'faculty' || role === 'teacher';
  return <Navigate to={isTeacherOrFaculty ? '/faculty/dashboard' : '/student/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/University_Student_support_AgentAzure" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
