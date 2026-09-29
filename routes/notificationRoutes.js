import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getNotices,
  createNotice,
  deleteNotice
} from '../controllers/notificationController.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public / notices endpoints
router.get('/notices', getNotices);

// Authenticated notification routes
router.use(verifyToken);

// Notices management
router.post('/notices', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), createNotice);
router.delete('/notices/:id', authorizeRoles('faculty', 'teacher', 'admin', 'super_admin'), deleteNotice);

// User notifications
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin send notification
router.post('/', authorizeRoles('admin', 'super_admin'), createNotification);

export default router;
