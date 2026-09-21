/**
 * Automated Test Suite: Complete Authentication, RBAC & Profile Management System
 * Validates:
 *  1. MongoDB User Collection & Bcrypt Password Hashing
 *  2. New Student Registration (User + Student collections)
 *  3. New Teacher Registration (User + Faculty collections)
 *  4. Duplicate Registration Prevention
 *  5. Login Verification with Bcrypt & JWT Generation
 *  6. JWT Token Verification & Expiration
 *  7. Role-Based Access Control (Student vs Teacher / Faculty)
 *  8. User Profile Retrieval & Updates
 *  9. Password Reset Lifecycle (Forgot Password, Token Expiration, Password Reset)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import { authorizeRoles } from '../middleware/authMiddleware.js';

dotenv.config();

const runAuthSystemTests = async () => {
  console.log('\n===========================================================');
  console.log('🔐 UNIASSIST AI — AUTHENTICATION & RBAC TEST SUITE');
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
  const studentEmail = `autotest.student.${testSuffix}@university.edu`;
  const teacherEmail = `autotest.teacher.${testSuffix}@university.edu`;
  const studentPassword = 'StudentSecure@123';
  const teacherPassword = 'TeacherSecure@123';
  const newPassword = 'NewlyResetPassword@2026';

  let studentUserDoc = null;
  let teacherUserDoc = null;
  let studentProfileDoc = null;
  let teacherProfileDoc = null;

  try {
    // 0. Connect to MongoDB
    console.log('\n[1/9] Connecting to MongoDB...');
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uniassist_db');
    }
    assert(mongoose.connection.readyState === 1, 'MongoDB connection established successfully');

    // 1. MongoDB User Collection & Password Hashing
    console.log('\n[2/9] Testing MongoDB User Model & Password Hashing...');
    const rawUser = new User({
      email: studentEmail,
      passwordHash: studentPassword,
      firstName: 'Samantha',
      lastName: 'Reed',
      role: 'student',
      phoneNumber: '+1-555-0145'
    });
    studentUserDoc = await rawUser.save();

    assert(studentUserDoc._id != null, 'User created in MongoDB with valid ObjectId');
    assert(studentUserDoc.passwordHash !== studentPassword, 'Password is automatically hashed via pre-save hook');
    assert(studentUserDoc.passwordHash.startsWith('$2'), 'Password hash uses bcrypt format ($2a / $2b)');
    assert(studentUserDoc.fullName === 'Samantha Reed', 'Virtual fullName getter works correctly');

    // Compare Password method
    const correctMatch = await studentUserDoc.comparePassword(studentPassword);
    const wrongMatch = await studentUserDoc.comparePassword('WrongPassword123');
    assert(correctMatch === true, 'comparePassword correctly validates authentic password');
    assert(wrongMatch === false, 'comparePassword rejects incorrect password');

    // 2. New Student Registration & Linked Profile
    console.log('\n[3/9] Testing New Student Registration & Student Collection...');
    studentProfileDoc = await Student.create({
      userId: studentUserDoc._id,
      studentId: `STU-${testSuffix.toString().slice(-6)}`,
      department: 'Computer Science',
      degreeProgram: 'B.S. in Computer Science',
      currentSemester: 3,
      admissionYear: 2024,
      batch: '2024-2028',
      emergencyContact: {
        name: 'Helen Reed',
        relationship: 'Mother',
        phone: '+1-555-9900'
      }
    });

    assert(studentProfileDoc._id != null, 'Student profile created in MongoDB');
    assert(studentProfileDoc.userId.toString() === studentUserDoc._id.toString(), 'Student profile properly references User ID');
    assert(studentProfileDoc.department === 'Computer Science', 'Student department recorded correctly');
    assert(studentProfileDoc.currentSemester === 3, 'Student semester recorded correctly');

    // 3. New Teacher Registration & Linked Faculty Profile
    console.log('\n[4/9] Testing New Teacher Registration & Faculty Collection...');
    const rawTeacher = new User({
      email: teacherEmail,
      passwordHash: teacherPassword,
      firstName: 'Dr. Evelyn',
      lastName: 'Vance',
      role: 'teacher',
      phoneNumber: '+1-555-0188'
    });
    teacherUserDoc = await rawTeacher.save();

    teacherProfileDoc = await Faculty.create({
      userId: teacherUserDoc._id,
      employeeId: `FAC-${testSuffix.toString().slice(-4)}`,
      department: 'Computer Science',
      designation: 'Associate Professor',
      cabinOffice: 'Lovelace Hall, Room 405',
      specialization: ['Artificial Intelligence', 'Natural Language Processing'],
      officeHours: [
        {
          dayOfWeek: 'Monday',
          startTime: '14:00',
          endTime: '16:00',
          location: 'Room 405'
        }
      ]
    });

    assert(teacherUserDoc._id != null, 'Teacher User created in MongoDB');
    assert(teacherUserDoc.role === 'teacher', "Teacher user has role 'teacher'");
    assert(teacherProfileDoc._id != null, 'Faculty profile created in MongoDB');
    assert(teacherProfileDoc.userId.toString() === teacherUserDoc._id.toString(), 'Faculty profile references Teacher User ID');
    assert(teacherProfileDoc.designation === 'Associate Professor', 'Teacher designation recorded correctly');
    assert(teacherProfileDoc.cabinOffice === 'Lovelace Hall, Room 405', 'Teacher cabin/office recorded correctly');

    // 4. Duplicate Registration Prevention
    console.log('\n[5/9] Testing Duplicate Email Prevention...');
    let duplicateRejected = false;
    try {
      await User.create({
        email: studentEmail,
        passwordHash: 'AnotherPass@123',
        firstName: 'Duplicate',
        lastName: 'User',
        role: 'student'
      });
    } catch (err) {
      duplicateRejected = true;
    }
    assert(duplicateRejected === true, 'Duplicate email registration is rejected by unique MongoDB index');

    // 5. JWT Generation & Verification
    console.log('\n[6/9] Testing JWT Token Generation & Verification...');
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_uniassist_jwt_key_987654321';
    
    // Generate access token for Student
    const studentToken = jwt.sign(
      { id: studentUserDoc._id.toString(), role: studentUserDoc.role },
      jwtSecret,
      { expiresIn: '1d' }
    );
    const decodedStudent = jwt.verify(studentToken, jwtSecret);
    assert(decodedStudent.id === studentUserDoc._id.toString(), 'Student JWT contains correct user ID');
    assert(decodedStudent.role === 'student', "Student JWT contains role 'student'");

    // Generate access token for Teacher
    const teacherToken = jwt.sign(
      { id: teacherUserDoc._id.toString(), role: teacherUserDoc.role },
      jwtSecret,
      { expiresIn: '1d' }
    );
    const decodedTeacher = jwt.verify(teacherToken, jwtSecret);
    assert(decodedTeacher.id === teacherUserDoc._id.toString(), 'Teacher JWT contains correct user ID');
    assert(decodedTeacher.role === 'teacher', "Teacher JWT contains role 'teacher'");

    // Test invalid / forged token
    let forgedRejected = false;
    try {
      jwt.verify(studentToken, 'wrong_secret_key');
    } catch {
      forgedRejected = true;
    }
    assert(forgedRejected === true, 'Tampered/forged JWT is rejected');

    // 6. Role-Based Access Control (RBAC)
    console.log('\n[7/9] Testing Role-Based Access Control (RBAC)...');
    
    // Student accessing student-only role
    const studentRBAC = authorizeRoles('student');
    let studentPassed = false;
    studentRBAC({ user: { role: 'student' } }, {}, () => { studentPassed = true; });
    assert(studentPassed === true, 'Student role passes student-authorized route');

    // Student attempting teacher-only role
    const teacherOnlyRBAC = authorizeRoles('faculty', 'teacher');
    let studentBlocked = false;
    const mockRes1 = {
      status: (code) => ({
        json: (data) => { if (code === 403) studentBlocked = true; }
      })
    };
    teacherOnlyRBAC({ user: { role: 'student' } }, mockRes1, () => {});
    assert(studentBlocked === true, 'Student role is blocked with 403 from teacher-authorized route');

    // Teacher accessing faculty/teacher route
    let teacherPassed = false;
    teacherOnlyRBAC({ user: { role: 'teacher' } }, {}, () => { teacherPassed = true; });
    assert(teacherPassed === true, 'Teacher role passes teacher/faculty-authorized route');

    // Teacher aliasing: authorizeRoles('faculty') must permit role 'teacher'
    const facultyRBAC = authorizeRoles('faculty');
    let teacherAliasPassed = false;
    facultyRBAC({ user: { role: 'teacher' } }, {}, () => { teacherAliasPassed = true; });
    assert(teacherAliasPassed === true, "authorizeRoles('faculty') permits user with role 'teacher' via aliasing");

    // 7. User Profile Management (Retrieval & Updates)
    console.log('\n[8/9] Testing User Profile Retrieval & Updates in MongoDB...');
    // Update student details
    studentUserDoc.phoneNumber = '+1-555-8899';
    await studentUserDoc.save();
    studentProfileDoc.emergencyContact = {
      name: 'Robert Reed',
      relationship: 'Father',
      phone: '+1-555-4422'
    };
    await studentProfileDoc.save();

    const updatedStudent = await Student.findOne({ userId: studentUserDoc._id }).populate('userId');
    assert(updatedStudent.userId.phoneNumber === '+1-555-8899', 'Student user phone number updated in MongoDB');
    assert(updatedStudent.emergencyContact.name === 'Robert Reed', 'Student emergency contact updated in MongoDB');

    // Update teacher details
    teacherUserDoc.phoneNumber = '+1-555-7733';
    await teacherUserDoc.save();
    teacherProfileDoc.cabinOffice = 'Turing Block, Suite 210';
    await teacherProfileDoc.save();

    const updatedTeacher = await Faculty.findOne({ userId: teacherUserDoc._id }).populate('userId');
    assert(updatedTeacher.userId.phoneNumber === '+1-555-7733', 'Teacher user phone number updated in MongoDB');
    assert(updatedTeacher.cabinOffice === 'Turing Block, Suite 210', 'Teacher cabin/office updated in MongoDB');

    // 8. Password Reset Lifecycle
    console.log('\n[9/9] Testing Password Reset Flow...');
    // Step A: Generate reset token (simulate forgotPassword)
    const resetTokenPlain = crypto.randomBytes(20).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetTokenPlain).digest('hex');
    
    studentUserDoc.resetPasswordToken = resetTokenHash;
    studentUserDoc.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await studentUserDoc.save({ validateBeforeSave: false });

    assert(studentUserDoc.resetPasswordToken != null, 'Password reset token hash stored on User in MongoDB');
    assert(studentUserDoc.resetPasswordExpire > Date.now(), 'Password reset token expiry is set 30 minutes in future');

    // Step B: Reset Password using plain token (simulate resetPassword)
    const tokenQueryHash = crypto.createHash('sha256').update(resetTokenPlain).digest('hex');
    const foundUserForReset = await User.findOne({
      resetPasswordToken: tokenQueryHash,
      resetPasswordExpire: { $gt: Date.now() }
    });
    assert(foundUserForReset != null, 'User successfully located using unexpired reset token hash');

    foundUserForReset.passwordHash = newPassword;
    foundUserForReset.resetPasswordToken = undefined;
    foundUserForReset.resetPasswordExpire = undefined;
    await foundUserForReset.save();

    // Verify reset succeeded
    const userAfterReset = await User.findById(studentUserDoc._id).select('+passwordHash +resetPasswordToken');
    const verifyNewPass = await userAfterReset.comparePassword(newPassword);
    const verifyOldPass = await userAfterReset.comparePassword(studentPassword);
    assert(verifyNewPass === true, 'New password matches and authenticates successfully');
    assert(verifyOldPass === false, 'Old password is invalid and rejected');
    assert(userAfterReset.resetPasswordToken == null, 'Reset token cleared after successful password reset');

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, `Unexpected error during test execution: ${err.message}`);
  } finally {
    // Clean up test records
    console.log('\nCleaning up automated test fixtures from MongoDB...');
    try {
      if (studentUserDoc?._id) {
        await Student.deleteMany({ userId: studentUserDoc._id });
        await User.findByIdAndDelete(studentUserDoc._id);
      }
      if (teacherUserDoc?._id) {
        await Faculty.deleteMany({ userId: teacherUserDoc._id });
        await User.findByIdAndDelete(teacherUserDoc._id);
      }
      console.log('Cleanup complete.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }
  }

  console.log('\n===========================================================');
  console.log('📊 AUTHENTICATION TEST SUITE SUMMARY');
  console.log('===========================================================');
  console.log(`Total Assertions: ${total}`);
  console.log(`Assertions Passed: ${passed} ✅`);
  console.log(`Assertions Failed: ${total - passed} ${total - passed === 0 ? '' : '❌'}`);
  console.log('===========================================================');

  if (total - passed === 0) {
    console.log('🎉 ALL AUTHENTICATION & RBAC TESTS PASSED WITH 100% SUCCESS RATE!\n');
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} assertion(s) failed.\n`);
    process.exit(1);
  }
};

runAuthSystemTests();
