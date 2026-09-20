import mongoose from 'mongoose';

/**
 * Marks Schema — Stores academic marks/grades per student per exam per course
 */
const marksSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required']
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required']
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    examType: {
      type: String,
      required: true,
      enum: ['internal_1', 'internal_2', 'midterm', 'final', 'assignment', 'practical', 'quiz', 'project'],
      default: 'internal_1'
    },
    examLabel: {
      type: String,
      trim: true,
      default: ''
      // e.g. "Mid Semester Exam - Unit 1"
    },
    marksObtained: {
      type: Number,
      required: [true, 'Marks obtained is required'],
      min: [0, 'Marks cannot be negative']
    },
    maxMarks: {
      type: Number,
      required: [true, 'Maximum marks is required'],
      min: [1, 'Maximum marks must be at least 1'],
      default: 100
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F', 'Ab', ''],
      default: ''
    },
    gradePoints: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    semester: {
      type: Number,
      min: 1,
      max: 12
    },
    academicYear: {
      type: String,
      default: () => {
        const y = new Date().getFullYear();
        return `${y}-${y + 1}`;
      }
    },
    remarks: {
      type: String,
      maxlength: 500,
      default: ''
    },
    isPublished: {
      type: Boolean,
      default: false // Faculty must publish marks for students to see
    }
  },
  {
    timestamps: true
  }
);

// Auto-calculate percentage and grade before save
marksSchema.pre('save', function (next) {
  if (this.maxMarks > 0) {
    this.percentage = parseFloat(((this.marksObtained / this.maxMarks) * 100).toFixed(2));
    this.grade = calculateGrade(this.percentage);
    this.gradePoints = calculateGradePoints(this.percentage);
  }
  next();
});

function calculateGrade(pct) {
  if (pct >= 91) return 'O';
  if (pct >= 81) return 'A+';
  if (pct >= 71) return 'A';
  if (pct >= 61) return 'B+';
  if (pct >= 51) return 'B';
  if (pct >= 41) return 'C';
  if (pct >= 36) return 'D';
  return 'F';
}

function calculateGradePoints(pct) {
  if (pct >= 91) return 10;
  if (pct >= 81) return 9;
  if (pct >= 71) return 8;
  if (pct >= 61) return 7;
  if (pct >= 51) return 6;
  if (pct >= 41) return 5;
  if (pct >= 36) return 4;
  return 0;
}

// Compound index: one entry per student per course per exam type
marksSchema.index({ student: 1, course: 1, examType: 1 }, { unique: false });
marksSchema.index({ student: 1, semester: 1 });

const Marks = mongoose.model('Marks', marksSchema);
export default Marks;
