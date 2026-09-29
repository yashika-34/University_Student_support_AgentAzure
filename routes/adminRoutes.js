import express from 'express';
import {
  getSystemStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  changeUserRole,
  deleteUser,
  getAuditLogs,
  getAIUsageStats,
  getFacultyList,
  getStudentList
} from '../controllers/adminController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and at least admin role
router.use(verifyToken);
router.use(authorizeRoles('admin', 'super_admin'));

// Telemetry & Analytics
router.get('/stats', getSystemStats);
router.get('/ai-usage', getAIUsageStats);
router.get('/audit-logs', getAuditLogs);

// Directory views
router.get('/teachers', getFacultyList);
router.get('/students', getStudentList);

// User Governance
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', updateUserStatus);

// High-Privilege Governance (Super Admin only)
router.put('/users/:id/role', authorizeRoles('super_admin'), changeUserRole);
router.delete('/users/:id', authorizeRoles('super_admin'), deleteUser);

export default router;
