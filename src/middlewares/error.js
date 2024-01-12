import httpStatus from "http-status";
import APIError from "../utils/APIError.js";

const handler = (err, req, res, next) => {
  const response = {
    status: String(err.status).startsWith("4") ? "fail" : "error",
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack,
  };

  if (process.env.NODE_ENV !== "development") {
    delete response.stack;
  }

  return res.status(err.status).json(response);
};

/**
 * Convert other types of error (ex: db error) into APIerror for consistent response
 */
const converter = (err, req, res, next) => {
  let convertedError = new APIError({
    status: err.status,
    message: err.message,
    stack: err.stack,
  });

  // Express Validator error
  if (err.type == "validation") {
    convertedError.status = httpStatus.BAD_REQUEST;
    convertedError.errors = err.errors;
  }

  // DB error
  if (err.code == 11000) {
    convertedError.status = httpStatus.BAD_REQUEST;
    convertedError.message =
      "Duplicate data: " + err.message.match(/\{([^}]+)\}/)[0];
  } else if (err.name == "CastError") {
    convertedError.status = httpStatus.BAD_REQUEST;
    convertedError.message = `Invalid ${err.path}: ${err.value}.`;
  } else if (err.name == "ValidationError") {
    convertedError.status = httpStatus.BAD_REQUEST;
  }

  // Multer error
  if (["LIMIT_FILE_SIZE", "LIMIT_UNEXPECTED_FILE"].includes(err.code))
    convertedError.status = httpStatus.BAD_REQUEST;

  return handler(convertedError, req, res);
};

/**
 * Handle 404
 */
const notFound = (req, res, next) => {
  const err = new APIError({
    status: httpStatus.NOT_FOUND,
    message: "Not found",
  });
  return handler(err, req, res);
};

export { handler, converter, notFound };
