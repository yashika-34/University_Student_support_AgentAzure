import express from 'express';
import {
  predictAttendance,
  predictSGPA,
  generateQuiz,
  getStudyPlan,
  getLearningRecommendations,
  getExamSchedules,
  createExamSchedule
} from '../controllers/academicToolsController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/predict-attendance', predictAttendance);
router.post('/predict-sgpa', predictSGPA);
router.post('/generate-quiz', generateQuiz);
router.get('/study-plan', getStudyPlan);
router.get('/recommendations', getLearningRecommendations);
router.get('/exam-schedules', getExamSchedules);
router.post('/exam-schedules', verifyToken, authorizeRoles('faculty', 'admin', 'super_admin'), createExamSchedule);

export default router;
