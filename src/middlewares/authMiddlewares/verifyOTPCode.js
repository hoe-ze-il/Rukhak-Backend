import User from "../../models/user.model.js";
import APIError from "../../utils/APIError.js";
import catchAsync from "../../utils/catchAsync.js";
import bcrypt from "bcryptjs";

const verifyOTPCode = catchAsync(async (req, res, next) => {
  let { OTP, email, loginMethod } = req.body;

  // User who update email can't request along with current email
  if (!email) email = req?.user.email || undefined;
  const user = await User.findOne({
    email,
    OTPExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    throw new APIError({
      status: 400,
      message: "OTP code is expired!",
    });
  }
  const resultCompare = await bcrypt.compare(OTP, user.OTP);
  if (!resultCompare) {
    throw new APIError({
      status: 500,
      message: "Incorrect OTP code.",
    });
  }
  user.OTP = undefined;
  user.OTPExpires = undefined;
  await user.save({ validateBeforeSave: false });
  req.user = user;
  req.user.loginMethod = loginMethod || undefined; // undefined because user not log in but only verify the code (enable 2FA)
  return next();
});

export default verifyOTPCode;
