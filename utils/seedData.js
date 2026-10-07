/**
 * seedData.js — Official Database Seeder for UniAssist AI
 * Tailored for Yashika Garg (Roll: 2410993073) & Faculty Prof. Rohit Kumar Thakur
 * Run with: npm run seed
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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
import Notice from '../models/Notice.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Document from '../models/Document.js';
import CampusEvent from '../models/CampusEvent.js';
import Scholarship from '../models/Scholarship.js';
import Placement from '../models/Placement.js';
import StudyPlan from '../models/StudyPlan.js';
import ForumPost from '../models/ForumPost.js';
import Ticket from '../models/Ticket.js';
import Appointment from '../models/Appointment.js';
import Badge from '../models/Badge.js';
import DigitalTwin from '../models/DigitalTwin.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    // ── Clear all collections ────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Course.deleteMany({}),
      Attendance.deleteMany({}),
      Assignment.deleteMany({}),
      Marks.deleteMany({}),
      FAQ.deleteMany({}),
      Notification.deleteMany({}),
      Notice.deleteMany({}),
      ExamSchedule.deleteMany({}),
      Document.deleteMany({}),
      CampusEvent.deleteMany({}),
      Scholarship.deleteMany({}),
      Placement.deleteMany({}),
      StudyPlan.deleteMany({}),
      ForumPost.deleteMany({}),
      Ticket.deleteMany({}),
      Appointment.deleteMany({}),
      Badge.deleteMany({}),
      DigitalTwin.deleteMany({})
    ]);
    console.log('🗑️  Cleared previous collections.');

    // Pass plain-text passwords so User.schema pre('save') hook hashes them cleanly once
    const facultyPass = 'Faculty@1234';
    const studentPass = 'Student@1234';
    const adminPass = 'Admin@1234';

    // ── 1. Create Admins ─────────────────────────────────────────────────────
    const adminUser = await User.create({
      email: 'admin@uniassist.edu',
      passwordHash: adminPass,
      firstName: 'Dean',
      lastName: 'Academics',
      role: 'admin',
      phoneNumber: '9876543210',
      isActive: true
    });

    const superAdminUser = await User.create({
      email: 'superadmin@uniassist.edu',
      passwordHash: adminPass,
      firstName: 'Academic',
      lastName: 'Director',
      role: 'super_admin',
      phoneNumber: '9876543211',
      isActive: true
    });

    // ── 2. Create Faculty Members from Portal ────────────────────────────────
    // Primary Demo Faculty: Prof. Rohit Kumar Thakur
    const rohitUser = await User.create({
      email: 'rohit.thakur@university.edu',
      passwordHash: facultyPass,
      firstName: 'Rohit Kumar',
      lastName: 'Thakur',
      role: 'faculty',
      phoneNumber: '9876500001',
      isActive: true
    });

    const rohitFaculty = await Faculty.create({
      userId: rohitUser._id,
      employeeId: 'FAC-CSE-0205',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      cabinOffice: 'Academic Block 3, Room 412',
      specialization: ['Computer Networks', 'Data Communication', 'System Design', 'Distributed Systems'],
      officeHours: [
        { dayOfWeek: 'Monday', startTime: '11:00', endTime: '13:00', location: 'Academic Block 3, Room 412' },
        { dayOfWeek: 'Wednesday', startTime: '14:00', endTime: '16:00', location: 'Academic Block 3, Room 412' }
      ]
    });

    // Alias Faculty: Dr. Alan Turing (retains backwards compatibility with quick buttons)
    const alanUser = await User.create({
      email: 'dr.alan@university.edu',
      passwordHash: facultyPass,
      firstName: 'Alan',
      lastName: 'Turing',
      role: 'faculty',
      phoneNumber: '9876500002',
      isActive: true
    });

    const alanFaculty = await Faculty.create({
      userId: alanUser._id,
      employeeId: 'FAC-CS-101',
      department: 'Computer Science & Engineering',
      designation: 'Professor',
      cabinOffice: 'Turing Hall, Room 302',
      specialization: ['Algorithms', 'System Architecture', 'AI Foundations'],
      officeHours: [
        { dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', location: 'Turing Hall, Room 302' },
        { dayOfWeek: 'Thursday', startTime: '14:00', endTime: '16:00', location: 'Turing Hall, Room 302' }
      ]
    });

    // Additional course instructors from user's portal
    const vivekUser = await User.create({
      email: 'vivek.singh@university.edu',
      passwordHash: facultyPass,
      firstName: 'Vivek',
      lastName: 'Singh',
      role: 'faculty',
      phoneNumber: '9876500003',
      isActive: true
    });
    const vivekFaculty = await Faculty.create({
      userId: vivekUser._id,
      employeeId: 'FAC-CSE-0302',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      cabinOffice: 'Block 2, Room 204',
      specialization: ['Programming Abstractions', 'AI Models'],
      officeHours: []
    });

    const vaibhavUser = await User.create({
      email: 'vaibhav.sultane@university.edu',
      passwordHash: facultyPass,
      firstName: 'Vaibhav',
      lastName: 'Sultane',
      role: 'faculty',
      phoneNumber: '9876500004',
      isActive: true
    });
    const vaibhavFaculty = await Faculty.create({
      userId: vaibhavUser._id,
      employeeId: 'FAC-CSE-0303',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      cabinOffice: 'Block 3, Room 305',
      specialization: ['Back End Engineering', 'Software Architecture', 'Cloud Services'],
      officeHours: []
    });

    const pradeepUser = await User.create({
      email: 'pradeep.singh@university.edu',
      passwordHash: facultyPass,
      firstName: 'Pradeep',
      lastName: 'Singh',
      role: 'faculty',
      phoneNumber: '9876500005',
      isActive: true
    });
    const pradeepFaculty = await Faculty.create({
      userId: pradeepUser._id,
      employeeId: 'FAC-CSE-0306',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      cabinOffice: 'Block 2, Room 318',
      specialization: ['Deep Neural Networks', 'Computer Vision'],
      officeHours: []
    });

    const pavanUser = await User.create({
      email: 'ssm.pavan@university.edu',
      passwordHash: facultyPass,
      firstName: 'S S M',
      lastName: 'Pavan',
      role: 'faculty',
      phoneNumber: '9876500006',
      isActive: true
    });
    const pavanFaculty = await Faculty.create({
      userId: pavanUser._id,
      employeeId: 'FAC-UNI-0133',
      department: 'Humanities & Management',
      designation: 'Assistant Professor',
      cabinOffice: 'Management Block, Room 102',
      specialization: ['Business Professional Communication', 'Corporate Soft Skills'],
      officeHours: []
    });

    const jaiUser = await User.create({
      email: 'jai.prakash@university.edu',
      passwordHash: facultyPass,
      firstName: 'Jai',
      lastName: 'prakash',
      role: 'faculty',
      phoneNumber: '9876500007',
      isActive: true
    });
    const jaiFaculty = await Faculty.create({
      userId: jaiUser._id,
      employeeId: 'FAC-UNI-0110',
      department: 'Applied Sciences & Mathematics',
      designation: 'Assistant Professor',
      cabinOffice: 'Science Block, Room 214',
      specialization: ['Numerical Aptitude', 'Logical Reasoning', 'Discrete Mathematics'],
      officeHours: []
    });

    console.log('👨‍🏫 Faculty members created.');

    // ── 3. Create the 8 Courses from Syllabus & Portal ──────────────────────
    const course1 = await Course.create({
      courseCode: '24CAI0205',
      courseName: 'Computer Networks & Data Communication',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: rohitFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Layered network architectures, OSI/TCP models, routing algorithms, flow & error control, transport protocols, and socket programming.'
    });

    const course2 = await Course.create({
      courseCode: '24CAI0302',
      courseName: 'Programming Abstractions for AI',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: vivekFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Declarative and functional programming paradigms, vectorized computation, tensor abstractions, and graph-based problem representation.'
    });

    const course3 = await Course.create({
      courseCode: '24CAI0303',
      courseName: 'Back End Engineering',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: vaibhavFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Scalable server-side APIs, database query optimization, asynchronous event loops, caching strategies, and containerized deployment.'
    });

    const course4 = await Course.create({
      courseCode: '24CAI0306',
      courseName: 'Deep Neural Networks',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: pradeepFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Backpropagation calculus, optimization techniques, convolutional networks, transformers, and regularization in deep learning models.'
    });

    const course5 = await Course.create({
      courseCode: '24UNI0133',
      courseName: 'Business Professional Communication',
      department: 'Humanities & Management',
      credits: 2,
      semester: 5,
      leadFaculty: pavanFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Corporate business communication, presentation mastery, executive reporting, technical documentation, and professional interviews.'
    });

    const course6 = await Course.create({
      courseCode: '25UNI0110',
      courseName: 'Numerical Aptitude & Logical Reasoning - I (NALR-I)',
      department: 'Applied Sciences & Mathematics',
      credits: 3,
      semester: 5,
      leadFaculty: jaiFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Quantitative problem solving, permutation & probability, logical deductions, data interpretation, and algorithmic aptitude.'
    });

    const course7 = await Course.create({
      courseCode: '24CSE0318',
      courseName: 'System Design',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: rohitFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'High-availability architecture, horizontal scaling, distributed caching, load balancing, CAP theorem, and microservices design.'
    });

    const course8 = await Course.create({
      courseCode: '24CAI0307',
      courseName: 'Software Design Process',
      department: 'Computer Science & Engineering',
      credits: 3,
      semester: 5,
      leadFaculty: vaibhavFaculty._id,
      maxCapacity: 60,
      isActive: true,
      description: 'Agile development workflows, design patterns, UML modeling, refactoring strategies, and continuous integration pipelines.'
    });

    // Assign courses to Prof. Rohit Kumar Thakur
    await Faculty.findByIdAndUpdate(rohitFaculty._id, {
      assignedCourses: [course1._id, course7._id]
    });
    // Assign courses to Dr. Alan Turing as well for backward compatibility
    await Faculty.findByIdAndUpdate(alanFaculty._id, {
      assignedCourses: [course1._id, course3._id, course7._id]
    });

    console.log('📚 All 8 university courses created.');

    // ── 4. Create Student: Yashika Garg (Roll: 2410993073) ──────────────────
    const yashikaUser = await User.create({
      email: 'yashika.student@university.edu',
      passwordHash: studentPass,
      firstName: 'Yashika',
      lastName: 'Garg',
      role: 'student',
      phoneNumber: '9876543073',
      isActive: true
    });

    // Create an alias student login for convenience if student ID is used as email
    const idAliasUser = await User.create({
      email: '2410993073@university.edu',
      passwordHash: studentPass,
      firstName: 'Yashika',
      lastName: 'Garg',
      role: 'student',
      phoneNumber: '9876543073',
      isActive: true
    });

    const yashikaProfile = await Student.create({
      userId: yashikaUser._id,
      studentId: '2410993073',
      department: 'Computer Science & Engineering',
      degreeProgram: 'B.E. Computer Science & Engineering (AIML)',
      currentSemester: 5,
      admissionYear: 2024,
      batch: '2024-2028',
      cgpa: 8.82,
      completedCredits: 88,
      academicAdvisor: rohitFaculty._id,
      emergencyContact: {
        name: 'Garg Family',
        relationship: 'Parent',
        phone: '+91-9876543073'
      },
      enrolledCourses: [
        { courseId: course1._id, semester: 5, status: 'enrolled' },
        { courseId: course2._id, semester: 5, status: 'enrolled' },
        { courseId: course3._id, semester: 5, status: 'enrolled' },
        { courseId: course4._id, semester: 5, status: 'enrolled' },
        { courseId: course5._id, semester: 5, status: 'enrolled' },
        { courseId: course6._id, semester: 5, status: 'enrolled' },
        { courseId: course7._id, semester: 5, status: 'enrolled' },
        { courseId: course8._id, semester: 5, status: 'enrolled' }
      ]
    });

    // Duplicate student profile for alias user so both logins point to identical student profile
    await Student.create({
      userId: idAliasUser._id,
      studentId: '2410993073-A',
      department: 'Computer Science & Engineering',
      degreeProgram: 'B.E. Computer Science & Engineering (AIML)',
      currentSemester: 5,
      admissionYear: 2024,
      batch: '2024-2028',
      cgpa: 8.82,
      completedCredits: 88,
      academicAdvisor: rohitFaculty._id,
      enrolledCourses: [
        { courseId: course1._id, semester: 5, status: 'enrolled' },
        { courseId: course2._id, semester: 5, status: 'enrolled' },
        { courseId: course3._id, semester: 5, status: 'enrolled' },
        { courseId: course4._id, semester: 5, status: 'enrolled' },
        { courseId: course5._id, semester: 5, status: 'enrolled' },
        { courseId: course6._id, semester: 5, status: 'enrolled' },
        { courseId: course7._id, semester: 5, status: 'enrolled' },
        { courseId: course8._id, semester: 5, status: 'enrolled' }
      ]
    });

    console.log('🎓 Student profile created: Yashika Garg (2410993073)');

    // ── 5. Seed Attendance Matching Portal Screenshot Exactly ───────────────
    // Exact counts from user's Image 2:
    // 1. 24CAI0205: Delivered 46, Attended 34 -> 73.91% (Rohit Kumar Thakur)
    // 2. 24CAI0302: Delivered 115, Attended 85 -> 73.91% (Vivek Singh)
    // 3. 24CAI0303: Delivered 73, Attended 55 -> 75.34% (Vaibhav Sultane)
    // 4. 24CAI0306: Delivered 74, Attended 59 -> 79.73% (Pradeep Singh)
    // 5. 24UNI0133: Delivered 26, Attended 22 -> 84.62% (S S M Pavan)
    // 6. 25UNI0110: Delivered 26, Attended 22 -> 84.62% (Jai prakash)
    // 7. 24CSE0318: Delivered 45, Attended 36 -> 80.00% (Rohit Kumar Thakur)
    // 8. 24CAI0307: Delivered 35, Attended 29 -> 82.86% (Vaibhav Sultane)
    const attendanceTargets = [
      { course: course1, faculty: rohitFaculty, delivered: 46, attended: 34, startDate: new Date('2026-06-24') },
      { course: course2, faculty: vivekFaculty, delivered: 115, attended: 85, startDate: new Date('2026-06-24') },
      { course: course3, faculty: vaibhavFaculty, delivered: 73, attended: 55, startDate: new Date('2026-06-25') },
      { course: course4, faculty: pradeepFaculty, delivered: 74, attended: 59, startDate: new Date('2026-06-29') },
      { course: course5, faculty: pavanFaculty, delivered: 26, attended: 22, startDate: new Date('2026-07-01') },
      { course: course6, faculty: jaiFaculty, delivered: 26, attended: 22, startDate: new Date('2026-06-26') },
      { course: course7, faculty: rohitFaculty, delivered: 45, attended: 36, startDate: new Date('2026-06-25') },
      { course: course8, faculty: vaibhavFaculty, delivered: 35, attended: 29, startDate: new Date('2026-06-28') }
    ];

    const attendanceRecords = [];
    for (const target of attendanceTargets) {
      const absentCount = target.delivered - target.attended;
      // Distribute absents evenly across the delivered total
      const absentInterval = absentCount > 0 ? Math.floor(target.delivered / absentCount) : 999;
      let absentsPlaced = 0;

      for (let i = 0; i < target.delivered; i++) {
        const sessionDate = new Date(target.startDate.getTime() + i * 24 * 60 * 60 * 1000 * 0.7);
        let isPresent = true;
        if (absentsPlaced < absentCount && (i % absentInterval === 0 || i >= target.delivered - (absentCount - absentsPlaced))) {
          isPresent = false;
          absentsPlaced++;
        }

        attendanceRecords.push({
          student: yashikaProfile._id,
          course: target.course._id,
          faculty: target.faculty._id,
          date: sessionDate,
          sessionType: i % 4 === 0 ? 'lab' : 'lecture',
          status: isPresent ? 'present' : 'absent',
          remarks: isPresent ? 'Attended' : 'Absent - Medical/Leave waiver not filed'
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`📊 Generated ${attendanceRecords.length} exact attendance records for Yashika.`);

    // ── 6. Seed Marks for Yashika Garg ──────────────────────────────────────
    const currentMarks = [
      { course: course1._id, faculty: rohitFaculty._id, examType: 'internal_1', examLabel: 'Mid Semester Test (MST)', marksObtained: 86, maxMarks: 100, grade: 'A', gradePoints: 8 },
      { course: course1._id, faculty: rohitFaculty._id, examType: 'quiz', examLabel: 'Quiz 1: Network Layers & Subnetting', marksObtained: 28, maxMarks: 30, grade: 'A+', gradePoints: 9 },
      { course: course2._id, faculty: vivekFaculty._id, examType: 'internal_1', examLabel: 'Mid Semester Test (MST)', marksObtained: 84, maxMarks: 100, grade: 'A', gradePoints: 8 },
      { course: course3._id, faculty: vaibhavFaculty._id, examType: 'internal_1', examLabel: 'Mid Semester Test (MST)', marksObtained: 89, maxMarks: 100, grade: 'A+', gradePoints: 9 },
      { course: course4._id, faculty: pradeepFaculty._id, examType: 'internal_1', examLabel: 'Mid Semester Test (MST)', marksObtained: 92, maxMarks: 100, grade: 'O', gradePoints: 10 },
      { course: course5._id, faculty: pavanFaculty._id, examType: 'internal_1', examLabel: 'Presentation & Case Analysis', marksObtained: 46, maxMarks: 50, grade: 'O', gradePoints: 10 },
      { course: course6._id, faculty: jaiFaculty._id, examType: 'internal_1', examLabel: 'Aptitude Speed Test 1', marksObtained: 45, maxMarks: 50, grade: 'A+', gradePoints: 9 },
      { course: course7._id, faculty: rohitFaculty._id, examType: 'internal_1', examLabel: 'System Architecture Design Doc', marksObtained: 88, maxMarks: 100, grade: 'A', gradePoints: 8 },
      { course: course8._id, faculty: vaibhavFaculty._id, examType: 'internal_1', examLabel: 'Agile Sprint Deliverable 1', marksObtained: 85, maxMarks: 100, grade: 'A', gradePoints: 8 }
    ];

    for (const m of currentMarks) {
      await Marks.create({
        student: yashikaProfile._id,
        course: m.course,
        faculty: m.faculty,
        examType: m.examType,
        examLabel: m.examLabel,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        grade: m.grade,
        gradePoints: m.gradePoints,
        semester: 5,
        isPublished: true
      });
    }

    // Historical Semester 1 - 4 SGPA records
    const historicalSemMarks = [
      { sem: 1, courseCode: 'CS101', courseName: 'Programming in C', marks: 88, grade: 'A+', gradePoints: 9 },
      { sem: 2, courseCode: 'CS102', courseName: 'Object Oriented Programming', marks: 92, grade: 'O', gradePoints: 10 },
      { sem: 3, courseCode: 'CS201', courseName: 'Data Structures & Algorithms', marks: 85, grade: 'A', gradePoints: 8 },
      { sem: 4, courseCode: 'CS205', courseName: 'Operating Systems & Concurrency', marks: 87, grade: 'A', gradePoints: 8 }
    ];

    for (const hm of historicalSemMarks) {
      await Marks.create({
        student: yashikaProfile._id,
        course: course1._id,
        faculty: rohitFaculty._id,
        examType: 'final',
        examLabel: `${hm.courseName} End-Term`,
        marksObtained: hm.marks,
        maxMarks: 100,
        grade: hm.grade,
        gradePoints: hm.gradePoints,
        semester: hm.sem,
        isPublished: true
      });
    }
    console.log('🎯 Marks and academic records seeded.');

    // ── 7. Seed Assignments ─────────────────────────────────────────────────
    await Assignment.create({
      course: course1._id,
      createdBy: rohitFaculty._id,
      title: 'Assignment 2: Network Topologies & Packet Routing Analysis',
      description: 'Implement Dijkstra and Bellman-Ford shortest-path algorithms and capture Wireshark packet traces for TCP 3-way handshake.',
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // in 4 days
      maxScore: 100,
      allowedFileTypes: ['pdf', 'docx', 'zip'],
      submissions: [
        {
          student: yashikaProfile._id,
          fileUrl: 'Yashika_Garg_2410993073_Assignment2_Networks.pdf',
          submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'submitted'
        }
      ]
    });

    await Assignment.create({
      course: course3._id,
      createdBy: vaibhavFaculty._id,
      title: 'Lab 3: REST API Authentication & Dockerization',
      description: 'Build a production-ready Express API with JWT authentication and containerize using a multi-stage Dockerfile.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 50,
      allowedFileTypes: ['pdf', 'zip'],
      submissions: []
    });

    await Assignment.create({
      course: course4._id,
      createdBy: pradeepFaculty._id,
      title: 'Assignment 1: Deep Convolutional Neural Networks on PyTorch',
      description: 'Train a ResNet-18 model on CIFAR-10, implement data augmentation, and report top-1 and top-5 accuracy.',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      allowedFileTypes: ['pdf', 'ipynb'],
      submissions: [
        {
          student: yashikaProfile._id,
          fileUrl: 'Yashika_Garg_CIFAR10_ResNet.ipynb',
          submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          status: 'graded',
          grade: 94,
          feedback: 'Excellent hyperparameter tuning and clear convergence plots.'
        }
      ]
    });

    await Assignment.create({
      course: course7._id,
      createdBy: rohitFaculty._id,
      title: 'System Design Case Study: Distributed Cache & Message Queue Architecture',
      description: 'Architect a low-latency URL shortener handling 100k requests/sec. Include capacity estimation and cache invalidation strategies.',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      allowedFileTypes: ['pdf'],
      submissions: []
    });

    console.log('📝 Assignments created for Yashika’s courses.');

    // ── 8. Seed Exam Schedules (5th Semester B.E. AIML) ──────────────────────
    await ExamSchedule.insertMany([
      {
        course: course1._id,
        courseCode: '24CAI0205',
        courseName: 'Computer Networks & Data Communication',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-08T09:00:00.000Z'),
        startTime: '09:00',
        endTime: '12:00',
        shift: 'Morning',
        venue: 'Examination Hall A, Block 3',
        seatNumber: 'G07-073',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course2._id,
        courseCode: '24CAI0302',
        courseName: 'Programming Abstractions for AI',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-11T09:00:00.000Z'),
        startTime: '09:00',
        endTime: '12:00',
        shift: 'Morning',
        venue: 'Examination Hall B, Block 2',
        seatNumber: 'G07-073',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course3._id,
        courseCode: '24CAI0303',
        courseName: 'Back End Engineering',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-14T14:00:00.000Z'),
        startTime: '14:00',
        endTime: '17:00',
        shift: 'Afternoon',
        venue: 'Examination Hall C, Block 3',
        seatNumber: 'G07-073',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course4._id,
        courseCode: '24CAI0306',
        courseName: 'Deep Neural Networks',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-17T09:00:00.000Z'),
        startTime: '09:00',
        endTime: '12:00',
        shift: 'Morning',
        venue: 'Examination Hall A, Block 2',
        seatNumber: 'G07-073',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course7._id,
        courseCode: '24CSE0318',
        courseName: 'System Design',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-20T14:00:00.000Z'),
        startTime: '14:00',
        endTime: '17:00',
        shift: 'Afternoon',
        venue: 'Examination Hall B, Block 1',
        seatNumber: 'G07-073',
        hallTicketStatus: 'available',
        status: 'upcoming'
      }
    ]);
    console.log('🗓️  Semester 5 Examination Schedules seeded.');

    // ── 9. Seed Notices Posted by Faculty (Prof. Rohit Kumar Thakur) ─────────
    const notice1 = await Notice.create({
      title: 'Lab Session Rescheduling: Computer Networks (24CAI0205)',
      content: 'Please note that the upcoming hands-on lab on Socket Programming scheduled for Thursday will be conducted in Block 3, Lab 412 from 02:00 PM to 04:00 PM.',
      category: 'Academic',
      priority: 'high',
      targetAudience: 'student',
      department: 'Computer Science & Engineering',
      isPinned: true,
      author: rohitUser._id,
      authorName: 'Prof. Rohit Kumar Thakur',
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    });

    const notice2 = await Notice.create({
      title: 'Attendance Advisory: Minimum 75% Cutoff in 24CAI0205',
      content: 'Students whose attendance in 24CAI0205 has fallen below 75% must attend mandatory tutorial makeup hours to avoid debarment from the upcoming final examinations.',
      category: 'Academic',
      priority: 'urgent',
      targetAudience: 'student',
      department: 'Computer Science & Engineering',
      isPinned: true,
      author: rohitUser._id,
      authorName: 'Prof. Rohit Kumar Thakur',
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000)
    });

    const notice3 = await Notice.create({
      title: 'Mid-Semester Hall Tickets Released for 5th Semester B.E. (AIML)',
      content: 'Digital Hall Tickets for the Fall 2026 mid-term evaluations are now live. Verify your course enrollments and seat numbers on the Examination portal tab.',
      category: 'Examinations',
      priority: 'high',
      targetAudience: 'student',
      department: 'Computer Science & Engineering',
      isPinned: false,
      author: adminUser._id,
      authorName: 'Office of Controller of Examinations',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    const notice4 = await Notice.create({
      title: 'HackUni 2026: 36-Hour National AI & Cloud Hackathon',
      content: 'Registrations are open for the annual university hackathon in collaboration with Microsoft Azure and IEEE Student Branch. Win prizes and cloud credits.',
      category: 'Events',
      priority: 'medium',
      targetAudience: 'all',
      department: 'All Departments',
      isPinned: false,
      author: adminUser._id,
      authorName: 'ACM & IEEE Student Chapters',
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });

    console.log('📢 Notices & Bulletins created.');

    // ── 10. Seed In-App Notifications for Yashika Garg ───────────────────────
    await Notification.create({
      recipient: yashikaUser._id,
      sender: rohitUser._id,
      type: 'attendance_alert',
      priority: 'critical',
      title: 'Low Attendance Warning: 24CAI0205 (73.91%)',
      message: 'Your attendance in Computer Networks & Data Communication is 73.91% (34/46 classes). Minimum 75% required under university regulations.',
      actionUrl: '/attendance',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    await Notification.create({
      recipient: yashikaUser._id,
      sender: vivekUser._id,
      type: 'attendance_alert',
      priority: 'high',
      title: 'Attendance Alert: 24CAI0302 (73.91%)',
      message: 'Your attendance in Programming Abstractions for AI has dropped below 75% (85/115 classes). Attend upcoming lectures to clear eligibility.',
      actionUrl: '/attendance',
      isRead: false,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
    });

    await Notification.create({
      recipient: yashikaUser._id,
      sender: rohitUser._id,
      type: 'assignment_deadline',
      priority: 'medium',
      title: 'Assignment Due in 4 Days',
      message: 'Assignment 2 for Computer Networks & Data Communication (24CAI0205) is due on Friday.',
      actionUrl: '/assignments',
      isRead: false,
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
    });

    await Notification.create({
      recipient: yashikaUser._id,
      sender: adminUser._id,
      type: 'exam_reminder',
      priority: 'high',
      title: 'Final Examination Timetable Released',
      message: 'Your 5th Semester exam schedule has been published. Seat Number: G07-073 assigned in Examination Hall A.',
      actionUrl: '/exam-schedule',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    await Notification.create({
      recipient: yashikaUser._id,
      sender: rohitUser._id,
      type: 'system_announcement',
      priority: 'medium',
      title: 'Lab Session Rescheduling Notice',
      message: 'Prof. Rohit Kumar Thakur posted a new bulletin regarding Lab 412 timing.',
      actionUrl: '/student/dashboard',
      isRead: true,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    });

    console.log('🔔 Notifications created for Yashika Garg.');

    // ── 11. Seed Digital Twin for Prof. Rohit Kumar Thakur ───────────────────
    await DigitalTwin.create({
      faculty: rohitFaculty._id,
      createdBy: rohitUser._id,
      twinName: 'Prof. Rohit Thakur AI Twin',
      subject: 'Computer Networks & Data Communication (24CAI0205)',
      personality: 'encouraging',
      greetingMessage: 'Hello Yashika! I am Prof. Rohit Kumar Thakur’s AI Teaching Twin for Computer Networks (24CAI0205). Ask me anything about OSI layers, TCP sliding windows, routing algorithms, or exam preparation!',
      avatarEmoji: '👨‍🏫',
      knowledgeBase: [
        {
          type: 'syllabus',
          title: '24CAI0205 Course Syllabus & Rubric',
          content: 'Course 24CAI0205 covers: Module 1 (Physical & Data Link Layers, Framing, HDLC), Module 2 (Network Layer, IPv4/IPv6, CIDR Subnetting, OSPF, BGP), Module 3 (Transport Layer, TCP Flow Control, Congestion Window, UDP), Module 4 (Application Layer, DNS, HTTP/2, TLS handshake).'
        },
        {
          type: 'lecture_notes',
          title: 'TCP Flow Control & Sliding Window Protocol',
          content: 'TCP uses a dynamic sliding window where sender window size is min(rwnd, cwnd). Slow start doubles cwnd every RTT until ssthresh, followed by linear congestion avoidance.'
        }
      ],
      faqs: [
        {
          question: 'What is the attendance criteria for 24CAI0205?',
          answer: 'Students must maintain at least 75% attendance. Students below 75% must complete makeup lab hours.'
        },
        {
          question: 'What topics are most important for the End-Term exam?',
          answer: 'Focus on Subnetting (CIDR), Dijkstra vs Bellman-Ford routing, and TCP 3-way handshake with sequence numbers.'
        }
      ],
      isActive: true,
      isPublicToStudents: true,
      analytics: {
        totalDoubtsResolved: 48,
        averageSatisfactionRating: 4.9,
        activeStudentUsers: 24
      }
    });

    console.log('🤖 Digital Twin created for Prof. Rohit Kumar Thakur.');

    // ── 12. Seed FAQs for RAG & Helpdesk ─────────────────────────────────────
    await FAQ.insertMany([
      {
        question: 'What is the minimum attendance required to appear in semester examinations?',
        answer: 'Students must maintain a minimum of 75% attendance in each enrolled course to be eligible for end-semester examinations under Academic Regulation 4.2. Students falling below 75% will be debarred unless medical exemption (Form MED-1) is approved by the Academic Dean.',
        category: 'Academics',
        tags: ['attendance', 'eligibility', '75%', 'debarment'],
        targetAudience: ['student', 'all'],
        isPublished: true,
        helpfulCount: 165
      },
      {
        question: 'How can I calculate how many classes I can safely miss?',
        answer: 'Use the Bunk / Safe Attendance Calculator on the Student Dashboard or Attendance page. The formula is: (Attended Classes / Total Classes) >= 0.75. If your attendance is already below 75%, the calculator shows the exact number of consecutive lectures you must attend to cross the 75% threshold.',
        category: 'Academics',
        tags: ['attendance', 'calculator', 'threshold'],
        targetAudience: ['student'],
        isPublished: true,
        helpfulCount: 142
      },
      {
        question: 'Where can I access my Examination Hall Ticket / Admit Card?',
        answer: 'Navigate to the Exam Schedule tab on the Student Portal. Once verified by the Controller of Examinations and after clearing fee/attendance criteria, you can view your digital admit card with venue and seat number details.',
        category: 'Examinations',
        tags: ['exam', 'hall ticket', 'admit card', 'seat'],
        targetAudience: ['student'],
        isPublished: true,
        helpfulCount: 98
      },
      {
        question: 'How do I submit an assignment for evaluation?',
        answer: 'Open the Assignments page, select your course, and upload your solution file (PDF, DOCX, or ZIP). Submissions are recorded with timestamp and evaluated by the course faculty with direct score and feedback updates.',
        category: 'Academics',
        tags: ['assignment', 'upload', 'submission'],
        targetAudience: ['student'],
        isPublished: true,
        helpfulCount: 88
      }
    ]);

    // ── 13. Seed Badges ──────────────────────────────────────────────────────
    await Badge.insertMany([
      {
        badgeCode: 'DEANS_HONORS',
        title: "Dean's Merit Scholar",
        description: 'Achieved an outstanding CGPA of 8.5 or higher in B.E. AIML.',
        iconName: 'GraduationCap',
        xpPoints: 500,
        category: 'Academic'
      },
      {
        badgeCode: 'QUIZ_CHAMPION',
        title: 'Network Systems Ace',
        description: 'Scored 90%+ in Computer Networks Unit Assessments.',
        iconName: 'Sparkles',
        xpPoints: 300,
        category: 'Academic'
      },
      {
        badgeCode: 'AI_PIONEER',
        title: 'Deep Learning Contender',
        description: 'Completed PyTorch Neural Network deployment project.',
        iconName: 'Award',
        xpPoints: 350,
        category: 'Career'
      }
    ]);

    console.log('\n===============================================================');
    console.log('🎉 UNIFIED UNIVERSITY PORTAL SEED COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');
    console.log('🎓 STUDENT CREDENTIALS:');
    console.log('   Email:     yashika.student@university.edu (or 2410993073@university.edu)');
    console.log('   Password:  Student@1234');
    console.log('   Student:   Yashika Garg (Roll: 2410993073)');
    console.log('   Degree:    B.E. Computer Science & Engineering (AIML) - 5th Semester\n');
    console.log('👨‍🏫 FACULTY CREDENTIALS:');
    console.log('   Email:     rohit.thakur@university.edu (or dr.alan@university.edu)');
    console.log('   Password:  Faculty@1234');
    console.log('   Faculty:   Prof. Rohit Kumar Thakur (Associate Professor)');
    console.log('   Courses:   24CAI0205 (Computer Networks) & 24CSE0318 (System Design)\n');
    console.log('🛡️  ADMIN CREDENTIALS:');
    console.log('   Email:     admin@uniassist.edu');
    console.log('   Password:  Admin@1234');
    console.log('===============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder Error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
