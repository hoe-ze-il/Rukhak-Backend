import catchAsync from "@/utils/catchAsync.js";
import authService from "@/services/auth.service.js";
import sendEmailWithNodemailer from "@/utils/email.js";
import { OAuth2Client } from "google-auth-library"; // Follow Google's documentation
import dotenv from "dotenv";

dotenv.config();

const authController = {
  signCookie(res, refreshToken) {
    res.cookie("jwt", refreshToken, {
      // httpOnly: true,
      secure: false,
      sameSite: "Strict",
      maxAge: process.env.COOKIES_EXPIRES * 24 * 60 * 60 * 1000,
    });
  },

  clearCookie(res) {
    res.clearCookie("jwt", {
      // httpOnly: true,
      secure: false,
      sameSite: "Strict",
    });
  },

  // Signup
  // 1. Get user data from signup
  // 2. Sign token (JWT)
  // 3. Create email data along with the token to client side
  // 4. Create new user (Temporary)
  signup: catchAsync(async (req, res, next) => {
    const data = req.body;
    const token = await authService.signup.signTokenForActivateAccount(data);
    const emailData = await authService.signup.createEmail(token, data);
    const resultSendEmail = await sendEmailWithNodemailer(emailData);
    const user = await authService.signup.createNewUser(resultSendEmail, data);
    return res.status(201).json({
      status: "success",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
  }),

  // Activate Account
  // 1. Receive JWT from client
  // 2. Verify the JWT
  // 3. Activate account by set active to true
  // 4. Move to next middleware for hanle generate access and refresh tokens
  accountActivation: catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await authService.signup.activateAccount(data);
    req.user = user;
    req.user.loginMethod = "email";
    next();
  }),

  // Login
  // 1. Get user data from login
  // 2. Verify user
  // 3. Move to next middleware for hanle generate access and refresh tokens
  loginWithEmailPassword: catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await authService.login.verifyUserByEmailAndPassword(data);
    req.user = user;
    req.user.loginMethod = "email";
    next();
  }),

  // Log in with google
  // 1. Initializing an OAuth2.0 client use OAuth2Client from library
  // 2. Verify idToken from client
  // 3. If new user, return to handlesignIn, else create new user to database and handleSignIn
  googleSignIn: catchAsync(async (req, res, next) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const data = req.body;
    const user = await authService.googleSignIn.verifyIdToken(client, data);
    req.user = user;
    req.user.loginMethod = "google";
    return next();
  }),

  // Refresh Token
  // 1. Get cookie
  // 2. Verify Session
  // 3. Verify JWT
  // 4. Sign new access and refresh tokens
  refreshToken: catchAsync(async (req, res, next) => {
    const { cookies } = req;
    const cookieRefreshToken =
      await authService.refreshToken.checkCookie(cookies);
    authController.clearCookie(res);
    const session =
      await authService.refreshToken.verifySession(cookieRefreshToken);
    const data = await authService.refreshToken.verifyRefreshToken(
      cookieRefreshToken,
      session
    );
    const { accessToken, refreshToken } = data;
    const user = await authService.refreshToken.findUser(session);
    authController.signCookie(res, refreshToken);
    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          role: user.role,
          accessToken,
        },
      },
    });
  }),

  // Forgot Password
  // 1. Get user's email
  // 2. Verify user by email
  // 3. Generate a random reset token
  // 4. Send it to user's email
  forgotPassword: catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await authService.forgotPassword.verifyUserByEmail(data);
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const emailData = await authService.forgotPassword.createEmail(
      data,
      resetToken
    );
    const resultSendEmail = sendEmailWithNodemailer(emailData);
    authService.forgotPassword.verifyResult(resultSendEmail);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Reset Password
  // 1. Get reset token
  // 2. Hash reset token and compare to user hashed token in db
  // 3. Create new password
  resetPassword: catchAsync(async (req, res, next) => {
    const data = req.body;
    const { cookies } = req;
    const refreshToken = cookies?.jwt || "";
    const hashedToken = authService.forgotPassword.hashToken(data);
    const user =
      await authService.forgotPassword.verifyUserByToken(hashedToken);
    await authService.forgotPassword.createNewPassword(data, user);
    await authService.forgotPassword.deleteSession(refreshToken);
    return res.status(201).json({
      status: "success",
    });
  }),

  // Signup as Seller
  // 1. Get sign up data
  // 2. Find the user with the request
  // 3. Replace user document with new document in db as seller
  signupSeller: catchAsync(async (req, res, next) => {
    const sellerData = req.body;
    const user = await authService.signupSeller.verifyUserById(req);
    const seller = await authService.signupSeller.createSeller(
      sellerData,
      user
    );
    return res.status(200).json({
      status: "success",
      data: {
        user: {
          id: seller._id,
          firstName: seller.firstName,
          lastName: seller.lastName,
          email: seller.email,
          role: seller.role,
          sellerStatus: seller.sellerStatus,
          storeName: seller.storeName,
          storeAddress: seller.storeAddress,
          storeLocation: seller.storeLocation,
        },
      },
    });
  }),

  // Handle seller
  // 1. Get seller id and action from params
  // 2. Check for seller in database
  // 3. Update seller status to active
  handleSeller: catchAsync(async (req, res, next) => {
    const { sellerId, action } = req.params;
    const seller = await authService.signupSeller.verifySeller(sellerId);
    await authService.signupSeller.updateSellerStatus(seller, action);
    return res.status(201).json({
      status: "success",
      data: {
        sellerStatus: seller.sellerStatus,
      },
    });
  }),

  // Logout
  // 1. Get cookie
  // 2. Check jwt in Cookie
  // 3. Check Session in db
  // 4. Delete Session contain refresh token in db
  // 5. Clear cookie
  logOut: catchAsync(async (req, res, next) => {
    const cookies = req?.cookies;
    const refreshToken = await authService.logOut.checkJWT(res, cookies);
    await authService.logOut.deleteSession(refreshToken);
    authController.clearCookie(res);
    return res.status(204).send();
  }),

  // Resend Email Activate Account
  // 1. Get user's data
  // 2. Sign new token (JWT)
  // 3. Create email data along with the token to client side
  // 4. Send Email again
  resendActivationEmail: catchAsync(async (req, res, next) => {
    const data = req?.user;
    const token = await authService.signup.signTokenForActivateAccount(data);
    const emailData = await authService.signup.createEmail(token, data);
    const resultSendEmail = await sendEmailWithNodemailer(emailData);
    authService.signup.verifyResult(resultSendEmail);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Redend Email for OTP
  // 1. Get user from middleware.
  // 2. Sign new OTP.
  // 3. Save to OTP token to database.
  // 4. Create new email.
  // 5. Send email to user again.
  resendEmailOTP: catchAsync(async (req, res, next) => {
    const user = req?.user;
    const OTP = await user.createOTPToken();
    await user.save({ validateBeforeSave: false });
    const emailData = await authService.twoFA.createEmail(user.email, OTP);
    const resultSendEmail = await sendEmailWithNodemailer(emailData);
    authService.twoFA.verifyResult(resultSendEmail);
    res.status(200).json({
      status: "success",
    });
  }),

  // Resend Email Reset Password
  // 1. Get user from middleware
  // 2. Sign new token
  // 3. Create new email data
  // 4. Send email again
  resendEmailResetPassword: catchAsync(async (req, res, next) => {
    const user = req?.user;
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const emailData = await authService.forgotPassword.createEmail(
      user,
      resetToken
    );
    const resultSendEmail = sendEmailWithNodemailer(emailData);
    authService.forgotPassword.verifyResult(next, resultSendEmail);
    return res.status(200).json({
      status: "success",
    });
  }),
};

export default authController;
