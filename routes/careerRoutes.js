import express from 'express';
import {
  checkPlacementEligibility,
  analyzeResume,
  getCareerCounseling,
  simulateInterview
} from '../controllers/careerController.js';

const router = express.Router();

router.post('/check-placement', checkPlacementEligibility);
router.post('/analyze-resume', analyzeResume);
router.post('/career-counseling', getCareerCounseling);
router.post('/simulate-interview', simulateInterview);

export default router;
