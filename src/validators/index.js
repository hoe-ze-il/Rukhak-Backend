import { validationResult } from "express-validator";

export const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.type = "validation";
    return next(errors);
  }
  next();
};
