import mongoose from 'mongoose';

const enrolledCourseSubSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    semester: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped'],
      default: 'enrolled'
    },
    gradeEarned: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Base user reference is required'],
      unique: true,
      index: true
    },
    studentId: {
      type: String,
      required: [true, 'Student Roll/ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true // e.g., "STU-2024-001"
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Academic department is required'],
      index: true
    },
    degreeProgram: {
      type: String,
      required: [true, 'Degree program is required'],
      trim: true // e.g., "B.S. in Computer Science"
    },
    currentSemester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: [1, 'Semester cannot be less than 1'],
      max: [12, 'Semester cannot exceed 12'],
      index: true
    },
    admissionYear: {
      type: Number,
      required: [true, 'Admission year is required']
    },
    batch: {
      type: String,
      required: [true, 'Cohort batch is required'], // e.g., "2024-2028"
      trim: true
    },
    academicAdvisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      default: null
    },
    enrolledCourses: [enrolledCourseSubSchema],
    cgpa: {
      type: Number,
      min: [0.0, 'CGPA cannot be negative'],
      max: [10.0, 'CGPA cannot exceed 10.0'],
      default: 0.0
    },
    completedCredits: {
      type: Number,
      default: 0
    },
    emergencyContact: emergencyContactSchema
  },
  {
    timestamps: true
  }
);

// Compound index for quick departmental semester filtering
studentSchema.index({ department: 1, currentSemester: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
