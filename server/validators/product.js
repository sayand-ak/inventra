import { body, param } from "express-validator";
import mongoose from "mongoose";

const allowedUnits = [
  "kg", "g", "mg",
  "litre", "ml",
  "tablet", "box",
  "bottle", "piece"
];

export const validateAddProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required"),

  body("brandId")
    .notEmpty()
    .withMessage("BrandId is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid brandId"),

  body("categoryId")
    .notEmpty()
    .withMessage("CategoryId is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid categoryId"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),

  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isObject()
    .withMessage("Quantity must be an object"),

  body("quantity.value")
    .notEmpty()
    .withMessage("Quantity value is required")
    .isFloat({ gt: 0 })
    .withMessage("Quantity value must be greater than 0"),

  body("quantity.unit")
    .notEmpty()
    .withMessage("Quantity unit is required")
    .isIn(allowedUnits)
    .withMessage("Invalid quantity unit"),

  body("count")
    .notEmpty()
    .withMessage("Count is required")
    .isInt({ gt: 0 })
    .withMessage("Count must be greater than 0"),

  body("openingStock")
    .notEmpty()
    .withMessage("Opening stock is required")
    .isInt({ min: 0 })
    .withMessage("Opening stock cannot be negative"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];

export const validateUpdateProduct = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid product ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Product name cannot be empty"),

  body("brandId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid brandId"),

  body("categoryId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid categoryId"),

  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be greater than 0"),

  body("quantity")
    .optional()
    .isObject()
    .withMessage("Quantity must be an object"),

  body("quantity.value")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Quantity value must be greater than 0"),

  body("quantity.unit")
    .optional()
    .isIn(allowedUnits)
    .withMessage("Invalid quantity unit"),

  body("count")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Count must be greater than 0"),

  body("openingStock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Opening stock cannot be negative"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];