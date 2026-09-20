/**
 * seedData.js — Bootstrap demo data for UniAssist AI Portal
 * Run with: npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Marks from '../models/Marks.js';
import FAQ from '../models/FAQ.js';
import Notification from '../models/Notification.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uniassist_db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected for seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Course.deleteMany({}),
      Attendance.deleteMany({}),
      Assignment.deleteMany({}),
      Marks.deleteMany({}),
      FAQ.deleteMany({}),
      Notification.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data.');

    // ── 1. Create Faculty User ──────────────────────────────────────────────
    const facultyUser = await User.create({
      email: 'dr.alan@university.edu',
      passwordHash: 'Faculty@1234',
      firstName: 'Alan',
      lastName: 'Turing',
      role: 'faculty',
      phoneNumber: '+1-555-0100',
      isActive: true
    });

    const faculty = await Faculty.create({
      userId: facultyUser._id,
      employeeId: 'FAC-CS-101',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      cabinOffice: 'Turing Hall, Room 302',
      specialization: ['Algorithms', 'AI & Machine Learning', 'Cloud Computing'],
      officeHours: 'Tue & Thu: 2:00 PM - 4:00 PM'
    });

    console.log('👨‍🏫 Faculty created:', facultyUser.email);

    // ── 2. Create Courses ───────────────────────────────────────────────────
    const course1 = await Course.create({
      courseCode: 'CS-301',
      courseName: 'Algorithms & Complexity',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: faculty._id,
      maxStudents: 60,
      isActive: true
    });

    const course2 = await Course.create({
      courseCode: 'CS-305',
      courseName: 'Cloud Computing & Distributed Systems',
      department: 'Computer Science & Engineering',
      credits: 3,
      semester: 5,
      leadFaculty: faculty._id,
      maxStudents: 50,
      isActive: true
    });

    await Faculty.findByIdAndUpdate(faculty._id, {
      assignedCourses: [course1._id, course2._id]
    });

    console.log('📚 Courses created:', course1.courseCode, course2.courseCode);

    // ── 3. Create 5 Student Users ───────────────────────────────────────────
    const studentData = [
      { firstName: 'Alex', lastName: 'Mercer', email: 'alex.student@university.edu', id: 'STU-2024-8842', cgpa: 3.82, credits: 74 },
      { firstName: 'Emma', lastName: 'Watson', email: 'emma.student@university.edu', id: 'STU-2024-9102', cgpa: 3.56, credits: 68 },
      { firstName: 'Liam', lastName: 'Smith', email: 'liam.student@university.edu', id: 'STU-2024-7731', cgpa: 3.10, credits: 62 },
      { firstName: 'Priya', lastName: 'Patel', email: 'priya.student@university.edu', id: 'STU-2024-6621', cgpa: 3.91, credits: 80 },
      { firstName: 'Carlos', lastName: 'Rivera', email: 'carlos.student@university.edu', id: 'STU-2024-5510', cgpa: 3.40, credits: 70 }
    ];

    const studentProfiles = [];
    for (const sd of studentData) {
      const u = await User.create({
        email: sd.email,
        passwordHash: 'Student@1234',
        firstName: sd.firstName,
        lastName: sd.lastName,
        role: 'student',
        isActive: true
      });

      const s = await Student.create({
        userId: u._id,
        studentId: sd.id,
        department: 'Computer Science & Engineering',
        degreeProgram: 'B.S. in Computer Science',
        currentSemester: 5,
        admissionYear: 2022,
        batch: '2022-2026',
        cgpa: sd.cgpa,
        completedCredits: sd.credits,
        enrolledCourses: [
          { courseId: course1._id, status: 'enrolled' },
          { courseId: course2._id, status: 'enrolled' }
        ]
      });

      studentProfiles.push(s);
    }

    console.log('🎓 5 Students created.');

    // ── 4. Seed Attendance Records ──────────────────────────────────────────
    const attendanceDates = Array.from({ length: 24 }, (_, i) => {
      const d = new Date('2026-08-01');
      d.setDate(d.getDate() + i * 3);
      return d;
    });

    const attendanceRates = [0.875, 0.72, 0.68, 0.95, 0.83];

    for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
      const s = studentProfiles[sIdx];
      const rate = attendanceRates[sIdx];

      for (const course of [course1, course2]) {
        const totalSessions = course === course1 ? 24 : 18;
        const sessions = attendanceDates.slice(0, totalSessions);

        for (const sessionDate of sessions) {
          await Attendance.create({
            student: s._id,
            course: course._id,
            faculty: faculty._id,
            date: sessionDate,
            status: Math.random() < rate ? 'present' : 'absent',
            sessionType: 'lecture'
          });
        }
      }
    }

    console.log('📊 Attendance records seeded.');

    // ── 5. Seed Assignments ─────────────────────────────────────────────────
    await Assignment.create({
      title: 'Problem Set 1: Sorting Algorithm Analysis',
      description: 'Implement and compare QuickSort, MergeSort, HeapSort. Submit PDF + code.',
      course: course1._id,
      faculty: faculty._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      submissions: studentProfiles.slice(0, 3).map((s) => ({
        student: s._id,
        submittedAt: new Date(),
        content: 'Demo submission...',
        status: 'submitted'
      }))
    });

    await Assignment.create({
      title: 'Lab 2: Docker Container Deployment',
      description: 'Deploy containerized Node.js app. Include docker-compose.yml and README.',
      course: course2._id,
      faculty: faculty._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 50,
      submissions: []
    });

    console.log('📝 Assignments created.');

    // ── 6. Seed Marks ───────────────────────────────────────────────────────
    const mockScores = [[78, 85], [62, 70], [55, 60], [90, 95], [72, 78]];

    for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
      await Marks.create({
        student: studentProfiles[sIdx]._id,
        course: course1._id,
        faculty: faculty._id,
        examType: 'internal_1',
        examLabel: 'Unit Test 1 — Graph Algorithms',
        marksObtained: mockScores[sIdx][0],
        maxMarks: 100,
        semester: 5,
        isPublished: true
      });
      await Marks.create({
        student: studentProfiles[sIdx]._id,
        course: course1._id,
        faculty: faculty._id,
        examType: 'midterm',
        examLabel: 'Mid Semester Examination',
        marksObtained: mockScores[sIdx][1],
        maxMarks: 100,
        semester: 5,
        isPublished: true
      });
    }

    console.log('🎯 Marks seeded.');

    // ── 7. Seed FAQs ────────────────────────────────────────────────────────
    await FAQ.insertMany([
      {
        question: 'What is the minimum attendance requirement?',
        answer: 'Students must maintain 75% attendance per course to be eligible for final exams (Regulation 4.2).',
        category: 'Examinations',
        isPublished: true
      },
      {
        question: 'When is the tuition fee due?',
        answer: 'Fall tuition is due before August 31st. Late fee: $50/week. Contact bursar@university.edu.',
        category: 'Fees & Financial Aid',
        isPublished: true
      },
      {
        question: 'How do I access my digital hall ticket?',
        answer: 'Hall tickets are available under Student Portal > Examinations, 7 days before exams (if fees cleared and attendance ≥75%).',
        category: 'Examinations',
        isPublished: true
      },
      {
        question: 'What are the library hours?',
        answer: 'Library: Mon–Fri 8AM–10PM, Sat 9AM–6PM. Online resources: 24/7.',
        category: 'Campus Facilities',
        isPublished: true
      }
    ]);

    console.log('❓ FAQs seeded.');

    // ── 8. Seed Notifications ───────────────────────────────────────────────
    for (const s of studentProfiles.slice(0, 2)) {
      await Notification.create({
        recipient: s.userId,
        type: 'warning',
        title: 'Attendance Warning',
        message: 'Your attendance in CS-305 has fallen below 75%. Risk of exam debarment.',
        isRead: false
      });
    }

    console.log('🔔 Notifications created.');
    console.log('\n✅ Seed completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('  👨‍🏫 Faculty:  dr.alan@university.edu  /  Faculty@1234');
    console.log('  🎓 Student:  alex.student@university.edu  /  Student@1234');
    console.log('  🎓 Student:  emma.student@university.edu  /  Student@1234\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
