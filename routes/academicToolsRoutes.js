import express from 'express';
import {
  predictAttendance,
  predictSGPA,
  generateQuiz,
  getStudyPlan,
  getLearningRecommendations
} from '../controllers/academicToolsController.js';

const router = express.Router();

router.post('/predict-attendance', predictAttendance);
router.post('/predict-sgpa', predictSGPA);
router.post('/generate-quiz', generateQuiz);
router.get('/study-plan', getStudyPlan);
router.get('/recommendations', getLearningRecommendations);

export default router;
