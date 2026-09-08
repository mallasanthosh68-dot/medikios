const { Notification } = require('../models');

// @route   GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id });
    res.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user.id });
    for (const notif of notifications) {
      await Notification.findByIdAndUpdate(notif._id, { $set: { read: true } });
    }
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
