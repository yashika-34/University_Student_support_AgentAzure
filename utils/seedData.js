/**
 * seedData.js — Comprehensive Bootstrap demo data for UniAssist AI Portal
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
import Notice from '../models/Notice.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Document from '../models/Document.js';
import CampusEvent from '../models/CampusEvent.js';
import Scholarship from '../models/Scholarship.js';
import Placement from '../models/Placement.js';
import StudyPlan from '../models/StudyPlan.js';
import Badge from '../models/Badge.js';
import ForumPost from '../models/ForumPost.js';
import Ticket from '../models/Ticket.js';
import Appointment from '../models/Appointment.js';

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
      Notification.deleteMany({}),
      Notice.deleteMany({}),
      ExamSchedule.deleteMany({}),
      Document.deleteMany({}),
      CampusEvent.deleteMany({}),
      Scholarship.deleteMany({}),
      Placement.deleteMany({}),
      StudyPlan.deleteMany({}),
      Badge.deleteMany({}),
      ForumPost.deleteMany({}),
      Ticket.deleteMany({}),
      Appointment.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing collections.');

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
      officeHours: [
        { dayOfWeek: 'Tuesday', startTime: '14:00', endTime: '16:00', location: 'Turing Hall, Room 302' },
        { dayOfWeek: 'Thursday', startTime: '14:00', endTime: '16:00', location: 'Turing Hall, Room 302' }
      ]
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

    const course3 = await Course.create({
      courseCode: 'CS-309',
      courseName: 'Artificial Intelligence & Neural Networks',
      department: 'Computer Science & Engineering',
      credits: 4,
      semester: 5,
      leadFaculty: faculty._id,
      maxStudents: 55,
      isActive: true
    });

    const course4 = await Course.create({
      courseCode: 'CS-302',
      courseName: 'Database Management Systems',
      department: 'Computer Science & Engineering',
      credits: 3,
      semester: 5,
      leadFaculty: faculty._id,
      maxStudents: 60,
      isActive: true
    });

    await Faculty.findByIdAndUpdate(faculty._id, {
      assignedCourses: [course1._id, course2._id, course3._id, course4._id]
    });

    console.log('📚 4 Courses created.');

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
        phoneNumber: '+1-555-0123',
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
        academicAdvisor: faculty._id,
        emergencyContact: {
          name: `${sd.lastName} Family`,
          relationship: 'Parent',
          phone: '+1-555-9988'
        },
        enrolledCourses: [
          { courseId: course1._id, semester: 5, status: 'enrolled' },
          { courseId: course2._id, semester: 5, status: 'enrolled' },
          { courseId: course3._id, semester: 5, status: 'enrolled' }
        ]
      });

      studentProfiles.push(s);
    }

    console.log('🎓 5 Students created.');

    // ── 4. Seed Attendance Records ──────────────────────────────────────────
    // Alex Mercer: CS-301: 21/24 (87.5%), CS-305: 13/18 (72.2% - CRITICAL ALERT!), CS-309: 19/20 (95%)
    const attendancePlan = [
      // Alex Mercer
      {
        studentIdx: 0,
        courses: [
          { course: course1, total: 24, present: 21 },
          { course: course2, total: 18, present: 13 },
          { course: course3, total: 20, present: 19 }
        ]
      },
      // Emma Watson
      {
        studentIdx: 1,
        courses: [
          { course: course1, total: 24, present: 18 },
          { course: course2, total: 18, present: 15 },
          { course: course3, total: 20, present: 18 }
        ]
      },
      // Liam Smith
      {
        studentIdx: 2,
        courses: [
          { course: course1, total: 24, present: 16 },
          { course: course2, total: 18, present: 11 }, // < 75%
          { course: course3, total: 20, present: 15 }
        ]
      },
      // Priya Patel
      {
        studentIdx: 3,
        courses: [
          { course: course1, total: 24, present: 23 },
          { course: course2, total: 18, present: 18 },
          { course: course3, total: 20, present: 20 }
        ]
      },
      // Carlos Rivera
      {
        studentIdx: 4,
        courses: [
          { course: course1, total: 24, present: 20 },
          { course: course2, total: 18, present: 14 },
          { course: course3, total: 20, present: 17 }
        ]
      }
    ];

    for (const plan of attendancePlan) {
      const student = studentProfiles[plan.studentIdx];
      for (const item of plan.courses) {
        for (let i = 0; i < item.total; i++) {
          const d = new Date('2026-08-01');
          d.setDate(d.getDate() + i * 2);
          const isPresent = i < item.present;
          await Attendance.create({
            student: student._id,
            course: item.course._id,
            faculty: faculty._id,
            date: d,
            status: isPresent ? 'present' : 'absent',
            sessionType: 'lecture'
          });
        }
      }
    }

    console.log('📊 Attendance records created.');

    // ── 5. Seed Marks (Semesters 1 - 5) ─────────────────────────────────────
    const historicalSemesters = [
      { sem: 1, courseCode: 'CS-101', courseName: 'Intro to Computer Science', credits: 4, marks: 88, grade: 'A', gradePoints: 9 },
      { sem: 1, courseCode: 'MATH-101', courseName: 'Calculus & Linear Algebra', credits: 4, marks: 82, grade: 'A', gradePoints: 8 },
      { sem: 2, courseCode: 'CS-102', courseName: 'Data Structures in C++', credits: 4, marks: 91, grade: 'A+', gradePoints: 10 },
      { sem: 2, courseCode: 'MATH-102', courseName: 'Discrete Mathematics', credits: 3, marks: 85, grade: 'A', gradePoints: 9 },
      { sem: 3, courseCode: 'CS-201', courseName: 'Computer Architecture & Org', credits: 4, marks: 89, grade: 'A', gradePoints: 9 },
      { sem: 3, courseCode: 'CS-205', courseName: 'Operating Systems & Concurrency', credits: 4, marks: 87, grade: 'A', gradePoints: 9 },
      { sem: 4, courseCode: 'CS-208', courseName: 'Theory of Computation', credits: 3, marks: 93, grade: 'O', gradePoints: 10 },
      { sem: 4, courseCode: 'CS-210', courseName: 'Computer Networks', credits: 4, marks: 90, grade: 'O', gradePoints: 10 }
    ];

    // Current Semester 5 Marks for Alex Mercer
    const alexCurrentMarks = [
      {
        course: course1._id,
        examType: 'internal_1',
        examLabel: 'Unit Test 1 — Dynamic Programming',
        marksObtained: 78,
        maxMarks: 100,
        grade: 'B+',
        gradePoints: 7,
        semester: 5
      },
      {
        course: course1._id,
        examType: 'midterm',
        examLabel: 'Mid Semester Examination',
        marksObtained: 85,
        maxMarks: 100,
        grade: 'A+',
        gradePoints: 9,
        semester: 5
      },
      {
        course: course2._id,
        examType: 'internal_1',
        examLabel: 'Unit Test 1 — Virtualization & Containers',
        marksObtained: 68,
        maxMarks: 100,
        grade: 'B',
        gradePoints: 6,
        semester: 5
      },
      {
        course: course3._id,
        examType: 'internal_1',
        examLabel: 'Quiz 1 — Neural Network Backpropagation',
        marksObtained: 94,
        maxMarks: 100,
        grade: 'O',
        gradePoints: 10,
        semester: 5
      },
      {
        course: course3._id,
        examType: 'midterm',
        examLabel: 'Mid Semester Examination',
        marksObtained: 91,
        maxMarks: 100,
        grade: 'A+',
        gradePoints: 9,
        semester: 5
      }
    ];

    for (const m of alexCurrentMarks) {
      await Marks.create({
        student: studentProfiles[0]._id,
        course: m.course,
        faculty: faculty._id,
        examType: m.examType,
        examLabel: m.examLabel,
        marksObtained: m.marksObtained,
        maxMarks: m.maxMarks,
        grade: m.grade,
        gradePoints: m.gradePoints,
        semester: m.semester,
        isPublished: true
      });
    }

    // Historical marks for Alex (Sem 1 - 4) for GPA trend
    for (const hm of historicalSemesters) {
      await Marks.create({
        student: studentProfiles[0]._id,
        course: course1._id, // placeholder ref
        faculty: faculty._id,
        examType: 'final',
        examLabel: `${hm.courseName} Final`,
        marksObtained: hm.marks,
        maxMarks: 100,
        grade: hm.grade,
        gradePoints: hm.gradePoints,
        semester: hm.sem,
        isPublished: true
      });
    }

    // Add marks for remaining 4 students
    for (let i = 1; i < studentProfiles.length; i++) {
      await Marks.create({
        student: studentProfiles[i]._id,
        course: course1._id,
        faculty: faculty._id,
        examType: 'internal_1',
        examLabel: 'Unit Test 1',
        marksObtained: 65 + i * 6,
        maxMarks: 100,
        grade: i === 3 ? 'O' : 'A',
        gradePoints: i === 3 ? 10 : 8,
        semester: 5,
        isPublished: true
      });
      await Marks.create({
        student: studentProfiles[i]._id,
        course: course1._id,
        faculty: faculty._id,
        examType: 'midterm',
        examLabel: 'Mid Semester Exam',
        marksObtained: 70 + i * 5,
        maxMarks: 100,
        grade: i === 3 ? 'O' : 'A+',
        gradePoints: i === 3 ? 10 : 9,
        semester: 5,
        isPublished: true
      });
    }

    console.log('🎯 Marks seeded.');

    // ── 6. Seed Assignments ─────────────────────────────────────────────────
    const asg1 = await Assignment.create({
      course: course1._id,
      createdBy: faculty._id,
      title: 'Problem Set 1: Dynamic Programming & Memoization',
      description: 'Implement memoized and bottom-up solutions for 0/1 Knapsack and Longest Common Subsequence. Include complexity proofs.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // due in 3 days
      maxScore: 100,
      allowedFileTypes: ['pdf', 'docx', 'zip'],
      submissions: [
        {
          student: studentProfiles[1]._id,
          fileUrl: 'Emma_Watson_PS1_DP.pdf',
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          status: 'submitted'
        },
        {
          student: studentProfiles[3]._id,
          fileUrl: 'Priya_Patel_Knapsack_Analysis.pdf',
          submittedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
          status: 'graded',
          grade: 96,
          feedback: 'Excellent proofs and clean asymptotic analysis.'
        }
      ]
    });

    const asg2 = await Assignment.create({
      course: course2._id,
      createdBy: faculty._id,
      title: 'Lab 2: Docker Container Deployment on Azure Kubernetes',
      description: 'Containerize a multi-tier microservice application and configure Kubernetes deployment manifests with automated health probes.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
      maxScore: 50,
      allowedFileTypes: ['pdf', 'zip'],
      submissions: [
        {
          student: studentProfiles[0]._id, // Alex Mercer submitted
          fileUrl: 'Alex_Mercer_Lab2_Docker_K8s.pdf',
          submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          status: 'submitted'
        }
      ]
    });

    const asg3 = await Assignment.create({
      course: course3._id,
      createdBy: faculty._id,
      title: 'Mini Project: Transformer Self-Attention Implementation',
      description: 'Build scaled dot-product attention from scratch using PyTorch and evaluate on sentiment classification benchmark.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      allowedFileTypes: ['pdf', 'zip', 'ipynb'],
      submissions: []
    });

    console.log('📝 Assignments created.');

    // ── 7. Seed Notices / Announcements ─────────────────────────────────────
    await Notice.insertMany([
      {
        title: 'Final Examination Hall Tickets Available for Download',
        content: 'Digital Hall Tickets for Fall 2026 final exams are now active on the portal. Ensure your course fees are cleared and aggregate attendance meets the 75% threshold.',
        category: 'Examinations',
        priority: 'high',
        targetAudience: 'student',
        isPinned: true,
        authorName: 'Office of the Controller of Examinations',
        publishedAt: new Date()
      },
      {
        title: 'Attendance Advisory: Minimum 75% Mandatory Attendance',
        content: 'Students with attendance below 75% in any registered course face automatic examination debarment under Academic Regulation 4.2. Review your attendance index immediately.',
        category: 'Academic',
        priority: 'urgent',
        targetAudience: 'student',
        isPinned: true,
        authorName: 'Academic Affairs Dean',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        title: 'HackUni 2026: 36-Hour Generative AI Hackathon Registration',
        content: 'Registrations are open for the annual university hackathon hosted with Microsoft Azure. Win cash prizes and direct interview opportunities with top tech companies.',
        category: 'Events',
        priority: 'medium',
        targetAudience: 'all',
        isPinned: false,
        authorName: 'ACM Student Chapter',
        publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },
      {
        title: 'Tuition Fee Payment Deadline for Fall 2026',
        content: 'The final date to pay the balance tuition fees without a late fee penalty is October 15th, 2026. Electronic receipts will reflect in the student billing center.',
        category: 'Administrative',
        priority: 'medium',
        targetAudience: 'student',
        isPinned: false,
        authorName: 'Bursar Financial Services',
        publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000)
      }
    ]);

    console.log('📢 Notices created.');

    // ── 8. Seed Exam Schedules ──────────────────────────────────────────────
    await ExamSchedule.insertMany([
      {
        course: course1._id,
        courseCode: 'CS-301',
        courseName: 'Algorithms & Complexity',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-10T09:00:00.000Z'),
        startTime: '09:00',
        endTime: '12:00',
        shift: 'Morning',
        venue: 'Examination Hall A, Block 3',
        seatNumber: 'A-42',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course2._id,
        courseCode: 'CS-305',
        courseName: 'Cloud Computing & Distributed Systems',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-12T14:00:00.000Z'),
        startTime: '14:00',
        endTime: '17:00',
        shift: 'Afternoon',
        venue: 'Examination Hall B, Block 3',
        seatNumber: 'B-17',
        hallTicketStatus: 'available',
        status: 'upcoming'
      },
      {
        course: course3._id,
        courseCode: 'CS-309',
        courseName: 'AI & Neural Networks',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Final Examination',
        date: new Date('2026-12-15T09:00:00.000Z'),
        startTime: '09:00',
        endTime: '12:00',
        shift: 'Morning',
        venue: 'Examination Hall A, Block 3',
        seatNumber: 'A-88',
        hallTicketStatus: 'pending',
        status: 'upcoming'
      },
      {
        course: course4._id,
        courseCode: 'CS-302',
        courseName: 'Database Management Systems',
        semester: 5,
        term: 'Fall 2026',
        examType: 'Internal Assessment 2',
        date: new Date('2026-11-22T10:00:00.000Z'),
        startTime: '10:00',
        endTime: '11:30',
        shift: 'Morning',
        venue: 'Lecture Hall 201',
        seatNumber: 'Roll Order',
        hallTicketStatus: 'not_required',
        status: 'completed'
      }
    ]);

    console.log('🗓️  Exam Schedules created.');

    // ── 9. Seed Documents for RAG Knowledge Base ────────────────────────────
    await Document.create({
      docId: 'doc-handbook-2026',
      title: 'University Academic Handbook & Examination Regulations 2026',
      originalName: 'academic_regulations_2026.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      category: 'Regulations',
      uploadedBy: facultyUser.email,
      totalChunks: 3,
      indexedChunks: 3,
      azureIndexed: false,
      chunks: [
        {
          chunkId: 'doc-handbook-chunk-0',
          chunkIndex: 0,
          content: 'Section 4: Attendance Policies and Debarment Criteria. All undergraduate students must maintain a minimum aggregate attendance of 75% in each enrolled course. Students falling below 75% attendance are automatically barred from sitting the end-semester final examinations unless official medical leave (Form MED-1) was approved by the Academic Dean prior to the exam date.'
        },
        {
          chunkId: 'doc-handbook-chunk-1',
          chunkIndex: 1,
          content: 'Section 6: Grading Scheme and SGPA/CGPA Calculation. The 10-point credit grade point scale is applied: O (Outstanding, 10), A+ (Excellent, 9), A (Very Good, 8), B+ (Good, 7), B (Above Average, 6), C (Average, 5), D (Pass, 4), F (Fail, 0). Semester Grade Point Average (SGPA) is computed as sum of (Credits * Grade Points) / Total Credits.'
        },
        {
          chunkId: 'doc-handbook-chunk-2',
          chunkIndex: 2,
          content: 'Section 8: Hall Tickets and Examination Conduct. Hall tickets are issued digitally through the student portal 7 days before examination commencement. Students must display either a printed copy or verified digital hall ticket along with their university student ID card.'
        }
      ]
    });

    await Document.create({
      docId: 'doc-bursar-fees-2026',
      title: 'Bursar Office Tuition Fees & Scholarship Waiver Guidelines',
      originalName: 'bursar_tuition_fee_schedule_2026.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 524288,
      category: 'Fees & Financial Aid',
      uploadedBy: facultyUser.email,
      totalChunks: 2,
      indexedChunks: 2,
      azureIndexed: false,
      chunks: [
        {
          chunkId: 'doc-bursar-chunk-0',
          chunkIndex: 0,
          content: 'Tuition Fee Payment Deadlines and Late Surcharges. Fall semester tuition must be settled by October 15th, 2026. A late fine of $50 per week applies for payments between October 16th and October 25th. Non-payment beyond October 25th results in administrative hold on registration and hall tickets.'
        },
        {
          chunkId: 'doc-bursar-chunk-1',
          chunkIndex: 1,
          content: 'Merit Scholarship Waivers. Students maintaining a CGPA of 3.75 or higher qualify for the Presidential Merit Fellowship providing up to $5,000 per semester tuition reduction. Applications must be submitted through the Campus Services portal before October 31st.'
        }
      ]
    });

    console.log('📑 Knowledge Documents for RAG created in MongoDB.');

    // ── 10. Seed FAQs ───────────────────────────────────────────────────────
    await FAQ.insertMany([
      {
        question: 'What is the minimum attendance requirement to appear for final examinations?',
        answer: 'University academic regulations mandate a minimum of 75% aggregate attendance in each registered course. Students below 75% are ineligible for final exams unless official medical leave (Form MED-1) is approved.',
        category: 'Academics',
        helpfulCount: 84,
        isPublished: true
      },
      {
        question: 'When is the deadline to pay Fall semester tuition fees?',
        answer: 'The regular tuition fee payment deadline is October 15th, 2026. A late fee penalty of $50 applies from October 16th to October 25th.',
        category: 'Fees & Financial Aid',
        helpfulCount: 65,
        isPublished: true
      },
      {
        question: 'Where is the Student Health and Counseling Center located?',
        answer: 'The Student Health Center is located on the ground floor of the Campus Wellness Pavilion (Building D, Room 102). It is open Monday to Friday from 8:00 AM to 6:00 PM.',
        category: 'Campus Facilities',
        helpfulCount: 42,
        isPublished: true
      },
      {
        question: 'How do I download my official examination Hall Ticket / Admit Card?',
        answer: 'Navigate to the Exam Schedule tab in the student portal 7 days prior to exam commencement to view your verified digital hall ticket, room allocation, and downloadable QR badge.',
        category: 'Examinations',
        helpfulCount: 57,
        isPublished: true
      }
    ]);

    console.log('❓ FAQs seeded.');

    // ── 11. Seed Campus Events, Scholarships, Placements ────────────────────
    await CampusEvent.insertMany([
      {
        title: 'HackUni 2026: 36-Hour Generative AI Hackathon',
        category: 'Hackathon',
        eventDate: new Date('2026-10-18T09:00:00.000Z'),
        venue: 'Student Innovation Center & Azure Cloud Lab',
        organizer: 'ACM Student Chapter & Google Developer Student Club',
        capacity: 250,
        registeredCount: 184,
        isRegistered: true,
        badgeAwarded: 'Hackathon Contender',
        description: 'Compete with 50+ multidisciplinary teams building AI solutions on Azure AI Foundry and Kubernetes.'
      },
      {
        title: 'Industry Keynote: The Future of Distributed Systems',
        category: 'Guest Lecture',
        eventDate: new Date('2026-10-22T15:00:00.000Z'),
        venue: 'University Grand Auditorium',
        organizer: 'Department of Computer Science',
        capacity: 400,
        registeredCount: 290,
        isRegistered: false,
        badgeAwarded: 'Tech Enthusiast',
        description: 'Distinguished lecture by leading cloud architects from Microsoft and open Q&A on scalable microservices.'
      }
    ]);

    await Scholarship.insertMany([
      {
        title: 'Presidential Academic Excellence Merit Fellowship',
        provider: 'University Board of Regents',
        amount: '$5,000 / semester',
        minCgpa: 3.75,
        deadline: new Date('2026-10-31'),
        isEligible: true,
        matchScore: '98% Match',
        description: 'Awarded to top 5% GPA students maintaining exceptional academic and research standing.'
      },
      {
        title: 'Women in Technology & AI Innovation Grant',
        provider: 'Azure Global STEM Foundation',
        amount: '$3,500 / year',
        minCgpa: 3.4,
        deadline: new Date('2026-11-15'),
        isEligible: true,
        matchScore: '92% Match',
        description: 'Empowers underrepresented student researchers in machine learning, cloud computing, and cybersecurity.'
      }
    ]);

    await Placement.insertMany([
      {
        companyName: 'Microsoft Corporation',
        tier: 'Tier-1 (Super Dream)',
        roleTitle: 'Software Development Engineer I',
        packageLPA: 45.0,
        minCgpa: 3.5,
        maxBacklogsAllowed: 0,
        eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
        requiredSkills: ['Data Structures & Algorithms', 'System Design', 'C++/Java/Python'],
        deadline: new Date('2026-10-15')
      },
      {
        companyName: 'Amazon Web Services (AWS)',
        tier: 'Tier-1 (Super Dream)',
        roleTitle: 'Cloud Support / DevOps Associate',
        packageLPA: 32.5,
        minCgpa: 3.3,
        maxBacklogsAllowed: 0,
        eligibleDepartments: ['Computer Science & Engineering'],
        requiredSkills: ['Linux', 'Docker', 'Networking', 'Distributed Systems'],
        deadline: new Date('2026-10-22')
      }
    ]);

    await Badge.insertMany([
      {
        badgeCode: 'PERFECT_ATTENDANCE',
        title: 'Attendance Titan',
        description: 'Maintained 95%+ attendance across all registered courses for 4 consecutive weeks.',
        category: 'Attendance',
        iconName: 'Award',
        xpPoints: 250
      },
      {
        badgeCode: 'QUIZ_MASTER',
        title: 'Quiz Champion',
        description: 'Completed 10 AI generated practice quizzes with an average score above 85%.',
        category: 'Academic',
        iconName: 'Sparkles',
        xpPoints: 300
      }
    ]);

    // ── 12. Seed Notifications ──────────────────────────────────────────────
    for (const s of studentProfiles.slice(0, 3)) {
      await Notification.create({
        recipient: s.userId,
        type: 'attendance_alert',
        priority: 'high',
        title: 'Attendance Alert: CS-305 Below 75%',
        message: 'Your current attendance in CS-305 (Cloud Computing) has dropped to 72.2%. Please attend upcoming lectures to avoid exam debarment.',
        actionUrl: '/attendance',
        isRead: false
      });
      await Notification.create({
        recipient: s.userId,
        type: 'assignment_deadline',
        priority: 'medium',
        title: 'Assignment Due in 3 Days',
        message: 'Problem Set 1 for CS-301 (Algorithms & Complexity) is due on Friday.',
        actionUrl: '/assignments',
        isRead: false
      });
    }

    // ── 13. Seed StudyPlan for Alex Mercer ──────────────────────────────────
    await StudyPlan.create({
      student: studentProfiles[0]._id,
      weeklyTargetHours: 24,
      dailySlots: [
        { day: 'Monday', time: '16:00 - 18:00', courseCode: 'CS-301', topic: 'Bellman-Ford & Floyd-Warshall Algorithms', durationMinutes: 120, isCompleted: true },
        { day: 'Tuesday', time: '17:00 - 19:00', courseCode: 'CS-305', topic: 'Kubernetes Pod Networking & Helm Charts', durationMinutes: 120, isCompleted: true },
        { day: 'Wednesday', time: '15:30 - 17:30', courseCode: 'CS-309', topic: 'Backpropagation & Loss Gradients in PyTorch', durationMinutes: 120, isCompleted: false },
        { day: 'Thursday', time: '18:00 - 20:00', courseCode: 'CS-301', topic: 'Problem Set 1 Tabulation Implementation', durationMinutes: 120, isCompleted: false },
        { day: 'Friday', time: '14:00 - 16:30', courseCode: 'CS-305', topic: 'Azure Cosmos DB Sharding Lab', durationMinutes: 150, isCompleted: false }
      ]
    });

    // ── 14. Seed ForumPosts ─────────────────────────────────────────────────
    await ForumPost.insertMany([
      {
        title: 'Tips for memoization vs tabulation in DP Problem Set 1 (CS-301)?',
        authorName: 'Alex Mercer',
        authorRole: 'student',
        category: 'Algorithms',
        content: 'When solving the Longest Common Subsequence, is it recommended to reconstruct the sequence path using a directional pointer matrix or recursive traceback?',
        upvotes: 24,
        isSolved: true,
        replies: [
          {
            authorName: 'Dr. Alan Turing',
            authorRole: 'faculty',
            content: 'Directional traceback from cell (m, n) provides O(m+n) reconstruction without extra auxiliary memory if you navigate values directly.',
            isVerifiedAnswer: true,
            createdAt: new Date('2026-09-17T14:40:00.000Z')
          }
        ]
      },
      {
        title: 'Configuring Azure Managed Identity in Docker containers',
        authorName: 'Liam Smith',
        authorRole: 'student',
        category: 'Cloud Computing',
        content: 'Has anyone faced token retrieval timeouts when running Azure Identity client inside local Docker desktop? Any workaround without hardcoding client secrets?',
        upvotes: 18,
        isSolved: false,
        replies: []
      }
    ]);

    // ── 15. Seed Tickets ────────────────────────────────────────────────────
    await Ticket.insertMany([
      {
        ticketId: 'TICK-482910',
        student: studentProfiles[0]._id,
        subject: 'Attendance Discrepancy for Lab Session 4 (CS-305)',
        category: 'Attendance Query',
        priority: 'High',
        status: 'In Progress',
        assignedTo: 'Prof. Registrar Office',
        messages: [
          { senderRole: 'student', senderName: 'Alex Mercer', message: 'I was present in the lab on Sept 14th but marked absent on portal.', sentAt: new Date('2026-09-18T10:15:00.000Z') },
          { senderRole: 'staff', senderName: 'Academic Officer', message: 'Verifying physical sign-in sheet with TA. Will update within 24h.', sentAt: new Date('2026-09-19T09:00:00.000Z') }
        ]
      },
      {
        ticketId: 'TICK-338219',
        student: studentProfiles[0]._id,
        subject: 'Fall Semester Fee Receipt & Scholarship Adjustment',
        category: 'Fees & Bursar',
        priority: 'Medium',
        status: 'Resolved',
        assignedTo: 'Bursar Financial Services',
        messages: [
          { senderRole: 'student', senderName: 'Alex Mercer', message: 'Requested updated invoice reflecting merit scholarship waiver.', sentAt: new Date('2026-09-12T14:30:00.000Z') },
          { senderRole: 'staff', senderName: 'Finance Admin', message: 'Updated receipt generated. Deduction applied in student billing portal.', sentAt: new Date('2026-09-13T11:20:00.000Z') }
        ]
      }
    ]);

    // ── 16. Seed Appointments ───────────────────────────────────────────────
    await Appointment.insertMany([
      {
        student: studentProfiles[0]._id,
        faculty: faculty._id,
        facultyName: 'Dr. Alan Turing',
        courseCode: 'CS-301 (Algorithms)',
        purpose: 'Review Dynamic Programming assignment rubric and grade clarification',
        appointmentDate: new Date('2026-10-02'),
        timeSlot: '14:30 - 15:00',
        status: 'confirmed',
        meetingLinkOrLocation: 'Turing Hall, Room 302'
      },
      {
        student: studentProfiles[0]._id,
        faculty: faculty._id,
        facultyName: 'Dr. Alan Turing',
        courseCode: 'CS-305 (Cloud Computing)',
        purpose: 'Attendance deficit counseling & exam clearance',
        appointmentDate: new Date('2026-10-08'),
        timeSlot: '11:00 - 11:30',
        status: 'pending',
        meetingLinkOrLocation: 'Turing Hall, Room 302'
      }
    ]);


    console.log('\n======================================================');
    console.log('✅ ALL COLLECTIONS SEEDED SUCCESSFULLY IN MONGODB!');
    console.log('======================================================');
    console.log('\nDemo User Credentials:');
    console.log('  👨‍🏫 Faculty:  dr.alan@university.edu     |  Password: Faculty@1234');
    console.log('  🎓 Student:  alex.student@university.edu |  Password: Student@1234');
    console.log('  🎓 Student:  emma.student@university.edu |  Password: Student@1234');
    console.log('  🎓 Student:  liam.student@university.edu |  Password: Student@1234\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
