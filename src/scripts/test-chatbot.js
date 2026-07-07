import dotenv from "dotenv";
import mongoose from "mongoose";
import { handleMessage } from "../modules/chatbot/chatbot.service.js";

dotenv.config();

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const userId = "test-user-1";
  const message = process.argv[2] || "I'm looking for a place in Cairo under $50 a night for 2 guests";

  console.log("You:", message);
  const reply = await handleMessage({ userId, message, userProfile: null, authToken: null });
  console.log("Bot:", reply);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});