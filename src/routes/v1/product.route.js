import express from "express";
import usersProductController from "@/controllers/product.controller.js";
import reviewRoute from "./review.route.js";

const router = express.Router();

router.route("/").get(usersProductController.getByCategories);
router.route("/all").get(usersProductController.getUserProducts);
router.route("/hot").get(usersProductController.getHotProducts);
router.route("/top").get(usersProductController.getTopProducts);
router.route("/:id").get(usersProductController.getProductDetails);

router.use("/:productId/reviews", reviewRoute);

export default router;
