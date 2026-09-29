import mongoose from 'mongoose';

/**
 * Session — Tracks active refresh token sessions per device.
 * Enables per-device logout, concurrent session limits, and security alerts.
 */
const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    refreshTokenHash: {
      type: String,
      required: [true, 'Refresh token hash is required'],
      select: false // Never expose raw hash in API responses
    },
    deviceInfo: {
      userAgent: { type: String, trim: true, default: null },
      platform: { type: String, trim: true, default: null },
      browser: { type: String, trim: true, default: null }
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    revokedReason: {
      type: String,
      enum: ['logout', 'password_change', 'admin_revoke', 'security_alert', 'expired', null],
      default: null
    },
    expiresAt: {
      type: Date,
      required: [true, 'Session expiry date is required']
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// TTL index: MongoDB auto-removes expired sessions after their expiry date
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup: "Find all active sessions for user X"
sessionSchema.index({ userId: 1, isRevoked: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
