import mongoose from 'mongoose';

const classScheduleSubSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: { type: String, required: true }, // e.g. "10:00 AM"
    endTime: { type: String, required: true },   // e.g. "11:30 AM"
    roomNumber: { type: String, required: true },
    classType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial'],
      default: 'lecture'
    }
  },
  { _id: false }
);

const weeklyTopicSubSchema = new mongoose.Schema(
  {
    weekNumber: { type: Number, required: true },
    topic: { type: String, required: true },
    readings: { type: String }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course Code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true // e.g. "CS-301"
    },
    courseName: {
      type: String,
      required: [true, 'Course Name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true
    },
    credits: {
      type: Number,
      required: [true, 'Course credits are required'],
      min: [1, 'Credits must be at least 1'],
      max: [6, 'Credits cannot exceed 6']
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      index: true
    },
    leadFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Lead Faculty Instructor is required'],
      index: true
    },
    teachingAssistants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    syllabus: {
      overview: { type: String },
      documentUrl: { type: String }, // Stored PDF in Azure Blob Storage
      weeklyTopics: [weeklyTopicSubSchema]
    },
    schedule: [classScheduleSubSchema],
    maxCapacity: {
      type: Number,
      default: 60
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for catalog querying
courseSchema.index({ department: 1, semester: 1 });

const Course = mongoose.model('Course', courseSchema);
export default Course;
