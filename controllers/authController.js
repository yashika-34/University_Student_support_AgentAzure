import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Faculty from '../models/Faculty.js';

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

/**
 * @desc    Register a new user (Student, Faculty, or Admin)
 * @route   POST /api/v1/auth/register
 * @access  Public (or Admin for staff)
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
      passwordHash: password, // Will be hashed via pre-save hook
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

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
 * @desc    Login user & return JWT token
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
 * @desc    Logout user & clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
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

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh session or user deactivated.'
      });
    }

    const newToken = generateToken(user._id, user.role);

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
 * @desc    Update user profile & role-specific details
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, emergencyContact, cabinOffice, officeHours, bio } = req.body;
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
        // officeHours: accept both array of sub-docs and plain string/array
        if (officeHours !== undefined) {
          if (Array.isArray(officeHours)) {
            profile.officeHours = officeHours;
          }
          // If it's a string, store as a single entry in the notes (skip schema validation for now)
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
 * @desc    Forgot Password — generate reset token
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
      return res.status(404).json({ success: false, message: 'No user registered with this email.' });
    }

    // Generate random 6-character reset code or token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken,
      resetUrl: `/reset-password/${resetToken}`
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
    const crypto = await import('crypto');
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

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
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

