import mongoose from 'mongoose';

const toolCallSubSchema = new mongoose.Schema(
  {
    toolName: { type: String, required: true },
    parameters: { type: mongoose.Schema.Types.Mixed },
    result: { type: mongoose.Schema.Types.Mixed }
  },
  { _id: false }
);

const groundingSourceSubSchema = new mongoose.Schema(
  {
    documentTitle: { type: String },
    sourceUrl: { type: String },
    citationSnippet: { type: String },
    relevanceScore: { type: Number }
  },
  { _id: false }
);

const messageSubSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system', 'tool']
    },
    content: {
      type: String,
      required: true
    },
    toolCalls: [toolCallSubSchema],
    groundingSources: [groundingSourceSubSchema],
    sentimentScore: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session UUID is required'],
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    userRole: {
      type: String,
      required: true,
      enum: ['student', 'faculty', 'admin']
    },
    sessionTitle: {
      type: String,
      default: 'New Academic Inquiry',
      trim: true
    },
    messages: [messageSubSchema],
    status: {
      type: String,
      enum: ['active', 'closed', 'escalated'],
      default: 'active'
    },
    escalatedTicketId: {
      type: String,
      default: null
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast user session history retrieval
chatHistorySchema.index({ user: 1, lastActiveAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;
