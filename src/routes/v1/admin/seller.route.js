import express from "express";
import sellerControllerAdmin from "@/controllers/admin/seller.controller.js";
import isAuth from "@/middlewares/authMiddlewares/isAuth.js";
import verifyRoles from "@/middlewares/authMiddlewares/verifyRoles.js";

const router = express.Router();

const ROLE = "admin";

router.use(isAuth);
router.use(verifyRoles(ROLE));

router.route("/").get(sellerControllerAdmin.searchSeller);

router.route("/:sellerId").patch(sellerControllerAdmin.updateSellerStatus);

export default router;
