import mongoose from 'mongoose';

const counselorMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    suggestedNextSteps: [{ type: String }],
    recommendedRoles: [{ type: String }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const careerCounselingChatSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      index: true
    },
    title: {
      type: String,
      default: 'Career Counseling Session',
      trim: true
    },
    interests: [{ type: String }],
    skills: [{ type: String }],
    careerGoals: {
      type: String,
      default: '',
      trim: true
    },
    targetDomain: {
      type: String,
      default: 'Cloud & AI Architecture',
      trim: true
    },
    semester: {
      type: Number,
      default: 5
    },
    cgpa: {
      type: String,
      default: ''
    },
    messages: [counselorMessageSchema],
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

// Compound index for fast queries by user and activity
careerCounselingChatSchema.index({ user: 1, lastActiveAt: -1 });

const CareerCounselingChat = mongoose.model('CareerCounselingChat', careerCounselingChatSchema);
export default CareerCounselingChat;
