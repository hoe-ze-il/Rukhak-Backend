import postController from "@/controllers/post.controller.js";
import express from "express";
import networkRoute from "./network.route.js";

const route = express.Router({ mergeParams: true });

route.route("/").get(postController.getPersonalPosts);
route.use("/network", networkRoute);

export default route;
