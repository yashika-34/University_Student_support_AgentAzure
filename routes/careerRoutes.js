import express from 'express';
import multer from 'multer';
import {
  getPlacements,
  createPlacement,
  checkPlacementEligibility,
  analyzeResume,
  uploadAndAnalyzeResume,
  getResumeHistory,
  generateResumeReport,
  getCareerCounseling,
  chatWithCareerCounselor,
  getCounselorSessions,
  getCounselorSessionById,
  deleteCounselorSession,
  generateInterviewQuestion,
  simulateInterview,
  registerForPlacement,
  getMyRegistrations,
  cancelRegistration
} from '../controllers/careerController.js';
import { verifyToken, authorizeRoles, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── Multer: memory storage, 5MB limit, PDF/DOCX only ──────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const allowedExts = ['.pdf', '.docx'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are accepted.'), false);
    }
  }
});

// Placement drives CRUD
router.get('/placements', optionalAuth, getPlacements);
router.post('/placements', verifyToken, authorizeRoles('faculty', 'admin', 'super_admin'), createPlacement);

// ─── Placement Registration (DB-persisted) ──────────────────────────────────
router.post('/placements/:id/register', verifyToken, registerForPlacement);
router.delete('/placements/:id/register', verifyToken, cancelRegistration);
router.get('/my-registrations', verifyToken, getMyRegistrations);

// Career Intelligence endpoints
router.post('/check-placement', optionalAuth, checkPlacementEligibility);

// ─── Resume: File upload (PDF/DOCX) ────────────────────────────────────────
router.post('/upload-resume', optionalAuth, upload.single('resume'), uploadAndAnalyzeResume);
router.get('/resume-history', verifyToken, getResumeHistory);
router.get('/resume-report/:analysisId', optionalAuth, generateResumeReport);

// Legacy text-based resume analysis
router.post('/analyze-resume', optionalAuth, analyzeResume);

router.post('/career-counseling', optionalAuth, getCareerCounseling);
router.post('/counselor/message', optionalAuth, chatWithCareerCounselor);
router.get('/counselor/sessions', optionalAuth, getCounselorSessions);
router.get('/counselor/sessions/:sessionId', optionalAuth, getCounselorSessionById);
router.delete('/counselor/sessions/:sessionId', optionalAuth, deleteCounselorSession);
router.post('/interview/generate-question', optionalAuth, generateInterviewQuestion);
router.post('/simulate-interview', optionalAuth, simulateInterview);


export default router;
