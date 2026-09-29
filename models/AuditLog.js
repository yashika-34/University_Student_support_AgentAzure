import mongoose from 'mongoose';

/**
 * AuditLog — Immutable record of every sensitive operation.
 * Never update or delete audit logs. They are append-only.
 */
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Action type is required'],
      enum: [
        'UPDATE_MARKS',
        'DELETE_MARKS',
        'UPDATE_ATTENDANCE',
        'DELETE_ATTENDANCE',
        'CHANGE_ROLE',
        'CREATE_USER',
        'DELETE_USER',
        'RESET_PASSWORD',
        'ENROLL_STUDENT',
        'UNENROLL_STUDENT',
        'PUBLISH_NOTICE',
        'DELETE_NOTICE',
        'UPLOAD_FILE',
        'DELETE_FILE',
        'PLACEMENT_STATUS_CHANGE',
        'AI_FEATURE_USED',
        'LOGIN',
        'LOGOUT',
        'TOKEN_REFRESH'
      ],
      index: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor user reference is required'],
      index: true
    },
    performedByRole: {
      type: String,
      enum: ['student', 'teacher', 'faculty', 'admin', 'super_admin', 'system'],
      default: 'system'
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    resourceType: {
      type: String,
      trim: true,
      default: null
      // e.g. 'Marks', 'Attendance', 'User', 'PlacementRegistration'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null }
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
      // Extra context: { courseId, studentId, reason, etc. }
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null
    },
    userAgent: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success'
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    // Disable versionKey — audit logs are immutable, no need for __v
    versionKey: false
  }
);

// Compound index for fast admin filtering: "Show all marks updates by teacher X"
auditLogSchema.index({ action: 1, performedBy: 1, createdAt: -1 });
// TTL index: auto-delete logs older than 2 years (optional, comment out if not desired)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
