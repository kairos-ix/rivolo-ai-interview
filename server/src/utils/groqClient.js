const Groq = require("groq-sdk");
const { groqRetry } = require("./groqRetry.js");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Known decommissioned or inaccessible models on Groq that should never be attempted
const DECOMMISSIONED_OR_INVALID_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.3-70b-specdec",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
]);

const DEFAULT_MODEL = "qwen/qwen3.8-27b";
const FALLBACK_MODELS = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];

/**
 * Resolves a safe, active Groq model. Filters out any obsolete models
 * that might linger in environment variables.
 */
function getGroqModel() {
  const envModel = process.env.GROQ_MODEL?.trim();
  if (envModel && !DECOMMISSIONED_OR_INVALID_MODELS.has(envModel)) {
    return envModel;
  }
  return DEFAULT_MODEL;
}

/**
 * Robust JSON parser that strips markdown code fences and extracts valid JSON objects or arrays.
 * @param {string} rawText
 * @returns {any}
 */
function parseJsonResponse(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    // Attempt extracting between outermost curly braces
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (innerErr) {
        // continue
      }
    }

    // Attempt extracting between outermost square brackets
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(text.substring(firstBracket, lastBracket + 1));
      } catch (innerErr) {
        // continue
      }
    }

    throw err;
  }
}

/**
 * Executes a Groq chat completion with automatic retry and model fallback.
 * Enforces a sensible max_tokens floor (minimum 600) to ensure responses
 * with reasoning tokens or structured JSON don't get prematurely truncated.
 *
 * @param {object} options - Options to pass to groq.chat.completions.create
 * @returns {Promise<any>}
 */
async function callGroq(options) {
  const primaryModel = options.model || getGroqModel();
  const modelsToTry = [
    primaryModel,
    ...FALLBACK_MODELS,
  ].filter((m, i, arr) => m && arr.indexOf(m) === i && !DECOMMISSIONED_OR_INVALID_MODELS.has(m));

  let lastError;
  for (const model of modelsToTry) {
    try {
      const response = await groqRetry(() =>
        groq.chat.completions.create({
          ...options,
          model,
          max_tokens: Math.max(options.max_tokens || 0, 600),
        })
      );
      return response;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      console.warn(
        `[Groq] Model "${model}" failed with status ${status || err.message}. Trying next fallback model...`
      );
      // If model not found (404) or bad request / decommissioned / json validate failed (400), try fallback
      if (status === 404 || status === 400) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

module.exports = {
  groq,
  getGroqModel,
  parseJsonResponse,
  callGroq,
};
