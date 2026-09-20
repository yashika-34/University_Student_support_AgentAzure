import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    semester: {
      type: Number,
      required: true
    },
    term: {
      type: String,
      default: 'Fall 2026'
    },
    examType: {
      type: String,
      enum: ['Final Examination', 'Mid Semester', 'Internal Assessment 1', 'Internal Assessment 2', 'Practical / Lab Exam'],
      default: 'Final Examination'
    },
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true // e.g. "09:00"
    },
    endTime: {
      type: String,
      required: true // e.g. "12:00"
    },
    shift: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening'],
      default: 'Morning'
    },
    venue: {
      type: String,
      required: true // e.g. "Examination Hall A, Block 3"
    },
    seatNumber: {
      type: String,
      default: 'A-42'
    },
    hallTicketStatus: {
      type: String,
      enum: ['available', 'pending', 'debarred', 'not_required'],
      default: 'available'
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming'
    },
    guidelines: {
      type: [String],
      default: [
        'Bring official university photo ID and printed/digital hall ticket.',
        'No electronic devices permitted in the exam hall.',
        'Arrive at least 20 minutes prior to scheduled start time.'
      ]
    }
  },
  {
    timestamps: true
  }
);

examScheduleSchema.index({ date: 1, courseCode: 1 });

const ExamSchedule = mongoose.model('ExamSchedule', examScheduleSchema);
export default ExamSchedule;
