import express from "express";
import controller from "@/controllers/seller.controller.js";
import {
  createProductValidator,
  sellerProductQueryValidator,
  updateProductValidator,
} from "@/validators/product.validator.js";
import { runValidation } from "@/validators/index.js";
import { uploadProductMedia } from "@/middlewares/uploadFiles.js";
import { editProductMedia } from "@/middlewares/editFiles.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import verifyRoles from "@/middlewares/authMiddlewares/verifyRoles.js";
import verifySellerStatus from "@/middlewares/authMiddlewares/verifySellerStatus.js";
import orderController from "@/controllers/order.controller.js";
import resizeImage from "@/middlewares/resizeImage.js";

const router = express.Router();

const ROLE = "seller";

router
  .route("/products")
  .post(
    isAuth,
    verifyRoles(ROLE),
    verifySellerStatus(),
    uploadProductMedia,
    resizeImage(),
    createProductValidator,
    runValidation,
    controller.createProduct
  )
  .get(
    isAuth,
    verifyRoles(ROLE),
    verifySellerStatus(),
    sellerProductQueryValidator,
    runValidation,
    controller.getOwnProducts
  );

router
  .route("/products/:id")
  .get(
    isAuth,
    verifyRoles(ROLE),
    verifySellerStatus(),
    controller.getOwnProductDetail
  )
  .patch(
    isAuth,
    verifyRoles(ROLE),
    verifySellerStatus(),
    editProductMedia,
    resizeImage(),
    updateProductValidator,
    runValidation,
    controller.updateProduct
  )
  .delete(
    isAuth,
    verifyRoles(ROLE),
    verifySellerStatus(),
    controller.deleteProduct
  );

// add method seller orderRoute
router.route("/orders").get(
  isAuth, //req.user
  verifyRoles(ROLE),
  verifySellerStatus(),
  orderController.getSellerOrderById
);
router.route("/ChartOrder").get(
  isAuth, //req.user
  verifyRoles(ROLE),
  verifySellerStatus(),
  orderController.ChartOrder
);
router
  .route("/orders/:id")
  .get(orderController.getOrder)
  .patch(
    isAuth, //req.user
    verifyRoles(ROLE),
    verifySellerStatus(),
    orderController.updateOrder
  )
  .delete(orderController.deleteOrder);

export default router;
