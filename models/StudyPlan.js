import mongoose from 'mongoose';

const studyPlanSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    weeklyTargetHours: {
      type: Number,
      default: 20
    },
    dailySlots: [
      {
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
        time: { type: String, required: true },
        courseCode: { type: String, required: true },
        topic: { type: String, required: true },
        durationMinutes: { type: Number, default: 60 },
        isCompleted: { type: Boolean, default: false }
      }
    ],
    activeWeek: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
export default StudyPlan;
