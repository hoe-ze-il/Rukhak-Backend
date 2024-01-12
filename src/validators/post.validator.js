import { check } from "express-validator";

const createPostValidator = [
  check("author")
    .not()
    .isEmpty()
    .withMessage("The Post must be have an author"),
  check("title").not().isEmpty().withMessage("The Post Title cannot be empty"),
  check("content")
    .not()
    .isEmail()
    .isLength({ min: 10 })
    .withMessage(
      "The Post Description must be not empty and longer than 10 character long"
    ),
];

export default createPostValidator;
