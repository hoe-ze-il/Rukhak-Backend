import catchAsync from "@/utils/catchAsync.js";
import userService from "@/services/user.service.js";
import sendEmailWithNodemailer from "@/utils/email.js";
import authController from "./auth.controller.js";

const userController = {
  // Get all users
  // 1. Get query
  // 2. Find all users
  // 3. Return users
  getAllUsers: catchAsync(async (req, res, next) => {
    const { query } = req;
    const users = await userService.getAll(query);
    return res.status(200).json({
      status: "success",
      data: { users },
    });
  }),

  // Create one user
  // 1. Get user data
  // 2. Create new user
  createOneUser: catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await userService.createOne(data);
    return res.status(201).json({
      status: "success",
      data: { user },
    });
  }),

  // Get one user
  // 1. Get user id from params
  // 2. Verify a user
  // 3. Return a user
  getOneUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const user = await userService.getOne.verifyUser(userId);
    const imageURL = await userService.getOne.getImageURL(user);
    if (imageURL) {
      user.imageURL = imageURL;
      return res.status(200).json({
        status: "success",
        data: { user: { ...user, imageURL } },
      });
    }
    return res.status(200).json({
      status: "success",
      data: { user },
    });
  }),

  // Update one user
  // 1. Get user id from params
  // 2. Verify and update user
  // 3. Return result
  updateOneUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const data = req.body;
    const user = await userService.updateOne.verifyAndUpdateUser(userId, data);
    return res.status(200).json({
      status: "success",
      data: { user },
    });
  }),

  uploadImage: catchAsync(async (req, res, next) => {
    const { user } = req;
    const file = userService.uploadImage.verifyFile(req);
    await userService.uploadImage.createImage(file, user);
    return res.status(201).json({
      status: "success",
    });
  }),

  // Delete one user
  // 1. Get user id from params
  // 2. Veriy user and delete
  // 3. Return 204 (No content)
  deleteOneUser: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    await userService.deleteOne.verifyUserAndDelete(userId);
    return res.status(204).send();
  }),

  // Update me
  // 1. Get user data
  // 2. Filter data (only required fields can be update here)
  // 3. Start update the data
  updateMe: catchAsync(async (req, res, next) => {
    const data = req.body;
    const { user } = req;
    const filteredData = await userService.updateMe.verifyData(data);
    await userService.updateMe.update(user, filteredData);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Confirm email before update
  // 1. Get current email and new email
  // 2. Get current user
  // 3. Verify new email. Make sure does not exist in db
  // 4. Generate OTP code
  // 5. Send email along the otp code
  confirmNewEmail: catchAsync(async (req, res, next) => {
    const data = req.body;
    const user = await userService.updateEmail.verifyUser(data);
    const newEmail = await userService.updateEmail.verifyNewEmail(data, user);
    const OTP = await user.createOTPToken();
    await user.save({ validateBeforeSave: false });
    const emailData = await userService.updateEmail.createEmail(OTP, newEmail);
    const resultSendEmail = await sendEmailWithNodemailer(emailData);
    await userService.updateEmail.verifyResultSendEmail(resultSendEmail);
    return res.status(200).json({
      status: "success",
      data: {
        newEmail,
      },
    });
  }),

  // Update email
  // 1. Get current user
  // 2. Get new email
  // 3. Update new email
  updateEmail: catchAsync(async (req, res, next) => {
    const { user } = req;
    const email = await userService.updateEmail.update(user);
    return res.status(201).json({
      status: "success",
      data: {
        email,
      },
    });
  }),

  // Delete Account
  // 1. Get current user
  // 2. Clear cookie
  deleteAccount: catchAsync(async (req, res, next) => {
    const data = req.body;
    const { user } = req;
    await userService.deleteAccount.verifyPassword(data, user);
    await userService.deleteAccount.delete(user, data);
    authController.clearCookie(res);
    res.status(204).send();
  }),

  // Log out one device
  // 1. Get session Id from request
  // 2. Find session in db and delete if exist
  // 3. Else Return error
  logOutOne: catchAsync(async (req, res, next) => {
    const data = req.params;
    const { user } = req;
    await userService.logOutOne.verifySession(user, data);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Update Password
  // 1. Get current password and new password
  // 2. Find user in data base
  // 3. Verify current password and Update new password
  // 4. Delete session and reauthenticate
  updatePassword: catchAsync(async (req, res, next) => {
    const data = req.body;
    const { cookies } = req;
    const refreshToken = userService.updatePassword.verifyCookie(cookies);
    const user = await userService.updatePassword.getCurrentUser(req);
    await userService.updatePassword.verifyAndUpdatePassword(user, data);
    await userService.updatePassword.removeSession(refreshToken);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Enable/Disable 2FA (User log in with email)
  // 1. Find User in database
  // 2. Compare password
  // 3. Enable/Disable 2FA (if password is correct)
  enable2FAByPassword: catchAsync(async (req, res, next) => {
    const data = req.body;
    const { action } = req.params;
    const user = await userService.enable2FA.verifyUser(req, action);
    await userService.enable2FA.verifyPassword(user, data);
    await userService.enable2FA.enable(user, action);
    return res.status(200).json({
      status: "success",
    });
  }),

  // Enable/Disable 2FA by OTP (User log in with OAuth)
  // 1. Get action (enable/disable)
  // 2. Create OTP code
  // 3. Create email to send
  // 4. Send email along OTP
  // 5. Verify the result sending email
  enable2FAByOTP: catchAsync(async (req, res, next) => {
    const { action } = req.params;
    const user = await userService.enable2FA.verifyUser(req, action);
    const OTP = await user.createOTPToken();
    await user.save({ validateBeforeSave: false });
    const emailData = await userService.enable2FA.createEmail(OTP, user.email);
    const resultSendEmail = sendEmailWithNodemailer(emailData);
    await userService.enable2FA.confirmResultSendEmail(resultSendEmail);
    return res.status(201).json({
      status: "success",
      data: {
        email: user.email,
      },
    });
  }),

  // Enable 2FA
  // 1. get action (enable/disable)
  // 2. get user
  // 3. Start enable/disable 2FA
  enable2FA: catchAsync(async (req, res, next) => {
    const { action } = req.params;
    const { user } = req;
    await userService.enable2FA.enable(user, action);
    return res.status(200).json({
      status: "success",
    });
  }),
};

export default userController;
