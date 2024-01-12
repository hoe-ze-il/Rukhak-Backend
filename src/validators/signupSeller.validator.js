import { check } from "express-validator";
import User from "@/models/user.model.js";

export const createSignupSellerValidator = [
  check("storeName")
    .not()
    .isEmpty()
    .withMessage("Store's name cannot be empty.")
    .trim(),
  check("phoneNumber")
    .not()
    .isEmpty()
    .withMessage("Phone number is requred.")
    .trim()
    .custom(async (value) => {
      const user = await User.findOne({ phoneNumber: value });
      if (user) {
        throw new Error("Phone number is already existed.");
      }
      return true;
    }),
  check("dateOfBirth").not().isEmpty().withMessage("Birthday is required."),
  check("storeLocation").custom((value) => {
    if (!value.coordinates) {
      throw new Error("Please select your store location");
    } else if (!value.address) {
      throw new Error("Store address is required");
    }
    return true;
  }),
];
