import mongoose from 'mongoose';
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

    const formattedMarks = marks.map((m) => ({
      _id: m._id,
      subject: m.subject || m.course?.courseName || 'General',
      courseCode: m.course?.courseCode || m.subject?.slice(0, 6) || 'GEN',
      courseName: m.course?.courseName || m.subject || 'General',
      credits: m.course?.credits || 3,
      examType: m.examType,
      examLabel: m.examLabel || `${m.subject || m.course?.courseName || 'Course'} Exam`,
      marksObtained: m.marksObtained,
      maxMarks: m.maxMarks,
      percentage: m.percentage,
      grade: m.grade,
      gradePoints: m.gradePoints,
      semester: m.semester,
      academicYear: m.academicYear,
      remarks: m.remarks,
      createdAt: m.createdAt
    }));

    res.status(200).json({ success: true, count: marks.length, marks: formattedMarks });
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
      const sem = m.semester || 1;
      if (!bySemester[sem]) bySemester[sem] = [];
      bySemester[sem].push(m);
    });

    // Calculate SGPA per semester
    const semesterSummaries = Object.entries(bySemester).map(([sem, entries]) => {
      const totalCredits = entries.reduce((acc, e) => acc + (e.course?.credits || 3), 0);
      const weightedPoints = entries.reduce((acc, e) => acc + ((e.course?.credits || 3) * (e.gradePoints || 0)), 0);
      const sgpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : 0;
      return { semester: sem, sgpa: parseFloat(sgpa), totalCredits, courses: entries.length };
    });

    // Grade distribution
    const gradeDistribution = {};
    allMarks.forEach((m) => {
      if (m.grade) {
        gradeDistribution[m.grade] = (gradeDistribution[m.grade] || 0) + 1;
      }
    });

    // Calculate overall CGPA
    const totalCredits = allMarks.reduce((acc, m) => acc + (m.course?.credits || 3), 0);
    const totalWeighted = allMarks.reduce((acc, m) => acc + ((m.course?.credits || 3) * (m.gradePoints || 0)), 0);
    const cgpa = totalCredits > 0 ? (totalWeighted / totalCredits).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      summary: {
        cgpa: parseFloat(cgpa) || student.cgpa || 0,
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
    const { examType, semester, studentId } = req.query;

    const filter = {};
    if (courseId && courseId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        filter.course = courseId;
      }
    }
    if (examType && examType !== 'all') filter.examType = examType;
    if (semester && semester !== 'all') filter.semester = Number(semester);
    if (studentId && studentId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        filter.student = studentId;
      }
    }

    const marks = await Marks.find(filter)
      .populate('course', 'courseCode courseName credits department')
      .populate({
        path: 'student',
        populate: { path: 'userId', select: 'firstName lastName email' },
        select: 'studentId department currentSemester'
      })
      .sort({ createdAt: -1 });

    const published = marks.filter((m) => m.isPublished);
    const avg = published.length
      ? (published.reduce((acc, m) => acc + (m.percentage || 0), 0) / published.length).toFixed(1)
      : 0;
    const highest = published.length ? Math.max(...published.map((m) => m.percentage || 0)) : 0;
    const lowest = published.length ? Math.min(...published.map((m) => m.percentage || 0)) : 0;

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
 * @route   POST /api/v1/marks or POST /api/v1/marks/upload
 * @access  Faculty, Teacher, Admin
 */
export const addMarks = async (req, res, next) => {
  try {
    const { studentId, courseId, subject, examType, examLabel, marksObtained, maxMarks, semester, academicYear, remarks } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student selection is required.' });
    }
    if (marksObtained === undefined || marksObtained === null || marksObtained === '') {
      return res.status(400).json({ success: false, message: 'Marks obtained is required.' });
    }

    // Auto-resolve / link faculty profile
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty && (req.user.role === 'faculty' || req.user.role === 'teacher')) {
      try {
        faculty = await Faculty.create({
          userId: req.user._id,
          employeeId: `FAC-${Date.now().toString().slice(-4)}`,
          department: req.user.department || 'Computer Science & Engineering',
          designation: 'Assistant Professor',
          cabinOffice: 'Academic Block A, Room 301',
          assignedCourses: []
        });
      } catch (fErr) {
        console.warn('Faculty auto-create note:', fErr.message);
      }
    }

    // Look up student by MongoDB _id, studentId string, or userId
    let student = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }
    if (!student) {
      student = await Student.findOne({ studentId });
    }
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in database.' });
    }

    let course = null;
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }

    const subjectName = subject || (course ? course.courseName : 'General Assessment');

    const entry = await Marks.create({
      student: student._id,
      course: course?._id || null,
      subject: subjectName,
      faculty: faculty?._id || null,
      examType: examType || 'internal_1',
      examLabel: examLabel || `${subjectName} Assessment`,
      marksObtained: Number(marksObtained),
      maxMarks: Number(maxMarks) || 100,
      semester: Number(semester) || student.currentSemester || 1,
      academicYear: academicYear || '2026-2027',
      remarks: remarks || '',
      isPublished: true
    });

    if (entry.course) {
      await entry.populate('course', 'courseCode courseName credits');
    }
    await entry.populate({ path: 'student', populate: { path: 'userId', select: 'firstName lastName email' } });

    res.status(201).json({ success: true, message: 'Marks recorded and published successfully.', marks: entry });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Faculty updates a marks entry
 * @route   PUT /api/v1/marks/:id
 * @access  Faculty, Teacher, Admin
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
 * @route   PATCH /api/v1/marks/:id/publish or POST /api/v1/marks/publish
 * @access  Faculty, Teacher, Admin
 */
export const publishMarks = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.body.id || req.body.marksId || req.body._id;
    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Marks entry ID is required.' });
    }

    const entry = await Marks.findByIdAndUpdate(
      targetId,
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
