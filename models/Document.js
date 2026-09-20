import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    sizeBytes: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      enum: ['General', 'Academics', 'Examinations', 'Fees & Financial Aid', 'Campus Facilities', 'Regulations', 'Syllabus'],
      default: 'General'
    },
    uploadedBy: {
      type: String,
      required: true
    },
    totalChunks: {
      type: Number,
      default: 0
    },
    indexedChunks: {
      type: Number,
      default: 0
    },
    chunks: [chunkSchema],
    azureIndexed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

documentSchema.index({ title: 'text', 'chunks.content': 'text' });

const Document = mongoose.model('Document', documentSchema);
export default Document;
