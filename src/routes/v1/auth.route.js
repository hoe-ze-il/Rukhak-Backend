import express from "express";
import { createSignupValidator } from "@/validators/signup.validator.js";
import { createLoginValidator } from "@/validators/login.validator.js";
import { createPasswordValidator } from "@/validators/password.validator.js";
import { runValidation } from "@/validators/index.js";
import controller from "@/controllers/auth.controller.js";
import handleSignIn from "@/middlewares/authMiddlewares/handleSignIn.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import verifyRoles from "@/middlewares/authMiddlewares/verifyRoles.js";
import isRecentlySignup from "@/middlewares/authMiddlewares/isRecentlySignup.js";
import isRecentlyForgotPwd from "@/middlewares/authMiddlewares/isRecentlyForgotPwd.js";
import is2FA from "@/middlewares/authMiddlewares/is2FA.js";
import verifyOTPCode from "@/middlewares/authMiddlewares/verifyOTPCode.js";
import isRecently2FA from "@/middlewares/authMiddlewares/isRecently2FA.js";
import { createSignupSellerValidator } from "@/validators/signupSeller.validator.js";

const router = express.Router();

router
  .route("/signup")
  .post(createSignupValidator, runValidation, controller.signup);

router
  .route("/account/activation")
  .post(controller.accountActivation, handleSignIn);

router
  .route("/login/email")
  .post(
    createLoginValidator,
    runValidation,
    controller.loginWithEmailPassword,
    is2FA,
    handleSignIn
  );

router
  .route("/login/google")
  .post(controller.googleSignIn, is2FA, handleSignIn);

router.route("/verify/2FA").post(verifyOTPCode, handleSignIn);

router.route("/forgot/password").post(controller.forgotPassword);

router
  .route("/reset/password")
  .patch(createPasswordValidator, runValidation, controller.resetPassword);

router
  .route("/signup/seller")
  .put(
    isAuth,
    verifyRoles("user"),
    createSignupSellerValidator,
    runValidation,
    controller.signupSeller
  );

router
  .route("/:sellerId/:action")
  .patch(isAuth, verifyRoles("admin"), controller.handleSeller);

router
  .route("/resend/email-activation")
  .post(isRecentlySignup, controller.resendActivationEmail);

router
  .route("/resend/email-reset-password")
  .post(isRecentlyForgotPwd, controller.resendEmailResetPassword);

router
  .route("/resend/email-otp")
  .post(isRecently2FA, controller.resendEmailOTP);

router.route("/refresh").get(controller.refreshToken);

router.route("/logout").post(controller.logOut);

export default router;
