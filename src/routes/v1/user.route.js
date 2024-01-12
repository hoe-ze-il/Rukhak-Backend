import express from "express";
import { runValidation } from "../../validators/index.js";
import { createPasswordValidator } from "../../validators/password.validator.js";
import controller from "../../controllers/user.controller.js";
import isAuth from "../../middlewares/authMiddlewares/isAuth.js";
import verifyOTPCode from "../../middlewares/authMiddlewares/verifyOTPCode.js";
import { createEmailValidator } from "../../validators/email.validator.js";
import verifyRoles from "../../middlewares/authMiddlewares/verifyRoles.js";
import { createSignupValidator } from "../../validators/signup.validator.js";
import verifyMe from "../../middlewares/userMiddlewares/verifyMe.js";
import { uploadProductMedia } from "../../middlewares/uploadFiles.js";
import notificationRouter from "@/routes/v1/notification.route.js";
import resizeImage from "@/middlewares/resizeImage.js";
import orderController from "@/controllers/order.controller.js";
import mediaRoute from "./media.profile.route.js";

const router = express.Router();

router.use(isAuth);

router
  .route("/me/:userId")
  .get(verifyMe, controller.getOneUser)
  .patch(verifyMe, controller.updateMe)
  .delete(verifyMe, controller.deleteAccount);

router
  .route("/upload/image")
  .post(uploadProductMedia, resizeImage(1 / 1), controller.uploadImage);

router
  .route("/update/password")
  .patch(createPasswordValidator, runValidation, controller.updatePassword);

router.route("/update/email").patch(verifyOTPCode, controller.updateEmail);

router.route("/:action/2FA/pwd").patch(controller.enable2FAByPassword);

router.route("/:action/2FA/oauth").get(controller.enable2FAByOTP);

router.route("/:action/2FA/otp").patch(verifyOTPCode, controller.enable2FA);

router.route("/:sessionId/logout").delete(controller.logOutOne);

router
  .route("/confirm/email")
  .post(createEmailValidator, runValidation, controller.confirmNewEmail);

router.use("/:userId/media", mediaRoute);
router.use("/:userId/notification", notificationRouter);

// update user update order

router
  .route("/order/:id")
  .get(orderController.getOrder)
  .patch(orderController.userUpdateOrder);
router.route("/order").get(isAuth, orderController.getUserOrder);
// Admin interact with users ----
router.use(verifyRoles("admin"));
router.route("/allOrder").get(orderController.getSellerOrder);
router
  .route("/")
  .get(controller.getAllUsers)
  .post(createSignupValidator, runValidation, controller.createOneUser);

router
  .route("/:userId")
  .get(controller.getOneUser)
  .patch(controller.updateOneUser)
  .delete(controller.deleteOneUser);

export default router;
