import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';

import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// 10 Requested Pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import AssignmentPage from './pages/AssignmentPage.jsx';
import FaqPage from './pages/FaqPage.jsx';
import AiChatbotPage from './pages/AiChatbotPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

// Advanced Module Hubs
import AcademicToolsPage from './pages/AcademicToolsPage.jsx';
import CareerHubPage from './pages/CareerHubPage.jsx';
import CampusServicesPage from './pages/CampusServicesPage.jsx';
import CommunityHubPage from './pages/CommunityHubPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/faqs" element={<FaqPage />} />

              {/* Protected Student & Faculty Pages */}
              <Route element={<ProtectedRoute />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/assignments" element={<AssignmentPage />} />
                <Route path="/academic-tools" element={<AcademicToolsPage />} />
                <Route path="/career-hub" element={<CareerHubPage />} />
                <Route path="/campus-services" element={<CampusServicesPage />} />
                <Route path="/community" element={<CommunityHubPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/chat" element={<AiChatbotPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
