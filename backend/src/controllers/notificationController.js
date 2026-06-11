const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    const totalCount = await Notification.countDocuments({ user: req.user._id });
    res.json({ notifications, unreadCount, totalCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, _id: { $in: req.body.ids || [] } },
      { read: true }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
