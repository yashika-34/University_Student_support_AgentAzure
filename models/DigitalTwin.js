import mongoose from 'mongoose';

const digitalTwinSchema = new mongoose.Schema({
  // The faculty who owns this twin
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Twin identity configuration
  twinName: {
    type: String,
    required: true,
    trim: true,
    default: 'AI Teaching Assistant'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  personality: {
    type: String,
    enum: ['friendly', 'formal', 'socratic', 'encouraging', 'strict'],
    default: 'friendly'
  },
  greetingMessage: {
    type: String,
    default: 'Hello! I am your AI teaching assistant. Feel free to ask me anything about the course!'
  },
  avatarEmoji: {
    type: String,
    default: '🧑‍🏫'
  },

  // Knowledge base — teacher uploads their content here
  knowledgeBase: [{
    type: {
      type: String,
      enum: ['lecture_notes', 'syllabus', 'past_paper', 'reference_material', 'faq', 'custom'],
      default: 'lecture_notes'
    },
    title: { type: String, required: true },
    content: { type: String, required: true }, // Raw extracted text
    fileName: String,
    addedAt: { type: Date, default: Date.now }
  }],

  // Quick FAQ pairs the teacher sets up
  faqs: [{
    question: String,
    answer: String
  }],

  // Stats
  totalChats: { type: Number, default: 0 },
  totalMessages: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // Doubt Heatmap / Analytics for the teacher
  analytics: {
    popularTopics: [{
      topic: String,
      count: { type: Number, default: 1 }
    }],
    recentDoubts: [{
      question: String,
      studentName: String,
      askedAt: { type: Date, default: Date.now },
      hasSourceMatch: { type: Boolean, default: true }
    }]
  },

  // Doubts escalated directly to the professor
  escalatedDoubts: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    studentName: { type: String, default: 'Student' },
    studentEmail: String,
    question: { type: String, required: true },
    context: String,
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending'
    },
    resolution: String,
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date
  }],

  // Courses this twin is linked to
  linkedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]

}, { timestamps: true });

const DigitalTwin = mongoose.model('DigitalTwin', digitalTwinSchema);
export default DigitalTwin;
