import express from "express";
import categoryController from "@/controllers/category.controller.js";

const router = express.Router();

router.route("/").get(categoryController.getCategory);

export default router;
