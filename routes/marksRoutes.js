import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  getMyMarks,
  getCourseMarks,
  addMarks,
  updateMarks,
  deleteMarks,
  publishMarks,
  getMarksSummary
} from '../controllers/marksController.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ── Student Routes ──────────────────────────────────────────────────────────
// GET /api/v1/marks/my — Student sees their own published marks
router.get('/my', authorizeRoles('student'), getMyMarks);

// GET /api/v1/marks/summary — Student: GPA, grade summary per semester
router.get('/summary', authorizeRoles('student'), getMarksSummary);

// ── Faculty / Admin Routes ──────────────────────────────────────────────────
// GET /api/v1/marks/course/:courseId — Faculty: see all marks for a course
router.get('/course/:courseId', authorizeRoles('faculty', 'admin', 'super_admin'), getCourseMarks);

// POST /api/v1/marks — Faculty: add marks for a student
router.post('/', authorizeRoles('faculty', 'admin', 'super_admin'), addMarks);

// PUT /api/v1/marks/:id — Faculty: update marks entry
router.put('/:id', authorizeRoles('faculty', 'admin', 'super_admin'), updateMarks);

// DELETE /api/v1/marks/:id — Faculty: delete marks entry
router.delete('/:id', authorizeRoles('faculty', 'admin', 'super_admin'), deleteMarks);

// PATCH /api/v1/marks/:id/publish — Faculty: publish marks (make visible to student)
router.patch('/:id/publish', authorizeRoles('faculty', 'admin', 'super_admin'), publishMarks);

export default router;
