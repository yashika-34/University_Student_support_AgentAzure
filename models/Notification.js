import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification recipient is required'],
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null indicates automated system notification
    },
    type: {
      type: String,
      required: true,
      enum: [
        'attendance_alert',
        'exam_reminder',
        'assignment_deadline',
        'fee_due',
        'system_announcement',
        'ticket_update'
      ]
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message body is required']
    },
    actionUrl: {
      type: String, // e.g., "/student/attendance"
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Auto-cleans up after 90 days
    }
  },
  {
    timestamps: true
  }
);

// Compound index for user inbox retrieval
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// TTL index to automatically purge expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
