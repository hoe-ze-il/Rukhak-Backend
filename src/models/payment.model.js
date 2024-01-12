import mongoose from "mongoose";
import Order from "@/models/order.model.js";
import APIError from "@/utils/APIError.js";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
0;

paymentSchema.virtual("amount").get(async function () {
  try {
    const order = await Order.findById(this.orderId);
    if (order) {
      return order.totalPrice;
    } else {
      throw new APIError("Order not found");
    }
  } catch (error) {
    throw new APIError("Error calculating amount: ", error);
    throw error;
  }
});

paymentSchema.post("save", async function (doc) {
  try {
    await Order.findByIdAndUpdata(doc.orderId, { $set: { isPaid: true } });
  } catch (error) {
    throw new APIError("Error updating order: ", error);
  }
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
