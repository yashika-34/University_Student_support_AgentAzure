import mongoose from 'mongoose';

const officeHourSubSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: { type: String, required: true }, // e.g. "14:00"
    endTime: { type: String, required: true },   // e.g. "16:00"
    location: { type: String, required: true }  // e.g. "Room 402 or Teams Link"
  },
  { _id: false }
);

const facultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Base user reference is required'],
      unique: true,
      index: true
    },
    employeeId: {
      type: String,
      required: [true, 'Faculty Employee ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true // e.g. "FAC-1002"
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true
    },
    designation: {
      type: String,
      required: [true, 'Faculty designation is required'],
      enum: [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Senior Lecturer',
        'Lecturer',
        'Teaching Assistant',
        'Dean / HOD'
      ],
      default: 'Assistant Professor'
    },
    specialization: [{
      type: String,
      trim: true
    }],
    cabinOffice: {
      type: String,
      required: [true, 'Office/Cabin room number is required'],
      trim: true
    },
    officeHours: [officeHourSubSchema],
    assignedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }]
  },
  {
    timestamps: true
  }
);

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
