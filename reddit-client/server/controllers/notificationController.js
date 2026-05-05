const Notification = require("../models/Notification");

// GET /api/notifications — fetch all unread notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    // req.user.userId is set by your JWT auth middleware
    // If you're using sessions, replace req.user.userId with req.session.userId
    const userId = req.user.userId;

    const notifications = await Notification.find({ userId, read: false })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ notifications });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// PATCH /api/notifications/:id/read — mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// PATCH /api/notifications/read-all — mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId, read: false }, { read: true });

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Failed to mark all as read:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
