import express from "express";
import commentController from "@/controllers/comment.controller.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import { mediaUpload } from "@/config/multer.js";
import isAuthorizeComment from "@/middlewares/isAuthorizeComment.js";
import dotenv from "dotenv";

dotenv.config();

const bucket = process.env.AWS_BUCKET_NAME;

const route = express.Router({ mergeParams: true });

route
  .route("/")
  // .get(commentController.getAllComments)
  .get(commentController.getAllCommentsByPost)
  .post(
    mediaUpload(bucket, "community/comments"),
    isAuth,
    commentController.createComment
  );

route
  .route("/:id")
  .get(commentController.getComment)
  .patch(isAuth, isAuthorizeComment, commentController.updateComment)
  .delete(isAuth, isAuthorizeComment, commentController.deleteComment);

route.patch("/:id/react", isAuth, commentController.reactComment);

export default route;
