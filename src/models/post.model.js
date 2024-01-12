import mongoose from "mongoose";
import slugify from "slugify";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
      trim: true,
      min: 3,
      max: 160,
      index: true,
    },
    content: {
      type: Object,
      require: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
      index: true,
    },
    isUpdated: {
      type: Boolean,
      default: false,
    },
    media: [
      {
        src: String,
        type: { type: String, enum: ["image", "video"] },
      },
    ],
    reactions: {
      type: Map,
      of: Boolean,
      default: new Map(),
    },
    commentCounts: {
      type: Number,
      default: 0,
    },
    slug: { type: String, unique: true, index: true },

    type: {
      type: String,
      enum: ["public", "restricted", "private"],
      index: true,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

postSchema.pre("save", async function (next) {
  this.slug = slugify(`${this.title}${Date.now().toString()}`, { lower: true });
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
