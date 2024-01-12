import APIError from "../../utils/APIError.js";

// Verify user roles
// 1. Get user's role
// 2. Verify the role
const verifyRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new APIError({
        status: 403,
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

export default verifyRoles;
