import express from "express";
import paymentController from "@/services/payment.service.js";

const router = express.Router();

router.post("/create", paymentController.createPayment);
router.get("/execute", paymentController.executePayment);

export default router;
