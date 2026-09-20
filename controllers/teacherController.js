import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Marks from '../models/Marks.js';
import { runStudentSupportAgent } from '../services/azureAiService.js';

/**
 * @desc    Teacher dashboard — aggregated stats for faculty's courses
 * @route   GET /api/v1/teacher/dashboard
 * @access  Faculty
 */
export const getTeacherDashboard = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id }).populate('assignedCourses');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    const courseIds = faculty.assignedCourses?.map((c) => c._id) || [];

    // Total enrolled students across faculty's courses
    const enrolledStudents = await Student.countDocuments({
      'enrolledCourses.courseId': { $in: courseIds },
      'enrolledCourses.status': 'enrolled'
    });

    // Pending assignments to grade
    const pendingGrade = await Assignment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $unwind: '$submissions' },
      { $match: { 'submissions.status': 'submitted' } },
      { $count: 'total' }
    ]);

    // Low attendance alerts (< 75%)
    const lowAttendanceAlerts = await Attendance.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: { student: '$student', course: '$course' },
          attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [{ $divide: ['$attended', { $max: ['$total', 1] }] }, 100]
          }
        }
      },
      { $match: { percentage: { $lt: 75 }, total: { $gt: 3 } } },
      { $count: 'count' }
    ]);

    // Recent submissions (last 5)
    const recentSubmissions = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'courseCode courseName')
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title course submissions updatedAt');

    res.status(200).json({
      success: true,
      dashboard: {
        faculty: {
          id: faculty._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          designation: faculty.designation,
          department: faculty.department,
          cabinOffice: faculty.cabinOffice
        },
        stats: {
          totalCourses: courseIds.length,
          totalStudents: enrolledStudents,
          pendingGrading: pendingGrade[0]?.total || 0,
          lowAttendanceAlerts: lowAttendanceAlerts[0]?.count || 0
        },
        courses: faculty.assignedCourses?.map((c) => ({
          id: c._id,
          courseCode: c.courseCode,
          courseName: c.courseName,
          credits: c.credits
        })),
        recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analytics for a specific course (attendance distribution, marks histogram)
 * @route   GET /api/v1/teacher/analytics/:courseId
 * @access  Faculty
 */
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Attendance distribution for course
    const attendanceStats = await Attendance.aggregate([
      { $match: { course: new (await import('mongoose')).default.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: { student: '$student' },
          attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [{ $divide: ['$attended', { $max: ['$total', 1] }] }, 100]
          }
        }
      },
      {
        $group: {
          _id: null,
          above90: { $sum: { $cond: [{ $gte: ['$percentage', 90] }, 1, 0] } },
          above75: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$percentage', 75] }, { $lt: ['$percentage', 90] }] },
                1,
                0
              ]
            }
          },
          below75: { $sum: { $cond: [{ $lt: ['$percentage', 75] }, 1, 0] } },
          avgAttendance: { $avg: '$percentage' }
        }
      }
    ]);

    // Marks distribution
    const marksStats = await Marks.aggregate([
      { $match: { course: new (await import('mongoose')).default.Types.ObjectId(courseId), isPublished: true } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      }
    ]);

    // Assignment submission rate
    const assignmentData = await Assignment.find({ course: courseId }).select('title submissions maxScore dueDate');
    const submissionRates = assignmentData.map((a) => ({
      title: a.title.substring(0, 30),
      submitted: a.submissions?.filter((s) => s.status === 'submitted' || s.status === 'graded').length || 0,
      total: a.submissions?.length || 0,
      rate: a.submissions?.length
        ? Math.round(
            (a.submissions.filter((s) => s.status !== 'pending').length / a.submissions.length) * 100
          )
        : 0
    }));

    res.status(200).json({
      success: true,
      analytics: {
        attendance: attendanceStats[0] || { above90: 0, above75: 0, below75: 0, avgAttendance: 0 },
        gradeDistribution: marksStats,
        assignmentSubmissionRates: submissionRates
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all students across faculty's courses with performance overview
 * @route   GET /api/v1/teacher/students
 * @access  Faculty
 */
export const getStudentPerformanceList = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id }).populate('assignedCourses');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });

    const courseIds = faculty.assignedCourses?.map((c) => c._id) || [];

    const students = await Student.find({
      'enrolledCourses.courseId': { $in: courseIds },
      'enrolledCourses.status': 'enrolled'
    })
      .populate('userId', 'firstName lastName email avatarUrl')
      .select('studentId department currentSemester cgpa enrolledCourses')
      .limit(100);

    const studentList = await Promise.all(
      students.map(async (s) => {
        // Get attendance across faculty's courses
        const attStats = await Attendance.aggregate([
          { $match: { student: s._id, course: { $in: courseIds } } },
          {
            $group: {
              _id: null,
              attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
              total: { $sum: 1 }
            }
          }
        ]);
        const att = attStats[0] || { attended: 0, total: 0 };
        const attPct = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;

        return {
          id: s._id,
          studentId: s.studentId,
          name: `${s.userId?.firstName} ${s.userId?.lastName}`,
          email: s.userId?.email,
          department: s.department,
          semester: s.currentSemester,
          cgpa: s.cgpa || 0,
          attendancePercentage: attPct,
          isLowAttendance: attPct < 75 && att.total > 0
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentList.length,
      students: studentList
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Individual student progress detail (for faculty view)
 * @route   GET /api/v1/teacher/students/:studentId
 * @access  Faculty
 */
export const getStudentProgressDetail = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('userId', 'firstName lastName email phoneNumber')
      .populate('enrolledCourses.courseId', 'courseCode courseName credits');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const courseIds = student.enrolledCourses.map((e) => e.courseId?._id).filter(Boolean);

    // Attendance per course
    const attendancePerCourse = await Promise.all(
      student.enrolledCourses.map(async (enr) => {
        if (!enr.courseId) return null;
        const stats = await Attendance.aggregate([
          { $match: { student: student._id, course: enr.courseId._id } },
          {
            $group: {
              _id: null,
              attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
              total: { $sum: 1 }
            }
          }
        ]);
        const s = stats[0] || { attended: 0, total: 0 };
        return {
          courseCode: enr.courseId.courseCode,
          courseName: enr.courseId.courseName,
          attended: s.attended,
          total: s.total,
          percentage: s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0
        };
      })
    );

    // Marks
    const marks = await Marks.find({ student: student._id, course: { $in: courseIds } })
      .populate('course', 'courseCode courseName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: `${student.userId?.firstName} ${student.userId?.lastName}`,
        email: student.userId?.email,
        department: student.department,
        semester: student.currentSemester,
        cgpa: student.cgpa
      },
      attendance: attendancePerCourse.filter(Boolean),
      marks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    AI-powered question paper generation
 * @route   POST /api/v1/teacher/question-paper
 * @access  Faculty
 */
export const generateQuestionPaper = async (req, res, next) => {
  try {
    const {
      courseCode,
      courseName,
      subject,
      topics,
      difficulty = 'mixed',
      totalMarks = 100,
      duration = '3 hours',
      questionCount = 10,
      examType = 'Final Examination'
    } = req.body;

    const prompt = `Generate a complete university ${examType} question paper with the following specifications:

Course: ${courseCode || 'CS-301'} — ${courseName || subject || 'Computer Science'}
Topics: ${Array.isArray(topics) ? topics.join(', ') : topics || 'All syllabus topics'}
Difficulty: ${difficulty} (mix of easy 30%, medium 50%, hard 20%)
Total Marks: ${totalMarks}
Duration: ${duration}
Number of Questions: ${questionCount}

Format the question paper as:
- Header with course details and instructions
- Section A: Multiple Choice Questions (20 marks, 1 mark each)
- Section B: Short Answer Questions (30 marks, 5 marks each)
- Section C: Long Answer / Problems (50 marks, 10-15 marks each)

Include marking scheme and instructions. Generate realistic academic questions.`;

    const result = await runStudentSupportAgent({
      userMessage: prompt,
      conversationHistory: [],
      user: req.user,
      studentProfile: null,
      facultyProfile: null
    });

    res.status(200).json({
      success: true,
      questionPaper: {
        courseCode,
        courseName: courseName || subject,
        examType,
        totalMarks,
        duration,
        generatedAt: new Date().toISOString(),
        content: result.content
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Full class report for a course
 * @route   GET /api/v1/teacher/report/:courseId
 * @access  Faculty
 */
export const getClassReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const students = await Student.find({
      'enrolledCourses.courseId': courseId,
      'enrolledCourses.status': 'enrolled'
    }).populate('userId', 'firstName lastName email');

    const reportRows = await Promise.all(
      students.map(async (s) => {
        const attStats = await Attendance.aggregate([
          { $match: { student: s._id, course: course._id } },
          {
            $group: {
              _id: null,
              attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
              total: { $sum: 1 }
            }
          }
        ]);
        const att = attStats[0] || { attended: 0, total: 0 };
        const attPct = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 0;

        const marks = await Marks.find({ student: s._id, course: courseId, isPublished: true });
        const avgMarks =
          marks.length > 0
            ? (marks.reduce((a, m) => a + m.percentage, 0) / marks.length).toFixed(1)
            : 'N/A';

        return {
          studentId: s.studentId,
          name: `${s.userId?.firstName} ${s.userId?.lastName}`,
          email: s.userId?.email,
          attendancePercentage: attPct,
          averageMarks: avgMarks,
          examEligible: attPct >= 75
        };
      })
    );

    res.status(200).json({
      success: true,
      report: {
        course: { id: course._id, courseCode: course.courseCode, courseName: course.courseName },
        generatedAt: new Date().toISOString(),
        totalStudents: reportRows.length,
        eligibleCount: reportRows.filter((r) => r.examEligible).length,
        ineligibleCount: reportRows.filter((r) => !r.examEligible).length,
        rows: reportRows
      }
    });
  } catch (error) {
    next(error);
  }
};
