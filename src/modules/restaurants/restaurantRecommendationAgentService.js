import { createChatCompletion } from "../../config/openai.js";
import { AppError } from "../../utils/AppError.js";
import { MAX_RECOMMENDATIONS } from "../../constants/restaurantConstants.js";

const normalizeName = (name) => String(name || "").trim().toLowerCase();

const parseJsonObject = (value) => {
  try {
    const clean = String(value || "")
      .replace(/```json|```/g, "")
      .trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
};

const buildPrompt = (restaurants, preferences = "") => {
  const restaurantList = JSON.stringify(restaurants, null, 2);

  return `You are a helpful local dining assistant. A tourist is staying at a hotel and wants restaurant recommendations nearby.

Here are the available restaurants (with distance in meters from their hotel):
${restaurantList}

User preferences: ${preferences || "none specified"}

Your task:
- Pick the TOP ${MAX_RECOMMENDATIONS} restaurants from the list above only
- Consider closest distance, cuisine variety, and user preferences
- Write a short, friendly reason for each pick (1-2 sentences)
- Use restaurant names exactly as given in the list

Respond with valid JSON only in this shape:
{
  "recommendations": [
    {
      "name": "restaurant name exactly as given",
      "reason": "short friendly reason"
    }
  ]
}`;
};

const fillWithNearbyFallback = (validated, restaurants) => {
  const used = new Set(validated.map((item) => normalizeName(item.name)));
  const sorted = [...restaurants].sort((a, b) => a.distance_m - b.distance_m);

  for (const restaurant of sorted) {
    if (validated.length >= MAX_RECOMMENDATIONS) {
      break;
    }

    if (used.has(normalizeName(restaurant.name))) {
      continue;
    }

    validated.push({
      name: restaurant.name,
      reason: `Close to your location (${restaurant.distance_m}m away).`,
      distance_m: restaurant.distance_m,
      address: restaurant.address,
      category: restaurant.category,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      image: restaurant.image,
    });
    used.add(normalizeName(restaurant.name));
  }

  return validated;
};

const validateRecommendations = (parsed, restaurants) => {
  const byName = new Map(restaurants.map((restaurant) => [normalizeName(restaurant.name), restaurant]));
  const validated = [];

  for (const pick of parsed.recommendations.slice(0, MAX_RECOMMENDATIONS)) {
    const match = byName.get(normalizeName(pick.name));
    if (!match) {
      continue;
    }

    validated.push({
      name: match.name,
      reason: pick.reason || "A great nearby option worth trying.",
      distance_m: match.distance_m,
      address: match.address,
      category: match.category,
      latitude: match.latitude,
      longitude: match.longitude,
      image: match.image,
    });
  }

  return fillWithNearbyFallback(validated, restaurants);
};

export const rankRestaurantsWithAI = async (restaurants, preferences = "") => {
  const prompt = buildPrompt(restaurants, preferences);

  const rawText = await createChatCompletion({
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    responseFormat: { type: "json_object" },
  });

  const parsed = parseJsonObject(rawText);
  if (!parsed?.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new AppError("Could not generate restaurant recommendations", 503);
  }

  return validateRecommendations(parsed, restaurants);
};
