import express from 'express';
import {
  getPlacements,
  createPlacement,
  checkPlacementEligibility,
  analyzeResume,
  getCareerCounseling,
  simulateInterview
} from '../controllers/careerController.js';
import { verifyToken, authorizeRoles, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Placement drives CRUD
router.get('/placements', optionalAuth, getPlacements);
router.post('/placements', verifyToken, authorizeRoles('faculty', 'admin', 'super_admin'), createPlacement);

// Career Intelligence endpoints
router.post('/check-placement', optionalAuth, checkPlacementEligibility);
router.post('/analyze-resume', optionalAuth, analyzeResume);
router.post('/career-counseling', optionalAuth, getCareerCounseling);
router.post('/simulate-interview', optionalAuth, simulateInterview);

export default router;
