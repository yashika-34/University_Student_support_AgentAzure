import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      index: true
    },
    topic: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        explanation: { type: String, default: '' }
      }
    ],
    createdBy: {
      type: String,
      default: 'AI System'
    }
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
