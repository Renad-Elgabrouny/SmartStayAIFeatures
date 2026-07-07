import express from "express";
import { postMessage } from "../modules/chatbot/chatbot.controller.js";

const router = express.Router();

// POST /api/chatbot/message
// body: { userId: string, message: string, userProfile?: object }
router.post("/message", postMessage);

export default router;