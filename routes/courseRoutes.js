import express from 'express';
import {
  getAllCourses,
  getCourseById,
  getMyCourses,
  createCourse,
  enrollStudentInCourse,
  // New functions
  updateCourse,
  deleteCourse,
  getCourseEnrollment,
  enrollStudentsInCourse,
  unenrollStudentFromCourse,
  getCoursesByDepartment,
  getCoursesBySemester
} from '../controllers/courseController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllCourses);
router.get('/my-courses', getMyCourses);
router.get('/:id', getCourseById);
router.post('/', authorizeRoles('admin', 'super_admin'), createCourse);
router.post('/:courseId/enroll', authorizeRoles('student', 'admin'), enrollStudentInCourse);

// NEW ROUTES
router.put('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), updateCourse);
router.delete('/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), deleteCourse);
router.get('/:id/enrollment', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getCourseEnrollment);
router.post('/:id/enroll-students', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), enrollStudentsInCourse);
router.delete('/:id/enroll/:studentId', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), unenrollStudentFromCourse);
router.get('/by-department', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getCoursesByDepartment);
router.get('/by-semester', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), getCoursesBySemester);

export default router;
