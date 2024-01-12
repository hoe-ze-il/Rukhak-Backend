import Order from "../models/order.model.js";
import APIError from "../utils/APIError.js";
import catchAsync from "../utils/catchAsync.js";

const isAbleToCreateReview = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { id: userId, role: userRole } = req.user;

  if (userRole !== "admin") {
    const orders = await Order.find({ userId });

    const selectedOrders = orders.filter(
      (order) =>
        order.cartItems.some(
          (item) => item.productId.toString() === productId
        ) && order.shipping.status === "delivered"
    );

    if (selectedOrders.length === 0) {
      throw new APIError({
        status: 400,
        message: "You must purchase the product before create a review.",
      });
    }
  }

  next();
});

export default isAbleToCreateReview;
