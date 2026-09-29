import mongoose from 'mongoose';

const scholarshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    minCgpa: {
      type: Number,
      default: 7.0
    },
    maxAnnualFamilyIncome: {
      type: Number, // in USD or INR
      default: 120000
    },
    eligibleCategories: [{
      type: String,
      trim: true
    }],
    eligibleDepartments: [{
      type: String,
      trim: true
    }],
    deadline: {
      type: Date,
      required: true
    },
    applicationUrl: {
      type: String,
      default: 'https://university.edu/scholarships'
    },
    description: {
      type: String,
      required: true
    },
    applicants: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        studentId: { type: String },
        studentName: { type: String },
        statement: { type: String },
        appliedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['submitted', 'under_review', 'awarded', 'rejected'],
          default: 'submitted'
        }
      }
    ]
  },
  { timestamps: true }
);

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
export default Scholarship;
