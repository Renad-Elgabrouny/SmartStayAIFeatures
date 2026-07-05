import * as restaurantRecommendationService from "./restaurantRecommendationService.js";
import { asyncHandler } from "../../middlewares/error.middleware.js";

export const recommendRestaurants = asyncHandler(async (req, res) => {
  const { latitude, longitude, preferences, radius, category, categoryCode } = {
    ...req.body,
    ...req.query,
  };

  const data = await restaurantRecommendationService.getRestaurantRecommendations({
    latitude,
    longitude,
    preferences,
    radius,
    category,
    categoryCode,
  });

  return res.json({
    success: true,
    data,
  });
});
