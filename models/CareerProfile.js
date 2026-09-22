import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    originalFileName: { type: String, default: 'resume.pdf' },
    uploadedAt: { type: Date, default: Date.now },
    targetRole: { type: String, default: 'Fullstack Cloud Engineer' },
    jobDescription: { type: String, default: '' },
    extractedTextSnippet: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },
    detectedSections: [{ type: String }],
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    grade: { type: String, default: 'Needs Optimization' },
    resumeSummary: { type: String, default: '' },
    skillsDetected: [{ type: String }],
    missingSkills: [{ type: String }],
    keywordMatchAnalysis: {
      matchPercentage: { type: Number, default: 0 },
      matchedKeywords: [{ type: String }],
      missingKeywords: [{ type: String }],
      suggestedKeywords: [{ type: String }]
    },
    experienceAnalysis: {
      rating: { type: String, default: '' },
      feedback: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }]
    },
    educationAnalysis: {
      rating: { type: String, default: '' },
      feedback: { type: String, default: '' }
    },
    sectionFeedback: {
      contactInfo: { score: Number, status: String, feedback: String },
      summary: { score: Number, status: String, feedback: String },
      skills: { score: Number, status: String, feedback: String },
      projects: { score: Number, status: String, feedback: String },
      experience: { score: Number, status: String, feedback: String },
      education: { score: Number, status: String, feedback: String }
    },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementSuggestions: [{ type: String }],
    careerRecommendations: {
      recommendedRoles: [{ type: String }],
      recommendedCertifications: [{ type: String }],
      actionPlan: [{ type: String }]
    },
    jobDescriptionComparison: {
      hasJd: { type: Boolean, default: false },
      matchScore: { type: Number, default: 0 },
      alignmentSummary: { type: String, default: '' },
      matchedRequirements: [{ type: String }],
      missingRequirements: [{ type: String }]
    },
    analyzedBy: { type: String, default: 'Azure OpenAI gpt-4.1-mini' }
  },
  { _id: true }
);

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
