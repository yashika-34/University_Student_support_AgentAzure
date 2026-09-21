import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: {
      type: Number,
      required: [true, 'Semester number is required'],
      min: [1, 'Semester cannot be less than 1'],
      max: [12, 'Semester cannot exceed 12'],
      index: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for quick active semester lookup
semesterSchema.index({ semesterNumber: 1, isActive: 1 });

const Semester = mongoose.model('Semester', semesterSchema);
export default Semester;
