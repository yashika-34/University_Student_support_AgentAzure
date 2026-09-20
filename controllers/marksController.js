import Marks from '../models/Marks.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Faculty from '../models/Faculty.js';

/**
 * @desc    Get logged-in student's own published marks
 * @route   GET /api/v1/marks/my
 * @access  Student
 */
export const getMyMarks = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const marks = await Marks.find({ student: student._id, isPublished: true })
      .populate('course', 'courseCode courseName credits department')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: marks.length, marks });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get marks summary (GPA, grade breakdown) for logged-in student
 * @route   GET /api/v1/marks/summary
 * @access  Student
 */
export const getMarksSummary = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const allMarks = await Marks.find({ student: student._id, isPublished: true })
      .populate('course', 'courseCode courseName credits');

    // Group by semester
    const bySemester = {};
    allMarks.forEach((m) => {
      const sem = m.semester || 'Unknown';
      if (!bySemester[sem]) bySemester[sem] = [];
      bySemester[sem].push(m);
    });

    // Calculate SGPA per semester
    const semesterSummaries = Object.entries(bySemester).map(([sem, entries]) => {
      const totalCredits = entries.reduce((acc, e) => acc + (e.course?.credits || 3), 0);
      const weightedPoints = entries.reduce((acc, e) => acc + ((e.course?.credits || 3) * e.gradePoints), 0);
      const sgpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : 0;
      return { semester: sem, sgpa: parseFloat(sgpa), totalCredits, courses: entries.length };
    });

    // Grade distribution
    const gradeDistribution = {};
    allMarks.forEach((m) => {
      gradeDistribution[m.grade] = (gradeDistribution[m.grade] || 0) + 1;
    });

    // Calculate overall CGPA
    const totalCredits = allMarks.reduce((acc, m) => acc + (m.course?.credits || 3), 0);
    const totalWeighted = allMarks.reduce((acc, m) => acc + ((m.course?.credits || 3) * m.gradePoints), 0);
    const cgpa = totalCredits > 0 ? (totalWeighted / totalCredits).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      summary: {
        cgpa: parseFloat(cgpa),
        totalMarksEntries: allMarks.length,
        gradeDistribution,
        semesterSummaries: semesterSummaries.sort((a, b) => a.semester - b.semester),
        recentMarks: allMarks.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all marks for a course (faculty view)
 * @route   GET /api/v1/marks/course/:courseId
 * @access  Faculty, Admin
 */
export const getCourseMarks = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { examType, semester } = req.query;

    const filter = { course: courseId };
    if (examType) filter.examType = examType;
    if (semester) filter.semester = Number(semester);

    const marks = await Marks.find(filter)
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'firstName lastName email' },
        select: 'studentId department currentSemester'
      })
      .sort({ 'student.studentId': 1, examType: 1 });

    // Compute course statistics
    const published = marks.filter((m) => m.isPublished);
    const avg = published.length
      ? (published.reduce((acc, m) => acc + m.percentage, 0) / published.length).toFixed(1)
      : 0;
    const highest = published.length ? Math.max(...published.map((m) => m.percentage)) : 0;
    const lowest = published.length ? Math.min(...published.map((m) => m.percentage)) : 0;

    res.status(200).json({
      success: true,
      count: marks.length,
      stats: { average: parseFloat(avg), highest, lowest },
      marks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Faculty adds marks for a student
 * @route   POST /api/v1/marks
 * @access  Faculty, Admin
 */
export const addMarks = async (req, res, next) => {
  try {
    const { studentId, courseId, examType, examLabel, marksObtained, maxMarks, semester, academicYear, remarks } = req.body;

    const faculty = await Faculty.findOne({ userId: req.user._id });
    const student = await Student.findById(studentId);
    const course = await Course.findById(courseId);

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

    const entry = await Marks.create({
      student: studentId,
      course: courseId,
      faculty: faculty?._id,
      examType,
      examLabel,
      marksObtained,
      maxMarks: maxMarks || 100,
      semester: semester || student.currentSemester,
      academicYear,
      remarks,
      isPublished: false
    });

    await entry.populate('course', 'courseCode courseName');
    await entry.populate({ path: 'student', populate: { path: 'userId', select: 'firstName lastName' } });

    res.status(201).json({ success: true, message: 'Marks added successfully.', marks: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Faculty updates a marks entry
 * @route   PUT /api/v1/marks/:id
 * @access  Faculty, Admin
 */
export const updateMarks = async (req, res, next) => {
  try {
    const entry = await Marks.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Marks entry not found.' });

    const { marksObtained, maxMarks, examLabel, remarks, semester } = req.body;
    if (marksObtained !== undefined) entry.marksObtained = marksObtained;
    if (maxMarks !== undefined) entry.maxMarks = maxMarks;
    if (examLabel !== undefined) entry.examLabel = examLabel;
    if (remarks !== undefined) entry.remarks = remarks;
    if (semester !== undefined) entry.semester = semester;

    await entry.save(); // pre-save hook recalculates grade/percentage

    res.status(200).json({ success: true, message: 'Marks updated successfully.', marks: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish marks (make visible to student)
 * @route   PATCH /api/v1/marks/:id/publish
 * @access  Faculty, Admin
 */
export const publishMarks = async (req, res, next) => {
  try {
    const entry = await Marks.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Marks entry not found.' });

    res.status(200).json({ success: true, message: 'Marks published successfully.', marks: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete marks entry
 * @route   DELETE /api/v1/marks/:id
 * @access  Faculty, Admin
 */
export const deleteMarks = async (req, res, next) => {
  try {
    const entry = await Marks.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Marks entry not found.' });

    res.status(200).json({ success: true, message: 'Marks entry deleted.' });
  } catch (error) {
    next(error);
  }
};
