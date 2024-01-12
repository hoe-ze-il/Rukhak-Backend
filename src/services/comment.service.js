import createService from "./common.service.js";
import Comment from "@/models/comment.model.js";
import { getFileSignedUrl } from "@/config/s3.js";

const commentService = {
  ...createService(Comment),
  async getAllCommentsByPost(postId) {
    const comments = await Comment.find({ postId }).populate({
      path: "author",
      select: "firstName lastName profilePicture",
    });

    await Promise.all(
      comments?.map(async (comment) => {
        if (comment._doc.media[0]) {
          comment._doc.signedMedia = await getFileSignedUrl(
            comment?.media[0]?.src
          );
        }
      })
    );

    const commentsById = {};
    comments.forEach((comment) => {
      commentsById[comment._id] = comment;
    });

    const groupedComments = comments?.reduce((acc, comment) => {
      const parentId = comment.parent;

      if (parentId) {
        if (!commentsById[parentId]?._doc.replies) {
          commentsById[parentId]._doc.replies = [];
        }
        commentsById[parentId]._doc.replies.push(comment);
      } else {
        acc.push(comment);
      }
      return acc;
    }, []);

    return groupedComments;
  },
  async reactComment(commentId, userId) {
    const comment = await Comment.findById(commentId);

    let react = {};

    // if user not reacted on the comment set reaction otherwise remove reaction
    if (!comment.reactions.get(userId)) {
      react = {
        $set: { [`reactions.${userId}`]: true },
      };
    } else {
      react = {
        $unset: { [`reactions.${userId}`]: 1 },
      };
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, react, {
      new: true,
    });

    return updatedComment;
  },
};

export default commentService;
