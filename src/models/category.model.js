import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      minLength: 10,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 });

const Category = mongoose.model("Category", categorySchema);
export default Category;
