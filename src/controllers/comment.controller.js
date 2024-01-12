import commentService from "@/services/comment.service.js";
import factory from "./factory.js";
import catchAsync from "@/utils/catchAsync.js";

const commentController = {
  getAllComments: factory.getAll(commentService.getAll),
  getComment: factory.getById(commentService.get),
  createComment: factory.create(commentService.create),
  updateComment: factory.updateById(commentService.update),
  deleteComment: factory.deleteById(commentService.delete),
  getAllCommentsByPost: catchAsync(async (req, res) => {
    const { postId } = req.params;
    const comments = await commentService.getAllCommentsByPost(postId);
    res.status(200).json({
      status: "sucess",
      doc: comments,
    });
  }),
  reactComment: catchAsync(async (req, res) => {
    const { id: commentId } = req.params;
    const { id: userId } = req.user;
    const comment = await commentService.reactComment(commentId, userId);
    res.status(200).json({
      status: "success",
      doc: comment,
    });
  }),
};

export default commentController;
