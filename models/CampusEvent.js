import mongoose from 'mongoose';

const campusEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Hackathon', 'Workshop', 'Guest Lecture', 'Career Fair', 'Cultural', 'Sports'],
      required: true
    },
    eventDate: {
      type: Date,
      required: true
    },
    venue: {
      type: String,
      required: true
    },
    organizer: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    capacity: {
      type: Number,
      default: 100
    },
    attendees: [{
      studentId: String,
      studentName: String,
      registeredAt: { type: Date, default: Date.now }
    }],
    badgeAwardedOnAttendance: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const CampusEvent = mongoose.model('CampusEvent', campusEventSchema);
export default CampusEvent;
