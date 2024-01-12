import followerService from "@/services/follower.service.js";
import catchAsync from "@/utils/catchAsync.js";

const networkController = {
  getAllFollowers: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const followers = await followerService.getAllFolllower(userId);

    res.status(200).json({
      status: "success",
      data: followers,
    });
  }),
  getAllFollowing: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const followingList = await followerService.getAllFolllowing(userId);

    res.status(200).json({
      status: "success",
      data: followingList,
    });
  }),
  follow: catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { targetId } = req.body;
    const newFollow = await followerService.addFollow(userId, targetId);
    res.status(200).json({
      status: "success",
      data: newFollow,
    });
  }),
};
export default networkController;
