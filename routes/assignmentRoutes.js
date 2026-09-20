import express from 'express';
import {
  getMyAssignments,
  getMyPendingAssignments,
  getAssignmentsByCourse,
  createAssignment,
  submitAssignment,
  gradeSubmission
} from '../controllers/assignmentController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my', authorizeRoles('student'), getMyAssignments);
router.get('/my-pending', authorizeRoles('student'), getMyPendingAssignments);
router.get('/course/:courseId', getAssignmentsByCourse);
router.post('/', authorizeRoles('faculty', 'admin', 'super_admin'), createAssignment);
router.post('/:id/submit', authorizeRoles('student'), submitAssignment);
router.put('/:id/grade', authorizeRoles('faculty', 'admin', 'super_admin'), gradeSubmission);

export default router;
