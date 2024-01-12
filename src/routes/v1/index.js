import express from "express";
import reviewRoute from "./review.route.js";
import sellerRoute from "./seller.route.js";
import authRoute from "./auth.route.js";
import productRoute from "./product.route.js";
import notificationRoute from "./notification.route.js";
import postRoute from "./post.route.js";
import commentRoute from "./comment.route.js";
import addressRoute from "./address.route.js";
import orderRoute from "./order.route.js";
import paymentRoute from "./payment.route.js";
import botRoute from "./bot.route.js";
import userRoute from "./user.route.js";
import categoryRoute from "./category.route.js";
import adminRoute from "./admin/index.js";

const router = express.Router();

const defaultRoutes = [
  {
    path: "/reviews",
    route: reviewRoute,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/seller",
    route: sellerRoute,
  },
  {
    path: "/community",
    route: postRoute,
  },
  {
    path: "/comments",
    route: commentRoute,
  },
  {
    path: "/products",
    route: productRoute,
  },
  {
    path: "/notification",
    route: notificationRoute,
  },
  {
    path: "/addresses",
    route: addressRoute,
  },
  {
    path: "/payment",
    route: paymentRoute,
  },
  {
    path: "/bot",
    route: botRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/orders",
    route: orderRoute,
  },
  {
    path: "/admin",
    route: adminRoute,
  },
  {
    path: "/category",
    route: categoryRoute,
  },
];

defaultRoutes.forEach((each) => {
  router.use(each.path, each.route);
});

export default router;
