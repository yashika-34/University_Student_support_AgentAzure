import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  }, // Azure Blob Storage link
  extractedSkills: [{ 
    type: String 
  }],
  experiences: [{
    title: { type: String },
    company: { type: String },
    duration: { type: String }
  }],
  education: [{
    degree: { type: String },
    institution: { type: String },
    year: { type: Number }
  }],
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
