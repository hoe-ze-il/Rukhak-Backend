import catchAsync from "@/utils/catchAsync.js";
import notificationService from "@/services/notification.service.js";
import APIError from "@/utils/APIError.js";

const notificationController = {
  getNotifications: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const notifications = await notificationService.getNotifications(userId);
    res.status(200).json(notifications);
  }),

  markNotificationAsOpened: async (req, res) => {
    const { notificationId } = req.params;
    const notification =
      await notificationService.markNotificationAsOpened(notificationId);
    if (!notification) {
      throw new APIError({
        status: 404,
        message: `No Notifiaction found by this id ${notificationId}`,
      });
    }
    res.status(200).json(notification);
  },
};

export default notificationController;
