import { check } from "express-validator";
import User from "@/models/user.model.js";

export const createSignupValidator = [
  check("firstName")
    .not()
    .isEmpty()
    .withMessage("First name cannot be empty.")
    .custom((value) => {
      const result = /^[a-zA-Z ]+$/.test(value);
      if (!result) throw new Error("Invalid first name.");
      return true;
    }),
  check("lastName")
    .not()
    .isEmpty()
    .withMessage("Last name cannot be empty.")
    .custom((value) => {
      const result = /^[a-zA-Z ]+$/.test(value);
      if (!result) throw new Error("Invalid last name.");
      return true;
    }),
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required.")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user && user.accountVerify) {
        throw new Error("Email is already in use.");
      } else if (user && user.accountVerify === false) {
        throw new Error(
          "Email recently signed up. Please wait 10 minutes before signing up again or check your email to activate your account."
        );
      }
    }),
  check("password")
    .not()
    .isEmpty()
    .withMessage("Password is required.")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })
    .withMessage("Please follow the convention.")
    .custom((value) => {
      if (value.trim() !== value) {
        throw new Error("Password can not be start or end with space.");
      }
      return true;
    }),
];
