import mongoose from 'mongoose';

const flashcardProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    dailyStreak: {
      type: Number,
      default: 1,
      min: 0
    },
    lastActiveDate: {
      type: String, // YYYY-MM-DD
      default: () => new Date().toISOString().split('T')[0]
    },
    totalReviewed: {
      type: Number,
      default: 0
    },
    totalKnown: {
      type: Number,
      default: 0
    },
    totalNeedsRevision: {
      type: Number,
      default: 0
    },
    weakTopics: {
      type: [String],
      default: []
    },
    bookmarkedCards: [
      {
        cardId: String,
        deckId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardDeck' },
        front: String,
        back: String,
        category: String,
        bookmarkedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

const FlashcardProgress = mongoose.model('FlashcardProgress', flashcardProgressSchema);
export default FlashcardProgress;
