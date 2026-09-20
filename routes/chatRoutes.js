import express from 'express';
import {
  sendMessage,
  getUserSessions,
  getSessionMessages,
  escalateSession
} from '../controllers/chatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post('/message', sendMessage);
router.get('/sessions', getUserSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);
router.post('/sessions/:sessionId/escalate', escalateSession);

export default router;
