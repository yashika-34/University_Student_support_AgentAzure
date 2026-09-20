import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'FAQ question is required'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'FAQ answer is required']
    },
    category: {
      type: String,
      required: [true, 'FAQ category is required'],
      enum: [
        'Admissions',
        'Academics',
        'Examinations',
        'Fees & Financial Aid',
        'Hostel & Housing',
        'Library & IT',
        'Campus Facilities',
        'General Support'
      ],
      index: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    targetAudience: [{
      type: String,
      enum: ['student', 'faculty', 'all'],
      default: 'all'
    }],
    relatedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    viewCount: {
      type: Number,
      default: 0
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    notHelpfulCount: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    },
    azureSearchIndexed: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Full-text search index for fast keyword queries
faqSchema.index({
  question: 'text',
  answer: 'text',
  tags: 'text'
});

// Category and publish state filter index
faqSchema.index({ category: 1, isPublished: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
