import mongoose from 'mongoose';

/**
 * RiskAlert Schema — Stores AI-generated backlog risk assessments per student
 * Aggregates: Attendance + Marks + Assignment submissions + Digital Twin engagement
 */

const riskFactorSubSchema = new mongoose.Schema(
  {
    factor: { type: String, required: true },
    score: { type: Number, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['safe', 'warning', 'danger', 'critical'],
      default: 'safe'
    },
    detail: { type: String, default: '' },
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const recoveryStepSubSchema = new mongoose.Schema(
  {
    priority: { type: Number },
    action: { type: String },
    deadline: { type: String },
    owner: { type: String, enum: ['student', 'faculty', 'advisor'], default: 'student' }
  },
  { _id: false }
);

const riskAlertSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    overallRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['safe', 'monitor', 'at_risk', 'critical'],
      required: true,
      index: true
    },

    riskFactors: [riskFactorSubSchema],

    aiSummary: {
      type: String,
      default: ''
    },

    recoveryPlan: {
      headline: { type: String, default: '' },
      steps: [recoveryStepSubSchema],
      estimatedRecoveryWeeks: { type: Number, default: 4 }
    },

    snapshotData: {
      attendancePercent: { type: Number, default: 0 },
      avgMarksPercent: { type: Number, default: 0 },
      assignmentSubmissionRate: { type: Number, default: 0 },
      missedAssignments: { type: Number, default: 0 },
      lateSubmissions: { type: Number, default: 0 },
      cgpa: { type: Number, default: 0 },
      digitalTwinSessions: { type: Number, default: 0 },
      escalatedDoubts: { type: Number, default: 0 }
    },

    isAcknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    acknowledgedAt: { type: Date, default: null },
    notificationSent: { type: Boolean, default: false },

    semester: { type: Number, default: null },
    academicYear: {
      type: String,
      default: () => {
        const y = new Date().getFullYear();
        return `${y}-${y + 1}`;
      }
    }
  },
  { timestamps: true }
);

riskAlertSchema.index({ student: 1, createdAt: -1 });
riskAlertSchema.index({ riskLevel: 1, isAcknowledged: 1 });

const RiskAlert = mongoose.model('RiskAlert', riskAlertSchema);
export default RiskAlert;
