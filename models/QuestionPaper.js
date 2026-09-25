import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    default: 'AI Generated Question Paper'
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);
export default QuestionPaper;
