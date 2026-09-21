import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Material title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['note', 'pdf', 'question_paper', 'other'],
      required: [true, 'Material type is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    // Optional: for future tagging
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// Indexes for fast retrieval by course/subject/department
studyMaterialSchema.index({ course: 1 });
studyMaterialSchema.index({ subject: 1 });
studyMaterialSchema.index({ department: 1, type: 1 });

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
export default StudyMaterial;
