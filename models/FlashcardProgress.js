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
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastActiveDate: {
      type: String, // YYYY-MM-DD
      default: null
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
    totalXP: {
      type: Number,
      default: 0,
      min: 0
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    badges: [
      {
        badgeId: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, default: '🎓' },
        description: { type: String, default: '' },
        unlockedAt: { type: Date, default: Date.now }
      }
    ],
    // Activity heatmap tracking: reviews and XP per calendar day
    reviewHeatmap: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        count: { type: Number, default: 0 },
        xpEarned: { type: Number, default: 0 }
      }
    ],
    // Daily review reminders configuration
    dailyReminder: {
      enabled: { type: Boolean, default: true },
      reminderTime: { type: String, default: '19:00' },
      emailNotification: { type: Boolean, default: false }
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

// Helper method to award XP and unlock badges
flashcardProgressSchema.methods.awardXP = function (amount, reason = '') {
  this.totalXP = (this.totalXP || 0) + amount;
  // Level formula: Level = floor(sqrt(XP / 50)) + 1
  this.level = Math.max(1, Math.floor(Math.sqrt(this.totalXP / 50)) + 1);

  // Check and unlock badges
  const currentBadgeIds = new Set(this.badges.map((b) => b.badgeId));

  const checkBadge = (id, name, icon, desc, condition) => {
    if (condition && !currentBadgeIds.has(id)) {
      this.badges.push({
        badgeId: id,
        name,
        icon,
        description: desc,
        unlockedAt: new Date()
      });
      currentBadgeIds.add(id);
    }
  };

  checkBadge('first_recall', 'First Recall', '🌱', 'Reviewed your first flashcard deck', this.totalReviewed >= 1);
  checkBadge('scholar_10', 'Scholar Initiate', '📖', 'Reviewed 10 flashcards', this.totalReviewed >= 10);
  checkBadge('centurion_100', 'Century of Recall', '💯', 'Completed 100 flashcard reviews', this.totalReviewed >= 100);
  checkBadge('streak_3', 'Streak Starter', '🔥', 'Maintained a 3-day continuous revision streak', this.dailyStreak >= 3);
  checkBadge('streak_7', 'Consistency Champion', '⚡', 'Maintained a 7-day revision streak', this.dailyStreak >= 7);
  checkBadge('master_25', 'Concept Master', '🎯', 'Mastered 25 flashcards', this.totalKnown >= 25);
  checkBadge('titan_50', 'Knowledge Titan', '🧠', 'Mastered 50 flashcards', this.totalKnown >= 50);
  checkBadge('xp_500', 'High Achiever', '🚀', 'Earned 500+ Flashcard Experience Points', this.totalXP >= 500);

  // Record into today's heatmap
  const today = new Date().toISOString().split('T')[0];
  const heatmapEntry = this.reviewHeatmap.find((h) => h.date === today);
  if (heatmapEntry) {
    heatmapEntry.count += 1;
    heatmapEntry.xpEarned += amount;
  } else {
    this.reviewHeatmap.push({ date: today, count: 1, xpEarned: amount });
  }

  // Keep last 365 days of heatmap
  if (this.reviewHeatmap.length > 365) {
    this.reviewHeatmap = this.reviewHeatmap.slice(-365);
  }
};

const FlashcardProgress = mongoose.model('FlashcardProgress', flashcardProgressSchema);
export default FlashcardProgress;
