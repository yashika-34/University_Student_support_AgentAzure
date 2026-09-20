import Student from '../models/Student.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';

/**
 * @desc    Get current student's full profile
 * @route   GET /api/v1/students/me
 * @access  Private (Student)
 */
export const getMyStudentProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl')
      .populate('academicAdvisor')
      .populate('enrolledCourses.courseId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found for this user.'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all students with filters and pagination
 * @route   GET /api/v1/students
 * @access  Private (Faculty, Admin)
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (semester) filter.currentSemester = Number(semester);
    if (search) {
      filter.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { degreeProgram: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate('userId', 'firstName lastName email phoneNumber')
      .skip(skip)
      .limit(Number(limit))
      .sort({ studentId: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student by ID or Student Roll Number
 * @route   GET /api/v1/students/:id
 * @access  Private (Faculty, Admin, or Student self)
 */
export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { studentId: id };

    // If ID is valid ObjectId, search by _id or userId or studentId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: id }, { userId: id }, { studentId: id }] };
    }

    const student = await Student.findOne(query)
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl')
      .populate('academicAdvisor')
      .populate('enrolledCourses.courseId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with identifier '${id}' not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student profile details
 * @route   PUT /api/v1/students/me
 * @access  Private (Student)
 */
export const updateStudentProfile = async (req, res, next) => {
  try {
    const { phoneNumber, emergencyContact } = req.body;

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found.'
      });
    }

    if (emergencyContact) {
      student.emergencyContact = {
        ...student.emergencyContact,
        ...emergencyContact
      };
      await student.save();
    }

    if (phoneNumber) {
      await User.findByIdAndUpdate(req.user._id, { phoneNumber });
    }

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully.',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get academic dashboard summary (credits, CGPA, courses count)
 * @route   GET /api/v1/students/me/academic-summary
 * @access  Private (Student)
 */
export const getAcademicSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found.'
      });
    }

    const activeEnrollments = student.enrolledCourses.filter((c) => c.status === 'enrolled');

    res.status(200).json({
      success: true,
      summary: {
        studentId: student.studentId,
        department: student.department,
        degreeProgram: student.degreeProgram,
        currentSemester: student.currentSemester,
        cgpa: student.cgpa,
        completedCredits: student.completedCredits,
        activeCoursesCount: activeEnrollments.length
      }
    });
  } catch (error) {
    next(error);
  }
};
