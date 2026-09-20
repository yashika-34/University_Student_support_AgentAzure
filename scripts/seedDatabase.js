/**
 * UniAssist AI — Database Seeder
 * Seeds FAQs, Placement Drives, Exam Schedules, and Notices into MongoDB.
 * Run with: node scripts/seedDatabase.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// ── Models ─────────────────────────────────────────────────────────────────
import FAQ from '../models/FAQ.js';
import Placement from '../models/Placement.js';
import ExamSchedule from '../models/ExamSchedule.js';
import Notice from '../models/Notice.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/uniassist_db';

// ── FAQ Seed Data ─────────────────────────────────────────────────────────
const faqs = [
  {
    question: 'What is the minimum attendance required to appear in examinations?',
    answer: 'Students must maintain a minimum of 75% attendance in each course to be eligible for end-semester examinations. Students falling below 75% will receive a debarment notice from the Controller of Examinations. Medical exemptions up to 10% are considered on a case-by-case basis by the Dean of Academic Affairs.',
    category: 'Academics',
    tags: ['attendance', 'eligibility', 'exam', 'debarment', '75%'],
    targetAudience: ['student', 'all'],
    isPublished: true,
    helpfulCount: 142
  },
  {
    question: 'How can I calculate my current attendance percentage?',
    answer: 'You can check your real-time attendance on the Student Portal under the "Attendance" section. The system shows lectures attended versus total lectures conducted per course. The formula is: (Lectures Attended / Total Lectures) × 100. You can also use the Bunk Calculator tool in the portal to estimate how many classes you can safely miss.',
    category: 'Academics',
    tags: ['attendance', 'calculator', 'bunk', 'percentage'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 98
  },
  {
    question: 'When is the last date to pay semester tuition fees?',
    answer: 'Semester fees must be paid before the fee deadline communicated at the beginning of each semester. Generally, fees for the odd semester (July–November) are due by July 31st, and even semester (January–May) fees are due by January 31st. A late fee penalty of ₹500 per week applies after the deadline. Check the Fees section in your portal for exact deadlines.',
    category: 'Fees & Financial Aid',
    tags: ['fees', 'tuition', 'deadline', 'payment', 'penalty'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 87
  },
  {
    question: 'What financial aid and scholarships are available for students?',
    answer: 'The university offers several scholarship categories: (1) Merit Scholarship for students with CGPA above 8.5, (2) Need-Based Financial Aid for students with family income below ₹3 LPA, (3) Sports Excellence Scholarship for state/national level athletes, (4) Government Scholarships (SC/ST/OBC/EWS) via the National Scholarship Portal. Apply through the Campus Services portal or visit the Financial Aid Office (Block C, Room 104).',
    category: 'Fees & Financial Aid',
    tags: ['scholarship', 'financial aid', 'merit', 'NSP', 'government'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 71
  },
  {
    question: 'How is CGPA calculated and what are the grade points?',
    answer: 'CGPA is calculated as: Sum of (Credits × Grade Points) / Total Credits earned. The grading scale is: O (Outstanding) = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5, P (Pass) = 4, F (Fail) = 0. A minimum CGPA of 5.0 is required to clear the semester without backlogs. SGPA is calculated the same way but only for a single semester.',
    category: 'Examinations',
    tags: ['CGPA', 'SGPA', 'grade points', 'grading', 'GPA'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 115
  },
  {
    question: 'How do I apply for a re-evaluation or rechecking of my answer scripts?',
    answer: 'Re-evaluation requests must be submitted within 10 days of the result declaration. Visit the Examination Cell (Admin Block, Ground Floor) with a filled re-evaluation form and a fee of ₹500 per subject. Alternatively, submit the form online through the Student Portal under Examinations → Result Dispute. Results of re-evaluation are final and binding.',
    category: 'Examinations',
    tags: ['re-evaluation', 'rechecking', 'result', 'marks', 'dispute'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 63
  },
  {
    question: 'Where is the Student Health Center and what are its timings?',
    answer: 'The Student Health Center (SHC) is located near Gate 3 (Medical Block, near the Basketball Court). Timings: Monday–Saturday, 8:00 AM – 8:00 PM. Emergency services are available 24/7. The SHC provides free first-aid, general physician consultations, and specialist referrals. You can also book an appointment online through Campus Services → Book Appointment.',
    category: 'Campus Facilities',
    tags: ['health center', 'medical', 'clinic', 'appointment', 'doctor'],
    targetAudience: ['student', 'all'],
    isPublished: true,
    helpfulCount: 56
  },
  {
    question: 'What is the library timings and how do I borrow books?',
    answer: 'The Central Library operates Monday–Saturday, 9:00 AM – 9:00 PM, and Sunday 10:00 AM – 4:00 PM. Students can borrow up to 4 books for 14 days. Access the online catalog and reserve books via the Library Management Portal or from the Campus Services section. Overdue fines: ₹5 per book per day. E-resources (JSTOR, IEEE Xplore, Scopus) are accessible with your university login.',
    category: 'Campus Facilities',
    tags: ['library', 'books', 'timings', 'borrow', 'e-resources'],
    targetAudience: ['student', 'all'],
    isPublished: true,
    helpfulCount: 44
  },
  {
    question: 'How do I submit assignments online?',
    answer: 'Assignments can be submitted through the Student Portal under Assignments. Select the relevant course, click on the assignment, upload your solution (PDF, DOCX, or ZIP), and click Submit. Ensure submission before the deadline — the portal automatically closes submissions after the due date. You will receive a confirmation email upon successful submission.',
    category: 'Academics',
    tags: ['assignment', 'submission', 'upload', 'deadline', 'portal'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 79
  },
  {
    question: 'What is the process for hostel room allotment?',
    answer: 'Hostel room allotment is done at the start of each academic year based on the student\'s year, department, and CGPA. Apply through the Hostel Management Office (Hostel Block A) or online via Campus Services → Hostel Allotment. Priority is given to students from outside the state and those with medical needs. Warden contact: hostel@university.edu.in',
    category: 'Hostel & Housing',
    tags: ['hostel', 'room', 'allotment', 'accommodation', 'warden'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 38
  },
  {
    question: 'How do I reset my university email or portal password?',
    answer: 'Use the "Forgot Password" link on the UniAssist portal login page. Enter your registered university email address. A reset link will be sent to your email within 5 minutes. If you do not receive the email, check your spam folder or contact the IT Helpdesk at support@university.edu.in or visit the Computer Center (Block D, Ground Floor) with your ID card.',
    category: 'Library & IT',
    tags: ['password', 'reset', 'email', 'IT helpdesk', 'login'],
    targetAudience: ['student', 'all'],
    isPublished: true,
    helpfulCount: 92
  },
  {
    question: 'Can I take a leave of absence or LOA from university?',
    answer: 'Students may apply for a Leave of Absence (LOA) for up to one year for medical, personal, or family reasons. Submit the LOA application to the Dean of Student Affairs with supporting documents. Academic leaves do not affect your CGPA or enrollment status. However, any semester without registration may require re-enrollment fees. Contact advisor@university.edu.in for guidance.',
    category: 'General Support',
    tags: ['leave of absence', 'LOA', 'medical leave', 'enrollment'],
    targetAudience: ['student'],
    isPublished: true,
    helpfulCount: 31
  }
];

// ── Placement Drives Seed Data ────────────────────────────────────────────
const placements = [
  {
    name: 'Microsoft India',
    role: 'Software Development Engineer II (Cloud)',
    packageLPA: '45 LPA',
    tier: 'Super Dream',
    eligibilityCgpa: 8.5,
    minCgpa: 8.5,
    maxBacklogs: 0,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    departments: ['Computer Science', 'Information Technology'],
    isActive: true,
    description: 'Full-time SDE-II role in Microsoft Azure Core Engineering team. On-campus recruitment with 3 rounds: Online Assessment, Technical Interview, and HR.',
    bond: 0
  },
  {
    name: 'Google India',
    role: 'Associate Software Engineer',
    packageLPA: '40 LPA',
    tier: 'Super Dream',
    eligibilityCgpa: 8.0,
    minCgpa: 8.0,
    maxBacklogs: 0,
    deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    departments: ['Computer Science', 'Electronics'],
    isActive: true,
    description: 'Google LLC direct campus recruitment for final year students. 4-round process: Coding, Technical + Data Structures, Googleyness fit, and Offer.',
    bond: 0
  },
  {
    name: 'TCS Digital',
    role: 'Digital Analyst - Technology',
    packageLPA: '9 LPA',
    tier: 'Dream',
    eligibilityCgpa: 7.0,
    minCgpa: 7.0,
    maxBacklogs: 1,
    deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    departments: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical'],
    isActive: true,
    description: 'TCS Digital hiring for digital transformation projects with skills in React, Node.js, and Cloud. 2-year service agreement included.',
    bond: 0
  },
  {
    name: 'Infosys Systems Engineer',
    role: 'Systems Engineer',
    packageLPA: '6.5 LPA',
    tier: 'General',
    eligibilityCgpa: 6.0,
    minCgpa: 6.0,
    maxBacklogs: 2,
    deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    departments: ['All Branches'],
    isActive: true,
    description: 'Infosys mass hiring for Systems Engineer role. Aptitude + Communication + Technical rounds. Global placement opportunities.',
    bond: 0
  },
  {
    name: 'Amazon Development Centre',
    role: 'SDE-I (AWS)',
    packageLPA: '32 LPA',
    tier: 'Super Dream',
    eligibilityCgpa: 7.5,
    minCgpa: 7.5,
    maxBacklogs: 0,
    deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    departments: ['Computer Science', 'Information Technology'],
    isActive: true,
    description: 'Amazon AWS development center campus drive. 4 rounds: Online Coding, 2 Technical Rounds, Bar Raiser. FAANG-level compensation.',
    bond: 0
  },
  {
    name: 'Wipro Elite',
    role: 'Project Engineer - Full Stack',
    packageLPA: '7 LPA',
    tier: 'Dream',
    eligibilityCgpa: 6.5,
    minCgpa: 6.5,
    maxBacklogs: 1,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    departments: ['Computer Science', 'Information Technology', 'Electronics'],
    isActive: true,
    description: 'Wipro Elite program for top talent. Roles in digital transformation and enterprise software. On-campus interview process.',
    bond: 0
  }
];

// ── Notice Seed Data ──────────────────────────────────────────────────────
const notices = [
  {
    title: 'End-Semester Examinations Schedule Released — Semester 5',
    content: 'The End-Semester Examination (ESE) schedule for Semester 5 has been officially released. Examinations will commence from the 3rd week of November. Students are advised to check the Exam Schedule section on the portal for subject-wise dates, timings, and venue allocations. Hall tickets will be available for download 7 days before the examination date.',
    category: 'Examination',
    priority: 'urgent',
    targetAudience: 'students',
    isPublished: true,
    publishedAt: new Date()
  },
  {
    title: 'Fee Payment Deadline Extended — Last Date: October 15',
    content: 'The semester fee payment deadline has been extended to October 15 for all students. Students with pending fees are advised to complete payment through the Finance Portal to avoid a late fee penalty. Contact the Finance Office (Block A, Room 201) for fee waivers or installment plans under the financial hardship scheme.',
    category: 'Finance',
    priority: 'high',
    targetAudience: 'students',
    isPublished: true,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'TCS & Microsoft Campus Recruitment Drive — Registration Open',
    content: 'On-campus placement drives for TCS Digital and Microsoft India are scheduled for next month. Final-year students meeting the eligibility criteria (CGPA ≥ 7.0 for TCS, CGPA ≥ 8.5 for Microsoft) can register through the Career & Placement Hub. Pre-placement talks will be conducted 2 days before each drive.',
    category: 'Placement',
    priority: 'normal',
    targetAudience: 'students',
    isPublished: true,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    title: 'University Annual Technical Fest "TechNova 2025" — Call for Participants',
    content: 'TechNova 2025, our flagship inter-university technical festival, is accepting registrations. Events include Hackathon, Robo Wars, Smart India Solutions, Paper Presentation, and AI/ML Ideathon. Prizes worth ₹5 Lakhs across all categories. Register at technova.university.edu. Team registration deadline: October 20.',
    category: 'Events',
    priority: 'normal',
    targetAudience: 'all',
    isPublished: true,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
];

// ── Exam Schedules ────────────────────────────────────────────────────────
const examSchedules = [
  {
    courseCode: 'CS-501',
    courseName: 'Advanced Database Management Systems',
    examType: 'End Semester',
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: 'Examination Hall A - Room 201',
    duration: 180,
    semester: 5,
    department: 'Computer Science',
    status: 'upcoming'
  },
  {
    courseCode: 'CS-502',
    courseName: 'Cloud Computing & Microservices',
    examType: 'End Semester',
    date: new Date(Date.now() + 47 * 24 * 60 * 60 * 1000),
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: 'Examination Hall B - Room 301',
    duration: 180,
    semester: 5,
    department: 'Computer Science',
    status: 'upcoming'
  },
  {
    courseCode: 'CS-503',
    courseName: 'Machine Learning & AI Fundamentals',
    examType: 'End Semester',
    date: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000),
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    venue: 'Examination Hall A - Room 202',
    duration: 180,
    semester: 5,
    department: 'Computer Science',
    status: 'upcoming'
  },
  {
    courseCode: 'CS-504',
    courseName: 'Computer Networks & Security',
    examType: 'End Semester',
    date: new Date(Date.now() + 51 * 24 * 60 * 60 * 1000),
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: 'Examination Hall C - Room 401',
    duration: 180,
    semester: 5,
    department: 'Computer Science',
    status: 'upcoming'
  },
  {
    courseCode: 'CS-505',
    courseName: 'Software Engineering & Design Patterns',
    examType: 'End Semester',
    date: new Date(Date.now() + 53 * 24 * 60 * 60 * 1000),
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    venue: 'Examination Hall B - Room 302',
    duration: 180,
    semester: 5,
    department: 'Computer Science',
    status: 'upcoming'
  }
];

// ── Seed Function ─────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log(`[Seeder] Connected to: ${mongoose.connection.host}`);

    // ── Seed FAQs ──────────────────────────────────────────────────────────
    const existingFaqCount = await FAQ.countDocuments();
    if (existingFaqCount === 0) {
      console.log('[Seeder] Seeding FAQs...');
      await FAQ.insertMany(faqs);
      console.log(`[Seeder] ✅ Inserted ${faqs.length} FAQs.`);
    } else {
      console.log(`[Seeder] ⏭  FAQs already seeded (${existingFaqCount} found), skipping.`);
    }

    // ── Seed Placements ────────────────────────────────────────────────────
    const existingPlacementCount = await Placement.countDocuments();
    if (existingPlacementCount === 0) {
      console.log('[Seeder] Seeding placement drives...');
      await Placement.insertMany(placements);
      console.log(`[Seeder] ✅ Inserted ${placements.length} placement drives.`);
    } else {
      console.log(`[Seeder] ⏭  Placements already seeded (${existingPlacementCount} found), skipping.`);
    }

    // ── Seed Notices ───────────────────────────────────────────────────────
    const existingNoticeCount = await Notice.countDocuments();
    if (existingNoticeCount === 0) {
      console.log('[Seeder] Seeding notices...');
      await Notice.insertMany(notices);
      console.log(`[Seeder] ✅ Inserted ${notices.length} notices.`);
    } else {
      console.log(`[Seeder] ⏭  Notices already seeded (${existingNoticeCount} found), skipping.`);
    }

    // ── Seed Exam Schedules ────────────────────────────────────────────────
    const existingExamCount = await ExamSchedule.countDocuments();
    if (existingExamCount === 0) {
      console.log('[Seeder] Seeding exam schedules...');
      await ExamSchedule.insertMany(examSchedules);
      console.log(`[Seeder] ✅ Inserted ${examSchedules.length} exam schedules.`);
    } else {
      console.log(`[Seeder] ⏭  Exam schedules already seeded (${existingExamCount} found), skipping.`);
    }

    console.log('\n[Seeder] 🎉 Database seeding completed successfully!');
    console.log('[Seeder] Your UniAssist platform is now populated with real data.\n');
    
  } catch (error) {
    console.error('[Seeder] ❌ Seeding failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('[Seeder] Disconnected from MongoDB.');
    process.exit(0);
  }
}

seedDatabase();
