import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  matchScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  recommendedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
