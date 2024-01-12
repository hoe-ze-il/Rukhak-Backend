import Post from "@/models/post.model.js";
import Comment from "@/models/comment.model.js";
import catchAsync from "@/utils/catchAsync.js";
import APIError from "../utils/APIError.js";

const isAuthorizeComment = catchAsync(async (req, res, next) => {
  const { role: userRole, id: userId } = req.user;

  const { postId, id: commentId } = req.params;

  // Check if post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new APIError({
      status: 400,
      message: "No post found with this id.",
    });
  }

  // Check if comment exist
  const comment = await Comment.findOne({ _id: commentId, postId });
  if (!comment) {
    throw new APIError({
      status: 400,
      message: "No comment found with this id.",
    });
  }

  if (userRole !== "admin" && userId !== comment.author.toString()) {
    throw new APIError({ status: 401, message: "Unauthorized." });
  }

  next();
});

export default isAuthorizeComment;
