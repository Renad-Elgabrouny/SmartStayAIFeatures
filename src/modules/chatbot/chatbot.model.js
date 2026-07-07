import mongoose from "mongoose";

// Stored exactly as Gemini's "contents" format so it can be sent back
// to the model with zero transformation.
const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    parts: { type: Array, required: true },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true, unique: true },
    messages: { type: [messageSchema], default: [] },
    summary: { type: String, default: "" },
  },
  { timestamps: true }
);

const ChatConversation = mongoose.model("ChatConversation", conversationSchema);

export default ChatConversation;