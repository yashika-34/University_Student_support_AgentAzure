import mongoose from 'mongoose';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Course from '../models/Course.js';
import AuditLog from '../models/AuditLog.js';
import AIUsageLog from '../models/AIUsageLog.js';
import Session from '../models/Session.js';
import Notice from '../models/Notice.js';
import { logAudit } from '../services/auditService.js';

/**
 * Enterprise Admin Controller
 * High-privilege administration, role governance, audit trails, and system telemetry.
 */

/**
 * @desc    Get overall system telemetry and analytics
 * @route   GET /api/v1/admin/stats
 * @access  Admin, Super Admin
 */
export const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCourses,
      totalNotices,
      activeSessions,
      totalAuditLogs,
      aiStats
    ] = await Promise.all([
      User.countDocuments(),
      Student.countDocuments(),
      Faculty.countDocuments(),
      Course.countDocuments(),
      Notice.countDocuments(),
      Session.countDocuments({ isRevoked: false, expiresAt: { $gt: new Date() } }),
      AuditLog.countDocuments(),
      AIUsageLog.aggregate([
        {
          $group: {
            _id: null,
            totalQueries: { $sum: 1 },
            totalTokens: { $sum: '$totalTokens' },
            totalCost: { $sum: '$estimatedCostUSD' },
            avgLatency: { $avg: '$latencyMs' }
          }
        }
      ])
    ]);

    const aiSummary = aiStats[0] || {
      totalQueries: 0,
      totalTokens: 0,
      totalCost: 0,
      avgLatency: 0
    };

    // System health
    const memUsage = process.memoryUsage();
    const systemHealth = {
      status: 'operational',
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      databaseState: mongoose.connection.readyState === 1 ? 'connected' : 'degraded',
      memoryMb: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024)
      }
    };

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalCourses,
        totalNotices,
        activeSessions,
        totalAuditLogs,
        ai: {
          totalQueries: aiSummary.totalQueries,
          totalTokens: aiSummary.totalTokens,
          totalCostUSD: Number((aiSummary.totalCost || 0).toFixed(4)),
          avgLatencyMs: Math.round(aiSummary.avgLatency || 0)
        },
        systemHealth
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get paginated users with filters
 * @route   GET /api/v1/admin/users
 * @access  Admin, Super Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (isActive !== undefined && isActive !== 'all') filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user details with associated profile and active sessions
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin, Super Admin
 */
export const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id }).populate('enrolledCourses.courseId');
    } else if (user.role === 'faculty' || user.role === 'teacher') {
      profile = await Faculty.findOne({ userId: user._id }).populate('assignedCourses');
    }

    const [sessions, recentLogs] = await Promise.all([
      Session.find({ userId: user._id }).sort({ lastUsedAt: -1 }).limit(10),
      AuditLog.find({ $or: [{ performedBy: user._id }, { targetUser: user._id }] })
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      user,
      profile,
      sessions,
      recentLogs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle user active status (suspend / activate)
 * @route   PUT /api/v1/admin/users/:id/status
 * @access  Admin, Super Admin
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own administrator account.' });
    }

    const previousStatus = user.isActive;
    user.isActive = Boolean(isActive);
    await user.save();

    // If deactivated, revoke all active sessions immediately
    if (!user.isActive) {
      await Session.updateMany(
        { userId: user._id, isRevoked: false },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'security_alert' }
      );
    }

    await logAudit({
      action: 'CHANGE_ROLE',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      changes: { before: { isActive: previousStatus }, after: { isActive: user.isActive } },
      metadata: { reason: reason || 'Administrative status change' },
      req
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      isActive: user.isActive
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change user role (e.g. promote to admin or faculty)
 * @route   PUT /api/v1/admin/users/:id/role
 * @access  Super Admin only
 */
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['student', 'teacher', 'faculty', 'admin', 'super_admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}` });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only super_admin can assign or change super_admin role
    if ((role === 'super_admin' || user.role === 'super_admin') && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only a Super Admin can modify super_admin roles.' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    // Ensure corresponding role profile exists
    if ((role === 'faculty' || role === 'teacher') && !(await Faculty.findOne({ userId: user._id }))) {
      await Faculty.create({
        userId: user._id,
        employeeId: `FAC-${Date.now().toString().slice(-4)}`,
        department: 'Academic Affairs',
        designation: 'Assistant Professor'
      });
    } else if (role === 'student' && !(await Student.findOne({ userId: user._id }))) {
      await Student.create({
        userId: user._id,
        studentId: `STU-${Date.now().toString().slice(-6)}`,
        department: 'General Studies',
        degreeProgram: 'Undergraduate Degree',
        currentSemester: 1
      });
    }

    await logAudit({
      action: 'CHANGE_ROLE',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      changes: { before: { role: previousRole }, after: { role } },
      req
    });

    res.status(200).json({
      success: true,
      message: `User role changed from ${previousRole} to ${role}.`,
      role: user.role
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user account and all references
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Super Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    // Clean up role profile and sessions
    await Promise.all([
      Student.deleteMany({ userId: user._id }),
      Faculty.deleteMany({ userId: user._id }),
      Session.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    await logAudit({
      action: 'DELETE_USER',
      performedBy: req.user._id,
      performedByRole: req.user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      changes: { before: { email: user.email, role: user.role } },
      req
    });

    res.status(200).json({
      success: true,
      message: `User ${user.email} and associated data successfully deleted.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get audit logs with filters and pagination
 * @route   GET /api/v1/admin/audit-logs
 * @access  Admin, Super Admin
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { action, performedBy, targetUser, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (action && action !== 'all') filter.action = action;
    if (performedBy && mongoose.Types.ObjectId.isValid(performedBy)) filter.performedBy = performedBy;
    if (targetUser && mongoose.Types.ObjectId.isValid(targetUser)) filter.targetUser = targetUser;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'firstName lastName email role')
        .populate('targetUser', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get AI usage analytics and token spend
 * @route   GET /api/v1/admin/ai-usage
 * @access  Admin, Super Admin
 */
export const getAIUsageStats = async (req, res, next) => {
  try {
    const [breakdown, recentLogs] = await Promise.all([
      AIUsageLog.aggregate([
        {
          $group: {
            _id: '$feature',
            queries: { $sum: 1 },
            tokens: { $sum: '$totalTokens' },
            costUSD: { $sum: '$estimatedCostUSD' },
            avgLatency: { $avg: '$latencyMs' }
          }
        },
        { $sort: { tokens: -1 } }
      ]),
      AIUsageLog.find()
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(50)
    ]);

    res.status(200).json({
      success: true,
      featureBreakdown: breakdown.map((b) => ({
        feature: b._id,
        queries: b.queries,
        tokens: b.tokens,
        costUSD: Number((b.costUSD || 0).toFixed(4)),
        avgLatencyMs: Math.round(b.avgLatency || 0)
      })),
      recentLogs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all faculty members with department & assigned courses
 * @route   GET /api/v1/admin/teachers
 * @access  Admin, Super Admin
 */
export const getFacultyList = async (req, res, next) => {
  try {
    const faculty = await Faculty.find()
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl isActive')
      .populate('assignedCourses', 'courseCode courseName credits');

    res.status(200).json({
      success: true,
      count: faculty.length,
      faculty
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all students with academic overview
 * @route   GET /api/v1/admin/students
 * @access  Admin, Super Admin
 */
export const getStudentList = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate('userId', 'firstName lastName email phoneNumber avatarUrl isActive')
      .populate('enrolledCourses.courseId', 'courseCode courseName credits')
      .sort({ studentId: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (err) {
    next(err);
  }
};
