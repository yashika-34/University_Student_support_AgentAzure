import ExamSchedule from '../models/ExamSchedule.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import { logAudit } from '../services/auditService.js';

/**
 * @desc    Get exam schedule for logged-in student (with hall ticket eligibility)
 * @route   GET /api/v1/exams/my
 * @access  Private (Student)
 */
export const getMyExamSchedule = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enrolledCourseIds = student.enrolledCourses
      .filter((c) => c.status === 'enrolled')
      .map((c) => c.courseId);

    const enrolledCourses = await Course.find({ _id: { $in: enrolledCourseIds } });
    const enrolledCodes = enrolledCourses.map((c) => c.courseCode.toUpperCase());

    const exams = await ExamSchedule.find({
      $or: [
        { course: { $in: enrolledCourseIds } },
        { courseCode: { $in: enrolledCodes } },
        { semester: student.currentSemester }
      ]
    }).sort({ date: 1 });

    // Check attendance eligibility for each exam
    const formattedExams = [];
    for (const exam of exams) {
      let isDebarred = false;
      let attendancePercentage = 100;

      if (exam.course) {
        const stats = await Attendance.calculateAttendancePercentage(student._id, exam.course);
        attendancePercentage = stats.percentage;
        if (stats.percentage < 75 && stats.totalClasses > 0) {
          isDebarred = true;
        }
      }

      const examDate = new Date(exam.date);
      const today = new Date();
      const diffTime = examDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      formattedExams.push({
        _id: exam._id,
        courseCode: exam.courseCode,
        courseName: exam.courseName,
        semester: exam.semester,
        term: exam.term,
        examType: exam.examType,
        date: exam.date,
        formattedDate: examDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        startTime: exam.startTime,
        endTime: exam.endTime,
        shift: exam.shift,
        venue: exam.venue,
        seatNumber: `${student.studentId.slice(-3) || 'A1'}-${exam.seatNumber || '42'}`,
        hallTicketStatus: isDebarred ? 'debarred' : exam.hallTicketStatus || 'available',
        attendancePercentage,
        status: daysRemaining < 0 ? 'completed' : daysRemaining === 0 ? 'today' : 'upcoming',
        daysRemaining: Math.max(0, daysRemaining),
        guidelines: exam.guidelines || []
      });
    }

    res.status(200).json({
      success: true,
      count: formattedExams.length,
      exams: formattedExams
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all exam schedules (Public or Faculty view)
 * @route   GET /api/v1/exams
 * @access  Private
 */
export const getAllExams = async (req, res, next) => {
  try {
    const { semester, examType, search } = req.query;
    const filter = {};

    if (semester && semester !== 'all') filter.semester = Number(semester);
    if (examType && examType !== 'all') filter.examType = examType;
    if (search) {
      filter.$or = [
        { courseCode: new RegExp(search, 'i') },
        { courseName: new RegExp(search, 'i') },
        { venue: new RegExp(search, 'i') }
      ];
    }

    const exams = await ExamSchedule.find(filter)
      .populate('course', 'courseCode courseName credits department')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single exam schedule by ID
 * @route   GET /api/v1/exams/:id
 * @access  Private
 */
export const getExamById = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findById(req.params.id).populate('course');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }

    res.status(200).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create exam schedule
 * @route   POST /api/v1/exams
 * @access  Faculty, Admin
 */
export const createExam = async (req, res, next) => {
  try {
    const {
      courseId,
      courseCode,
      courseName,
      semester,
      term,
      examType,
      date,
      startTime,
      endTime,
      shift,
      venue,
      seatNumber,
      guidelines
    } = req.body;

    let targetCourse = null;
    if (courseId) {
      targetCourse = await Course.findById(courseId);
    } else if (courseCode) {
      targetCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    }

    const newExam = await ExamSchedule.create({
      course: targetCourse ? targetCourse._id : null,
      courseCode: (targetCourse?.courseCode || courseCode || 'GEN-101').toUpperCase(),
      courseName: targetCourse?.courseName || courseName || 'General Examination',
      semester: semester || targetCourse?.semester || 1,
      term: term || 'Fall 2026',
      examType: examType || 'Final Examination',
      date: new Date(date),
      startTime: startTime || '09:00',
      endTime: endTime || '12:00',
      shift: shift || 'Morning',
      venue: venue || 'Examination Hall A, Block 3',
      seatNumber: seatNumber || 'A-42',
      guidelines: guidelines || [
        'Bring official university photo ID and printed/digital hall ticket.',
        'No electronic devices permitted in the exam hall.',
        'Arrive at least 20 minutes prior to scheduled start time.'
      ]
    });

    await logAudit({
      action: 'PUBLISH_NOTICE',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'ExamSchedule',
      resourceId: newExam._id,
      metadata: { courseCode: newExam.courseCode, examType: newExam.examType, date: newExam.date },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Exam schedule published successfully.',
      exam: newExam
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update exam schedule
 * @route   PUT /api/v1/exams/:id
 * @access  Faculty, Admin
 */
export const updateExam = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Exam schedule updated successfully.',
      exam
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete exam schedule
 * @route   DELETE /api/v1/exams/:id
 * @access  Faculty, Admin
 */
export const deleteExam = async (req, res, next) => {
  try {
    const exam = await ExamSchedule.findByIdAndDelete(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Exam schedule deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
