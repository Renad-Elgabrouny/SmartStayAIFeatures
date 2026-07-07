import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let ai = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export const getGeminiClient = () => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  return ai;
};

export default ai;