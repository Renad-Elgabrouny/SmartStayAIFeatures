/**
 * Quick test script - run with: npm run test:restaurants
 * Tests the TomTom -> Groq pipeline without starting the server or database.
 */

import { getRestaurantRecommendations } from "../modules/restaurants/restaurantRecommendationService.js";

async function test() {
  const lat = 30.0444;
  const lon = 31.2357;

  console.log(`\nFetching restaurants near (${lat}, ${lon})...\n`);

  try {
    const data = await getRestaurantRecommendations({
      latitude: lat,
      longitude: lon,
      preferences: "I enjoy local Egyptian food",
    });

    console.log(`Found ${data.totalNearbyFound} restaurants from TomTom`);
    console.log("\nTop recommendations:\n");

    data.recommendations.forEach((recommendation, index) => {
      console.log(`${index + 1}. ${recommendation.name} (${recommendation.distance_m}m away)`);
      console.log(`   ${recommendation.address}`);
      console.log(`   ${recommendation.reason}\n`);
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  }
}

test();
