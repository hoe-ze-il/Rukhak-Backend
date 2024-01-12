import { check } from "express-validator";

export const createAddressValidator = [
  check("receiverName")
    .not()
    .isEmpty()
    .withMessage("Receiver name can not be empty.")
    .custom((value) => {
      const result = /^[a-zA-Z ]+$/.test(value);
      if (!result) throw new Error("Invalid name.");
      return true;
    }),
  check("phoneNumber")
    .not()
    .isEmpty()
    .withMessage("Phone number is required for our deliver to contact.")
    .custom((value) => {
      const result = /^[0-9\s\-()]{8,}$/.test(value);
      if (!result) {
        throw new Error("Invalid phone number.");
      }
      return true;
    }),
];
