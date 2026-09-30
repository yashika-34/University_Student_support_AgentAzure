import express from 'express';
import {
  generateFlashcards,
  saveDeck,
  updateDeck,
  getMyDecks,
  getDeckById,
  deleteDeck,
  addCardToDeck,
  updateCardInDeck,
  deleteCardFromDeck,
  updateCardStatus,
  getDeckAnalytics,
  getPublicCommunityDecks,
  forkPublicDeck,
  toggleLikeDeck,
  getUserFlashcardStats,
  getReminderSettings,
  updateReminderSettings,
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

// Public / Community Decks
router.get('/community', optionalAuth, getPublicCommunityDecks);
router.post('/decks/:id/fork', verifyToken, forkPublicDeck);
router.post('/decks/:id/like', optionalAuth, toggleLikeDeck);

// Deck management
router.post('/decks', optionalAuth, saveDeck);
router.get('/decks', optionalAuth, getMyDecks);
router.get('/decks/:id', optionalAuth, getDeckById);
router.put('/decks/:id', verifyToken, updateDeck);
router.delete('/decks/:id', verifyToken, deleteDeck);
router.get('/decks/:id/analytics', optionalAuth, getDeckAnalytics);
router.get('/decks/:id/export-anki', optionalAuth, exportDeckToAnki);

// Manual Card CRUD within Deck
router.post('/decks/:id/cards', verifyToken, addCardToDeck);
router.put('/decks/:id/cards/:cardId', verifyToken, updateCardInDeck);
router.delete('/decks/:id/cards/:cardId', verifyToken, deleteCardFromDeck);

// Status & SM-2 updates: Quality (0-5), Known, Needs Revision, Bookmark
router.put('/card-status', optionalAuth, updateCardStatus);

// Dashboard stats: streak, XP, badges, heatmap, mastered cards
router.get('/stats', optionalAuth, getUserFlashcardStats);

// Review Reminders
router.get('/reminders', verifyToken, getReminderSettings);
router.put('/reminders', verifyToken, updateReminderSettings);

// Smart AI recommendations
router.get('/recommended', optionalAuth, getRecommendedFlashcards);

export default router;
