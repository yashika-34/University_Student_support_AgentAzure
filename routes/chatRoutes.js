import express from 'express';
import {
  sendMessage,
  getUserSessions,
  getSessionMessages,
  escalateSession,
  getAzureStatus
} from '../controllers/chatController.js';
import { verifyToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Diagnostic endpoint: Test live Azure AI connectivity from browser or curl
router.get('/azure-status', getAzureStatus);

// Send message to AI Agent (supports both logged-in students & guests)
router.post('/message', optionalAuth, sendMessage);

// Protected session history endpoints
router.get('/sessions', verifyToken, getUserSessions);
router.get('/sessions/:sessionId/messages', verifyToken, getSessionMessages);
router.post('/sessions/:sessionId/escalate', verifyToken, escalateSession);

export default router;
