import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  refreshAccessToken
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.post('/refresh', refreshAccessToken);
router.get('/me', verifyToken, getMe);

export default router;
