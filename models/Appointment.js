import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
      index: true
    },
    facultyName: {
      type: String,
      required: true
    },
    courseCode: {
      type: String,
      default: 'General Consultation'
    },
    purpose: {
      type: String,
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed'],
      default: 'pending'
    },
    meetingLinkOrLocation: {
      type: String,
      default: 'Turing Hall, Room 302 / Microsoft Teams'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
