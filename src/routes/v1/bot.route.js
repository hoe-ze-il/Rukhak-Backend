import express from "express";
import handleTextQuery from "@/controllers/bot.controller.js";

const router = express.Router();

router.post("/textQuery", handleTextQuery);

export default router;
