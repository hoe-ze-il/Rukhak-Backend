import mongoose from "mongoose";

const topSellingSchema = mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  salesCount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const TopSelling = mongoose.model("TopSelling", topSellingSchema);
export default TopSelling;
