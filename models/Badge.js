import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    badgeCode: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    iconName: {
      type: String,
      default: 'Award'
    },
    xpPoints: {
      type: Number,
      default: 100
    },
    category: {
      type: String,
      enum: ['Academic', 'Attendance', 'Career', 'Community'],
      default: 'Academic'
    }
  },
  { timestamps: true }
);

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
