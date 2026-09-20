import mongoose from 'mongoose';

const placementSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    tier: {
      type: String,
      enum: ['Tier-1 (Super Dream)', 'Tier-2 (Dream)', 'Tier-3 (Regular)', 'Service'],
      default: 'Tier-2 (Dream)'
    },
    roleTitle: {
      type: String,
      required: true
    },
    packageLPA: {
      type: Number,
      required: true
    },
    minCgpa: {
      type: Number,
      default: 6.5
    },
    maxBacklogsAllowed: {
      type: Number,
      default: 0
    },
    eligibleDepartments: [{
      type: String,
      trim: true
    }],
    requiredSkills: [{
      type: String,
      trim: true
    }],
    deadline: {
      type: Date,
      required: true
    },
    openPositions: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

const Placement = mongoose.model('Placement', placementSchema);
export default Placement;
