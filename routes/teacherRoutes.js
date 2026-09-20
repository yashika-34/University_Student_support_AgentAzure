import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getTeacherDashboard,
  getCourseAnalytics,
  getStudentPerformanceList,
  getStudentProgressDetail,
  generateQuestionPaper,
  getClassReport
} from '../controllers/teacherController.js';

const router = express.Router();

// All teacher routes require authentication + faculty/admin role
router.use(verifyToken);
router.use(authorizeRoles('faculty', 'admin', 'super_admin'));

// GET /api/v1/teacher/dashboard — Aggregated faculty dashboard stats
router.get('/dashboard', getTeacherDashboard);

// GET /api/v1/teacher/analytics/:courseId — Detailed analytics for a course
router.get('/analytics/:courseId', getCourseAnalytics);

// GET /api/v1/teacher/students — Roster of all students for faculty's courses
router.get('/students', getStudentPerformanceList);

// GET /api/v1/teacher/students/:studentId — Individual student progress
router.get('/students/:studentId', getStudentProgressDetail);

// POST /api/v1/teacher/question-paper — AI-generate question paper
router.post('/question-paper', generateQuestionPaper);

// GET /api/v1/teacher/report/:courseId — Full class report (marks + attendance)
router.get('/report/:courseId', getClassReport);

export default router;
