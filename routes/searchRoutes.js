import express from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);
router.get('/', globalSearch);

export default router;
