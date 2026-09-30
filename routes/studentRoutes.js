import express from 'express';
import {
  getMyStudentProfile,
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  getAcademicSummary,
  getStudentAnalytics,
  getUnifiedDashboard,
  getAIAcademicAssistant
} from '../controllers/studentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Single Unified Student Dashboard
router.get('/me/dashboard', authorizeRoles('student'), getUnifiedDashboard);

// AI Academic Advisor / Assistant
router.get('/me/ai-assistant', authorizeRoles('student'), getAIAcademicAssistant);

router.get('/me', authorizeRoles('student'), getMyStudentProfile);
router.put('/me', authorizeRoles('student'), updateStudentProfile);
router.get('/me/academic-summary', authorizeRoles('student'), getAcademicSummary);
router.get('/me/analytics', authorizeRoles('student'), getStudentAnalytics);

// Faculty & Admin management
router.get('/', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getAllStudents);
router.get('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin', 'student'), getStudentById);

export default router;
