import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  getNotices,
  createNotice
} from '../controllers/notificationController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / notices endpoints
router.get('/notices', getNotices);

// Authenticated notification routes
router.use(verifyToken);

router.post('/notices', authorizeRoles('faculty', 'admin', 'super_admin'), createNotice);
router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.post('/', authorizeRoles('admin', 'super_admin'), createNotification);

export default router;
