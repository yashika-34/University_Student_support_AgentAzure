import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  originalFileName: { type: String, default: 'resume.pdf' },
  uploadedAt: { type: Date, default: Date.now },
  targetRole: { type: String, default: 'Fullstack Cloud Engineer' },
  jobDescription: { type: String, default: '' },
  extractedTextSnippet: { type: String, default: '' }, // first 500 chars
  wordCount: { type: Number, default: 0 },
  detectedSections: [{ type: String }],
  atsScore: { type: Number, min: 0, max: 100, default: 0 },
  jdMatchScore: { type: Number, min: 0, max: 100, default: 0 },
  grade: { type: String, default: 'Needs Optimization' },
  matchedKeywords: [{ type: String }],
  missingKeywords: [{ type: String }],
  jdMatchedKeywords: [{ type: String }],
  jdMissingKeywords: [{ type: String }],
  sectionScores: {
    keywords: { type: Number, default: 0 },
    sections: { type: Number, default: 0 },
    quantification: { type: Number, default: 0 },
    actionVerbs: { type: Number, default: 0 },
    length: { type: Number, default: 0 }
  },
  feedback: [{ type: String }],
  strengths: [{ type: String }]
}, { _id: true });

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
    resumeKeywordsMatched: [{ type: String }],
    missingKeywords: [{ type: String }],
    resumeFeedback: [{ type: String }],
    // Full analysis history — one entry per upload
    resumeAnalyses: [resumeAnalysisSchema],
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
