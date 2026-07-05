import { Router } from "express";
import { recommendRestaurants } from "./restaurantRecommendationController.js";
import {
  handleValidation,
  restaurantRecommendationValidation,
} from "./restaurantRecommendationValidation.js";

const router = Router();

router.post(
  "/recommend",
  restaurantRecommendationValidation,
  handleValidation,
  recommendRestaurants,
);

export default router;
