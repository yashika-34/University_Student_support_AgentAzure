import mongoose from 'mongoose';

const cardItemSchema = new mongoose.Schema(
  {
    cardId: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    front: {
      type: String,
      required: true,
      trim: true
    },
    back: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General'
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    tags: {
      type: [String],
      default: []
    },
    isKnown: {
      type: Boolean,
      default: false
    },
    needsRevision: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    lastReviewedAt: {
      type: Date,
      default: null
    },
    // SM-2 Spaced Repetition Fields
    interval: {
      type: Number,
      default: 1 // days
    },
    repetitions: {
      type: Number,
      default: 0
    },
    easeFactor: {
      type: Number,
      default: 2.5
    },
    nextReviewDate: {
      type: Date,
      default: () => new Date()
    }
  },
  { _id: false }
);

const flashcardDeckSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    sourceModule: {
      type: String,
      enum: [
        'job_matcher',
        'mock_interview',
        'resume_analyzer',
        'chatbot',
        'faq',
        'career_guidance',
        'roadmap',
        'paper_generator',
        'quiz',
        'dashboard',
        'custom',
        'student_syllabus',
        'recommendation',
        'remedial',
        'catch_up',
        'saved_deck'
      ],
      required: true,
      index: true
    },
    category: {
      type: String,
      default: 'General',
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    cards: [cardItemSchema],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

flashcardDeckSchema.index({ user: 1, sourceModule: 1 });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
export default FlashcardDeck;
