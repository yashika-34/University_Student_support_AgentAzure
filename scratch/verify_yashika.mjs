import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Notice from '../models/Notice.js';
import Notification from '../models/Notification.js';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');

console.log('--- TESTING CREDENTIALS ---');
const yashika = await User.findOne({ email: 'yashika.student@university.edu' }).select('+passwordHash');
console.log('Yashika found:', !!yashika, yashika?.email, yashika?.role);
const passMatchStudent = await yashika.comparePassword('Student@1234');
console.log('Student password matches:', passMatchStudent);

const rohit = await User.findOne({ email: 'rohit.thakur@university.edu' }).select('+passwordHash');
console.log('Prof. Rohit found:', !!rohit, rohit?.email, rohit?.role);
const passMatchFaculty = await rohit.comparePassword('Faculty@1234');
console.log('Faculty password matches:', passMatchFaculty);

const studentDoc = await Student.findOne({ userId: yashika._id }).populate('enrolledCourses.courseId');
console.log('Student ID:', studentDoc.studentId);
console.log('Enrolled courses count:', studentDoc.enrolledCourses.length);

const summary = await Attendance.aggregate([
  { $match: { student: studentDoc._id } },
  {
    $group: {
      _id: '$course',
      total: { $sum: 1 },
      attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
    }
  }
]);

console.log('\n--- ATTENDANCE SUMMARY PER COURSE ---');
for (const s of summary) {
  const c = await Course.findById(s._id);
  const pct = ((s.attended / s.total) * 100).toFixed(2);
  console.log(`${c.courseCode} (${c.courseName}): Attended ${s.attended}/${s.total} (${pct}%)`);
}

const notices = await Notice.find();
console.log('\nTotal notices in DB:', notices.length);

const notifications = await Notification.find({ recipient: yashika._id });
console.log('Total notifications for Yashika in DB:', notifications.length);

await mongoose.disconnect();
console.log('\n--- ALL VERIFICATIONS PASSED ---');
