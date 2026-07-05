import { AppError } from "../../utils/AppError.js";
import {
  DEFAULT_SEARCH_LIMIT,
  DEFAULT_SEARCH_RADIUS_M,
  TOMTOM_RESTAURANT_CATEGORY,
} from "../../constants/restaurantConstants.js";

const TOMTOM_NEARBY_URL = "https://api.tomtom.com/search/2/nearbySearch/.json";
const TOMTOM_SEARCH_URL = "https://api.tomtom.com/search/2/search/.json";

const getTomTomApiKey = () => {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    throw new AppError("TomTom API key is not configured", 503);
  }
  return apiKey;
};

const normalizeCategoryValue = (value) => String(value || "").trim().toLowerCase();

const isNumericCategoryCode = (value) => /^\d+$/.test(value);

export const resolveCategoryCode = (value) => {
  if (!value) {
    return TOMTOM_RESTAURANT_CATEGORY;
  }

  const normalized = normalizeCategoryValue(value);
  return isNumericCategoryCode(normalized) ? normalized : null;
};

export const resolveSearchQuery = (value) => {
  if (!value) {
    return "restaurant";
  }

  const normalized = normalizeCategoryValue(value);
  return isNumericCategoryCode(normalized) ? null : normalized;
};

const pickImageUrl = (result) => {
  const candidates = [
    result?.poi?.photo?.url,
    result?.poi?.photo?.href,
    result?.poi?.photo?.src,
    result?.poi?.images?.[0]?.url,
    result?.poi?.images?.[0]?.src,
    result?.poi?.images?.[0]?.href,
    result?.photo?.url,
    result?.photo?.href,
    result?.photo?.src,
    result?.images?.[0]?.url,
    result?.images?.[0]?.src,
    result?.images?.[0]?.href,
  ];

  return candidates.find(Boolean) || null;
};

export const searchNearbyRestaurants = async (
  lat,
  lon,
  radius = DEFAULT_SEARCH_RADIUS_M,
  limit = DEFAULT_SEARCH_LIMIT,
  categoryValue = TOMTOM_RESTAURANT_CATEGORY,
) => {
  const normalizedCategory = normalizeCategoryValue(categoryValue);
  const categoryCode = resolveCategoryCode(normalizedCategory);
  const searchQuery = resolveSearchQuery(normalizedCategory);
  const url = new URL(searchQuery ? TOMTOM_SEARCH_URL : TOMTOM_NEARBY_URL);

  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("key", getTomTomApiKey());

  if (searchQuery) {
    url.searchParams.set("query", searchQuery);
  } else {
    url.searchParams.set("categorySet", categoryCode || TOMTOM_RESTAURANT_CATEGORY);
  }

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error("[TomTom Search] Network error:", error.message);
    throw new AppError("Unable to reach TomTom search service", 503);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[TomTom Search]", response.status, errorBody);
    throw new AppError(
      "Restaurant search is temporarily unavailable",
      response.status >= 500 ? 503 : 502,
    );
  }

  const data = await response.json();
  const results = data?.results || [];

  if (!results.length) {
    throw new AppError("No results found near this location", 404);
  }

  return results.map((result) => ({
    name: result.poi?.name || "Unknown",
    category: result.poi?.categories?.[0] || "Restaurant",
    address: result.address?.freeformAddress || "Address not available",
    distance_m: Math.round(result.dist || 0),
    latitude: result.position?.lat ?? null,
    longitude: result.position?.lon ?? null,
    image: pickImageUrl(result),
  }));
};
