import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import FAQ from '../models/FAQ.js';
import Notification from '../models/Notification.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Course.deleteMany({});
    await Attendance.deleteMany({});
    await Assignment.deleteMany({});
    await FAQ.deleteMany({});
    await Notification.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Create Users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const adminUser = await User.create({
      email: 'admin@university.edu',
      passwordHash,
      firstName: 'Dean',
      lastName: 'Vance',
      role: 'admin',
      phoneNumber: '+1-555-0199'
    });

    const facultyUser = await User.create({
      email: 'dr.alan@university.edu',
      passwordHash,
      firstName: 'Alan',
      lastName: 'Turing',
      role: 'faculty',
      phoneNumber: '+1-555-0144'
    });

    const studentUser = await User.create({
      email: 'alex.student@university.edu',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Mercer',
      role: 'student',
      phoneNumber: '+1-555-0123'
    });

    // 2. Create Faculty Profile
    const faculty = await Faculty.create({
      userId: facultyUser._id,
      employeeId: 'FAC-CS-101',
      department: 'Computer Science',
      designation: 'Professor',
      specialization: ['Artificial Intelligence', 'Distributed Systems'],
      cabinOffice: 'Turing Hall, Room 302',
      officeHours: [
        { dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', location: 'Room 302' },
        { dayOfWeek: 'Thursday', startTime: '10:00', endTime: '12:00', location: 'Room 302' }
      ]
    });

    // 3. Create Courses
    const course1 = await Course.create({
      courseCode: 'CS-301',
      courseName: 'Algorithms & Complexity',
      description: 'Advanced design and analysis of algorithms, dynamic programming, graph algorithms, and NP-completeness.',
      department: 'Computer Science',
      credits: 4,
      semester: 5,
      leadFaculty: faculty._id,
      schedule: [
        { dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '10:30 AM', roomNumber: 'Hall 4A', classType: 'lecture' },
        { dayOfWeek: 'Wednesday', startTime: '09:00 AM', endTime: '10:30 AM', roomNumber: 'Hall 4A', classType: 'lecture' }
      ],
      syllabus: {
        overview: 'Comprehensive coverage of asymptotic notation, divide and conquer, greedy paradigms, and graph algorithms.'
      }
    });

    const course2 = await Course.create({
      courseCode: 'CS-305',
      courseName: 'Cloud Computing & Distributed Systems',
      description: 'Architectures, virtualization, containerization, microservices, and serverless computing on Azure.',
      department: 'Computer Science',
      credits: 3,
      semester: 5,
      leadFaculty: faculty._id,
      schedule: [
        { dayOfWeek: 'Tuesday', startTime: '11:00 AM', endTime: '12:30 PM', roomNumber: 'Lab 2', classType: 'lab' }
      ]
    });

    // 4. Create Student Profile
    const student = await Student.create({
      userId: studentUser._id,
      studentId: 'STU-2024-8842',
      department: 'Computer Science',
      degreeProgram: 'B.S. in Computer Science',
      currentSemester: 5,
      admissionYear: 2024,
      batch: '2024-2028',
      academicAdvisor: faculty._id,
      cgpa: 3.82,
      completedCredits: 74,
      enrolledCourses: [
        { courseId: course1._id, semester: 5, status: 'enrolled' },
        { courseId: course2._id, semester: 5, status: 'enrolled' }
      ],
      emergencyContact: {
        name: 'Martha Mercer',
        relationship: 'Mother',
        phone: '+1-555-9988'
      }
    });

    // Update faculty assigned courses
    faculty.assignedCourses = [course1._id, course2._id];
    await faculty.save();

    // 5. Create Attendance Records
    const attendanceDates = [
      new Date('2026-09-01'),
      new Date('2026-09-03'),
      new Date('2026-09-08'),
      new Date('2026-09-10'),
      new Date('2026-09-15')
    ];

    for (let i = 0; i < attendanceDates.length; i++) {
      await Attendance.create({
        course: course1._id,
        student: student._id,
        faculty: faculty._id,
        date: attendanceDates[i],
        sessionType: 'lecture',
        status: i === 3 ? 'absent' : 'present', // 1 absent, 4 present = 80%
        markedBy: facultyUser._id
      });
    }

    // 6. Create Assignments
    await Assignment.create({
      course: course1._id,
      createdBy: faculty._id,
      title: 'Problem Set 1: Dynamic Programming & Knapsack',
      description: 'Implement memoized and bottom-up solutions for 0/1 Knapsack and Longest Common Subsequence.',
      maxScore: 100,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
      allowedFileTypes: ['.pdf', '.zip']
    });

    await Assignment.create({
      course: course2._id,
      createdBy: faculty._id,
      title: 'Lab Exercise 2: Docker Containerization on Azure App Service',
      description: 'Containerize a multi-tier web application and configure continuous deployment via GitHub Actions.',
      maxScore: 50,
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
    });

    // 7. Create FAQs
    await FAQ.create([
      {
        question: 'What is the minimum attendance required to appear for final examinations?',
        answer: 'University academic regulations mandate a minimum of 75% aggregate attendance in each registered course. Students below 75% are not permitted to write end-semester exams unless an approved medical leave form has been accepted.',
        category: 'Academics',
        tags: ['attendance', 'exams', 'policy'],
        targetAudience: ['student', 'all'],
        helpfulCount: 42
      },
      {
        question: 'When is the deadline to pay Fall semester tuition fees?',
        answer: 'The regular tuition fee payment deadline is October 15th, 2026. A late fine of $50 applies from October 16th through October 25th. After October 25th, class registration is suspended.',
        category: 'Fees & Financial Aid',
        tags: ['fees', 'tuition', 'deadline', 'bursar'],
        targetAudience: ['student', 'all'],
        helpfulCount: 89
      },
      {
        question: 'Where is the Student Health and Counseling Center located?',
        answer: 'The Student Health Center is located on the ground floor of the Campus Wellness Pavilion (Building D, Room 102). It is open Monday to Friday, 8:00 AM to 6:00 PM. Emergency on-call medical assistance is available 24/7 at +1-555-HELP.',
        category: 'Campus Facilities',
        tags: ['health', 'counseling', 'clinic', 'emergency'],
        targetAudience: ['all'],
        helpfulCount: 31
      }
    ]);

    // 8. Create Notification
    await Notification.create({
      recipient: studentUser._id,
      type: 'assignment_deadline',
      priority: 'high',
      title: 'Upcoming Assignment: Problem Set 1',
      message: 'Your assignment for CS-301 is due in 5 days. Ensure your solutions are uploaded on time.',
      actionUrl: '/student/assignments'
    });

    console.log('\n======================================================');
    console.log('✅ UNIASSIST DATABASE SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Default Accounts for Testing:');
    console.log('------------------------------------------------------');
    console.log('1. Student Account:');
    console.log('   Email:    alex.student@university.edu');
    console.log('   Password: Password123!');
    console.log('------------------------------------------------------');
    console.log('2. Faculty Account:');
    console.log('   Email:    dr.alan@university.edu');
    console.log('   Password: Password123!');
    console.log('------------------------------------------------------');
    console.log('3. Admin Account:');
    console.log('   Email:    admin@university.edu');
    console.log('   Password: Password123!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
