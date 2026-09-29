import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';
import Session from '../models/Session.js';
import { logAudit } from '../services/auditService.js';
import { sendEmailNotification } from '../services/emailService.js';

// Helper: Hash token using SHA-256 for secure DB storage
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Helper: Generate JWT Access Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_uniassist_jwt_key_987654321',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Helper: Generate JWT Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_REFRESH_SECRET || 'super_secret_uniassist_refresh_key_123456789',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

// Helper: Create Device Session
const createDeviceSession = async (userId, refreshToken, req) => {
  try {
    const ua = req.headers['user-agent'] || '';
    let browser = 'Unknown Browser';
    let platform = 'Unknown OS';

    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';

    if (ua.includes('Windows')) platform = 'Windows';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) platform = 'macOS';
    else if (ua.includes('Linux')) platform = 'Linux';
    else if (ua.includes('Android')) platform = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';

    const ipAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return await Session.create({
      userId,
      refreshTokenHash: hashToken(refreshToken),
      deviceInfo: { userAgent: ua, platform, browser },
      ipAddress,
      expiresAt
    });
  } catch (err) {
    console.error('[Session Create Error]:', err.message);
    return null;
  }
};

/**
 * @desc    Register a new user (Student, Faculty, or Admin)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role = 'student',
      phoneNumber,
      // Student-specific fields
      studentId,
      department,
      degreeProgram,
      currentSemester,
      admissionYear,
      batch,
      // Faculty-specific fields
      employeeId,
      designation,
      cabinOffice,
      specialization
    } = req.body;

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Create Base User
    const user = await User.create({
      email,
      passwordHash: password,
      firstName,
      lastName,
      role,
      phoneNumber
    });

    // Create Role-Specific Profile
    let roleProfile = null;
    if (role === 'student') {
      roleProfile = await Student.create({
        userId: user._id,
        studentId: studentId || `STU-${Date.now().toString().slice(-6)}`,
        department: department || 'General Studies',
        degreeProgram: degreeProgram || 'Undergraduate Degree',
        currentSemester: currentSemester || 1,
        admissionYear: admissionYear || new Date().getFullYear(),
        batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`
      });
    } else if (role === 'faculty' || role === 'teacher') {
      roleProfile = await Faculty.create({
        userId: user._id,
        employeeId: employeeId || `FAC-${Date.now().toString().slice(-4)}`,
        department: department || 'Academic Affairs',
        designation: designation || 'Assistant Professor',
        cabinOffice: cabinOffice || 'Staff Room 101',
        specialization: specialization || []
      });
    }

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Create active session
    await createDeviceSession(user._id, refreshToken, req);

    await logAudit({
      action: 'CREATE_USER',
      performedBy: user._id,
      performedByRole: user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      req,
      metadata: { email: user.email, role: user.role }
    });

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profile: roleProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT token with session tracking
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Look up user including passwordHash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    // Verify Password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact administration.'
      });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    // Fetch Role-Specific Profile
    let roleProfile = null;
    if (user.role === 'student') {
      roleProfile = await Student.findOne({ userId: user._id });
    } else if (user.role === 'faculty' || user.role === 'teacher') {
      roleProfile = await Faculty.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Create session in MongoDB
    const session = await createDeviceSession(user._id, refreshToken, req);

    // Audit Log
    await logAudit({
      action: 'LOGIN',
      performedBy: user._id,
      performedByRole: user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      req,
      metadata: { email: user.email, sessionId: session?._id }
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profile: roleProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let roleProfile = null;
    if (user.role === 'student') {
      roleProfile = await Student.findOne({ userId: user._id }).populate('academicAdvisor enrolledCourses.courseId');
    } else if (user.role === 'faculty' || user.role === 'teacher') {
      roleProfile = await Faculty.findOne({ userId: user._id }).populate('assignedCourses');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        profile: roleProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & invalidate session
 * @route   POST /api/v1/auth/logout
 * @access  Private/Public
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      const hashed = hashToken(refreshToken);
      await Session.findOneAndUpdate(
        { refreshTokenHash: hashed },
        { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' }
      );
    }

    if (req.user?._id) {
      await logAudit({
        action: 'LOGOUT',
        performedBy: req.user._id,
        performedByRole: req.user.role || 'student',
        resourceType: 'User',
        resourceId: req.user._id,
        req
      });
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out.' });
  }
};

/**
 * @desc    Refresh access token with active session validation
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.'
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'super_secret_uniassist_refresh_key_123456789'
    );

    const hashed = hashToken(refreshToken);
    const session = await Session.findOne({
      userId: decoded.id,
      refreshTokenHash: hashed,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or expired. Please sign in again.'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh session or user deactivated.'
      });
    }

    // Refresh lastUsedAt
    session.lastUsedAt = new Date();
    await session.save();

    const newToken = generateToken(user._id, user.role);

    await logAudit({
      action: 'TOKEN_REFRESH',
      performedBy: user._id,
      performedByRole: user.role,
      resourceType: 'Session',
      resourceId: session._id,
      req
    });

    res.status(200).json({
      success: true,
      token: newToken
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token.'
    });
  }
};

/**
 * @desc    Get active device sessions for current user
 * @route   GET /api/v1/auth/sessions
 * @access  Private
 */
export const getActiveSessions = async (req, res, next) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    const sessions = await Session.find({
      userId: req.user._id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    })
      .sort({ lastUsedAt: -1 })
      .lean();

    const formatted = sessions.map((s) => ({
      id: s._id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      sessions: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke specific device session
 * @route   DELETE /api/v1/auth/sessions/:sessionId
 * @access  Private
 */
export const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ _id: sessionId, userId: req.user._id });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = 'logout';
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Device session revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke all device sessions except current
 * @route   DELETE /api/v1/auth/sessions/other
 * @access  Private
 */
export const revokeAllOtherSessions = async (req, res, next) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;

    const filter = {
      userId: req.user._id,
      isRevoked: false
    };

    if (currentHash) {
      filter.refreshTokenHash = { $ne: currentHash };
    }

    const result = await Session.updateMany(filter, {
      isRevoked: true,
      revokedAt: new Date(),
      revokedReason: 'logout'
    });

    res.status(200).json({
      success: true,
      message: `Revoked ${result.modifiedCount} other active sessions.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke ALL device sessions (force logout everywhere)
 * @route   DELETE /api/v1/auth/sessions/all
 * @access  Private
 */
export const revokeAllSessions = async (req, res, next) => {
  try {
    await Session.updateMany(
      { userId: req.user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'logout' }
    );
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'All device sessions revoked. Please log in again.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile & role-specific details
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, emergencyContact, cabinOffice, officeHours } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    await user.save();

    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id });
      if (profile && emergencyContact) {
        profile.emergencyContact = { ...profile.emergencyContact, ...emergencyContact };
        await profile.save();
      }
    } else if (user.role === 'faculty' || user.role === 'teacher') {
      profile = await Faculty.findOne({ userId: user._id });
      if (profile) {
        if (cabinOffice !== undefined) profile.cabinOffice = cabinOffice;
        if (officeHours !== undefined && Array.isArray(officeHours)) {
          profile.officeHours = officeHours;
        }
        await profile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password — generate reset token & email secure link
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5174';
    const resetUrl = `${clientOrigin}/reset-password/${resetToken}`;

    await sendEmailNotification({
      to: user.email,
      subject: 'UniAssist AI — Password Reset Request',
      templateType: 'password_reset',
      data: {
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        resetUrl
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your registered email address.',
      ...(process.env.NODE_ENV !== 'production' ? { resetToken, resetUrl } : {})
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using token
 * @route   PUT /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const resetTokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Invalidate all active sessions for security after password change
    await Session.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_change' }
    );

    await logAudit({
      action: 'RESET_PASSWORD',
      performedBy: user._id,
      performedByRole: user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      req,
      metadata: { reason: 'Password reset via email token' }
    });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new credentials.',
      token,
      role: user.role
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Password for logged-in user
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();

    // Revoke all other sessions
    await Session.updateMany(
      { userId: user._id, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'password_change' }
    );

    await logAudit({
      action: 'RESET_PASSWORD',
      performedBy: user._id,
      performedByRole: user.role,
      targetUser: user._id,
      resourceType: 'User',
      resourceId: user._id,
      req,
      metadata: { reason: 'Password updated from account settings' }
    });

    const token = generateToken(user._id, user.role);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      token
    });
  } catch (error) {
    next(error);
  }
};
