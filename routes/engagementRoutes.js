import express from 'express';
import {
  getForumPosts,
  createForumPost,
  getBadges,
  getAnalytics
} from '../controllers/engagementController.js';

const router = express.Router();

router.get('/forum', getForumPosts);
router.post('/forum', createForumPost);

router.get('/badges', getBadges);
router.get('/analytics', getAnalytics);

export default router;
