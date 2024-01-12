import Follower from "@/models/follower.model.js";
import User from "@/models/user.model.js";
import APIError from "@/utils/APIError.js";
import Notification from "@/models/notification.model.js";
import mongoose from "mongoose";
import MediaUtil from "@/utils/media.util.js";

const followerService = {
  async addFollow(sourceId, targetId) {
    const targetUser = await User.findById(targetId);
    const sourceUser = await User.findById(sourceId);

    if (targetUser && sourceUser) {
      const newFollow = await Follower.create({ sourceId, targetId });
      await Notification.insertNotification(
        targetId,
        sourceId,
        "Follow Notification",
        `${sourceUser.firstName} ${sourceUser.lastName} had followed you`,
        "Follow",
        new mongoose.Types.ObjectId()
      );

      return newFollow;
    } else {
      throw new APIError({ status: 404, message: "Following failed" });
    }
  },

  async removeFollow(sourceId, targetId) {
    const follow = await Follower.findOneAndDelete({ sourceId, targetId });
    if (!follow) {
      throw new APIError({ status: 404, message: "Unfollowing failed" });
    }
    return follow;
  },

  async getAllFolllower(userId) {
    const followers = await Follower.find({ targetId: userId }).populate({
      path: "sourceId",
      select: ["firstName", "lastName", "profilePicture", "role"],
    });

    if (!followers) {
      throw new APIError({ status: 404, message: "Something went wrong" });
    }

    // Remove followers whose target user has been deleted
    const validFollowers = await Promise.all(
      followers.map(async (follower) => {
        const targetUserExists = await User.exists({ _id: follower.sourceId });
        return targetUserExists ? follower : null;
      })
    );

    // Filter out null values (followers of deleted users)
    const filteredFollowers = validFollowers.filter(
      (follower) => follower !== null
    );

    return filteredFollowers;
  },

  async getAllFolllowing(userId) {
    const followingList = await Follower.find({ sourceId: userId }).populate({
      path: "targetId",
      select: ["firstName", "lastName", "profilePicture", "role"],
    });

    if (!followingList) {
      throw new APIError({ status: 404, message: "Something Went Wrong" });
    }
    // Remove follow relationships where the source user has been deleted
    const validFollowingList = await Promise.all(
      followingList.map(async (following) => {
        const sourceUserExists = await User.exists({ _id: following.targetId });
        return sourceUserExists ? following : null;
      })
    );

    // Filter out null values (follow relationships of deleted users)
    const filteredFollowingList = validFollowingList.filter(
      (following) => following !== null
    );

    return filteredFollowingList;
  },
};

export default followerService;
