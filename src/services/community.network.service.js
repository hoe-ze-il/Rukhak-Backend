import Post from "@/models/post.model.js";
import Follower from "@/models/follower.model.js";
import APIError from "@/utils/APIError.js";

const Community = {
  async getNetworkPosts(userId) {
    // Get the IDs of users the current user is following
    const followingList = await Follower.find({ sourceId: userId }).select(
      "targetId"
    );

    // Extract the targetIds from the followingList
    const followingIds = followingList.map((follow) => follow.targetId);

    // Retrieve public posts or posts from users in the following list
    const posts = await Post.find({
      $or: [{ type: "public" }, { author: { $in: followingIds } }],
      type: { $ne: "private" }, // Exclude posts of type "private"
    });

    if (!posts) {
      throw new APIError({ status: 404, message: "No posts found" });
    }
    return posts;
  },
};

export default Community;
