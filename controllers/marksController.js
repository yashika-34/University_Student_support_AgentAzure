import mongoose from 'mongoose';
import Marks from '../models/Marks.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import Faculty from '../models/Faculty.js';
import { logAudit } from '../services/auditService.js';

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

    // Audit Log
    await logAudit({
      action: 'UPDATE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetUser: student.userId,
      resourceType: 'Marks',
      resourceId: entry._id,
      changes: { after: { marksObtained: entry.marksObtained, maxMarks: entry.maxMarks, examType: entry.examType } },
      metadata: { studentId: student.studentId, courseCode: course?.courseCode || subjectName },
      req
    });

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

    const beforeState = { marksObtained: entry.marksObtained, maxMarks: entry.maxMarks };

    const { marksObtained, maxMarks, examLabel, remarks, semester } = req.body;
    if (marksObtained !== undefined) entry.marksObtained = marksObtained;
    if (maxMarks !== undefined) entry.maxMarks = maxMarks;
    if (examLabel !== undefined) entry.examLabel = examLabel;
    if (remarks !== undefined) entry.remarks = remarks;
    if (semester !== undefined) entry.semester = semester;

    await entry.save();

    await logAudit({
      action: 'UPDATE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Marks',
      resourceId: entry._id,
      changes: { before: beforeState, after: { marksObtained: entry.marksObtained, maxMarks: entry.maxMarks } },
      req
    });

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

    await logAudit({
      action: 'UPDATE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Marks',
      resourceId: entry._id,
      metadata: { action: 'publish_marks' },
      req
    });

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
    const entry = await Marks.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Marks entry not found.' });

    await Marks.findByIdAndDelete(req.params.id);

    await logAudit({
      action: 'DELETE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Marks',
      resourceId: entry._id,
      changes: { before: { student: entry.student, marksObtained: entry.marksObtained } },
      req
    });

    res.status(200).json({ success: true, message: 'Marks entry deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview CSV / Bulk Marks Data before importing
 * @route   POST /api/v1/marks/bulk/preview
 * @access  Faculty, Teacher, Admin
 */
export const previewBulkMarks = async (req, res, next) => {
  try {
    const { rows = [], csvText = '' } = req.body;
    let dataRows = rows;

    if (csvText && (!rows || rows.length === 0)) {
      // Basic CSV parser
      const lines = csvText.trim().split('\n').filter(Boolean);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        dataRows = lines.slice(1).map((line) => {
          const cols = line.split(',').map((c) => c.trim());
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = cols[i];
          });
          return obj;
        });
      }
    }

    if (!dataRows || dataRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid data rows provided for preview.' });
    }

    const validatedRows = [];
    const errors = [];

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const studentIdentifier = row.studentId || row.studentid || row.rollno;
      const courseCode = row.courseCode || row.coursecode || row.subject;
      const marksObtained = Number(row.marksObtained || row.marksobtained || row.marks || row.score);
      const maxMarks = Number(row.maxMarks || row.maxmarks || 100);
      const examType = row.examType || row.examtype || 'mid_term';
      const semester = Number(row.semester) || 1;

      if (!studentIdentifier) {
        errors.push({ row: index + 1, message: 'Missing student identifier (studentId).' });
        continue;
      }
      if (isNaN(marksObtained) || marksObtained < 0) {
        errors.push({ row: index + 1, message: `Invalid marks obtained: "${row.marksObtained}".` });
        continue;
      }

      // Check student in DB
      let student = await Student.findOne({ studentId: studentIdentifier }).populate('userId', 'firstName lastName email');
      if (!student && mongoose.Types.ObjectId.isValid(studentIdentifier)) {
        student = await Student.findById(studentIdentifier).populate('userId', 'firstName lastName email');
      }

      if (!student) {
        errors.push({ row: index + 1, message: `Student '${studentIdentifier}' does not exist in the database.` });
        continue;
      }

      // Check course in DB
      let course = null;
      if (courseCode) {
        course = await Course.findOne({ courseCode: new RegExp(`^${courseCode}$`, 'i') });
      }

      // Check for duplicate marks record
      const existing = await Marks.findOne({
        student: student._id,
        ...(course ? { course: course._id } : { subject: courseCode }),
        examType,
        semester
      });

      const percentage = (marksObtained / maxMarks) * 100;
      let grade = 'F';
      let gradePoints = 0;
      if (percentage >= 90) { grade = 'O'; gradePoints = 10; }
      else if (percentage >= 80) { grade = 'A+'; gradePoints = 9; }
      else if (percentage >= 70) { grade = 'A'; gradePoints = 8; }
      else if (percentage >= 60) { grade = 'B+'; gradePoints = 7; }
      else if (percentage >= 50) { grade = 'B'; gradePoints = 6; }
      else if (percentage >= 40) { grade = 'C'; gradePoints = 5; }

      validatedRows.push({
        row: index + 1,
        studentDbId: student._id,
        studentId: student.studentId,
        studentName: student.userId ? `${student.userId.firstName} ${student.userId.lastName}` : student.studentId,
        courseDbId: course?._id || null,
        courseCode: course?.courseCode || courseCode || 'N/A',
        courseName: course?.courseName || courseCode || 'General Assessment',
        examType,
        marksObtained,
        maxMarks,
        percentage: Number(percentage.toFixed(1)),
        grade,
        gradePoints,
        semester,
        isDuplicate: !!existing,
        existingId: existing?._id || null
      });
    }

    res.status(200).json({
      success: true,
      totalRows: dataRows.length,
      validCount: validatedRows.length,
      errorCount: errors.length,
      duplicateCount: validatedRows.filter((r) => r.isDuplicate).length,
      preview: validatedRows,
      errors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Execute Bulk Marks Import
 * @route   POST /api/v1/marks/bulk/import
 * @access  Faculty, Teacher, Admin
 */
export const importBulkMarks = async (req, res, next) => {
  try {
    const { rows = [], overwriteDuplicates = true } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided for import.' });
    }

    let faculty = await Faculty.findOne({ userId: req.user._id });
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of rows) {
      if (!item.studentDbId) continue;

      if (item.isDuplicate && item.existingId && overwriteDuplicates) {
        await Marks.findByIdAndUpdate(item.existingId, {
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks,
          isPublished: true,
          remarks: item.remarks || 'Updated via Bulk CSV Import'
        });
        updatedCount++;
      } else if (!item.isDuplicate || overwriteDuplicates) {
        await Marks.create({
          student: item.studentDbId,
          course: item.courseDbId || null,
          subject: item.courseName || item.courseCode || 'Assessment',
          faculty: faculty?._id || null,
          examType: item.examType || 'mid_term',
          examLabel: `${item.courseCode || 'Course'} ${item.examType || 'Exam'}`,
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks || 100,
          semester: item.semester || 1,
          academicYear: '2026-2027',
          remarks: item.remarks || 'Imported via Bulk CSV Import',
          isPublished: true
        });
        createdCount++;
      }
    }

    await logAudit({
      action: 'UPDATE_MARKS',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      resourceType: 'Marks',
      metadata: { importedRows: createdCount, updatedRows: updatedCount },
      req
    });

    res.status(200).json({
      success: true,
      message: `Bulk import complete: ${createdCount} created, ${updatedCount} updated.`,
      stats: { createdCount, updatedCount }
    });
  } catch (error) {
    next(error);
  }
};
