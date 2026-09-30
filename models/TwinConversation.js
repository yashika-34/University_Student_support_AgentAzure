import mongoose from 'mongoose';

const twinConversationSchema = new mongoose.Schema({
  twinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalTwin',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    sourceCitation: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index so a student has one active conversation per twin
twinConversationSchema.index({ twinId: 1, studentId: 1 }, { unique: true });

const TwinConversation = mongoose.model('TwinConversation', twinConversationSchema);
export default TwinConversation;
