import mongoose from 'mongoose';

const submissionSubSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    fileUrl: {
      type: String,
      required: [true, 'Submission file link is required']
    },
    status: {
      type: String,
      enum: ['submitted', 'late', 'graded', 'resubmitted'],
      default: 'submitted'
    },
    grade: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: null
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    gradedAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Associated course is required'],
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Creator faculty reference is required']
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Assignment description/prompt is required']
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true
    },
    attachmentUrl: {
      type: String, // Azure Blob Storage prompt/rubric PDF
      default: null
    },
    allowedFileTypes: {
      type: [String],
      default: ['.pdf', '.zip', '.docx']
    },
    submissions: [submissionSubSchema]
  },
  {
    timestamps: true
  }
);

// Indexes for deadline alerts and student lookup
assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ 'submissions.student': 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
