import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Notice from '../models/Notice.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

/**
 * Global Search Controller
 * Multi-entity fast search across courses, assignments, notices, faculty, and students.
 */
export const globalSearch = async (req, res, next) => {
  try {
    const { q = '', type = 'all', limit = 10 } = req.query;
    const query = q.trim();

    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        query,
        total: 0,
        results: {
          courses: [],
          assignments: [],
          notices: [],
          teachers: [],
          students: []
        }
      });
    }

    const regex = new RegExp(query, 'i');
    const maxResults = Math.min(Number(limit) || 10, 30);
    const userRole = req.user ? req.user.role : 'student';
    const isStaffOrAdmin = ['faculty', 'teacher', 'admin', 'super_admin'].includes(userRole);

    const promises = [];

    // 1. Courses
    if (type === 'all' || type === 'courses') {
      promises.push(
        Course.find({
          $or: [{ courseCode: regex }, { courseName: regex }, { department: regex }, { description: regex }]
        })
          .select('courseCode courseName credits department semester')
          .limit(maxResults)
          .lean()
          .then((items) => ({
            key: 'courses',
            items: items.map((c) => ({
              id: c._id,
              type: 'course',
              title: `${c.courseCode} - ${c.courseName}`,
              subtitle: `${c.department} &bull; ${c.credits} Credits`,
              url: `/courses`
            }))
          }))
      );
    }

    // 2. Assignments
    if (type === 'all' || type === 'assignments') {
      promises.push(
        Assignment.find({
          $or: [{ title: regex }, { description: regex }]
        })
          .populate('course', 'courseCode courseName')
          .select('title dueDate maxScore course')
          .limit(maxResults)
          .lean()
          .then((items) => ({
            key: 'assignments',
            items: items.map((a) => ({
              id: a._id,
              type: 'assignment',
              title: a.title,
              subtitle: `${a.course?.courseCode || 'Course'} &bull; Due: ${new Date(a.dueDate).toLocaleDateString()}`,
              url: `/assignments`
            }))
          }))
      );
    }

    // 3. Notices
    if (type === 'all' || type === 'notices') {
      promises.push(
        Notice.find({
          isPublished: true,
          $or: [{ title: regex }, { content: regex }, { category: regex }]
        })
          .select('title category priority createdAt')
          .limit(maxResults)
          .lean()
          .then((items) => ({
            key: 'notices',
            items: items.map((n) => ({
              id: n._id,
              type: 'notice',
              title: n.title,
              subtitle: `${n.category} &bull; ${n.priority?.toUpperCase()} Priority`,
              url: `/notifications`
            }))
          }))
      );
    }

    // 4. Faculty / Teachers Directory
    if (type === 'all' || type === 'teachers') {
      promises.push(
        Faculty.find()
          .populate({
            path: 'userId',
            match: { $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] },
            select: 'firstName lastName email'
          })
          .select('employeeId department designation cabinOffice userId')
          .limit(maxResults)
          .lean()
          .then((items) => {
            const matched = items.filter((f) => f.userId);
            return {
              key: 'teachers',
              items: matched.map((f) => ({
                id: f._id,
                type: 'teacher',
                title: `Dr. ${f.userId.firstName} ${f.userId.lastName}`,
                subtitle: `${f.designation} &bull; ${f.department} &bull; ${f.cabinOffice || 'Office'}`,
                url: `/services`
              }))
            };
          })
      );
    }

    // 5. Students (Only accessible by Faculty & Admin)
    if (isStaffOrAdmin && (type === 'all' || type === 'students')) {
      promises.push(
        Student.find({
          $or: [{ studentId: regex }, { department: regex }]
        })
          .populate('userId', 'firstName lastName email')
          .select('studentId department currentSemester userId')
          .limit(maxResults)
          .lean()
          .then((items) => ({
            key: 'students',
            items: items.map((s) => ({
              id: s._id,
              type: 'student',
              title: s.userId ? `${s.userId.firstName} ${s.userId.lastName}` : s.studentId,
              subtitle: `${s.studentId} &bull; ${s.department} &bull; Sem ${s.currentSemester}`,
              url: `/teacher/students`
            }))
          }))
      );
    }

    const resolved = await Promise.all(promises);
    const results = {
      courses: [],
      assignments: [],
      notices: [],
      teachers: [],
      students: []
    };

    let total = 0;
    resolved.forEach((resItem) => {
      results[resItem.key] = resItem.items;
      total += resItem.items.length;
    });

    res.status(200).json({
      success: true,
      query,
      total,
      results
    });
  } catch (err) {
    next(err);
  }
};
