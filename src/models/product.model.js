import mongoose from "mongoose";
import slugify from "slugify";
import utils from "../utils/utils.js";
import APIError from "@/utils/APIError.js";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: 3,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      minLength: 10,
      trim: true,
    },
    basePrice: {
      type: Number,
      min: 0,
      required: true,
    },
    unitPrice: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      default: "item",
    },
    availableStock: {
      type: Number,
      min: 0,
      required: true,
    },
    soldAmount: {
      type: Number,
      default: 0,
    },
    stockAlert: {
      type: Number,
      default: 3,
    },
    imgCover: {
      type: String,
      required: true,
    },
    media: {
      type: [String],
      required: true,
    },
    categories: [
      {
        type: String,
        required: true,
      },
    ],
    dimension: {
      type: Object,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviews: [
      {
        _id: mongoose.Schema.Types.ObjectId,
        review: String,
        rating: Number,
        upVote: Number,
        downVote: Number,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: Date,
      },
    ],
    reviewCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Public", "Hidden", "Deleted"], // if status does not work for seller, change them to lowercase.
      default: "Public",
    },
    expirationDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({
  status: 1,
  sellerId: 1,
});

productSchema.index({
  categories: 1,
});
productSchema.index({ title: "text", description: "text" });

productSchema.pre("save", function (next) {
  // Slugify
  if (this.isModified("title")) {
    this.slug = slugify(this.title + "-" + Date.now(), {
      lower: true,
      strict: true,
    });
  }

  // Set unitPrice (add +10%)
  this.unitPrice = utils.calculateUnitPrice(this.basePrice);
  next();
});

productSchema.pre("findOneAndUpdate", function (next) {
  if (this._update.basePrice)
    this._update.unitPrice = utils.calculateUnitPrice(this._update.basePrice);
  next();
});

productSchema.statics.checkProductExists = async function ({
  title,
  sellerId,
}) {
  const foundProduct = await this.findOne({
    sellerId,
    title,
  }).select("title sellerId status");

  if (foundProduct) {
    if (foundProduct.status !== "Deleted") {
      throw new APIError({
        status: 400,
        message: "Found product with the same title.",
      });
    }
  }
  return;
};

const Product = mongoose.model("Product", productSchema);
export default Product;
