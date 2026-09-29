import mongoose from 'mongoose';

/**
 * FileUpload — Tracks every file uploaded to Azure Blob Storage.
 * Provides a unified registry of all user-generated content.
 */
const fileUploadSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required'],
      index: true
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storedFileName: {
      type: String,
      required: [true, 'Stored (blob) file name is required'],
      trim: true
    },
    blobUrl: {
      type: String,
      required: [true, 'Azure Blob URL is required'],
      trim: true
    },
    containerName: {
      type: String,
      required: [true, 'Azure container name is required'],
      trim: true,
      // e.g. 'resumes', 'study-materials', 'assignments', 'syllabus-docs'
      enum: ['resumes', 'study-materials', 'assignments', 'syllabus-docs', 'profile-avatars', 'misc']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true
      // e.g. 'application/pdf', 'image/jpeg'
    },
    sizeBytes: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'File size must be at least 1 byte']
    },
    // Which DB document is this file linked to?
    associatedModel: {
      type: String,
      trim: true,
      default: null,
      enum: ['CareerProfile', 'Assignment', 'StudyMaterial', 'User', 'Course', null]
    },
    associatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Fast lookup: "Show all files uploaded by user X"
fileUploadSchema.index({ uploadedBy: 1, containerName: 1, isDeleted: 1 });

const FileUpload = mongoose.model('FileUpload', fileUploadSchema);
export default FileUpload;
