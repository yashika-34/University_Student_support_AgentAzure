import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import multer from 'multer';
import {
  getTeacherDashboard,
  getCourseAnalytics,
  getStudentPerformanceList,
  getStudentProgressDetail,
  generateQuestionPaper,
  getClassReport,
  addStudentAttendance,
  addStudentMarks,
  createTeacherNotice,
  assignCourseToFaculty,
  createAndAssignCourse,
  unassignCourseFromFaculty,
  assignStudentToCourse,
  // Student Management CRUD
  getStudentManagementList,
  addStudentByFaculty,
  editStudentByFaculty,
  deleteStudentByFaculty,
  approveStudentAccount,
  getDepartmentStats,
  uploadSyllabusAndGenerate,
  getTeacherPapers
} from '../controllers/teacherController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'), false);
    }
  }
});

// All teacher routes require authentication + faculty/teacher/admin role
router.use(verifyToken);
router.use(authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'));

// ── Course Assignment & Management ─────────────────────────────────────────
router.post('/courses/assign', assignCourseToFaculty);
router.post('/courses/create', createAndAssignCourse);
router.delete('/courses/assign/:courseId', unassignCourseFromFaculty);
router.post('/courses/assign-student', assignStudentToCourse);

// ── Teacher Dashboard & Analytics ─────────────────────────────────────────
router.get('/dashboard', getTeacherDashboard);
router.get('/analytics/:courseId', getCourseAnalytics);

// ── Student Performance List & Detail ─────────────────────────────────────
router.get('/students', getStudentPerformanceList);
router.get('/students/:studentId', getStudentProgressDetail);

// ── Attendance, Marks, Notices ─────────────────────────────────────────────
router.post('/attendance', addStudentAttendance);
router.post('/marks', addStudentMarks);
router.post('/notices', createTeacherNotice);

// ── AI Question Paper ──────────────────────────────────────────────────────
router.post('/question-paper', generateQuestionPaper);
router.post('/question-paper/upload', upload.single('syllabus'), uploadSyllabusAndGenerate);
router.get('/question-paper/my-papers', getTeacherPapers);

// ── Class Report ──────────────────────────────────────────────────────────
router.get('/report/:courseId', getClassReport);

// ── Student Management CRUD (Full CRUD) ────────────────────────────────────
router.get('/manage/students', getStudentManagementList);
router.post('/manage/students', addStudentByFaculty);
router.put('/manage/students/:id', editStudentByFaculty);
router.delete('/manage/students/:id', deleteStudentByFaculty);
router.put('/manage/students/:id/approve', approveStudentAccount);

// ── Department & Semester Stats ────────────────────────────────────────────
router.get('/manage/departments', getDepartmentStats);

export default router;
