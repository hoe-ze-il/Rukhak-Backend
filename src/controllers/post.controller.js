import catchAsync from "@/utils/catchAsync.js";
import factory from "./factory.js";
import postService from "@/services/post.service.js";

const postController = {
  getAllPosts: factory.getAll(postService.getAll, "author"),
  getPost: factory.getById(postService.get),
  createPost: factory.create(postService.create),
  updatePost: factory.updateById(postService.update),
  deletePost: factory.deleteById(postService.delete),
  reactPost: catchAsync(async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;
    const updatedPost = postService.reactPost(userId, id);
    res.status(204).json({
      status: "success",
      data: updatedPost,
    });
  }),
  getPersonalPosts: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const posts = await postService.getPersonalPost(userId, "author");
    res.status(200).json({
      status: "success",
      data: posts,
    });
  }),
};

export default postController;
