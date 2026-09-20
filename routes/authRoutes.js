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
  updatePassword
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh', refreshAccessToken);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);

// Password Management
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.put('/update-password', verifyToken, updatePassword);

export default router;
