import APIError from "../../utils/APIError.js";

const verifySellerStatus = () => {
  return (req, res, next) => {
    if (req.user.sellerStatus === "pending") {
      throw new APIError({
        status: 403,
        message:
          "Forbidden: Seller status is pending. You do not have permission as a seller yet.",
      });
    } else if (req.user.sellerStatus === "inactive") {
      throw new APIError({
        status: 401,
        message: "Unauthorized: You have been rejected to be a seller.",
      });
    } else if (!req.user.sellerStatus || req.user.sellerStatus !== "active") {
      throw new APIError({
        status: 401,
        message:
          "Unauthorized: Please sign up as a seller to perform this action.",
      });
    }

    // Next means seller's status is active
    next();
  };
};

export default verifySellerStatus;
