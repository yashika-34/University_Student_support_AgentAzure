import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');

const db = mongoose.connection.db;
const users = await db.collection('users').find({
  email: { $in: ['dr.alan@university.edu', 'alex.student@university.edu', 'emma.student@university.edu'] }
}).toArray();

const userMap = Object.fromEntries(users.map(u => [u.email, u._id]));
console.log('Found users:', Object.keys(userMap));

const now = new Date();
const expiry = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

const notifs = [
  {
    recipient: userMap['alex.student@university.edu'],
    type: 'attendance_alert', priority: 'high',
    title: 'Low Attendance Warning',
    message: 'Your attendance in Data Structures has dropped below 75%. Please attend classes to avoid debarment.',
    isRead: false, createdAt: new Date(now - 2 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['alex.student@university.edu'],
    type: 'assignment_deadline', priority: 'medium',
    title: 'Assignment Due Tomorrow',
    message: 'Cloud Computing Assignment 3 is due on Sep 23. Submit before 11:59 PM.',
    isRead: false, createdAt: new Date(now - 5 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['alex.student@university.edu'],
    type: 'exam_reminder', priority: 'critical',
    title: 'Mid-Semester Exam Next Week',
    message: 'Your Mid-Semester exams start from Sep 29. Download your hall ticket from the portal.',
    isRead: false, createdAt: new Date(now - 24 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['alex.student@university.edu'],
    type: 'fee_due', priority: 'high',
    title: 'Semester Fee Due',
    message: 'Your semester fee of Rs. 85,000 is due by Oct 15. Late fee of Rs. 500/week applies after deadline.',
    isRead: true, createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['alex.student@university.edu'],
    type: 'system_announcement', priority: 'low',
    title: 'Campus Wi-Fi Upgrade',
    message: 'Campus Wi-Fi will be upgraded on Sep 25 from 2 AM - 6 AM. Expect brief interruptions.',
    isRead: true, createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['emma.student@university.edu'],
    type: 'assignment_deadline', priority: 'medium',
    title: 'Assignment Graded',
    message: 'Your Machine Learning Assignment 2 has been graded. Score: 88/100.',
    isRead: false, createdAt: new Date(now - 1 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['dr.alan@university.edu'],
    type: 'system_announcement', priority: 'medium',
    title: 'Faculty Meeting Tomorrow',
    message: 'Department faculty meeting scheduled for Sep 23 at 10:00 AM in Conference Hall B.',
    isRead: false, createdAt: new Date(now - 3 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  },
  {
    recipient: userMap['dr.alan@university.edu'],
    type: 'ticket_update', priority: 'low',
    title: 'Lab Booking Confirmed',
    message: 'Computer Lab 3 has been booked for your AI Lab session on Sep 24, 2-4 PM.',
    isRead: false, createdAt: new Date(now - 6 * 60 * 60 * 1000), expiresAt: expiry, metadata: {}
  }
];

const result = await db.collection('notifications').insertMany(notifs);
console.log('Inserted', result.insertedCount, 'notifications successfully!');
await mongoose.disconnect();
process.exit(0);
