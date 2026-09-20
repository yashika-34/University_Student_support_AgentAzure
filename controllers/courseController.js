import Course from '../models/Course.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

/**
 * @desc    Get all courses with filtering and search
 * @route   GET /api/v1/courses
 * @access  Private
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const { department, semester, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (department) filter.department = department;
    if (semester) filter.semester = Number(semester);
    if (search) {
      filter.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate({
        path: 'leadFaculty',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .skip(skip)
      .limit(Number(limit))
      .sort({ courseCode: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single course by ID or course code
 * @route   GET /api/v1/courses/:id
 * @access  Private
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = { courseCode: id.toUpperCase() };

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { $or: [{ _id: id }, { courseCode: id.toUpperCase() }] };
    }

    const course = await Course.findOne(query)
      .populate({
        path: 'leadFaculty',
        populate: { path: 'userId', select: 'firstName lastName email phoneNumber' }
      })
      .populate('prerequisites', 'courseCode courseName credits');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Course '${id}' not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses associated with logged-in user (Student: enrolled; Faculty: taught)
 * @route   GET /api/v1/courses/my-courses
 * @access  Private (Student, Faculty)
 */
export const getMyCourses = async (req, res, next) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id }).populate({
        path: 'enrolledCourses.courseId',
        populate: {
          path: 'leadFaculty',
          populate: { path: 'userId', select: 'firstName lastName email' }
        }
      });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      return res.status(200).json({
        success: true,
        count: student.enrolledCourses.length,
        data: student.enrolledCourses
      });
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
      }

      const courses = await Course.find({ leadFaculty: faculty._id });
      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Endpoint only applies to students or faculty.'
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new course offering
 * @route   POST /api/v1/courses
 * @access  Private (Admin)
 */
export const createCourse = async (req, res, next) => {
  try {
    const { courseCode, courseName, description, department, credits, semester, leadFaculty, schedule, syllabus } = req.body;

    const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: `Course with code '${courseCode}' already exists.`
      });
    }

    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      description,
      department,
      credits,
      semester,
      leadFaculty,
      schedule: schedule || [],
      syllabus: syllabus || {}
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll student in a course
 * @route   POST /api/v1/courses/:courseId/enroll
 * @access  Private (Student, Admin)
 */
export const enrollStudentInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Active course not found.' });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      (c) => c.courseId.toString() === courseId && c.status === 'enrolled'
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course.'
      });
    }

    student.enrolledCourses.push({
      courseId: course._id,
      semester: course.semester,
      status: 'enrolled'
    });

    await student.save();

    res.status(200).json({
      success: true,
      message: `Enrolled in ${course.courseCode} successfully.`,
      enrolledCourses: student.enrolledCourses
    });
  } catch (error) {
    next(error);
  }
};
