import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      enum: ['student', 'faculty', 'ta'],
      default: 'student'
    },
    category: {
      type: String,
      enum: ['Algorithms', 'Cloud Computing', 'AI & Machine Learning', 'Exam Prep', 'Placement & Internships', 'Campus Life'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    upvotes: {
      type: Number,
      default: 0
    },
    isSolved: {
      type: Boolean,
      default: false
    },
    replies: [
      {
        authorName: String,
        authorRole: String,
        content: String,
        isVerifiedAnswer: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const ForumPost = mongoose.model('ForumPost', forumPostSchema);
export default ForumPost;
