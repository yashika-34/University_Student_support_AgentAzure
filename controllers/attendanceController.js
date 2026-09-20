import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Faculty from '../models/Faculty.js';

/**
 * @desc    Get aggregated attendance summary for currently logged-in student
 * @route   GET /api/v1/attendance/my-summary
 * @access  Private (Student)
 */
export const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enrolledCourses = student.enrolledCourses.filter((c) => c.status === 'enrolled');
    const summary = [];

    for (const enrollment of enrolledCourses) {
      const course = await Course.findById(enrollment.courseId).select('courseCode courseName credits');
      if (!course) continue;

      const stats = await Attendance.calculateAttendancePercentage(student._id, course._id);
      
      summary.push({
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        credits: course.credits,
        totalClasses: stats.totalClasses,
        attendedClasses: stats.attendedClasses,
        excusedClasses: stats.excusedClasses,
        percentage: stats.percentage,
        isLowAttendance: stats.percentage < 75 && stats.totalClasses > 0,
        statusLabel: stats.percentage >= 80 ? 'Good' : stats.percentage >= 75 ? 'Average' : 'Critical Warning'
      });
    }

    res.status(200).json({
      success: true,
      studentId: student.studentId,
      overallSummary: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed attendance history for a specific course
 * @route   GET /api/v1/attendance/course/:courseId
 * @access  Private (Student, Faculty)
 */
export const getCourseAttendanceDetails = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    let studentId = req.query.studentId;

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      studentId = student._id;
    }

    const filter = { course: courseId };
    if (studentId) filter.student = studentId;

    const records = await Attendance.find(filter)
      .populate('student', 'studentId')
      .populate('course', 'courseCode courseName')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark batch attendance for a course session
 * @route   POST /api/v1/attendance/mark-batch
 * @access  Private (Faculty, Admin)
 */
export const markBatchAttendance = async (req, res, next) => {
  try {
    const { courseId, date, sessionType = 'lecture', attendanceList } = req.body;
    // attendanceList: [{ studentId, status, remarks }]

    if (!courseId || !date || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide courseId, date, and a non-empty attendanceList.'
      });
    }

    const faculty = await Faculty.findOne({ userId: req.user._id });
    const facultyId = faculty ? faculty._id : req.body.facultyId;

    const operations = attendanceList.map((entry) => ({
      updateOne: {
        filter: {
          course: courseId,
          student: entry.studentId,
          date: new Date(date),
          sessionType
        },
        update: {
          $set: {
            faculty: facultyId,
            status: entry.status,
            markedBy: req.user._id,
            remarks: entry.remarks || null
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `Batch attendance processed. Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`,
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of students with low attendance (< 75%) across a course
 * @route   GET /api/v1/attendance/course/:courseId/low-attendance
 * @access  Private (Faculty, Admin)
 */
export const getLowAttendanceAlerts = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const students = await Student.find({ 'enrolledCourses.courseId': courseId })
      .populate('userId', 'firstName lastName email phoneNumber');

    const lowAttendanceList = [];

    for (const student of students) {
      const stats = await Attendance.calculateAttendancePercentage(student._id, courseId);
      if (stats.percentage < 75 && stats.totalClasses > 0) {
        lowAttendanceList.push({
          studentId: student.studentId,
          name: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Unknown',
          email: student.userId ? student.userId.email : null,
          totalClasses: stats.totalClasses,
          attendedClasses: stats.attendedClasses,
          percentage: stats.percentage
        });
      }
    }

    res.status(200).json({
      success: true,
      count: lowAttendanceList.length,
      alerts: lowAttendanceList
    });
  } catch (error) {
    next(error);
  }
};
