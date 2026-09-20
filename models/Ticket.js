import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Academic Advisory', 'Attendance Query', 'Fees & Bursar', 'Examinations', 'Hostel & Mess', 'IT Support', 'Health & Counseling'],
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open'
    },
    messages: [
      {
        senderRole: { type: String, enum: ['student', 'staff', 'system'], required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        sentAt: { type: Date, default: Date.now }
      }
    ],
    assignedTo: {
      type: String,
      default: 'Academic Advisory Officer'
    },
    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
