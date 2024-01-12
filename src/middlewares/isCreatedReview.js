import Review from "../models/review.model.js";
import APIError from "../utils/APIError.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * Check if the user has already reviewed the product
 */
const isCreatedReview = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { id: userId, role: userRole } = req.user;

  if (userRole !== "admin") {
    const existingReview = await Review.findOne({
      product: productId,
      userId,
    });

    if (existingReview) {
      throw new APIError({
        status: 400,
        message: "You have already reviewed this product.",
      });
    }
  }

  next();
});

export default isCreatedReview;
