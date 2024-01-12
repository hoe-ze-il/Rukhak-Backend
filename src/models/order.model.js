import mongoose from "mongoose";
import Product from "./product.model.js";
import { generateString } from "@/utils/generateString.js";
const orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        itemPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "cash_on_delivery"],
      validate: {
        validator: function (v) {
          return ["credit_card", "cash_on_delivery"].includes(v);
        },
        message: (props) => `${props.value} is not a valid payment method!`,
      },
    },
    paymentDetails: {
      type: Object,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    shipping: {
      address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
      },
      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "shipped",
          "cancelled",
          "delivered",
          "refunded",
        ],
        default: "pending",
      },
    },
    tracking_number: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.tracking_number = generateString();
    for (let item of this.cartItems) {
      const product = await Product.findById(item.productId);
      if (product && product.availableStock >= item.quantity) {
        await product.save();
      } else {
        throw new Error("Not enough stock for this product");
      }
    }
  }
  next();
});

orderSchema.methods.cutStock = async function () {
  for (let item of this.cartItems) {
    const product = await Product.findById(item.productId);
    if (product && product.availableStock >= item.quantity) {
      product.availableStock -= item.quantity;
      await product.save();
      await this.updateSoldAmount();
    } else {
      const errorMessage =
        "Not enough stock for one of the products in the order";
      console.log(errorMessage);
      throw new Error({ status: 400, message: errorMessage });
    }
  }
};
orderSchema.methods.updateSoldAmount = async function () {
  for (let item of this.cartItems) {
    const product = await Product.findById(item.productId);
    if (product) {
      product.soldAmount += item.quantity;
      await product.save();
    } else {
      throw new Error("Product not found for one of the items in the order");
    }
  }
};

orderSchema.pre("find", function () {
  this.populate("shipping.address");
});

orderSchema.statics.getTotalRevenue = async function () {
  const pipeline = [
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
  ];
  const revenue = await this.aggregate(pipeline);
  return revenue.length > 0 ? revenue[0].totalRevenue : 0;
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
