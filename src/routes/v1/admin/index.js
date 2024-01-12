import express from "express";
import sellerRoute from "./seller.route.js";
import productRoute from "./product.route.js";
import analyticReportsRoute from "./analyticReports.route.js";

const router = express.Router();

const adminRoute = [
  {
    path: "/sellers",
    route: sellerRoute,
  },
  {
    path: "/products",
    route: productRoute,
  },
  {
    path: "/analytics",
    route: analyticReportsRoute,
  },
];

adminRoute.forEach((each) => {
  router.use(each.path, each.route);
});

export default router;
