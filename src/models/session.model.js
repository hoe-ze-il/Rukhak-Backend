import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceType: {
      type: String,
      required: true,
    },
    loginMethod: {
      type: String,
      required: true,
      enum: ["email", "google", "facebook"],
    },
    loginAt: {
      type: Date,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
      select: false,
    },
    accessToken: {
      type: String,
      required: true,
    },
    deviceLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ accessToken: 1 });
sessionSchema.index({ refreshToken: 1 });

// Each documentas will remove from db after 30 days if not refresh the token
sessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

const Session = mongoose.model("Session", sessionSchema);
export default Session;
