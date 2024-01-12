import User from "../../models/user.model.js";
import APIError from "../../utils/APIError.js";
import catchAsync from "../../utils/catchAsync.js";

// Prevent someone accidentally request to resend email
const isRecently2FA = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new APIError({
      status: 401,
      message: "User not found.",
    });
  } else if (!user.OTP) {
    throw new APIError({
      status: 400,
      message: "This email didn't request for OTP.",
    });
  }
  req.user = user;
  return next();
});

export default isRecently2FA;
