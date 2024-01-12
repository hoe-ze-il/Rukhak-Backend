import mongoose from "mongoose";

const followerSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    unique: { fields: ["sourceId", "targetId"] },
  }
);

const Follower = mongoose.model("Follower", followerSchema);

export default Follower;
