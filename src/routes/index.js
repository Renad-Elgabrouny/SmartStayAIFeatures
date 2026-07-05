import { Router } from "express";
import restaurantRecommendationRoute from "../modules/restaurants/restaurantRecommendationRoute.js";

const router = Router();

router.use("/", restaurantRecommendationRoute);

export default router;
