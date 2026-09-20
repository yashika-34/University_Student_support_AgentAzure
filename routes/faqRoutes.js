import express from 'express';
import {
  getAllFaqs,
  getFaqById,
  createFaq,
  updateFaq,
  deleteFaq,
  voteFaq
} from '../controllers/faqController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getAllFaqs);
router.get('/:id', getFaqById);
router.post('/:id/vote', verifyToken, voteFaq);
router.post('/', verifyToken, authorizeRoles('admin', 'super_admin'), createFaq);
router.put('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), updateFaq);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), deleteFaq);

export default router;
