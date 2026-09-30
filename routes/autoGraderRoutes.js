import express from 'express';
import multer from 'multer';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  gradeAnswerSheet,
  getEvaluations,
  getEvaluationById,
  syncToMarks,
  deleteEvaluation
} from '../controllers/autoGraderController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'text/plain'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG images and text files are supported.'), false);
    }
  }
});

router.use(verifyToken);
router.use(authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'));

router.post('/grade', upload.single('file'), gradeAnswerSheet);
router.get('/', getEvaluations);
router.get('/:id', getEvaluationById);
router.post('/:id/sync-marks', syncToMarks);
router.delete('/:id', deleteEvaluation);

export default router;
