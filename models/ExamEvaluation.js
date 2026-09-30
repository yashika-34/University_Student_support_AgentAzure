import mongoose from 'mongoose';

const questionBreakdownSchema = new mongoose.Schema({
  questionNumber: { type: String, required: true },
  questionText: { type: String, default: '' },
  maxMarks: { type: Number, required: true },
  awardedMarks: { type: Number, required: true },
  studentAnswer: { type: String, default: '' },
  expectedAnswer: { type: String, default: '' },
  strengths: { type: String, default: '' },
  mistakes: { type: String, default: '' },
  deductionReason: { type: String, default: '' }
}, { _id: false });

const examEvaluationSchema = new mongoose.Schema({
  // Metadata
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
    default: 'Student'
  },
  studentRollNo: {
    type: String,
    trim: true,
    default: ''
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  courseName: {
    type: String,
    default: ''
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'internal_1', 'internal_2', 'assignment', 'quiz', 'custom'],
    default: 'midterm'
  },
  examTitle: {
    type: String,
    default: 'Semester Examination'
  },

  // Linked items
  questionPaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  },
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },

  // Content
  answerSheetFileName: {
    type: String,
    default: ''
  },
  extractedAnswerSheetText: {
    type: String,
    default: ''
  },
  questionPaperText: {
    type: String,
    default: ''
  },
  answerKeyText: {
    type: String,
    default: ''
  },

  // Results
  maxMarks: {
    type: Number,
    required: true,
    default: 100
  },
  obtainedMarks: {
    type: Number,
    required: true,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  gradeLetter: {
    type: String,
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
    default: 'B'
  },
  overallFeedback: {
    type: String,
    default: ''
  },
  improvementTips: [{
    type: String
  }],
  questionBreakdown: [questionBreakdownSchema],

  // Gradebook sync status
  syncedToMarks: {
    type: Boolean,
    default: false
  },
  syncedMarksId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Marks'
  },

  evaluationDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ExamEvaluation = mongoose.model('ExamEvaluation', examEvaluationSchema);
export default ExamEvaluation;
