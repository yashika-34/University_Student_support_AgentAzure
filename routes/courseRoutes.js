import express from 'express';
import {
  getAllCourses,
  getCourseById,
  getMyCourses,
  createCourse,
  enrollStudentInCourse
} from '../controllers/courseController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllCourses);
router.get('/my-courses', getMyCourses);
router.get('/:id', getCourseById);
router.post('/', authorizeRoles('admin', 'super_admin'), createCourse);
router.post('/:courseId/enroll', authorizeRoles('student', 'admin'), enrollStudentInCourse);

export default router;
