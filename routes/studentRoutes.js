import express from 'express';
import {
  getMyStudentProfile,
  getAllStudents,
  getStudentById,
  updateStudentProfile,
  getAcademicSummary,
  getStudentAnalytics
} from '../controllers/studentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/me', authorizeRoles('student'), getMyStudentProfile);
router.put('/me', authorizeRoles('student'), updateStudentProfile);
router.get('/me/academic-summary', authorizeRoles('student'), getAcademicSummary);
router.get('/me/analytics', authorizeRoles('student'), getStudentAnalytics);
router.get('/', authorizeRoles('faculty', 'admin', 'super_admin'), getAllStudents);
router.get('/:id', authorizeRoles('faculty', 'admin', 'super_admin', 'student'), getStudentById);

export default router;
