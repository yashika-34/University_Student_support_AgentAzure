import express from 'express';
import {
  getForumPosts,
  createForumPost,
  addForumReply,
  upvoteForumPost,
  markPostSolved,
  getBadges,
  getAnalytics
} from '../controllers/engagementController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All engagement routes require authentication
router.use(verifyToken);

// ── Forum ──────────────────────────────────────────────────────────────────────
router.get('/forum', getForumPosts);
router.post('/forum', createForumPost);
router.post('/forum/:id/reply', addForumReply);
router.patch('/forum/:id/upvote', upvoteForumPost);
router.patch('/forum/:id/solve', markPostSolved);

// ── Gamification ───────────────────────────────────────────────────────────────
router.get('/badges', getBadges);

// ── Analytics ──────────────────────────────────────────────────────────────────
router.get('/analytics', getAnalytics);

export default router;
