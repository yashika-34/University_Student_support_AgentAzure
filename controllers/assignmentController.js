import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

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

    // Attach student submission status
    const formatted = assignments.map((assign) => {
      const submission = assign.submissions.find(
        (s) => s.student.toString() === student._id.toString()
      );
      return {
        id: assign._id,
        courseCode: assign.course.courseCode,
        courseName: assign.course.courseName,
        title: assign.title,
        description: assign.description,
        dueDate: assign.dueDate,
        maxScore: assign.maxScore,
        attachmentUrl: assign.attachmentUrl,
        isSubmitted: !!submission,
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
 * @access  Private (Faculty)
 */
export const createAssignment = async (req, res, next) => {
  try {
    const { courseId, title, description, maxScore, dueDate, attachmentUrl, allowedFileTypes } = req.body;

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only faculty can post assignments.' });
    }

    const assignment = await Assignment.create({
      course: courseId,
      createdBy: faculty ? faculty._id : req.body.facultyId,
      title,
      description,
      maxScore: maxScore || 100,
      dueDate: new Date(dueDate),
      attachmentUrl: attachmentUrl || null,
      allowedFileTypes: allowedFileTypes || ['.pdf', '.zip']
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
 * @desc    Submit an assignment
 * @route   POST /api/v1/assignments/:id/submit
 * @access  Private (Student)
 */
export const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'Submission file URL is required.' });
    }

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    // Check existing submission
    const existingIndex = assignment.submissions.findIndex(
      (s) => s.student.toString() === student._id.toString()
    );

    if (existingIndex > -1) {
      assignment.submissions[existingIndex].fileUrl = fileUrl;
      assignment.submissions[existingIndex].submittedAt = new Date();
      assignment.submissions[existingIndex].status = isLate ? 'late' : 'resubmitted';
    } else {
      assignment.submissions.push({
        student: student._id,
        fileUrl,
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
 * @desc    Grade a student submission
 * @route   PUT /api/v1/assignments/:id/grade
 * @access  Private (Faculty)
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
      (s) => s.student.toString() === studentId
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

    res.status(200).json({
      success: true,
      message: 'Submission graded successfully.',
      submission
    });
  } catch (error) {
    next(error);
  }
};
