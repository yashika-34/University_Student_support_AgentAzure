import mongoose from 'mongoose';

const careerProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    targetDomain: {
      type: String,
      default: 'Fullstack & Cloud Engineering'
    },
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    resumeKeywordsMatched: [{
      type: String
    }],
    missingKeywords: [{
      type: String
    }],
    resumeFeedback: [{
      type: String
    }],
    interviewSimulations: [
      {
        sessionDate: { type: Date, default: Date.now },
        roleTitle: String,
        difficulty: { type: String, enum: ['Junior', 'Mid', 'Senior'], default: 'Junior' },
        score: Number,
        strengths: [String],
        improvements: [String],
        qaTranscript: [
          {
            question: String,
            answer: String,
            feedback: String,
            rating: Number
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

const CareerProfile = mongoose.model('CareerProfile', careerProfileSchema);
export default CareerProfile;
