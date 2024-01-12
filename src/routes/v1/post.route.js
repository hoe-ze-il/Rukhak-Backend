import postController from "@/controllers/post.controller.js";
import express from "express";
import { runValidation } from "@/validators/index.js";
import createPostValidator from "@/validators/post.validator.js";
import commentRoute from "./comment.route.js";
import { mediaUpload } from "@/config/multer.js";
import dotenv from "dotenv";

dotenv.config();

const bucket = process.env.AWS_BUCKET_NAME;

const route = express.Router();

route
  .route("/")
  .get(postController.getAllPosts)
  .post(
    mediaUpload(bucket, "community/posts"),
    createPostValidator,
    runValidation,
    postController.createPost
  );

route
  .route("/:id")
  .get(postController.getPost)
  .patch(postController.reactPost)
  .put(postController.updatePost)
  .delete(postController.deletePost);

route.use("/:postId/comments", commentRoute);

export default route;
