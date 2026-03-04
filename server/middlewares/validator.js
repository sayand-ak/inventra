import { validationResult } from "express-validator";
import { AppError } from "../utils/CustomError.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return next(new AppError(firstError.msg, 400));
  }

  next();
};