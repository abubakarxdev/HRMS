const prisma = require("../config/prisma");

/**
 * Create a new notification
 */
const createNotification = async (data) => {
  return await prisma.notification.create({
    data,
  });
};

/**
 * Create multiple notifications (bulk)
 */
const createManyNotifications = async (notifications) => {
  return await prisma.notification.createMany({
    data: notifications,
  });
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, skip = 0, take = 20) => {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
};

/**
 * Count unread notifications
 */
const getUnreadCount = async (userId) => {
  return await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
};

/**
 * Mark a notification as read
 */
const markAsRead = async (id) => {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
};

/**
 * Delete a notification
 */
const deleteNotification = async (id) => {
  return await prisma.notification.delete({
    where: { id },
  });
};

/**
 * Clear all notifications for a user
 */
const clearAllNotifications = async (userId) => {
  return await prisma.notification.deleteMany({
    where: {
      userId,
    },
  });
};

module.exports = {
  createNotification,
  createManyNotifications,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
