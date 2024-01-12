import User from "../../models/user.model.js";
import APIError from "../../utils/APIError.js";
import catchAsync from "../../utils/catchAsync.js";

// Prevent someone accidentally request to resend email
const isRecentlyForgotPwd = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new APIError({
      status: 404,
      message: "User not found!",
    });
  } else if (user && !user.forgotPasswordExpires) {
    throw new APIError({
      status: 400,
      message: "User with this email was not requested to reset password.",
    });
  }
  req.user = user;
  return next();
});

export default isRecentlyForgotPwd;
