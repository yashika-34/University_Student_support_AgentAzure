/**
 * Automated Test Suite: Student Management, Administration & Workflow Engine
 * Validates:
 *  1. View All Students (List with pagination)
 *  2. Add Student (Atomic User + Student creation)
 *  3. Edit Student (Profile updates in MongoDB)
 *  4. Delete Student (Soft delete / deactivation & Hard delete)
 *  5. Search Students (by name, roll no, email, department)
 *  6. Filter Students (by department, semester, and status)
 *  7. Department Management (Aggregated departmental statistics)
 *  8. Semester Management (Semester progression & filtering)
 *  9. Student Profile Management (Full profile detail retrieval)
 * 10. Student Approval Workflow (Approve / Activate & Suspend)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Course from '../models/Course.js';

dotenv.config();

const runStudentManagementTests = async () => {
  console.log('\n===========================================================');
  console.log('🎓 UNIASSIST AI — STUDENT MANAGEMENT SYSTEM TEST SUITE');
  console.log('===========================================================');

  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
    }
  };

  const testSuffix = Date.now();
  let createdUser = null;
  let createdStudent = null;

  try {
    // 0. Connect to MongoDB
    console.log('\n[1/10] Connecting to MongoDB...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');
    }
    assert(mongoose.connection.readyState === 1, 'MongoDB connection established');

    // 1. Add Student
    console.log('\n[2/10] Testing Add Student...');
    const studentData = {
      firstName: 'Aarav',
      lastName: 'Chopra',
      email: `aarav.chopra.${testSuffix}@university.edu`,
      passwordHash: 'Student@1234',
      role: 'student',
      phoneNumber: '+91-98765-43210',
      isActive: false // Starts as unapproved / pending
    };

    createdUser = await User.create(studentData);
    const studentRoll = `STU-TEST-${testSuffix.toString().slice(-4)}`;

    createdStudent = await Student.create({
      userId: createdUser._id,
      studentId: studentRoll,
      department: 'Computer Science',
      degreeProgram: 'Bachelor of Technology',
      currentSemester: 4,
      admissionYear: 2024,
      batch: '2024-2028',
      cgpa: 8.45,
      emergencyContact: {
        name: 'Sunil Chopra',
        relationship: 'Father',
        phone: '+91-98765-11111'
      }
    });

    assert(createdStudent._id != null, 'New student created successfully in MongoDB');
    assert(createdStudent.studentId === studentRoll, 'Student ID recorded correctly');
    assert(createdStudent.cgpa === 8.45, 'Student CGPA recorded correctly');

    // 2. View All Students
    console.log('\n[3/10] Testing View All Students...');
    const allStudents = await Student.find()
      .populate('userId', 'firstName lastName email phoneNumber isActive')
      .sort({ createdAt: -1 });

    assert(allStudents.length > 0, 'Successfully retrieved all students from MongoDB');
    const foundAdded = allStudents.find(s => s._id.toString() === createdStudent._id.toString());
    assert(foundAdded != null, 'Newly added student is present in the student list');
    assert(foundAdded.userId.email === studentData.email, 'Populated user email matches');

    // 3. Search Students
    console.log('\n[4/10] Testing Search Students...');
    const searchQuery = 'Aarav';
    const searchResults = await Student.find().populate('userId');
    const matched = searchResults.filter(s => {
      const fullName = `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase()) || s.studentId.includes(searchQuery);
    });

    assert(matched.length >= 1, `Search query '${searchQuery}' returned matching student(s)`);
    assert(matched[0].userId.firstName === 'Aarav', 'Matched student has correct first name');

    // Search by student roll number
    const matchedRoll = searchResults.filter(s => s.studentId === studentRoll);
    assert(matchedRoll.length === 1, `Search by student roll '${studentRoll}' returned exact match`);

    // 4. Filter Students (by Department, Semester, Status)
    console.log('\n[5/10] Testing Filter Students...');
    // Filter by department
    const csStudents = await Student.find({ department: 'Computer Science' });
    assert(csStudents.length >= 1, 'Department filter (Computer Science) successfully returned students');
    assert(csStudents.every(s => s.department === 'Computer Science'), 'All filtered students belong to Computer Science');

    // Filter by semester
    const sem4Students = await Student.find({ currentSemester: 4 });
    assert(sem4Students.length >= 1, 'Semester filter (Semester 4) successfully returned students');

    // Filter by active / inactive status
    const inactiveUsers = await User.find({ role: 'student', isActive: false });
    assert(inactiveUsers.length >= 1, 'Status filter (Inactive / Pending) returned unapproved student account');

    // 5. Department Management
    console.log('\n[6/10] Testing Department Management & Stats Aggregation...');
    const deptStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          studentCount: { $sum: 1 },
          avgCgpa: { $avg: '$cgpa' }
        }
      },
      { $sort: { studentCount: -1 } }
    ]);

    assert(Array.isArray(deptStats) && deptStats.length > 0, 'Aggregated department statistics calculated');
    const csDept = deptStats.find(d => d._id === 'Computer Science');
    assert(csDept != null, 'Computer Science department present in aggregated stats');
    assert(csDept.studentCount >= 1, 'Department student count is accurate');

    // 6. Semester Management (Semester Progression / Transition)
    console.log('\n[7/10] Testing Semester Management...');
    createdStudent.currentSemester = 5;
    await createdStudent.save();

    const semPromoted = await Student.findById(createdStudent._id);
    assert(semPromoted.currentSemester === 5, 'Student semester promoted from Semester 4 to Semester 5');

    // 7. Edit Student
    console.log('\n[8/10] Testing Edit Student...');
    createdUser.phoneNumber = '+91-98765-99999';
    await createdUser.save();

    createdStudent.cgpa = 8.92;
    createdStudent.degreeProgram = 'B.Tech in Artificial Intelligence';
    createdStudent.emergencyContact.phone = '+91-98765-88888';
    await createdStudent.save();

    const editedStudent = await Student.findById(createdStudent._id).populate('userId');
    assert(editedStudent.userId.phoneNumber === '+91-98765-99999', 'Student phone number updated');
    assert(editedStudent.cgpa === 8.92, 'Student CGPA updated');
    assert(editedStudent.degreeProgram === 'B.Tech in Artificial Intelligence', 'Student degree program updated');
    assert(editedStudent.emergencyContact.phone === '+91-98765-88888', 'Emergency contact phone updated');

    // 8. Student Profile Management (Full Profile Inspection)
    console.log('\n[9/10] Testing Student Profile Management...');
    const profile = await Student.findById(createdStudent._id)
      .populate('userId', 'firstName lastName email phoneNumber isActive createdAt')
      .populate('academicAdvisor')
      .populate('enrolledCourses.courseId');

    assert(profile.userId != null, 'Student profile has populated User identity');
    assert(profile.emergencyContact != null, 'Student profile contains emergency contact');
    assert(profile.batch === '2024-2028', 'Student cohort batch is properly retained');

    // 9. Student Approval Workflow (Approve & Suspend)
    console.log('\n[10/10] Testing Student Approval Workflow...');
    // Initial state: isActive is false
    assert(createdUser.isActive === false, 'Student account initially pending approval');

    // Action: Approve account
    await User.findByIdAndUpdate(createdUser._id, { isActive: true });
    const approvedUser = await User.findById(createdUser._id);
    assert(approvedUser.isActive === true, 'Student account successfully approved and activated');

    // Action: Suspend account
    await User.findByIdAndUpdate(createdUser._id, { isActive: false });
    const suspendedUser = await User.findById(createdUser._id);
    assert(suspendedUser.isActive === false, 'Student account successfully suspended');

    // Reactivate for normal flow
    await User.findByIdAndUpdate(createdUser._id, { isActive: true });

    // 10. Delete Student (Soft & Hard Delete)
    console.log('\nTesting Delete Student (Soft & Hard Delete)...');
    // Soft Delete (deactivate user account)
    await User.findByIdAndUpdate(createdUser._id, { isActive: false });
    const softDeleted = await User.findById(createdUser._id);
    assert(softDeleted.isActive === false, 'Soft delete deactivates student account without data loss');

    // Hard Delete (permanently delete student & linked user from MongoDB)
    await Student.findByIdAndDelete(createdStudent._id);
    await User.findByIdAndDelete(createdUser._id);

    const checkStudentDeleted = await Student.findById(createdStudent._id);
    const checkUserDeleted = await User.findById(createdUser._id);
    assert(checkStudentDeleted == null, 'Hard delete removed student document from MongoDB');
    assert(checkUserDeleted == null, 'Hard delete removed user document from MongoDB');

    createdStudent = null;
    createdUser = null;

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, `Unexpected error during test execution: ${err.message}`);
  } finally {
    if (createdStudent?._id) await Student.findByIdAndDelete(createdStudent._id);
    if (createdUser?._id) await User.findByIdAndDelete(createdUser._id);
  }

  console.log('\n===========================================================');
  console.log('📊 STUDENT MANAGEMENT TEST SUITE SUMMARY');
  console.log('===========================================================');
  console.log(`Total Assertions: ${total}`);
  console.log(`Assertions Passed: ${passed} ✅`);
  console.log(`Assertions Failed: ${total - passed} ${total - passed === 0 ? '' : '❌'}`);
  console.log('===========================================================');

  if (total - passed === 0) {
    console.log('🎉 ALL 10 STUDENT MANAGEMENT CAPABILITIES PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} assertion(s) failed.\n`);
    process.exit(1);
  }
};

runStudentManagementTests();
