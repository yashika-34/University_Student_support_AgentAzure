import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student reference is required'],
      index: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty instructor reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Class session date is required'],
      index: true
    },
    sessionType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial'],
      default: 'lecture'
    },
    status: {
      type: String,
      required: [true, 'Attendance status is required'],
      enum: {
        values: ['present', 'absent', 'late', 'excused'],
        message: '{VALUE} is not a valid attendance status'
      },
      index: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    remarks: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance records for the same student, course, date, and session
attendanceSchema.index(
  { course: 1, student: 1, date: 1, sessionType: 1 },
  { unique: true }
);

// Compound index for fast AI Agent queries (e.g. "What is my CS101 attendance?")
attendanceSchema.index({ student: 1, course: 1, status: 1 });

// Static aggregation method: Calculate attendance percentage for a student in a course
attendanceSchema.statics.calculateAttendancePercentage = async function (studentId, courseId) {
  const result = await this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        course: new mongoose.Types.ObjectId(courseId)
      }
    },
    {
      $group: {
        _id: '$student',
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: {
            $cond: [
              { $in: ['$status', ['present', 'late']] },
              1,
              0
            ]
          }
        },
        excusedClasses: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        totalClasses: 1,
        attendedClasses: 1,
        excusedClasses: 1,
        percentage: {
          $cond: [
            { $eq: ['$totalClasses', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$attendedClasses', '$totalClasses'] },
                    100
                  ]
                },
                2
              ]
            }
          ]
        }
      }
    }
  ]);

  return result.length > 0
    ? result[0]
    : { totalClasses: 0, attendedClasses: 0, excusedClasses: 0, percentage: 0 };
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
