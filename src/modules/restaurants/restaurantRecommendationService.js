import { DEFAULT_SEARCH_RADIUS_M } from "../../constants/restaurantConstants.js";
import { AppError } from "../../utils/AppError.js";
import { rankRestaurantsWithAI } from "./restaurantRecommendationAgentService.js";
import { searchNearbyRestaurants } from "./tomtomRestaurantSearchService.js";

export const getRestaurantRecommendations = async ({
  latitude,
  longitude,
  preferences = "",
  radius = DEFAULT_SEARCH_RADIUS_M,
  category,
  categoryCode,
}) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    throw new AppError("latitude and longitude are required", 400);
  }

  const resolvedCategory = categoryCode || category || "restaurant";

  const restaurants = await searchNearbyRestaurants(
    lat,
    lon,
    radius,
    undefined,
    resolvedCategory,
  );
  const recommendations = await rankRestaurantsWithAI(restaurants, preferences);

  return {
    location: { latitude: lat, longitude: lon },
    totalNearbyFound: restaurants.length,
    category: resolvedCategory,
    recommendations,
  };
};
