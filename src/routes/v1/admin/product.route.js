import express from "express";
import productControllerAdmin from "@/controllers/admin/product.controller.js";
import {
  createProductValidator,
  sellerProductQueryValidator,
} from "@/validators/product.validator.js";
import { runValidation } from "@/validators/index.js";
import { uploadProductMedia } from "@/middlewares/uploadFiles.js";
import { editProductMedia } from "@/middlewares/editFiles.js";
import resizeImage from "@/middlewares/resizeImage.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import verifyRoles from "@/middlewares/authMiddlewares/verifyRoles.js";

const router = express.Router();

const ROLE = "admin";

router.use(isAuth);
router.use(verifyRoles(ROLE));

router
  .route("/")
  .post(
    uploadProductMedia,
    resizeImage(),
    createProductValidator,
    runValidation,
    productControllerAdmin.createProduct
  )
  .get(
    sellerProductQueryValidator,
    runValidation,
    productControllerAdmin.getProducts
  );

router
  .route("/:id")
  .get(productControllerAdmin.getProductById)
  .patch(editProductMedia, resizeImage(), productControllerAdmin.updateProduct);

export default router;
