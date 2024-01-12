import mongoose from "mongoose";
import Review from "../models/review.model.js";
import APIError from "../utils/APIError.js";
import Product from "../models/product.model.js";
import blurText from "@/utils/blurText.js";

const reviewService = {
  async createReview(productId, userId, reviewInput) {
    // Start a session
    const session = await mongoose.startSession();
    const reviewData = { product: productId, userId, ...reviewInput };

    try {
      // Start the transaction
      session.startTransaction();

      const review = new Review(reviewData);
      await review.save({ session });

      const product = await Product.findById(review.product).session(session);

      // Update Product's review count and average rating
      const newReviewCount = product.reviewCount + 1;
      product.averageRating =
        (product.reviewCount * product.averageRating + review.rating) /
        newReviewCount;
      product.reviewCount = newReviewCount;

      // Add the new review to the start of the reviews array
      product.reviews.unshift({
        _id: review._id,
        review: review.review,
        rating: review.rating,
        createdAt: review.createdAt,
        userId,
      });
      // Limit the reviews array to 10
      product.reviews = product.reviews.slice(0, 10);

      await product.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      return review;
    } catch (error) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw new APIError({
        status: 400,
        message: "Cannot create a review!",
        error: error,
      });
    }
  },
  async deleteReview(productId, reviewId) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const review = await Review.findByIdAndRemove(reviewId, {
        session: session,
      });
      if (!review) {
        throw new APIError({ status: 404, message: "Review not found" });
      }

      const product = await Product.findById(productId).session(session);

      // Remove the review from the embedded reviews array, if there is any
      const isEmbeddedReview = product.reviews.some((r) =>
        r._id.equals(review._id)
      );

      product.reviews = product.reviews.filter(
        (r) => !r._id.equals(review._id)
      );

      // If the deleted review was in the embedded list, find the next most recent one
      if (isEmbeddedReview && product.reviews.length < 10) {
        const extraReview = await Review.findOne(
          {
            product: productId,
            _id: { $nin: product.reviews.map((r) => r._id) },
          },
          null,
          { sort: { createdAt: -1 }, session: session }
        );

        if (extraReview) {
          product.reviews.push({
            _id: extraReview._id,
            rating: extraReview.rating,
            review: extraReview.review,
            userId: extraReview.userId,
          });
        }
      }

      let newAverageRating;
      const newReviewCount = product.reviewCount - 1;
      if (newReviewCount > 0) {
        newAverageRating =
          (product.reviewCount * product.averageRating - review.rating) /
          newReviewCount;
      } else {
        newAverageRating = 0; // If no reviews left, reset average rating
      }

      product.reviewCount = newReviewCount;
      product.averageRating = newAverageRating;

      await product.save({ session });

      await session.commitTransaction();
      session.endSession();
      return review;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new APIError({
        status: 400,
        message: "Failed to delete the review",
        error: error,
      });
    }
  },
  async updateReview(productId, reviewId, updateData) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const review = await Review.findById(reviewId).session(session);
      if (!review) {
        throw new APIError({
          status: 404,
          message: "Review not found.",
        });
      }
      const previousRating = review.rating;

      for (const key in updateData) {
        review[key] = updateData[key];
      }

      await review.save({ session });

      const product = await Product.findById(productId).session(session);

      if (product) {
        const reviewIndex = product.reviews.findIndex((r) =>
          r._id.equals(review._id)
        );
        if (reviewIndex !== -1) {
          product.reviews[reviewIndex] = {
            ...product.reviews[reviewIndex].toObject(),
            ...updateData,
          };
        }
        product.averageRating =
          (product.averageRating * product.reviewCount -
            previousRating +
            updateData.rating) /
          product.reviewCount;

        await product.save({ session });
      }

      await session.commitTransaction();
      session.endSession();
      return review;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new APIError({
        status: 400,
        message: "Failed to update the review.",
        error: error,
      });
    }
  },
  async getReviews(productId, page) {
    const limit = 10;

    const reviews = await Review.find(
      {
        product: productId,
      },
      { review: 1, rating: 1, userId: 1 }
    )
      .sort({ createdAt: -1 })
      .skip(limit * page)
      .limit(limit)
      .populate("userId", "firstName createdAt");

    reviews.map((review) => {
      review.userId.firstName = blurText(review.userId.firstName);
    });

    return reviews;
  },
};

export default reviewService;
