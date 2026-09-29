import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Course from '../models/Course.js';
import { logAudit } from '../services/auditService.js';

/**
 * @desc    Get all assignments for logged-in student (pending, submitted, graded)
 * @route   GET /api/v1/assignments/my
 * @access  Private (Student)
 */
export const getMyAssignments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enrolledCourseIds = student.enrolledCourses
      .filter((c) => c.status === 'enrolled')
      .map((c) => c.courseId);

    const assignments = await Assignment.find({
      course: { $in: enrolledCourseIds }
    })
      .populate('course', 'courseCode courseName')
      .sort({ dueDate: 1 });

    const formatted = assignments.map((assign) => {
      const submission = assign.submissions?.find(
        (s) => s.student.toString() === student._id.toString()
      );
      const isPastDue = new Date(assign.dueDate) < new Date();
      let status = 'pending';
      if (submission) {
        status = submission.status === 'graded' ? 'graded' : 'submitted';
      } else if (isPastDue) {
        status = 'overdue';
      }

      return {
        id: assign._id,
        courseCode: assign.course?.courseCode || 'Unknown',
        courseName: assign.course?.courseName || 'Course',
        title: assign.title,
        description: assign.description,
        dueDate: assign.dueDate,
        maxScore: assign.maxScore,
        attachmentUrl: assign.attachmentUrl,
        isSubmitted: !!submission,
        status,
        submissionDetails: submission || null
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get upcoming pending assignments for logged-in student
 * @route   GET /api/v1/assignments/my-pending
 * @access  Private (Student)
 */
export const getMyPendingAssignments = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const enrolledCourseIds = student.enrolledCourses
      .filter((c) => c.status === 'enrolled')
      .map((c) => c.courseId);

    const assignments = await Assignment.find({
      course: { $in: enrolledCourseIds },
      dueDate: { $gte: new Date() }
    })
      .populate('course', 'courseCode courseName')
      .sort({ dueDate: 1 });

    const formatted = assignments.map((assign) => {
      const submission = assign.submissions?.find(
        (s) => s.student.toString() === student._id.toString()
      );
      return {
        id: assign._id,
        courseCode: assign.course?.courseCode || 'Unknown',
        courseName: assign.course?.courseName || 'Course',
        title: assign.title,
        description: assign.description,
        dueDate: assign.dueDate,
        maxScore: assign.maxScore,
        attachmentUrl: assign.attachmentUrl,
        isSubmitted: !!submission,
        status: submission ? (submission.status === 'graded' ? 'graded' : 'submitted') : 'pending',
        submissionDetails: submission || null
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all assignments for a course
 * @route   GET /api/v1/assignments/course/:courseId
 * @access  Private
 */
export const getAssignmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const assignments = await Assignment.find({ course: courseId })
      .populate('createdBy', 'employeeId')
      .populate('course', 'courseCode courseName')
      .sort({ dueDate: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course assignment
 * @route   POST /api/v1/assignments
 * @access  Private (Faculty, Admin)
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { courseId, courseCode, title, description, maxScore, dueDate, attachmentUrl, allowedFileTypes } = req.body;

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only faculty or admins can post assignments.' });
    }

    let targetCourseId = courseId;
    if (!targetCourseId && courseCode) {
      const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
      if (course) targetCourseId = course._id;
    }

    if (!targetCourseId) {
      return res.status(400).json({ success: false, message: 'Valid course is required.' });
    }

    const assignment = await Assignment.create({
      course: targetCourseId,
      createdBy: faculty ? faculty._id : req.body.facultyId,
      title,
      description,
      maxScore: maxScore || 100,
      dueDate: new Date(dueDate),
      attachmentUrl: attachmentUrl || null,
      allowedFileTypes: allowedFileTypes || ['pdf', 'docx', 'zip']
    });

    await logAudit({
      action: 'UPDATE_MARKS', // Or general assignment creation
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Assignment',
      resourceId: assignment._id,
      metadata: { title: assignment.title, courseId: targetCourseId, dueDate: assignment.dueDate },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Assignment published successfully.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit student assignment file or text
 * @route   POST /api/v1/assignments/:id/submit
 * @access  Private (Student)
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fileUrl, content, fileName } = req.body;

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const isLate = new Date() > new Date(assignment.dueDate);
    const submissionContent = fileUrl || fileName || content || (req.file ? req.file.originalname : 'Online Submission');

    const existingIndex = assignment.submissions.findIndex(
      (s) => s.student.toString() === student._id.toString()
    );

    if (existingIndex > -1) {
      assignment.submissions[existingIndex].fileUrl = submissionContent;
      assignment.submissions[existingIndex].submittedAt = new Date();
      assignment.submissions[existingIndex].status = isLate ? 'late' : 'resubmitted';
    } else {
      assignment.submissions.push({
        student: student._id,
        fileUrl: submissionContent,
        submittedAt: new Date(),
        status: isLate ? 'late' : 'submitted'
      });
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: isLate ? 'Assignment submitted late.' : 'Assignment submitted successfully.',
      submissionStatus: isLate ? 'late' : 'submitted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all submissions for an assignment (Faculty view)
 * @route   GET /api/v1/assignments/:id/submissions
 * @access  Private (Faculty, Admin)
 */
export const getAssignmentSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate({
        path: 'submissions.student',
        select: 'studentId department currentSemester userId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate('course', 'courseCode courseName');

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const submissions = assignment.submissions.map((s) => ({
      _id: s._id,
      studentId: s.student?._id,
      studentRollNo: s.student?.studentId || 'N/A',
      studentName: s.student?.userId ? `${s.student.userId.firstName} ${s.student.userId.lastName}` : 'Unknown Student',
      studentEmail: s.student?.userId?.email || '',
      submittedAt: s.submittedAt,
      fileUrl: s.fileUrl,
      status: s.status,
      grade: s.grade,
      feedback: s.feedback,
      gradedAt: s.gradedAt
    }));

    res.status(200).json({
      success: true,
      assignment: {
        id: assignment._id,
        title: assignment.title,
        courseCode: assignment.course?.courseCode,
        courseName: assignment.course?.courseName,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore
      },
      count: submissions.length,
      submissions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grade a student submission
 * @route   PUT /api/v1/assignments/:id/grade
 * @access  Private (Faculty, Admin)
 */
export const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentId, grade, feedback } = req.body;

    const faculty = await Faculty.findOne({ userId: req.user._id });
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const submission = assignment.submissions.find(
      (s) => s.student.toString() === studentId || s._id.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission record for this student not found.' });
    }

    submission.grade = Number(grade);
    submission.feedback = feedback || null;
    submission.gradedBy = faculty ? faculty._id : null;
    submission.gradedAt = new Date();
    submission.status = 'graded';

    await assignment.save();

    await logAudit({
      action: 'UPDATE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Assignment',
      resourceId: assignment._id,
      metadata: { action: 'grade_assignment_submission', studentId, grade },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      submission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete assignment
 * @route   DELETE /api/v1/assignments/:id
 * @access  Private (Faculty, Admin)
 */
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    await logAudit({
      action: 'DELETE_MARKS', // Or deletion audit
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Assignment',
      resourceId: req.params.id,
      metadata: { title: assignment.title },
      req
    });

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
