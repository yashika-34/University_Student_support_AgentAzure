import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
} from '../controllers/notificationController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.post('/', authorizeRoles('admin', 'super_admin'), createNotification);

export default router;
