import express from "express";
import service from "@/controllers/notification.controller.js";

const router = express.Router({ mergeParams: true });

router.get("/", service.getNotifications);

router.patch("/:notificationId", service.markNotificationAsOpened);

export default router;
