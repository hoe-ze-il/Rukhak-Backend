import express from "express";
import analyticReportsController from "@/controllers/admin/analyticReports.controller.js";

const router = express.Router();

router.route("/").get(analyticReportsController.getActiveUsers);

export default router;
