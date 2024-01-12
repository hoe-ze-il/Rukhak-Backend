import express from "express";
import addressController from "@/controllers/address.controller.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import verifyRoles from "@/middlewares/authMiddlewares/verifyRoles.js";

const router = express.Router();

router.use(isAuth);

router
  .route("/")
  .get(verifyRoles("admin"), addressController.getAllAddresses)
  .post(addressController.createAddress);

router
  .route("/:id")
  .get(addressController.getAddress)
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

export default router;
