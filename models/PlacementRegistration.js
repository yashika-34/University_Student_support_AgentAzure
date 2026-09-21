import mongoose from 'mongoose';

const placementRegistrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    placement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Placement',
      required: true,
      index: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'shortlisted', 'selected', 'rejected', 'withdrawn'],
      default: 'registered'
    },
    cgpaAtRegistration: {
      type: Number,
      default: 0
    },
    notificationSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Compound unique index: one student can register for a company only once
placementRegistrationSchema.index({ student: 1, placement: 1 }, { unique: true });

const PlacementRegistration = mongoose.model('PlacementRegistration', placementRegistrationSchema);
export default PlacementRegistration;
