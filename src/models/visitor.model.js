import mongoose from "mongoose";

const visitorSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  ipAddress: {
    type: String,
  },
  visitDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Visitor = mongoose.model("Visitor", visitorSchema);
export default Visitor;
