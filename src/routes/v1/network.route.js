import express from "express";
import networkController from "@/controllers/network.controller.js";

const route = express.Router({ mergeParams: true });

route.route("/").post(networkController.follow);
route.route("/getAllFollowers").get(networkController.getAllFollowers);
route.route("/getAllFollowing").get(networkController.getAllFollowing);
export default route;
