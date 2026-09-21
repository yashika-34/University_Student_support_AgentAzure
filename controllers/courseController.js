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

// ---------------------------------------------------------------------
// Additional Course Management Functions
// ---------------------------------------------------------------------

/**
 * @desc    Update course details
 * @route   PUT /api/v1/courses/:id
 * @access  Private (Faculty/Admin)
 */
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Ensure courseCode remains uppercase if provided
    if (updates.courseCode) updates.courseCode = updates.courseCode.toUpperCase();
    const course = await Course.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate({ path: 'leadFaculty', populate: { path: 'userId', select: 'firstName lastName email' } });
    if (!course) {
      return res.status(404).json({ success: false, message: `Course '${id}' not found.` });
    }
    res.status(200).json({ success: true, message: 'Course updated.', data: course });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete a course (set isActive false)
 * @route   DELETE /api/v1/courses/:id
 * @access  Private (Faculty/Admin)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!course) {
      return res.status(404).json({ success: false, message: `Course '${id}' not found.` });
    }
    res.status(200).json({ success: true, message: 'Course deactivated.', data: course });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enrollment list for a course
 * @route   GET /api/v1/courses/:id/enrollment
 * @access  Private (Faculty/Admin)
 */
export const getCourseEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Active course not found.' });
    }
    // Find students enrolled in this course
    const students = await Student.find({ 'enrolledCourses.courseId': course._id })
      .populate('userId', 'firstName lastName email');
    const enrollment = students.map(s => ({
      studentId: s._id,
      name: `${s.userId.firstName} ${s.userId.lastName}`,
      email: s.userId.email,
      semester: s.enrolledCourses.find(ec => ec.courseId.toString() === course._id.toString()).semester,
      status: s.enrolledCourses.find(ec => ec.courseId.toString() === course._id.toString()).status,
    }));
    res.status(200).json({ success: true, count: enrollment.length, data: enrollment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk enroll multiple students into a course
 * @route   POST /api/v1/courses/:id/enroll-students
 * @access  Private (Faculty/Admin)
 */
export const enrollStudentsInCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body; // array of student ObjectIds
    const course = await Course.findById(id);
    if (!course || !course.isActive) {
      return res.status(404).json({ success: false, message: 'Active course not found.' });
    }
    const results = [];
    for (const sid of studentIds) {
      const student = await Student.findById(sid);
      if (!student) {
        results.push({ studentId: sid, status: 'not_found' });
        continue;
      }
      const already = student.enrolledCourses.some(ec => ec.courseId.toString() === id);
      if (already) {
        results.push({ studentId: sid, status: 'already_enrolled' });
        continue;
      }
      student.enrolledCourses.push({ courseId: course._id, semester: course.semester, status: 'enrolled' });
      await student.save();
      results.push({ studentId: sid, status: 'enrolled' });
    }
    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unenroll a single student from a course
 * @route   DELETE /api/v1/courses/:id/enroll/:studentId
 * @access  Private (Faculty/Admin)
 */
export const unenrollStudentFromCourse = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const before = student.enrolledCourses.length;
    student.enrolledCourses = student.enrolledCourses.filter(ec => ec.courseId.toString() !== id);
    if (student.enrolledCourses.length === before) {
      return res.status(400).json({ success: false, message: 'Student not enrolled in this course.' });
    }
    await student.save();
    res.status(200).json({ success: true, message: 'Student unenrolled.', data: student.enrolledCourses });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses grouped by department with enrollment counts
 * @route   GET /api/v1/courses/by-department
 * @access  Private (Faculty/Admin)
 */
export const getCoursesByDepartment = async (req, res, next) => {
  try {
    const aggregation = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'enrolledCourses.courseId',
          as: 'enrolledStudents'
        }
      },
      {
        $group: {
          _id: '$department',
          courses: { $push: { _id: '$_id', name: '$courseName', code: '$courseCode', count: { $size: '$enrolledStudents' } } },
          totalCourses: { $sum: 1 },
          totalEnrolled: { $sum: { $size: '$enrolledStudents' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, data: aggregation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get courses grouped by semester with enrollment counts
 * @route   GET /api/v1/courses/by-semester
 * @access  Private (Faculty/Admin)
 */
export const getCoursesBySemester = async (req, res, next) => {
  try {
    const aggregation = await Course.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: 'enrolledCourses.courseId',
          as: 'enrolledStudents'
        }
      },
      {
        $group: {
          _id: '$semester',
          courses: { $push: { _id: '$_id', name: '$courseName', code: '$courseCode', count: { $size: '$enrolledStudents' } } },
          totalCourses: { $sum: 1 },
          totalEnrolled: { $sum: { $size: '$enrolledStudents' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, data: aggregation });
  } catch (error) {
    next(error);
  }
};

// End of additional functions
