import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Faculty from '../models/Faculty.js';

/**
 * @desc Get aggregated performance metrics for a specific student (SGPA, CGPA, grade distribution)
 * @route GET /api/v1/analytics/student/:studentId/performance
 */
export const getStudentPerformance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).lean();
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Aggregate marks for the student
    const marksAgg = await Marks.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          totalScore: { $sum: '$score' },
          totalMax: { $sum: '$maxScore' },
          count: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' }
        }
      }
    ]);
    const marksStats = marksAgg[0] || {};

    // Attendance stats for the student
    const attendanceAgg = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);
    const attendanceStats = attendanceAgg[0] || {};
    const attendancePct = attendanceStats.totalSessions
      ? (attendanceStats.presentCount / attendanceStats.totalSessions) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        studentId: student._id,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        cgpa: student.cgpa,
        totalScore: marksStats.totalScore || 0,
        totalMaxScore: marksStats.totalMax || 0,
        avgPercentage: marksStats.avgPercentage || 0,
        attendancePercentage: attendancePct.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Attendance analytics across courses/semesters
 * @route GET /api/v1/analytics/attendance
 */
export const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const agg = await Attendance.aggregate([
      {
        $group: {
          _id: { course: '$course', semester: '$semester' },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
        }
      },
      {
        $project: {
          course: '$_id.course',
          semester: '$_id.semester',
          attendanceRate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
          lateRate: { $multiply: [{ $divide: ['$late', '$total'] }, 100] },
          totalSessions: '$total',
          _id: 0
        }
      },
      { $sort: { attendanceRate: -1 } }
    ]);
    res.status(200).json({ success: true, data: agg });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Course analytics – enrollment counts, average marks, attendance
 * @route GET /api/v1/analytics/course/:courseId
 */
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const enrollmentCount = await Enrollment.countDocuments({ course: courseId, status: 'enrolled' });

    const marksAgg = await Marks.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgPercentage: { $avg: '$percentage' }
        }
      }
    ]);
    const marksStats = marksAgg[0] || {};

    const attendanceAgg = await Attendance.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      }
    ]);
    const attendanceStats = attendanceAgg[0] || {};
    const attendanceRate = attendanceStats.total
      ? (attendanceStats.present / attendanceStats.total) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.courseName,
        enrollmentCount,
        avgScore: marksStats.avgScore || 0,
        avgPercentage: marksStats.avgPercentage || 0,
        attendanceRate: attendanceRate.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Class statistics – grade distribution and attendance per class (course)
 * @route GET /api/v1/analytics/class/:courseId
 */
export const getClassStatistics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const gradesAgg = await Marks.aggregate([
      { $match: { course: courseId } },
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 50, 60, 70, 80, 90, 100],
          default: 'Unknown',
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    const attendanceAgg = await Attendance.aggregate([
      { $match: { course: courseId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    res.status(200).json({ success: true, data: { gradesDistribution: gradesAgg, attendanceStatus: attendanceAgg } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Teacher dashboard analytics – summary of their courses
 * @route GET /api/v1/analytics/teacher/:teacherId
 */
export const getTeacherDashboardAnalytics = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Faculty.findById(teacherId).lean();
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const courses = await Course.find({ leadFaculty: teacherId }).select('_id courseCode courseName');
    const courseIds = courses.map(c => c._id);

    const enrollmentAgg = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, status: 'enrolled' } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    const marksAgg = await Marks.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$course',
          avgScore: { $avg: '$score' },
          avgPercentage: { $avg: '$percentage' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        teacherId: teacher._id,
        name: teacher.firstName ? `${teacher.firstName} ${teacher.lastName}`.trim() : teacher.employeeId,
        courses: courses.map(c => ({ id: c._id, code: c.courseCode, name: c.courseName })),
        enrollmentByCourse: enrollmentAgg,
        marksByCourse: marksAgg
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Real‑time statistics – simple snapshot of system activity
 * @route GET /api/v1/analytics/realtime
 */
export const getRealTimeStatistics = async (req, res, next) => {
  try {
    const [studentCount, facultyCount, activeCourses, pendingAssignments] = await Promise.all([
      Student.countDocuments({}),
      Faculty.countDocuments({}),
      Course.countDocuments({ isActive: true }),
      // assignments due in next 24h
      (await import('../models/Assignment.js')).default.countDocuments({
        dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      })
    ]);
    res.status(200).json({
      success: true,
      data: {
        totalStudents: studentCount,
        totalFaculty: facultyCount,
        activeCourses,
        assignmentsDueNext24h: pendingAssignments
      }
    });
  } catch (error) {
    next(error);
  }
};
