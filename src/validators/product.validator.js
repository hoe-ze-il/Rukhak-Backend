import { check, query } from "express-validator";

const EXCLUDED_FIELDS = [
  "soldAmount",
  "reviews",
  "reviewCount",
  "averageRating",
];

export const createProductValidator = [
  // Prevent adding on specific fields
  (req, res, next) => {
    EXCLUDED_FIELDS.map((item) => delete req.body[item]);
    if (req.user?.role === "seller") delete req.body["sellerId"];
    next();
  },
  check("title")
    .not()
    .isEmpty()
    .isLength({ min: 3 })
    .withMessage(
      "Product title cannot be empty and must have at least 3 characters long."
    ),

  check("description")
    .not()
    .isEmpty()
    .isLength({ min: 10 })
    .withMessage(
      "Description field cannot be empty and must have at least 10 characters long."
    ),

  check("basePrice")
    .not()
    .isEmpty()
    .isFloat({
      min: 0,
    })
    .withMessage("The product base price must be a positive number."),

  check("availableStock")
    .not()
    .isEmpty()
    .isInt({ min: 1 })
    .withMessage("Available stock must be minimum 1."),

  check("categories")
    .not()
    .isEmpty()
    .withMessage("Categories cannot be empty")
    .escape()
    .customSanitizer((value, { req }) => {
      const categories = value.split(",");

      return (req.body.categories = categories);
    }),
];

export const updateProductValidator = [
  // Prevent update on specific fields
  (req, res, next) => {
    EXCLUDED_FIELDS.map((item) => delete req.body[item]);
    if (req.user?.role === "seller") delete req.body["sellerId"];
    next();
  },
  check("title")
    .optional()
    .not()
    .isEmpty()
    .isLength({ min: 3 })
    .withMessage(
      "Product title cannot be empty and must have at least 3 characters long."
    ),

  check("description")
    .optional()
    .not()
    .isEmpty()
    .isLength({ min: 10 })
    .withMessage(
      "Description field cannot be empty and must have at least 10 characters long."
    ),

  check("basePrice")
    .optional()
    .not()
    .isEmpty()
    .isFloat({
      min: 0,
    })
    .withMessage("The product base price must be a positive number."),

  check("availableStock")
    .optional()
    .not()
    .isEmpty()
    .isInt({ min: 1 })
    .withMessage("Available stock must be minimum 1."),

  check("categories")
    .optional()
    .not()
    .isEmpty()
    .withMessage("Categories cannot be empty")
    .escape()
    .customSanitizer((value, { req }) => {
      const categories = value.split(",");

      return (req.body.categories = categories);
    }),
];

export const sellerProductQueryValidator = [
  // Price filter check
  query("unitPrice")
    .optional()
    .custom((value) => {
      if (
        typeof value !== "object" ||
        !value.hasOwnProperty("gte") ||
        !value.hasOwnProperty("lte")
      ) {
        throw new Error(
          "unitPrice query must be of shape 'unitPrice[gte]=10&unitPrice[lte]=100'"
        );
      }

      return true;
    }),
  query("unitPrice.gte")
    .optional()
    .isInt({ min: 0 })
    .withMessage("unitPrice must be a natural number."),
  query("unitPrice.lte")
    .optional()
    .isInt({ min: 0 })
    .withMessage("unitPrice must be a natural number."),

  // availableStock filter check
  query("availableStock")
    .optional()
    .custom((value) => {
      if (
        typeof value !== "object" ||
        !value.hasOwnProperty("gte") ||
        !value.hasOwnProperty("lte")
      ) {
        throw new Error(
          "availableStock query must be of shape 'quantity[gte]=10&quantity[lte]=100'"
        );
      }

      return true;
    }),
  query("availableStock.gte")
    .optional()
    .isInt()
    .withMessage("Quantity must be an integer."),
  query("availableStock.lte")
    .optional()
    .isInt()
    .withMessage("Quantity must be an integer."),

  // Category filter check
  query("categories")
    .optional()
    .not()
    .isNumeric()
    .withMessage("Categories must be text split by comma.")
    .escape(),

  // Sort
  query("sort")
    .optional()
    .customSanitizer((value, { req }) => {
      const availableFields = value.split(",");

      // field that must not be sorted
      const excludedFields = ["_id", "__v", "media"];
      const sanitizedFields = availableFields.filter(
        (each) => !excludedFields.includes(each.trim())
      );
      return (req.query.sort = sanitizedFields.join(","));
    }),

  // Pagination
  query("limit")
    .optional()
    .isInt({ max: 350 })
    .withMessage("Limit must be between 0 to 350."),

  // Search (query)
  query("q").optional().escape(),
];
