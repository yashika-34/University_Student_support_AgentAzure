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
    // Media & Formula Support
    frontImage: {
      type: String,
      default: null
    },
    backImage: {
      type: String,
      default: null
    },
    latexFormula: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: '',
      trim: true
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
    quality: {
      type: Number,
      default: 0 // Last SM-2 user quality rating (0-5)
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
      required: [true, 'FlashcardDeck must be owned by a user'],
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
        'saved_deck',
        'community'
      ],
      required: true,
      index: true
    },
    category: {
      type: String,
      default: 'General',
      index: true
    },
    subject: {
      type: String,
      default: 'General'
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'],
      default: 'Mixed'
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
    },
    // Shared / Public Community Deck Fields
    isPublic: {
      type: Boolean,
      default: false,
      index: true
    },
    likes: {
      type: Number,
      default: 0
    },
    forkCount: {
      type: Number,
      default: 0
    },
    originalAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

flashcardDeckSchema.index({ user: 1, sourceModule: 1 });
flashcardDeckSchema.index({ isPublic: 1, category: 1 });

const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
export default FlashcardDeck;
