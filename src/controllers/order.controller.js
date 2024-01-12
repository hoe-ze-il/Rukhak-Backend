import factory from "./factory.js";
import orderService from "@/services/order.service.js";
import catchAsync from "@/utils/catchAsync.js";
const orderController = {
  getAllOrder: factory.getAll(orderService.getAllOrders),
  getOrder: factory.getById(orderService.getOrder),
  addOrder: factory.create(orderService.createOrder),
  updateOrder: factory.updateById(orderService.updateOrder),
  userUpdateOrder: factory.updateById(orderService.userUpdateOrder),
  deleteOrder: factory.deleteById(orderService.deleteOrder),

  // get all order of seller
  getSellerOrder: factory.getAll(orderService.getSellerOrder),

  // get order by sellerId
  getSellerOrderById: catchAsync(async (req, res, next) => {
    req.query.sellerId = req.user.id;

    const products = await orderService.getSellerOrderById(req.query);

    return res.json({
      status: "success",
      data: products,
    });
  }),
  getUserOrder: catchAsync(async (req, res, next) => {
    req.query.userId = req.user.id;

    const user = await orderService.getUserOrder(req.query);
    return res.json({
      status: "success",
      data: user,
    });
  }),
  ChartOrder: catchAsync(async (req, res, next) => {
    req.query.sellerId = req.user.id;
    const ChartOrder = await orderService.ChartOrder(req.query);
    return res.json({
      status: "success",
      data: ChartOrder,
    });
  }),
};

export default orderController;
