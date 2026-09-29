import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getMyMarks,
  getCourseMarks,
  addMarks,
  updateMarks,
  deleteMarks,
  publishMarks,
  getMarksSummary,
  previewBulkMarks,
  importBulkMarks
} from '../controllers/marksController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ── Student Routes ──────────────────────────────────────────────────────────
// GET /api/v1/marks/my — Student sees their own published marks
router.get('/my', authorizeRoles('student'), getMyMarks);

// GET /api/v1/marks/summary — Student: GPA, grade summary per semester
router.get('/summary', authorizeRoles('student'), getMarksSummary);

// ── Faculty / Teacher / Admin Routes ───────────────────────────────────────
// GET /api/v1/marks/course/:courseId — Faculty: see all marks for a course
router.get('/course/:courseId', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getCourseMarks);

// Bulk CSV Marks Upload Routes
router.post('/bulk/preview', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), previewBulkMarks);
router.post('/bulk/import', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), importBulkMarks);

// Single Marks Operations
router.post('/', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), addMarks);
router.post('/upload', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), addMarks);
router.put('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), updateMarks);
router.delete('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), deleteMarks);

// Publish Marks
router.patch('/:id/publish', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), publishMarks);
router.post('/publish', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), publishMarks);

export default router;
