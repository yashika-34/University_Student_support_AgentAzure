import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  requiredSkills: [{ 
    type: String 
  }],
  description: { 
    type: String 
  },
  location: { 
    type: String 
  },
  postedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const Job = mongoose.model('Job', jobSchema);

export default Job;
