import mongoose from 'mongoose';

/**
 * AIUsageLog — Tracks every Azure OpenAI API call for cost control and analytics.
 * Essential for monitoring token spend, per-feature usage, and detecting abuse.
 */
const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    userRole: {
      type: String,
      enum: ['student', 'teacher', 'faculty', 'admin', 'super_admin', 'system'],
      default: 'student'
    },
    feature: {
      type: String,
      required: [true, 'AI feature name is required'],
      enum: [
        'chatbot',           // General AI chatbot
        'resume_analyzer',   // Resume upload + analysis
        'mock_interview',    // AI interview simulation
        'job_matcher',       // AI job matching
        'quiz_generator',    // AI quiz generation
        'flashcard_gen',     // AI flashcard generation
        'paper_generator',   // AI question paper generation
        'study_plan',        // AI study plan generation
        'career_roadmap',    // AI career roadmap
        'academic_tools',    // CGPA calculator / attendance prediction
        'rag_query',         // RAG document Q&A
        'remedial_content',  // AI remedial study content
        'sentiment_analysis',// Chat sentiment analysis
        'voice',             // Voice-to-text / TTS
        'other'
      ],
      index: true
    },
    model: {
      type: String,
      required: [true, 'AI model name is required'],
      trim: true,
      default: 'gpt-4.1-mini'
      // e.g. 'gpt-4.1-mini', 'text-embedding-ada-002'
    },
    promptTokens: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    completionTokens: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalTokens: {
      type: Number,
      min: 0,
      default: 0
    },
    estimatedCostUSD: {
      type: Number,
      min: 0,
      default: 0
      // Calculated at log time based on model pricing
    },
    latencyMs: {
      type: Number,
      min: 0,
      default: null
      // Time from request sent to response received
    },
    isSuccess: {
      type: Boolean,
      default: true
    },
    errorCode: {
      type: String,
      default: null
      // e.g. 'rate_limit_exceeded', 'context_length_exceeded'
    },
    requestMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Optional: { courseId, studentId, query snippet, etc. }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Pre-save: auto-calculate totalTokens
aiUsageLogSchema.pre('save', function (next) {
  this.totalTokens = (this.promptTokens || 0) + (this.completionTokens || 0);
  next();
});

// Fast aggregation: "Total cost this month by feature"
aiUsageLogSchema.index({ feature: 1, createdAt: -1 });
// Per-user cost tracking
aiUsageLogSchema.index({ userId: 1, createdAt: -1 });

const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
export default AIUsageLog;
