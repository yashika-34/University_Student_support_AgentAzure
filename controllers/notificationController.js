import Notification from '../models/Notification.js';
import Notice from '../models/Notice.js';

/**
 * @desc    Get all notifications for logged-in user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = { recipient: req.user._id };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for current user
 * @route   PUT /api/v1/notifications/mark-all-read
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a notification (Admin / System)
 * @route   POST /api/v1/notifications
 * @access  Private (Admin)
 */
export const createNotification = async (req, res, next) => {
  try {
    const { recipient, type, priority, title, message, actionUrl, metadata } = req.body;

    const notification = await Notification.create({
      recipient,
      sender: req.user._id,
      type,
      priority: priority || 'medium',
      title,
      message,
      actionUrl: actionUrl || null,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully.',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get published notices and announcements
 * @route   GET /api/v1/notifications/notices
 * @access  Public / Private
 */
export const getNotices = async (req, res, next) => {
  try {
    const { category, targetAudience, department } = req.query;
    const filter = { isPublished: true };

    if (category && category !== 'All') filter.category = category;
    if (targetAudience) filter.targetAudience = { $in: [targetAudience, 'all'] };
    if (department && department !== 'All') filter.department = { $in: [department, 'All Departments'] };

    const notices = await Notice.find(filter)
      .sort({ isPinned: -1, publishedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a notice / announcement
 * @route   POST /api/v1/notifications/notices
 * @access  Private (Faculty, Admin)
 */
export const createNotice = async (req, res, next) => {
  try {
    const { title, content, category, priority, targetAudience, isPinned, department, attachmentUrl } = req.body;

    const notice = await Notice.create({
      title,
      content,
      category: category || 'General',
      priority: priority || 'medium',
      targetAudience: targetAudience || 'all',
      department: department || 'All Departments',
      isPinned: !!isPinned,
      attachmentUrl: attachmentUrl || null,
      author: req.user ? req.user._id : null,
      authorName: req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'University Administration'
    });

    res.status(201).json({
      success: true,
      message: 'Notice created successfully.',
      data: notice
    });
  } catch (error) {
    next(error);
  }
};
