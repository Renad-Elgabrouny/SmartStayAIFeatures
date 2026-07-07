import { handleMessage } from "./chatbot.service.js";

export async function postMessage(req, res) {
  try {
    const { userId, message, userProfile } = req.body;
    const authToken = req.headers.authorization;

    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }

    const reply = await handleMessage({ userId, message, userProfile, authToken });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ error: err.message || "Something went wrong, please try again." });
  }
}
