/**
 * Community, Gamification & Analytics Controller
 * All data is sourced from MongoDB — no hardcoded or mock values.
 */

import ForumPost from '../models/ForumPost.js';
import Badge from '../models/Badge.js';
import Attendance from '../models/Attendance.js';
import Marks from '../models/Marks.js';
import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';

// ─── Discussion Forum ─────────────────────────────────────────────────────────

/**
 * @desc  List all forum posts, newest first
 * @route GET /api/v1/engagement/forum
 */
export const getForumPosts = async (req, res) => {
  try {
    const { category, solved, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (solved !== undefined) filter.isSolved = solved === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [posts, total] = await Promise.all([
      ForumPost.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ForumPost.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: posts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Create a new forum post
 * @route POST /api/v1/engagement/forum
 */
export const createForumPost = async (req, res) => {
  try {
    const { title, category, content } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({ success: false, message: 'title, category, and content are required.' });
    }

    // Derive author details from the authenticated user if available
    const authorName = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      : 'Anonymous';
    const authorRole = req.user?.role === 'faculty' ? 'faculty' : 'student';

    const post = await ForumPost.create({
      title,
      category,
      content,
      authorName,
      authorRole,
      upvotes: 0,
      isSolved: false,
      replies: []
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Add a reply to a forum post
 * @route POST /api/v1/engagement/forum/:id/reply
 */
export const addForumReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isVerifiedAnswer } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Reply content is required.' });
    }

    const authorName = req.user
      ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email
      : 'Anonymous';
    const authorRole = req.user?.role === 'faculty' ? 'faculty' : 'student';

    const post = await ForumPost.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            authorName,
            authorRole,
            content,
            isVerifiedAnswer: isVerifiedAnswer === true && authorRole === 'faculty',
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Toggle upvote on a post
 * @route PATCH /api/v1/engagement/forum/:id/upvote
 */
export const upvoteForumPost = async (req, res) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc  Mark a post as solved
 * @route PATCH /api/v1/engagement/forum/:id/solve
 */
export const markPostSolved = async (req, res) => {
  try {
    const post = await ForumPost.findByIdAndUpdate(
      req.params.id,
      { isSolved: true },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Achievements & Badge Catalog ─────────────────────────────────────────────

/**
 * @desc  Return the full badge catalog from MongoDB with real student unlock status
 * @route GET /api/v1/engagement/badges
 */
export const getBadges = async (req, res) => {
  try {
    // Fetch the badge catalog
    const badgeCatalog = await Badge.find().sort({ category: 1, xpPoints: -1 }).lean();

    // If a student is authenticated, compute real unlock status
    let studentProfile = null;
    let attendancePct = null;
    let avgMarks = null;
    let forumUpvotes = 0;

    if (req.user && req.user.role === 'student') {
      studentProfile = await Student.findOne({ userId: req.user._id }).lean();

      if (studentProfile) {
        // Attendance: overall percentage
        const attAgg = await Attendance.aggregate([
          { $match: { student: studentProfile._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          }
        ]);
        const att = attAgg[0];
        attendancePct = att && att.total > 0 ? (att.present / att.total) * 100 : 0;

        // Marks: average percentage
        const marksAgg = await Marks.aggregate([
          { $match: { student: studentProfile._id, isPublished: true } },
          { $group: { _id: null, avg: { $avg: '$marksObtained' } } }
        ]);
        avgMarks = marksAgg[0]?.avg || 0;

        // Forum upvotes received
        const forumAgg = await ForumPost.aggregate([
          { $unwind: '$replies' },
          {
            $match: {
              'replies.authorName': `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim()
            }
          },
          { $group: { _id: null, totalUpvotes: { $sum: '$upvotes' } } }
        ]);
        forumUpvotes = forumAgg[0]?.totalUpvotes || 0;
      }
    }

    // Evaluate unlock status for each badge
    const evaluatedBadges = badgeCatalog.map((badge) => {
      let unlocked = false;
      let progress = null;

      if (studentProfile) {
        switch (badge.badgeCode) {
          case 'PERFECT_ATTENDANCE':
            unlocked = attendancePct >= 95;
            progress = `${attendancePct.toFixed(1)}% attendance (need 95%)`;
            break;
          case 'QUIZ_MASTER':
            unlocked = avgMarks >= 85;
            progress = `Avg score: ${avgMarks.toFixed(1)}% (need 85%)`;
            break;
          case 'COMMUNITY_PILLAR':
            unlocked = forumUpvotes >= 20;
            progress = `${forumUpvotes} upvotes received (need 20)`;
            break;
          case 'DEANS_HONORS':
            unlocked = studentProfile.cgpa >= 3.80;
            progress = `Current CGPA: ${studentProfile.cgpa} (need 3.80+)`;
            break;
          case 'CAREER_PRODIGY':
            unlocked = false;
            progress = 'Complete ATS resume review to unlock';
            break;
          default:
            unlocked = false;
            progress = null;
        }
      }

      return {
        code: badge.badgeCode,
        title: badge.title,
        description: badge.description,
        category: badge.category,
        icon: badge.iconName,
        xp: badge.xpPoints,
        unlocked,
        ...(progress && !unlocked ? { progress } : {}),
        ...(unlocked ? { unlockedAt: badge.updatedAt } : {})
      };
    });

    // Compute XP from unlocked badges
    const unlockedBadges = evaluatedBadges.filter((b) => b.unlocked);
    const totalXp = unlockedBadges.reduce((sum, b) => sum + b.xp, 0);
    const level = Math.floor(totalXp / 250) + 1;
    const currentLevelXp = totalXp % 250;
    const nextLevelXp = 250;

    const rankTitles = [
      'Freshman Scholar',
      'Rising Scholar',
      'Academic Achiever',
      'Senior Scholar Specialist',
      'Honor Roll Elite',
      'Valedictorian Candidate'
    ];

    res.status(200).json({
      success: true,
      data: {
        currentLevel: level,
        rankTitle: rankTitles[Math.min(level - 1, rankTitles.length - 1)],
        currentXp: currentLevelXp,
        nextLevelXp,
        xpToNextLevel: nextLevelXp - currentLevelXp,
        totalXp,
        badges: evaluatedBadges
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Student Analytics Dashboard ─────────────────────────────────────────────

/**
 * @desc  Return real student analytics built from DB aggregations
 * @route GET /api/v1/engagement/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    let studentId = null;

    if (req.user && req.user.role === 'student') {
      const studentProfile = await Student.findOne({ userId: req.user._id }).lean();
      if (studentProfile) studentId = studentProfile._id;
    }

    // ── GPA Trend (semester-level aggregation from Marks) ──────────────────
    const gpaTrendRaw = await Marks.aggregate([
      ...(studentId ? [{ $match: { student: studentId, isPublished: true } }] : [{ $match: { isPublished: true } }]),
      {
        $group: {
          _id: '$semester',
          avgGradePoints: { $avg: '$gradePoints' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const gpaTrend = gpaTrendRaw.map((row) => ({
      semester: `Sem ${row._id}`,
      gpa: parseFloat(row.avgGradePoints?.toFixed(2) || 0)
    }));

    // ── Attendance per Enrolled Course ──────────────────────────────────────
    const attFilter = studentId ? { student: studentId } : {};
    const attendanceRaw = await Attendance.aggregate([
      { $match: attFilter },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: { path: '$courseInfo', preserveNullAndEmptyArrays: true } }
    ]);

    const attendanceStats = attendanceRaw.map((row) => ({
      course: row.courseInfo
        ? `${row.courseInfo.courseCode} (${row.courseInfo.courseName})`
        : String(row._id),
      percentage: row.total > 0 ? parseFloat(((row.present / row.total) * 100).toFixed(1)) : 0,
      threshold: 75
    }));

    // ── Assignment Metrics ──────────────────────────────────────────────────
    const now = new Date();
    const [totalAssigned, allAssignments] = await Promise.all([
      Assignment.countDocuments({}),
      Assignment.find({}).select('submissions dueDate maxScore').lean()
    ]);

    let submittedOnTime = 0;
    let overdue = 0;
    let pendingReview = 0;
    let totalScore = 0;
    let gradedCount = 0;

    for (const asg of allAssignments) {
      const subs = studentId
        ? (asg.submissions || []).filter((s) => String(s.student) === String(studentId))
        : asg.submissions || [];

      for (const sub of subs) {
        if (sub.status === 'submitted') pendingReview++;
        if (sub.status === 'graded') {
          submittedOnTime++;
          if (sub.grade != null) {
            totalScore += (sub.grade / asg.maxScore) * 100;
            gradedCount++;
          }
        }
      }
      if (asg.dueDate < now && subs.length === 0) overdue++;
    }

    const assignmentMetrics = {
      totalAssigned,
      submittedOnTime,
      pendingReview,
      overdue,
      averageScore: gradedCount > 0 ? parseFloat((totalScore / gradedCount).toFixed(1)) : null
    };

    // ── Percentile Ranking ──────────────────────────────────────────────────
    let percentileRank = null;
    if (studentId) {
      const studentProfile = await Student.findById(studentId).lean();
      const totalStudents = await Student.countDocuments({});

      if (totalStudents > 0 && studentProfile) {
        const betterCgpa = await Student.countDocuments({ cgpa: { $lt: studentProfile.cgpa } });
        const academicScore = Math.round((betterCgpa / totalStudents) * 100);

        const attTotalAgg = await Attendance.aggregate([
          { $match: { student: studentId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          }
        ]);
        const attData = attTotalAgg[0];
        const myAttPct = attData && attData.total > 0 ? (attData.present / attData.total) * 100 : 0;

        // Compare to class average attendance
        const classAttAgg = await Attendance.aggregate([
          {
            $group: {
              _id: '$student',
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } }
            }
          },
          { $project: { pct: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } }
        ]);
        const allPcts = classAttAgg.map((r) => r.pct);
        const attBetter = allPcts.filter((p) => p < myAttPct).length;
        const attendanceConsistency = allPcts.length > 0
          ? Math.round((attBetter / allPcts.length) * 100)
          : 50;

        percentileRank = {
          academicScore,
          attendanceConsistency,
          overallIndex: Math.round((academicScore + attendanceConsistency) / 2)
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        gpaTrend,
        attendanceStats,
        assignmentMetrics,
        ...(percentileRank ? { percentileRank } : {})
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
