import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import { errorHandler } from "./middlewares/error.middleware.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import routes from "./routes/index.js";

dotenv.config();

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI).catch((err) => {
    console.error("Mongo connection error:", err.message);
  });
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(cookieParser());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Chatbot and restaurant recommendation service is running" });
});



app.use("/api/chatbot", chatbotRoutes);
app.use("/api/restaurants", routes);

app.use(errorHandler);

export default app;
