import Notification from "@/models/notification.model.js";
import APIError from "@/utils/APIError.js";

const NotificationService = {
  async getNotifications(userId) {
    try {
      const notifications = await Notification.find({ To: userId })
        .sort({ createdAt: -1 })
        .exec();
      return notifications;
    } catch (error) {
      throw new APIError({
        status: 500,
        message: "Error getting notifications",
      });
    }
  },

  async markNotificationAsOpened(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new APIError({ status: 404, message: "Notification not found" });
      }

      notification.opened = true;

      await notification.save();

      return notification;
    } catch (error) {
      throw new APIError({
        status: 404,
        message: "Error updating notification status",
      });
    }
  },
};

export default NotificationService;
