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

    // Fetch all attendance records directly from MongoDB
    const records = await Attendance.find({ student: student._id })
      .populate('course', 'courseCode courseName credits')
      .sort({ date: -1 });

    const subjectMap = {};

    for (const rec of records) {
      const key = rec.course ? rec.course._id.toString() : (rec.subject || 'General');
      const label = rec.course ? rec.course.courseName : (rec.subject || 'General');
      const code = rec.course ? rec.course.courseCode : (rec.subject || 'General');

      if (!subjectMap[key]) {
        subjectMap[key] = {
          courseId: rec.course?._id || null,
          courseCode: code,
          courseName: label,
          credits: rec.course?.credits || 3,
          totalClasses: 0,
          attendedClasses: 0,
          excusedClasses: 0,
          records: []
        };
      }

      subjectMap[key].totalClasses += 1;
      if (rec.status === 'present') {
        subjectMap[key].attendedClasses += 1;
      } else if (rec.status === 'excused') {
        subjectMap[key].excusedClasses += 1;
      }
      subjectMap[key].records.push({
        date: rec.date,
        status: rec.status,
        sessionType: rec.sessionType,
        remarks: rec.remarks
      });
    }

    // Also include enrolled courses if any
    if (student.enrolledCourses && student.enrolledCourses.length > 0) {
      for (const enrollment of student.enrolledCourses) {
        if (enrollment.status === 'enrolled' && enrollment.courseId) {
          const course = await Course.findById(enrollment.courseId).select('courseCode courseName credits');
          if (course && !subjectMap[course._id.toString()]) {
            subjectMap[course._id.toString()] = {
              courseId: course._id,
              courseCode: course.courseCode,
              courseName: course.courseName,
              credits: course.credits,
              totalClasses: 0,
              attendedClasses: 0,
              excusedClasses: 0,
              records: []
            };
          }
        }
      }
    }

    const summary = Object.values(subjectMap).map((item) => {
      const percentage = item.totalClasses > 0 ? parseFloat(((item.attendedClasses / item.totalClasses) * 100).toFixed(2)) : 100;
      return {
        ...item,
        percentage,
        isLowAttendance: percentage < 75 && item.totalClasses > 0,
        statusLabel: percentage >= 80 ? 'Good' : percentage >= 75 ? 'Average' : item.totalClasses === 0 ? 'Not Started' : 'Critical Warning'
      };
    });

    res.status(200).json({
      success: true,
      studentId: student.studentId,
      overallSummary: summary,
      recentRecords: records.slice(0, 10)
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
