import express from 'express';
import {
  getMyAssignments,
  getMyPendingAssignments,
  getAssignmentsByCourse,
  createAssignment,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
  deleteAssignment
} from '../controllers/assignmentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Student endpoints
router.get('/my', authorizeRoles('student'), getMyAssignments);
router.get('/my-pending', authorizeRoles('student'), getMyPendingAssignments);
router.post('/:id/submit', authorizeRoles('student'), submitAssignment);

// Course assignments
router.get('/course/:courseId', getAssignmentsByCourse);

// Faculty & Admin management
router.post('/', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), createAssignment);
router.get('/:id/submissions', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getAssignmentSubmissions);
router.put('/:id/grade', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), gradeSubmission);
router.delete('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), deleteAssignment);

export default router;
