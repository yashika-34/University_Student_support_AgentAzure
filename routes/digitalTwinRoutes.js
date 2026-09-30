import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import multer from 'multer';
import {
  getMyTwin,
  updateMyTwin,
  addKnowledge,
  deleteKnowledge,
  updateFaqs,
  chatWithTwin,
  discoverTwins,
  toggleTwinStatus,
  getConversationHistory,
  clearConversationHistory,
  escalateDoubt,
  resolveEscalatedDoubt,
  getTwinAnalytics
} from '../controllers/digitalTwinController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are supported.'), false);
    }
  }
});

// All routes require authentication
router.use(verifyToken);

// ── Student & Shared Routes (any authenticated user) ─────────────────────────
router.get('/discover', discoverTwins);
router.post('/chat/:twinId', chatWithTwin);
router.get('/conversation/:twinId', getConversationHistory);
router.delete('/conversation/:twinId', clearConversationHistory);
router.post('/escalate/:twinId', escalateDoubt);

// ── Faculty-only Twin Management ──────────────────────────────────────────────
router.use(authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'));

router.get('/my-twin', getMyTwin);
router.put('/my-twin', updateMyTwin);
router.get('/my-twin/analytics', getTwinAnalytics);
router.post('/my-twin/knowledge', upload.single('file'), addKnowledge);
router.delete('/my-twin/knowledge/:entryId', deleteKnowledge);
router.put('/my-twin/faqs', updateFaqs);
router.patch('/my-twin/toggle', toggleTwinStatus);
router.post('/my-twin/resolve-doubt/:doubtId', resolveEscalatedDoubt);

export default router;
