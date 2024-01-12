import { check } from "express-validator";

export const createNameValidator = [
  check("firstName")
    .not()
    .isEmpty()
    .withMessage("First name can not be empty.")
    .custom((value) => {
      const result = /^[a-zA-Z ]+$/.test(value);
      if (!result) throw new Error("Invalid first name.");
      return true;
    }),
  check("lastName")
    .not()
    .isEmpty()
    .withMessage("Last name can not be empty.")
    .custom((value) => {
      const result = /^[a-zA-Z ]+$/.test(value);
      if (!result) throw new Error("Invalid last name.");
      return true;
    }),
];
