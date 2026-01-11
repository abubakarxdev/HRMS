const notificationRepository = require("../repositories/notification.repository");
const prisma = require("../config/prisma");

/**
 * Create a specialized notification for Admins/HR
 */
const notifyAdminsAndHR = async (title, message, type, data = {}) => {
  // Find all Admin and HR users
  const recipients = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "HR", "SUPER_ADMIN"],
      },
      NOT: {
          id: data.excludeUserId // Exclude specific user (e.g., sender)
      }
    },
    select: { id: true, role: true },
  });

  console.log(`[Notification] Found ${recipients.length} recipients for ${type}`);

  if (recipients.length === 0) {
    console.warn("[Notification] No Admins/HRs to notify.");
    return;
  }

  const notifications = recipients.map((user) => {
    // Generate Role-Based Link
    let link = data.link; // Default link
    if (type === "LEAVE_REQUEST") {
        if (user.role === "HR") {
            link = "/leaves/requests"; // Correct HR route
        } else {
             // Admin route with office filter if available
             const officeParam = data.officeId ? `?officeId=${data.officeId}` : "";
             link = `/admin/leaves/requests${officeParam}`;
        }
    }

    return {
      userId: user.id,
      title,
      message,
      type,
      data: { ...data, link }, // Keep in data for backup/metadata
      link: link || null,      // Store in dedicated column
    };
  });

  try {
    const result = await notificationRepository.createManyNotifications(notifications);
    console.log(`[Notification] Created ${result.count} notifications.`);
  } catch (error) {
    console.error("[Notification] Creation Failed:", error);
  }
};

/**
 * Notify a specific employee
 */
const notifyEmployee = async (userId, title, message, type, data = {}) => {
  const notification = {
    userId,
    title,
    message,
    type,
    data: { ...data },
    link: data.link || null,
  };

  try {
    const result = await notificationRepository.createManyNotifications([notification]);
    console.log(`[Notification] Sent to employee ${userId}: ${title}`);
  } catch (error) {
    console.error("[Notification] Failed to notify employee:", error);
  }
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId) => {
  const notifications = await notificationRepository.getUserNotifications(userId);
  const unreadCount = await notificationRepository.getUnreadCount(userId);
  return { notifications, unreadCount };
};

/**
 * Mark as read
 */
const markAsRead = async (id) => {
  return await notificationRepository.markAsRead(id);
};

/**
 * Mark all as read
 */
const markAllAsRead = async (userId) => {
  return await notificationRepository.markAllAsRead(userId);
};

/**
 * Delete a notification
 */
const deleteNotification = async (id) => {
  return await notificationRepository.deleteNotification(id);
};

/**
 * Clear all notifications for a user
 */
const clearAllNotifications = async (userId) => {
  return await notificationRepository.clearAllNotifications(userId);
};

module.exports = {
  notifyAdminsAndHR,
  notifyEmployee,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
