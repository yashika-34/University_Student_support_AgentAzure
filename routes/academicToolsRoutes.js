import express from 'express';
import {
  predictAttendance,
  predictSGPA,
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getQuizById,
  getStudyPlan,
  getLearningRecommendations,
  getExamSchedules,
  createExamSchedule,
  generateProjectArchitecture
} from '../controllers/academicToolsController.js';
import { verifyToken, authorizeRoles, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Predictors & Tools
router.post('/predict-attendance', predictAttendance);
router.post('/predict-sgpa', predictSGPA);
router.get('/study-plan', getStudyPlan);
router.get('/recommendations', getLearningRecommendations);
router.get('/exam-schedules', getExamSchedules);
router.post('/exam-schedules', verifyToken, authorizeRoles('faculty', 'admin', 'super_admin'), createExamSchedule);

// AI Quiz Studio (Azure OpenAI GPT-4.1-mini)
router.post('/generate-quiz', optionalAuth, generateQuiz);
router.post('/submit-quiz', optionalAuth, submitQuiz);
router.post('/quizzes/:id/submit', optionalAuth, submitQuiz);
router.get('/quiz-history', optionalAuth, getQuizHistory);
router.get('/quizzes/history', optionalAuth, getQuizHistory);
router.get('/quizzes/:id', optionalAuth, getQuizById);
// AI Project Architect
router.post('/project-architect', optionalAuth, generateProjectArchitecture);

export default router;
