import express from "express";
import reviewController from "@/controllers/review.controller.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import isAuthorizeReview from "@/middlewares/isAuthorizeReview.js";
import isCreatedReview from "@/middlewares/isCreatedReview.js";
import isAbleToCreateReview from "@/middlewares/isAbleToCreateReview.js";

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(reviewController.getReviews)
  .post(
    isAuth,
    isAbleToCreateReview,
    isCreatedReview,
    reviewController.createReview
  );

router
  .route("/:reviewId")
  .delete(isAuth, isAuthorizeReview, reviewController.deleteReview)
  .patch(isAuth, isAuthorizeReview, reviewController.updateReview);

export default router;
