import express from "express";
import orderController from "@/controllers/order.controller.js";

const router = express.Router();

router
  .route("/")
  .get(orderController.getAllOrder)
  .post(orderController.addOrder);

export default router;
