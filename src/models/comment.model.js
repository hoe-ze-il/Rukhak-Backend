import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      require: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    content: {
      type: Object,
      trim: true,
      require: true,
    },
    media: [
      {
        src: String,
      },
    ],
    isUpdated: {
      type: Boolean,
      default: false,
    },
    reactions: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    excerpt: {
      type: String,
      max: 300,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
