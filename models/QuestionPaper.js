import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'AI Generated Question Paper'
  },
  // NEW: Let the teacher just type what they want in plain English (e.g. "Make a 50 mark test on Machine Learning")
  magicPrompt: {
    type: String,
    trim: true
  },
  // NEW: Let the teacher just drag and drop last year's paper or syllabus PDF.
  sourceMaterialUrl: {
    type: String
  },
  examType: {
    type: String,
    enum: ['Mid-Term', 'End-Term', 'Quiz', 'Assignment', 'Practice Test', 'Final Examination'],
    default: 'Mid-Term'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Mixed', 'mixed'],
    default: 'Mixed'
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 100
  },
  syllabusText: {
    type: String,
  },
  generatedPaper: {
    type: String,
    required: true
  },
  answerKey: {
    type: String,
    required: true
  },
  variants: [{
    generatedPaper: String,
    answerKey: String,
    variantName: String, // e.g., "Set A", "Set B"
    createdAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
export default QuestionPaper;
