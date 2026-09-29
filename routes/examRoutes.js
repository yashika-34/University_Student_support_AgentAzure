import express from 'express';
import {
  getMyExamSchedule,
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam
} from '../controllers/examController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

// Student Exam Schedule View
router.get('/my', authorizeRoles('student'), getMyExamSchedule);

// General views
router.get('/', getAllExams);
router.get('/:id', getExamById);

// Faculty / Admin Management
router.post('/', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), createExam);
router.put('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), updateExam);
router.delete('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), deleteExam);

export default router;
