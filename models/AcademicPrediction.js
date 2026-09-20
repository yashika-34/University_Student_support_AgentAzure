import mongoose from 'mongoose';

const academicPredictionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    predictionType: {
      type: String,
      enum: ['attendance', 'sgpa', 'cgpa_goal'],
      required: true
    },
    targetGoal: {
      type: Number,
      required: true
    },
    currentMetric: {
      type: Number,
      required: true
    },
    predictedMetric: {
      type: Number,
      required: true
    },
    simulationParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    recommendedAction: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const AcademicPrediction = mongoose.model('AcademicPrediction', academicPredictionSchema);
export default AcademicPrediction;
