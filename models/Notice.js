import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Notice content is required']
    },
    category: {
      type: String,
      enum: ['Academic', 'Examinations', 'Events', 'Administrative', 'Urgent', 'General'],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    authorName: {
      type: String,
      default: 'University Administration'
    },
    targetAudience: {
      type: String,
      enum: ['all', 'student', 'faculty'],
      default: 'all'
    },
    department: {
      type: String,
      default: 'All Departments'
    },
    attachmentUrl: {
      type: String,
      default: null
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    publishedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 180 days
    }
  },
  {
    timestamps: true
  }
);

noticeSchema.index({ isPublished: 1, publishedAt: -1, isPinned: -1 });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
