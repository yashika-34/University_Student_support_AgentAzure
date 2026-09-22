import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Marks from '../models/Marks.js';
import Notice from '../models/Notice.js';
import { runStudentSupportAgent } from '../services/azureAiService.js';

/**
 * @desc    Teacher dashboard — aggregated stats for faculty's courses
 * @route   GET /api/v1/teacher/dashboard
 * @access  Faculty
 */
export const getTeacherDashboard = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `FAC-${Date.now().toString().slice(-4)}`,
        department: req.user.department || 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        cabinOffice: 'Academic Block A, Room 301',
        assignedCourses: []
      });
    }

    // Query all courses where leadFaculty is this faculty OR id is in faculty.assignedCourses
    const leadCourses = await Course.find({
      $or: [
        { leadFaculty: faculty._id },
        { _id: { $in: faculty.assignedCourses || [] } }
      ]
    }).sort({ courseCode: 1 });

    // Sync faculty.assignedCourses with leadCourses
    const courseIds = leadCourses.map((c) => c._id);
    const existingAssignedStrs = (faculty.assignedCourses || []).map((id) => id.toString());
    const newCourseStrs = courseIds.map((id) => id.toString());
    const mergedIds = Array.from(new Set([...existingAssignedStrs, ...newCourseStrs]));
    if (mergedIds.length !== existingAssignedStrs.length) {
      faculty.assignedCourses = mergedIds;
      await faculty.save();
    }

    // Total registered students in the university system
    const enrolledStudents = await Student.countDocuments();

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

    // Count enrolled students per course
    const courseEnrolledCounts = {};
    for (const c of leadCourses) {
      const count = await Student.countDocuments({
        'enrolledCourses.courseId': c._id,
        'enrolledCourses.status': 'enrolled'
      });
      courseEnrolledCounts[c._id.toString()] = count;
    }

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
          totalCourses: leadCourses.length,
          totalStudents: enrolledStudents,
          pendingGrading: pendingGrade[0]?.total || 0,
          lowAttendanceAlerts: lowAttendanceAlerts[0]?.count || 0
        },
        courses: leadCourses.map((c) => ({
          id: c._id,
          _id: c._id,
          courseCode: c.courseCode,
          courseName: c.courseName,
          credits: c.credits,
          department: c.department,
          semester: c.semester,
          description: c.description,
          maxCapacity: c.maxCapacity || 60,
          enrolledCount: courseEnrolledCounts[c._id.toString()] || 0
        })),
        recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign an existing university course to the logged-in faculty
 * @route   POST /api/v1/teacher/courses/assign
 * @access  Faculty / Teacher
 */
export const assignCourseToFaculty = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required.' });
    }

    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `FAC-${Date.now().toString().slice(-4)}`,
        department: req.user.department || 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        cabinOffice: 'Academic Block A, Room 301',
        assignedCourses: []
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in MongoDB.' });
    }

    // Set course leadFaculty to this faculty
    course.leadFaculty = faculty._id;
    await course.save();

    // Add to faculty assignedCourses if not present
    const isAlreadyAssigned = faculty.assignedCourses.some(
      (id) => id.toString() === course._id.toString()
    );
    if (!isAlreadyAssigned) {
      faculty.assignedCourses.push(course._id);
      await faculty.save();
    }

    res.status(200).json({
      success: true,
      message: `Course ${course.courseCode} (${course.courseName}) has been assigned to you successfully.`,
      course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course offering and assign it to the logged-in faculty
 * @route   POST /api/v1/teacher/courses/create
 * @access  Faculty / Teacher
 */
export const createAndAssignCourse = async (req, res, next) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      department,
      credits,
      semester,
      maxCapacity
    } = req.body;

    if (!courseCode || !courseName) {
      return res.status(400).json({ success: false, message: 'Course code and course name are required.' });
    }

    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `FAC-${Date.now().toString().slice(-4)}`,
        department: department || 'Computer Science & Engineering',
        designation: 'Assistant Professor',
        cabinOffice: 'Academic Block A, Room 301',
        assignedCourses: []
      });
    }

    const existing = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Course with code '${courseCode.toUpperCase()}' already exists.`
      });
    }

    const newCourse = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      description: description || 'University undergraduate/graduate course offering.',
      department: department || faculty.department || 'Computer Science & Engineering',
      credits: Number(credits) || 3,
      semester: Number(semester) || 1,
      leadFaculty: faculty._id,
      maxCapacity: Number(maxCapacity) || 60,
      schedule: [
        { dayOfWeek: 'Monday', startTime: '10:00 AM', endTime: '11:30 AM', roomNumber: 'Hall 101', classType: 'lecture' },
        { dayOfWeek: 'Wednesday', startTime: '10:00 AM', endTime: '11:30 AM', roomNumber: 'Hall 101', classType: 'lecture' }
      ]
    });

    faculty.assignedCourses.push(newCourse._id);
    await faculty.save();

    res.status(201).json({
      success: true,
      message: `Course ${newCourse.courseCode} created and assigned to you successfully.`,
      course: newCourse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unassign course from the logged-in faculty
 * @route   DELETE /api/v1/teacher/courses/assign/:courseId
 * @access  Faculty / Teacher
 */
export const unassignCourseFromFaculty = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    faculty.assignedCourses = (faculty.assignedCourses || []).filter(
      (id) => id.toString() !== courseId.toString()
    );
    await faculty.save();

    res.status(200).json({
      success: true,
      message: 'Course unassigned from your active list.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign / Enroll a registered student into a course
 * @route   POST /api/v1/teacher/courses/assign-student
 * @access  Faculty / Teacher
 */
export const assignStudentToCourse = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.body;
    if (!courseId || !studentId) {
      return res.status(400).json({ success: false, message: 'Both courseId and studentId are required.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found in MongoDB.' });
    }

    const query = studentId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: studentId }, { studentId }] }
      : { studentId };

    const student = await Student.findOne(query).populate('userId', 'firstName lastName email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const isAlreadyEnrolled = student.enrolledCourses.some(
      (c) => c.courseId && c.courseId.toString() === course._id.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.studentId} is already enrolled in ${course.courseCode}.`
      });
    }

    student.enrolledCourses.push({
      courseId: course._id,
      semester: Number(course.semester) || Number(student.currentSemester) || 1,
      status: 'enrolled',
      enrolledAt: new Date()
    });
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.studentId} (${student.userId?.firstName || ''} ${student.userId?.lastName || ''}) has been enrolled in ${course.courseCode}.`,
      student
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
    const { search, department } = req.query;
    const filter = {};
    if (department && department !== 'All') {
      filter.department = department;
    }

    let students = await Student.find(filter)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl isActive')
      .select('studentId department currentSemester cgpa enrolledCourses admissionYear batch createdAt')
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      students = students.filter((s) => {
        const fullName = `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.userId?.email?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q)
        );
      });
    }

    const studentList = await Promise.all(
      students.map(async (s) => {
        // Calculate aggregate attendance for this student
        const attStats = await Attendance.aggregate([
          { $match: { student: s._id } },
          {
            $group: {
              _id: null,
              attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
              total: { $sum: 1 }
            }
          }
        ]);
        const att = attStats[0] || { attended: 0, total: 0 };
        const attPct = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 100;

        // Calculate marks count
        const marksCount = await Marks.countDocuments({ student: s._id });

        return {
          id: s._id,
          studentId: s.studentId,
          name: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : 'Registered Student',
          email: s.userId?.email || 'N/A',
          phoneNumber: s.userId?.phoneNumber || 'N/A',
          department: s.department,
          semester: s.currentSemester,
          cgpa: s.cgpa || 0,
          totalClasses: att.total,
          attendedClasses: att.attended,
          attendancePercentage: attPct,
          isLowAttendance: attPct < 75 && att.total > 0,
          marksCount,
          createdAt: s.createdAt
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

/**
 * @desc    Teacher adds attendance for a student
 * @route   POST /api/v1/teacher/attendance
 * @access  Faculty / Teacher
 */
export const addStudentAttendance = async (req, res, next) => {
  try {
    const { studentId, subject, date, status, sessionType, remarks } = req.body;
    if (!studentId || !status) {
      return res.status(400).json({ success: false, message: 'Student ID and status are required.' });
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const faculty = await Faculty.findOne({ userId: req.user._id });
    const attDate = date ? new Date(date) : new Date();

    const record = await Attendance.create({
      student: student._id,
      subject: subject || 'Course Lecture',
      faculty: faculty?._id || null,
      date: attDate,
      sessionType: sessionType || 'lecture',
      status: status.toLowerCase(),
      markedBy: req.user._id,
      remarks: remarks || ''
    });

    res.status(201).json({ success: true, message: 'Attendance recorded successfully.', attendance: record });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher adds marks for a student
 * @route   POST /api/v1/teacher/marks
 * @access  Faculty / Teacher
 */
export const addStudentMarks = async (req, res, next) => {
  try {
    const { studentId, subject, examType, examLabel, marksObtained, maxMarks, semester, remarks } = req.body;
    if (!studentId || marksObtained === undefined) {
      return res.status(400).json({ success: false, message: 'Student ID and marks obtained are required.' });
    }
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const faculty = await Faculty.findOne({ userId: req.user._id });
    const subjectName = subject || 'General Subject';

    const newMark = await Marks.create({
      student: student._id,
      subject: subjectName,
      faculty: faculty?._id || null,
      examType: examType || 'internal_1',
      examLabel: examLabel || `${subjectName} Assessment`,
      marksObtained: Number(marksObtained),
      maxMarks: Number(maxMarks) || 100,
      semester: semester || student.currentSemester || 1,
      academicYear: '2026-2027',
      remarks: remarks || '',
      isPublished: true
    });

    res.status(201).json({ success: true, message: 'Marks recorded successfully.', marks: newMark });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher publishes a notice to all students
 * @route   POST /api/v1/teacher/notices
 * @access  Faculty / Teacher
 */
export const createTeacherNotice = async (req, res, next) => {
  try {
    const { title, content, category, priority, targetAudience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Notice title and content are required.' });
    }

    const notice = await Notice.create({
      title,
      content,
      category: category || 'Academic',
      priority: priority || 'medium',
      author: req.user._id,
      authorName: `${req.user.firstName} ${req.user.lastName}`,
      targetAudience: targetAudience || 'all',
      isPublished: true,
      publishedAt: new Date()
    });

    res.status(201).json({ success: true, message: 'Notice published successfully to all students.', notice });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher / Faculty registers a new student directly into MongoDB
 * @route   POST /api/v1/teacher/students/create
 * @access  Faculty / Teacher
 */
export const createStudentByTeacher = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password = 'Student@1234',
      studentId,
      department = 'Computer Science & Engineering',
      degreeProgram = 'B.Tech in Computer Science',
      currentSemester = 1,
      phoneNumber
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const generatedStudentId = studentId || `STU-${Date.now().toString().slice(-5)}`;
    const existingStudent = await Student.findOne({ studentId: generatedStudentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: `Student ID '${generatedStudentId}' already exists.` });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash: password,
      role: 'student',
      phoneNumber: phoneNumber || 'N/A',
      isActive: true
    });

    const student = await Student.create({
      userId: user._id,
      studentId: generatedStudentId,
      department,
      degreeProgram,
      currentSemester: Number(currentSemester) || 1,
      admissionYear: new Date().getFullYear(),
      batch: `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
      enrolledCourses: []
    });

    res.status(201).json({
      success: true,
      message: `Student account for ${firstName} ${lastName} created successfully.`,
      student: {
        id: student._id,
        studentId: student.studentId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        department: student.department,
        semester: student.currentSemester
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher updates student details
 * @route   PUT /api/v1/teacher/students/:studentId
 * @access  Faculty / Teacher
 */
export const updateStudentByTeacher = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { firstName, lastName, department, degreeProgram, currentSemester, phoneNumber, cgpa } = req.body;

    const query = studentId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: studentId }, { studentId }] }
      : { studentId };

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    if (department) student.department = department;
    if (degreeProgram) student.degreeProgram = degreeProgram;
    if (currentSemester) student.currentSemester = Number(currentSemester);
    if (cgpa !== undefined) student.cgpa = Number(cgpa);
    await student.save();

    if (firstName || lastName || phoneNumber) {
      const user = await User.findById(student.userId);
      if (user) {
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
      student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Teacher deletes student and linked user account from MongoDB
 * @route   DELETE /api/v1/teacher/students/:studentId
 * @access  Faculty / Teacher
 */
export const deleteStudentByTeacher = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const query = studentId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: studentId }, { studentId }] }
      : { studentId };

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Delete associated User
    await User.findByIdAndDelete(student.userId);
    // Delete Student
    await Student.findByIdAndDelete(student._id);
    // Delete student attendance and marks
    await Attendance.deleteMany({ student: student._id });
    await Marks.deleteMany({ student: student._id });

    res.status(200).json({
      success: true,
      message: `Student '${student.studentId}' and all linked academic records deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle student account active / approval status
 * @route   PUT /api/v1/teacher/students/:studentId/status
 * @access  Faculty / Teacher
 */
export const toggleStudentStatusByTeacher = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const query = studentId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: studentId }, { studentId }] }
      : { studentId };

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Student account is now ${user.isActive ? 'Active' : 'Suspended / Inactive'}.`,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign multiple courses to a student in one operation
 * @route   POST /api/v1/teacher/students/:studentId/assign-courses
 * @access  Faculty / Teacher
 */
export const assignMultipleCoursesToStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseIds } = req.body; // Array of course ObjectId strings

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of course IDs.' });
    }

    const query = studentId.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: studentId }, { studentId }] }
      : { studentId };

    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    let addedCount = 0;
    for (const cId of courseIds) {
      const course = await Course.findById(cId);
      if (!course) continue;

      const alreadyEnrolled = (student.enrolledCourses || []).some(
        (e) => e.courseId && e.courseId.toString() === course._id.toString()
      );

      if (!alreadyEnrolled) {
        student.enrolledCourses.push({
          courseId: course._id,
          semester: Number(course.semester) || Number(student.currentSemester) || 1,
          status: 'enrolled',
          enrolledAt: new Date()
        });
        addedCount++;
      }
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: `Successfully enrolled student into ${addedCount} courses.`,
      enrolledCourses: student.enrolledCourses
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ── STUDENT MANAGEMENT CRUD ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @desc    Get all students with full profile for faculty management panel
 * @route   GET /api/v1/teacher/manage/students
 * @access  Faculty / Admin
 */
export const getStudentManagementList = async (req, res, next) => {
  try {
    const {
      search = '',
      department = 'All',
      semester = 'All',
      status = 'All',
      page = 1,
      limit = 20
    } = req.query;

    // Build MongoDB filter
    const filter = {};
    if (department && department !== 'All') filter.department = department;
    if (semester && semester !== 'All') filter.currentSemester = Number(semester);

    const skip = (Number(page) - 1) * Number(limit);

    let students = await Student.find(filter)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl isActive createdAt lastLoginAt')
      .populate('enrolledCourses.courseId', 'courseCode courseName')
      .sort({ createdAt: -1 });

    // Apply search (post-filter for relational fields)
    if (search) {
      const q = search.toLowerCase();
      students = students.filter((s) => {
        const fullName = `${s.userId?.firstName || ''} ${s.userId?.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(q) ||
          s.studentId?.toLowerCase().includes(q) ||
          s.userId?.email?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.degreeProgram?.toLowerCase().includes(q)
        );
      });
    }

    // Apply account status filter
    if (status && status !== 'All') {
      const isActive = status === 'Active';
      students = students.filter((s) => s.userId?.isActive === isActive);
    }

    const total = students.length;
    const paginated = students.slice(skip, skip + Number(limit));

    const studentList = paginated.map((s) => ({
      _id: s._id,
      userId: s.userId?._id,
      studentId: s.studentId,
      name: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : 'Unknown Student',
      firstName: s.userId?.firstName || '',
      lastName: s.userId?.lastName || '',
      email: s.userId?.email || '',
      phoneNumber: s.userId?.phoneNumber || '',
      avatarUrl: s.userId?.avatarUrl || null,
      isActive: s.userId?.isActive !== false,
      lastLoginAt: s.userId?.lastLoginAt,
      department: s.department,
      degreeProgram: s.degreeProgram,
      currentSemester: s.currentSemester,
      admissionYear: s.admissionYear,
      batch: s.batch,
      cgpa: s.cgpa || 0,
      completedCredits: s.completedCredits || 0,
      enrolledCourses: s.enrolledCourses?.map((ec) => ({
        courseId: ec.courseId?._id,
        courseCode: ec.courseId?.courseCode,
        courseName: ec.courseId?.courseName,
        status: ec.status,
        semester: ec.semester
      })) || [],
      emergencyContact: s.emergencyContact || {},
      createdAt: s.createdAt
    }));

    // Get unique departments for filter
    const allDepartments = await Student.distinct('department');

    res.status(200).json({
      success: true,
      count: total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      students: studentList,
      departments: allDepartments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new student (faculty creates user + student profile)
 * @route   POST /api/v1/teacher/manage/students
 * @access  Faculty / Admin
 */
export const addStudentByFaculty = async (req, res, next) => {
  let createdUser = null;
  try {
    const {
      firstName,
      lastName,
      email,
      password = 'Student@1234',
      phoneNumber,
      department,
      degreeProgram,
      currentSemester,
      admissionYear,
      batch,
      studentId,
      cgpa,
      emergencyContact
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required.'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user with email '${email}' already exists.`
      });
    }

    // Auto-generate student ID if not provided
    const autoStudentId = studentId ||
      `STU-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

    // Check if student ID already exists
    const existingStudentId = await Student.findOne({ studentId: autoStudentId.toUpperCase() });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: `Student ID '${autoStudentId}' already exists. Please provide a unique ID.`
      });
    }

    // Create user account
    createdUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: 'student',
      phoneNumber: phoneNumber || '',
      isActive: true
    });

    // Create student profile
    const admYear = Number(admissionYear) || new Date().getFullYear();
    const student = await Student.create({
      userId: createdUser._id,
      studentId: autoStudentId.toUpperCase(),
      department: (department || 'Computer Science').trim(),
      degreeProgram: (degreeProgram || 'Bachelor of Technology').trim(),
      currentSemester: Number(currentSemester) || 1,
      admissionYear: admYear,
      batch: batch || `${admYear}-${admYear + 4}`,
      cgpa: Math.min(10, Math.max(0, Number(cgpa) || 0)),
      completedCredits: 0,
      emergencyContact: emergencyContact || {}
    });

    res.status(201).json({
      success: true,
      message: `Student ${firstName} ${lastName} (${autoStudentId.toUpperCase()}) added successfully.`,
      student: {
        _id: student._id,
        studentId: student.studentId,
        name: `${firstName} ${lastName}`,
        email: createdUser.email,
        department: student.department,
        degreeProgram: student.degreeProgram,
        currentSemester: student.currentSemester,
        isActive: true
      }
    });
  } catch (error) {
    // Rollback: delete orphaned User if Student creation failed
    if (createdUser) {
      try { await User.findByIdAndDelete(createdUser._id); } catch (_) {}
    }
    // Return validation errors in a friendly format
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join('; ');
      return res.status(400).json({ success: false, message: messages });
    }
    next(error);
  }
};


/**
 * @desc    Edit student profile details
 * @route   PUT /api/v1/teacher/manage/students/:id
 * @access  Faculty / Admin
 */
export const editStudentByFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phoneNumber,
      department,
      degreeProgram,
      currentSemester,
      admissionYear,
      batch,
      cgpa,
      completedCredits,
      emergencyContact,
      isActive
    } = req.body;

    const student = await Student.findById(id).populate('userId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Update User fields
    const user = await User.findById(student.userId._id || student.userId);
    if (user) {
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
      if (isActive !== undefined) user.isActive = isActive;
      await user.save();
    }

    // Update Student fields
    if (department !== undefined) student.department = department;
    if (degreeProgram !== undefined) student.degreeProgram = degreeProgram;
    if (currentSemester !== undefined) student.currentSemester = Number(currentSemester);
    if (admissionYear !== undefined) student.admissionYear = Number(admissionYear);
    if (batch !== undefined) student.batch = batch;
    if (cgpa !== undefined) student.cgpa = Number(cgpa);
    if (completedCredits !== undefined) student.completedCredits = Number(completedCredits);
    if (emergencyContact !== undefined) {
      student.emergencyContact = { ...student.emergencyContact || {}, ...emergencyContact };
    }
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.studentId} updated successfully.`,
      student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student (deactivate user + remove student profile)
 * @route   DELETE /api/v1/teacher/manage/students/:id
 * @access  Admin / Super Admin only
 */
export const deleteStudentByFaculty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete = false } = req.query;

    const student = await Student.findById(id).populate('userId', '_id firstName lastName');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const studentName = student.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : student.studentId;

    if (hardDelete === 'true' || req.user.role === 'super_admin') {
      // Hard delete: remove user and all associated data
      if (student.userId?._id) {
        await User.findByIdAndDelete(student.userId._id);
      }
      await Student.findByIdAndDelete(id);
      // Optionally remove attendance and marks records
      await Attendance.deleteMany({ student: id });
      await Marks.deleteMany({ student: id });

      return res.status(200).json({
        success: true,
        message: `Student ${studentName} (${student.studentId}) permanently deleted.`
      });
    }

    // Soft delete: deactivate user account
    if (student.userId?._id) {
      await User.findByIdAndUpdate(student.userId._id, { isActive: false });
    }

    res.status(200).json({
      success: true,
      message: `Student ${studentName} (${student.studentId}) account has been deactivated.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve / Reactivate student account
 * @route   PUT /api/v1/teacher/manage/students/:id/approve
 * @access  Faculty / Admin
 */
export const approveStudentAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action = 'approve' } = req.body; // 'approve' | 'suspend'

    const student = await Student.findById(id).populate('userId', '_id firstName lastName email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const isActive = action === 'approve';
    await User.findByIdAndUpdate(student.userId._id, { isActive });

    res.status(200).json({
      success: true,
      message: `Student ${student.userId?.firstName} ${student.userId?.lastName} (${student.studentId}) ${isActive ? 'approved and activated' : 'suspended'} successfully.`,
      studentId: student._id,
      isActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get department and semester stats for management filters
 * @route   GET /api/v1/teacher/manage/departments
 * @access  Faculty / Admin
 */
export const getDepartmentStats = async (req, res, next) => {
  try {
    const deptStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          avgCgpa: { $avg: '$cgpa' },
          semesters: { $addToSet: '$currentSemester' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const semStats = await Student.aggregate([
      {
        $group: {
          _id: '$currentSemester',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalStudents = await Student.countDocuments();
    // Count active students by joining Student profiles with their User accounts
    const activeStudentUsers = await Student.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.isActive': true } },
      { $count: 'count' }
    ]);
    const activeStudents = activeStudentUsers[0]?.count || 0;

    res.status(200).json({
      success: true,
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      departments: deptStats.map((d) => ({
        name: d._id,
        count: d.count,
        avgCgpa: Number((d.avgCgpa || 0).toFixed(2))
      })),
      semesters: semStats.map((s) => ({
        semester: s._id,
        count: s.count
      }))
    });
  } catch (error) {
    next(error);
  }
};
