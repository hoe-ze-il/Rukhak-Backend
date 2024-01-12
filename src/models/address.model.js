import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentlyUse: {
      type: Boolean,
      default: true,
    },
    pinPoint: [
      {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
          required: true,
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    ],
    fullname: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    addressLine: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

addressSchema.pre("save", async function (next) {
  if (this.isNew) {
    const otherDocuments = await this.constructor.find({
      _id: { $ne: this._id },
      userId: this.userId,
      currentlyUse: true,
    });
    if (otherDocuments.length > 0) {
      for (const doc of otherDocuments) {
        doc.currentlyUse = false;
        await doc.save();
      }
    }
  }

  next();
});

const Address = mongoose.model("Address", addressSchema);
export default Address;
