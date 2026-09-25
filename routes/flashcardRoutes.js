import express from 'express';
import {
  generateFlashcards,
  saveDeck,
  getMyDecks,
  getDeckById,
  deleteDeck,
  updateCardStatus,
  getUserFlashcardStats,
  getRecommendedFlashcards,
  getDueTodayCards,
  exportDeckToAnki
} from '../controllers/flashcardController.js';
import { optionalAuth, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate dynamic AI flashcards from any module
router.post('/generate', optionalAuth, generateFlashcards);

// Due today cards via SM-2 Spaced Repetition
router.get('/due-today', optionalAuth, getDueTodayCards);

// Deck management
router.post('/decks', optionalAuth, saveDeck);
router.get('/decks', optionalAuth, getMyDecks);
router.get('/decks/:id', optionalAuth, getDeckById);
router.get('/decks/:id/export-anki', optionalAuth, exportDeckToAnki);
router.delete('/decks/:id', verifyToken, deleteDeck);

// Status updates: Mark as Known / Needs Revision / Bookmark
router.put('/card-status', optionalAuth, updateCardStatus);

// Dashboard stats: daily revision streak, total mastered, weak topics
router.get('/stats', optionalAuth, getUserFlashcardStats);

// Smart AI recommendations
router.get('/recommended', optionalAuth, getRecommendedFlashcards);

export default router;
