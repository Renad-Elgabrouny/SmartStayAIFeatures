/**
 * Restaurant model
 * Defines the structure of a restaurant object used throughout the app
 */

class Restaurant {
  constructor({ name, category, address, distance_m, latitude, longitude, image }) {
    this.name = name;
    this.category = category;
    this.address = address;
    this.distance_m = distance_m;
    this.latitude = latitude;
    this.longitude = longitude;
    this.image = image;
  }
}

class RestaurantRecommendation {
  constructor({ name, reason, distance_m, address, category, latitude, longitude, image }) {
    this.name = name;
    this.reason = reason;
    this.distance_m = distance_m;
    this.address = address;
    this.category = category;
    this.latitude = latitude;
    this.longitude = longitude;
    this.image = image;
  }
}

module.exports = { Restaurant, RestaurantRecommendation };