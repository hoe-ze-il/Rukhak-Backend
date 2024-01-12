import createService from "./common.service.js";
import Post from "@/models/post.model.js";
import MediaUtil from "@/utils/media.util.js";

const postService = createService(Post);

postService.reactPost = async (userId, id) => {
  const post = await Post.findById(id);
  const isLiked = post.reactions.get(userId);
  if (isLiked) {
    post.reactions.delete(userId);
  } else {
    post.reactions.set(userId, true);
  }
  const updatePost = await Post.findByIdAndUpdate(
    id,
    {
      reactions: post.reactions,
    },
    { new: true }
  );
  return updatePost;
};

postService.getPersonalPost = async (userId, populateField) => {
  let posts = await Post.find({ author: userId });
  if (populateField) {
    posts = await Post.populate(posts, {
      path: populateField,
      select: [
        "firstName",
        "lastName",
        "imageURL",
        "storeName",
        "role",
        "email",
      ],
    });
  }
  await Promise.all(
    posts.map(async (item) => {
      const { media } = item;
      if (!media.isEmpty) {
        item.media = await MediaUtil.getMediaUrls(media);
      }
    })
  );
  return posts;
};

export default postService;
