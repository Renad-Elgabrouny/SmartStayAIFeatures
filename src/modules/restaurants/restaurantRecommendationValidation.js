import { body, query, validationResult } from "express-validator";

export const restaurantRecommendationValidation = [
  body("latitude")
    .exists({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("latitude must be between -90 and 90"),
  body("longitude")
    .exists({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("longitude must be between -180 and 180"),
  body("preferences")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("preferences must be at most 500 characters"),
  body("radius")
    .optional()
    .isInt({ min: 100, max: 10000 })
    .withMessage("radius must be between 100 and 10000 meters"),
  query("category")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("category must be at most 100 characters"),
];

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  next();
};
