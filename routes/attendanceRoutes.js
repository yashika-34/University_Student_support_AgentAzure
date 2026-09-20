import express from 'express';
import {
  getMyAttendanceSummary,
  getCourseAttendanceDetails,
  markBatchAttendance,
  getLowAttendanceAlerts
} from '../controllers/attendanceController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/my-summary', authorizeRoles('student'), getMyAttendanceSummary);
router.get('/course/:courseId', getCourseAttendanceDetails);
router.post('/mark-batch', authorizeRoles('faculty', 'admin', 'super_admin'), markBatchAttendance);
router.get('/course/:courseId/low-attendance', authorizeRoles('faculty', 'admin', 'super_admin'), getLowAttendanceAlerts);

export default router;
