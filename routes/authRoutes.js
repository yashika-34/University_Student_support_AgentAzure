import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  refreshAccessToken,
  updateProfile,
  forgotPassword,
  resetPassword,
  updatePassword,
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  revokeAllSessions
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Authenticated Routes
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/update-password', verifyToken, updatePassword);
router.put('/change-password', verifyToken, updatePassword);

// Session Management (Multi-device control)
router.get('/sessions', verifyToken, getActiveSessions);
router.delete('/sessions/other', verifyToken, revokeAllOtherSessions);
router.delete('/sessions/all', verifyToken, revokeAllSessions);
router.delete('/sessions/:sessionId', verifyToken, revokeSession);

export default router;
