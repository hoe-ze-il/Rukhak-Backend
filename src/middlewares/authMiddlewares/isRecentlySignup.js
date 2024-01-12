import User from "../../models/user.model.js";
import APIError from "../../utils/APIError.js";
import catchAsync from "../../utils/catchAsync.js";

// Prevent user or someone accidentally request to resend email
const isRecentlySignup = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new APIError({
      status: 404,
      message: "Please Sign up first!",
    });
  } else if (user.accountVerify === true) {
    throw new APIError({
      status: 400,
      message:
        "Your account is already verified. No need to resend activation.",
    });
  }
  // set updatedAt field to current date to delay expiration time of activate account
  user.updatedAt = Date.now();
  user.save();

  req.user = user;
  return next();
});

export default isRecentlySignup;
