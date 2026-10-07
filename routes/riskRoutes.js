import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  analyzeStudentRisk,
  batchAnalyzeRisk,
  getRiskAlerts,
  getRiskAlertById,
  getStudentRiskHistory,
  acknowledgeAlert,
  getRiskDashboardStats,
  deleteRiskAlert
} from '../controllers/riskController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Dashboard stats
router.get('/dashboard-stats', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getRiskDashboardStats);

// Batch analysis (analyze all students)
router.post('/batch-analyze', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), batchAnalyzeRisk);

// Analyze a single student
router.post('/analyze/:studentId', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), analyzeStudentRisk);

// Get all alerts (with optional filters)
router.get('/alerts', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getRiskAlerts);

// Get / acknowledge / delete a specific alert
router.get('/alerts/:alertId', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getRiskAlertById);
router.patch('/alerts/:alertId/acknowledge', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), acknowledgeAlert);
router.delete('/alerts/:alertId', authorizeRoles('admin', 'super_admin'), deleteRiskAlert);

// Student risk history
router.get('/student/:studentId', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getStudentRiskHistory);

export default router;
