import Notification from '../models/Notification.js';

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
