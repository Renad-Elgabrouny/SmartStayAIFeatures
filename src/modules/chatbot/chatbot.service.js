import { getGeminiClient, FunctionCallingConfigMode } from "../../config/gemini.js";
import { GEMINI_MODEL, MAX_RAW_TURNS, SUMMARIZE_AFTER, BASE_SYSTEM_PROMPT } from "../../constants/chatbot.constants.js";
import ChatConversation from "./chatbot.model.js";
import { searchPropertiesTool, executeSearch, toGeminiToolDeclarations } from "./property-search.tool.js";

const ALL_TOOLS = [searchPropertiesTool];
const GEMINI_TOOLS = toGeminiToolDeclarations(ALL_TOOLS);

const TOOL_EXECUTORS = {
  search_properties: (args, ctx) => executeSearch(args, ctx.authToken),
};

async function getOrCreateConversation(userId) {
  let convo = await ChatConversation.findOne({ userId });
  if (!convo) convo = await ChatConversation.create({ userId, messages: [], summary: "" });
  return convo;
}

async function summarizeIfNeeded(convo) {
  if (convo.messages.length <= SUMMARIZE_AFTER) return;

  const older = convo.messages.slice(0, convo.messages.length - MAX_RAW_TURNS);
  const recent = convo.messages.slice(convo.messages.length - MAX_RAW_TURNS);

  const ai = getGeminiClient();
  const summaryResponse = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      ...older,
      {
        role: "user",
        parts: [{ text: "Summarize the conversation above in 3-4 sentences. Keep any stated preferences explicit (city, budget, dates, guests, style of place)." }],
      },
    ],
  });

  convo.summary = (convo.summary ? convo.summary + " " : "") + summaryResponse.text;
  convo.messages = recent;
}

async function generateWithTools(ai, contents, userProfile, summary) {
  return ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: BASE_SYSTEM_PROMPT(userProfile, summary),
      tools: GEMINI_TOOLS,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
        },
      },
    },
  });
}

async function generateReply(ai, contents, userProfile, summary) {
  return ai.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction: BASE_SYSTEM_PROMPT(userProfile, summary),
    },
  });
}

export async function handleMessage({ userId, message, userProfile, authToken }) {
  if (!process.env.GEMINI_API_KEY) {
    return "Chatbot is unavailable because GEMINI_API_KEY is not configured.";
  }

  const convo = await getOrCreateConversation(userId);
  const contents = [...convo.messages, { role: "user", parts: [{ text: message }] }];

  let finalText = null;
  const ai = getGeminiClient();

  let response = await generateWithTools(ai, contents, userProfile, convo.summary);
  const call = response.functionCalls?.[0];

  if (!call) {
    finalText = response.text || "I couldn't formulate a reply right now.";
    contents.push({ role: "model", parts: [{ text: finalText }] });
  } else {
    const executor = TOOL_EXECUTORS[call.name];
    console.log(`Chatbot tool invoked: ${call.name}`, {
      userId,
      args: call.args,
      conversationId: convo._id?.toString(),
    });

    const result = executor
      ? await executor(call.args, { userId, authToken })
      : { success: false, error: `Unknown tool: ${call.name}` };

    console.log(`Chatbot tool result: ${call.name}`, {
      success: result.success ?? true,
      error: result.error,
      itemCount: Array.isArray(result.items) ? result.items.length : undefined,
    });

    contents.push({ role: "model", parts: [{ functionCall: call }] });
    contents.push({ role: "user", parts: [{ functionResponse: { name: call.name, response: result } }] });

    response = await generateReply(ai, contents, userProfile, convo.summary);
    finalText = response.text || "I found some options but couldn't describe them right now. Please try again.";
    contents.push({ role: "model", parts: [{ text: finalText }] });
  }

  convo.messages = contents;
  await summarizeIfNeeded(convo);
  await ChatConversation.findOneAndUpdate(
    { _id: convo._id },
    { messages: convo.messages, summary: convo.summary },
    { new: true, upsert: true, runValidators: true }
  );

  return finalText;
}
