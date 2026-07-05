import { AppError } from "../utils/AppError.js";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_SPEECH_URL = "https://api.groq.com/openai/v1/audio/speech";
const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

const DEFAULT_CHAT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_SPEECH_MODEL = "canopylabs/orpheus-v1-english";
const DEFAULT_SPEECH_VOICE = "troy";
const DEFAULT_TRANSCRIBE_MODEL = "whisper-large-v3";

const getGroqApiKey = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AppError("Groq API key is not configured", 503);
  }
  return apiKey;
};

const parseGroqErrorBody = (errorBody) => {
  try {
    const parsed = JSON.parse(errorBody);
    return parsed.error || parsed;
  } catch {
    return { message: String(errorBody || "") };
  }
};

const throwGroqServiceError = (serviceLabel, response, errorBody, fallbackMessage) => {
  const error = parseGroqErrorBody(errorBody);
  console.error(`[Groq ${serviceLabel}]`, response.status, errorBody);

  if (error.code === "model_terms_required") {
    throw new AppError(
      "Groq TTS requires one-time model terms acceptance. Open the Groq console playground for Orpheus TTS and accept the terms, then retry.",
      503,
    );
  }

  if (error.code === "model_decommissioned") {
    throw new AppError(
      "The configured Groq TTS model is no longer available. Update to canopylabs/orpheus-v1-english or canopylabs/orpheus-arabic-saudi.",
      503,
    );
  }

  throw new AppError(fallbackMessage, 503);
};

export const createChatCompletion = async ({
  messages,
  model = DEFAULT_CHAT_MODEL,
  temperature = 0.6,
  responseFormat,
}) => {
  const body = {
    model,
    messages,
    temperature,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throwGroqServiceError(
      "Chat",
      response,
      errorBody,
      "Language test evaluation is temporarily unavailable",
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError("Invalid response from language evaluation service", 503);
  }

  return content;
};

export const createSpeech = async ({
  text,
  model = DEFAULT_SPEECH_MODEL,
  voice = DEFAULT_SPEECH_VOICE,
  responseFormat = "wav",
}) => {
  const response = await fetch(GROQ_SPEECH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify({
      model,
      input: text,
      voice,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throwGroqServiceError(
      "TTS",
      response,
      errorBody,
      "Question audio generation is temporarily unavailable",
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const transcribeAudio = async ({ audioBuffer, languageCode, mimeType = "audio/webm" }) => {
  const extension = mimeType.includes("mp4") ? "mp4" : mimeType.includes("mpeg") ? "mp3" : "webm";
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType });

  formData.append("file", blob, `recording.${extension}`);
  formData.append("model", DEFAULT_TRANSCRIBE_MODEL);

  if (languageCode) {
    formData.append("language", languageCode);
  }

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throwGroqServiceError(
      "Whisper",
      response,
      errorBody,
      "Speech transcription is temporarily unavailable",
    );
  }

  const data = await response.json();
  const text = String(data.text || "").trim();

  if (!text) {
    throw new AppError("Could not transcribe the spoken answer", 400);
  }

  return text;
};
