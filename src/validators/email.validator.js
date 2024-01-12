import User from "@/models/user.model.js";
import { check } from "express-validator";

export const createEmailValidator = [
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Email is invalid.")
    .toLowerCase()
    .trim()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) throw new Error("This email already in use.");
      return true;
    }),
];
