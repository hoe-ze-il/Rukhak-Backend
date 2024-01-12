import { check } from "express-validator";
export const createPasswordValidator = [
  check("newPassword")
    .not()
    .isEmpty()
    .withMessage("New password is required.")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    })
    .withMessage("Please follow password convention.")
    .custom((value) => {
      if (value.trim() !== value) {
        throw new Error("Password can not be start or end with space.");
      }
      return true;
    }),
];
