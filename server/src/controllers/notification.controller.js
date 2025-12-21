const notificationService = require("../services/notification.service");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUserNotifications(userId);
    res.json(result);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
