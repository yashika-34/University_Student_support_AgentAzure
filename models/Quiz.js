import mongoose from 'mongoose';

const questionItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    questionText: {
      type: String,
      required: true
    },
    question: {
      type: String
    },
    options: {
      type: [String],
      validate: [val => Array.isArray(val) && val.length === 4, 'Must have exactly 4 options'],
      required: true
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3
    },
    correctOptionIndex: {
      type: Number,
      min: 0,
      max: 3
    },
    explanation: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      default: 'GENERAL',
      index: true
    },
    topic: {
      type: String,
      required: true,
      index: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Beginner', 'Intermediate', 'Advanced'],
      default: 'Medium'
    },
    numberOfQuestions: {
      type: Number,
      default: 5
    },
    questions: [questionItemSchema],
    createdBy: {
      type: String,
      default: 'Azure OpenAI gpt-4.1-mini'
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    attempt: {
      score: { type: Number },
      totalQuestions: { type: Number },
      correctCount: { type: Number },
      wrongCount: { type: Number },
      percentage: { type: Number },
      selectedAnswers: { type: mongoose.Schema.Types.Mixed },
      submittedAt: { type: Date }
    }
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
