import mongoose from "mongoose";
import User from "./user.model.js";

const sellerSchema = User.discriminator(
  "Seller",
  new mongoose.Schema({
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      // required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "hide"],
      default: "hide",
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    sellerStatus: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    storeLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    storeAndSellerName: String,
  })
);

const Seller = mongoose.model("Seller", sellerSchema.scheme);
export default Seller;
