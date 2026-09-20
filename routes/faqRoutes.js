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

// Public read endpoints
router.get('/', getAllFaqs);
router.get('/:id', getFaqById);

// Vote is public (no auth required) so landing page visitors can vote
router.post('/:id/vote', voteFaq);

// Admin-only write endpoints
router.post('/', verifyToken, authorizeRoles('admin', 'super_admin', 'faculty'), createFaq);
router.put('/:id', verifyToken, authorizeRoles('admin', 'super_admin', 'faculty'), updateFaq);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'super_admin'), deleteFaq);

export default router;
