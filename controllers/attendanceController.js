import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Faculty from '../models/Faculty.js';
import Assignment from '../models/Assignment.js';
import Notice from '../models/Notice.js';
import ExamSchedule from '../models/ExamSchedule.js';

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

/**
 * @desc    Academic Catch-Up Assistant: Detect absent days, show missed lectures, assignments, notices, upcoming deadlines, 3-phase roadmap, and auto-generate revision flashcards
 * @route   GET /api/v1/attendance/catch-up
 * @access  Private (Student)
 */
export const getCatchUpAssistant = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Query recent absences
    const recentAbsences = await Attendance.find({
      student: student._id,
      status: 'absent'
    })
      .populate('course', 'courseCode courseName credits')
      .sort({ date: -1 })
      .limit(10);

    if (recentAbsences.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          hasAbsences: false,
          missedLecturesCount: 0,
          message: 'Great job! You have no recorded absences. You are completely up to date with your academic lectures.',
          missedLectures: [],
          missedAssignments: [],
          missedNotices: [],
          upcomingDeadlines: [],
          roadmap: [],
          suggestedFlashcards: []
        }
      });
    }

    const missedDates = recentAbsences.map((a) => new Date(a.date));
    const oldestAbsenceDate = new Date(Math.min(...missedDates.map((d) => d.getTime())));
    const courseIds = [...new Set(recentAbsences.map((a) => a.course?._id?.toString()).filter(Boolean))];

    // Format missed lectures
    const missedLectures = recentAbsences.map((a) => ({
      id: a._id,
      date: a.date,
      courseCode: a.course?.courseCode || a.subject || 'Course',
      courseName: a.course?.courseName || a.subject || 'General Lecture',
      sessionType: a.sessionType || 'lecture',
      remarks: a.remarks || `Missed ${a.sessionType || 'class'} session`,
      topic: a.remarks || `${a.course?.courseCode || a.subject || 'Course'} Core Syllabus Topics`
    }));

    // Find pending/missed assignments
    const courseObjIds = courseIds.map((id) => new mongoose.Types.ObjectId(id));
    const assignments = await Assignment.find({
      course: { $in: courseObjIds },
      dueDate: { $gte: oldestAbsenceDate }
    }).populate('course', 'courseCode courseName');

    const missedAssignments = [];
    for (const asg of assignments) {
      const isSubmitted = asg.submissions?.some((s) => s.student.toString() === student._id.toString());
      if (!isSubmitted) {
        missedAssignments.push({
          id: asg._id,
          title: asg.title,
          courseCode: asg.course?.courseCode || 'CS',
          courseName: asg.course?.courseName || 'Course',
          dueDate: asg.dueDate,
          maxScore: asg.maxScore || 100,
          isOverdue: new Date(asg.dueDate) < new Date()
        });
      }
    }

    // Find notices posted during or after absence
    const notices = await Notice.find({
      createdAt: { $gte: oldestAbsenceDate },
      isPublished: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    const missedNotices = notices.map((n) => ({
      id: n._id,
      title: n.title,
      category: n.category,
      priority: n.priority,
      date: n.createdAt
    }));

    // Upcoming exams
    const upcomingExams = await ExamSchedule.find({
      examDate: { $gte: new Date() }
    })
      .sort({ examDate: 1 })
      .limit(3);

    const upcomingDeadlines = [
      ...missedAssignments.map((a) => ({
        title: `Assignment: ${a.title}`,
        courseCode: a.courseCode,
        dueDate: a.dueDate,
        type: 'assignment'
      })),
      ...upcomingExams.map((e) => ({
        title: `Exam: ${e.courseName || e.courseCode} (${e.examType})`,
        courseCode: e.courseCode,
        dueDate: e.examDate,
        type: 'exam'
      }))
    ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Synthesize personalized 3-phase Catch-Up Roadmap
    const distinctCourses = [...new Set(missedLectures.map((m) => m.courseCode))].join(', ');
    const roadmap = [
      {
        phase: 'Phase 1: Immediate Lecture Recovery (Days 1–2)',
        focus: `Review missed syllabus & notes for ${distinctCourses}`,
        actionItems: [
          `Collect lecture notes and presentation slides for ${missedLectures.length} missed sessions.`,
          `Review core algorithms, theorems, and definitions with course peers.`,
          `Attend faculty mentoring or office hours to resolve foundational gaps.`
        ],
        status: 'urgent'
      },
      {
        phase: 'Phase 2: Priority Deadlines & Assignments (Days 3–4)',
        focus: `Clear ${missedAssignments.length} pending academic assignment(s)`,
        actionItems:
          missedAssignments.length > 0
            ? missedAssignments.map(
                (a) =>
                  `Submit "${a.title}" (${a.courseCode}) due ${new Date(a.dueDate).toLocaleDateString()}`
              )
            : ['No pending assignments found for missed classes.'],
        status: 'high'
      },
      {
        phase: 'Phase 3: Active Spaced Repetition (Days 5–6)',
        focus: 'Consolidate memory with auto-generated Catch-Up Flashcards',
        actionItems: [
          'Practice the auto-generated Catch-Up Flashcard deck (5 minutes daily).',
          'Test recall on missed lecture topics prior to the upcoming assessments.',
          'Maintain steady attendance above 75% to stay clear of debarment thresholds.'
        ],
        status: 'medium'
      }
    ];

    // Pre-generated high-yield catch-up flashcards tailored to missed course sessions
    const suggestedFlashcards = missedLectures.map((m, idx) => ({
      cardId: `catchup-${m.courseCode}-${idx}-${Date.now().toString(36)}`,
      front: `[${m.courseCode}] Missed ${m.sessionType.toUpperCase()}: ${m.topic}`,
      back: `Core Recovery Takeaway:\n• Date Missed: ${new Date(m.date).toLocaleDateString()}\n• Key Focus: Review foundational theory, theorem proofs, and standard problem patterns.\n• Action: Verify assignments with faculty and sync notes with your batch group.`,
      category: m.courseCode,
      difficulty: 'Medium',
      tags: ['Academic Catch-Up', m.courseCode, 'Missed Lecture']
    }));

    res.status(200).json({
      success: true,
      data: {
        hasAbsences: true,
        missedLecturesCount: missedLectures.length,
        missedLectures,
        missedAssignments,
        missedNotices,
        upcomingDeadlines,
        roadmap,
        suggestedFlashcards
      }
    });
  } catch (error) {
    next(error);
  }
};
