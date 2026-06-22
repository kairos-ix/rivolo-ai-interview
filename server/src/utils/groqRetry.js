/**
 * Utility to call Groq API with automatic retry on 429 (rate limit) errors.
 * Uses exponential backoff to avoid hammering the API.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds

/**
 * Wraps a Groq API call with retry logic for 429 errors.
 * @param {Function} apiCallFn - An async function that performs the Groq API call.
 * @param {number} [maxRetries=MAX_RETRIES] - Maximum number of retry attempts.
 * @returns {Promise<any>} - The API response.
 */
async function groqRetry(apiCallFn, maxRetries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCallFn();
    } catch (err) {
      lastError = err;

      const status = err?.status || err?.response?.status || err?.statusCode;
      const isRateLimited = status === 429;
      const isServerError = status >= 500 && status < 600;

      if ((isRateLimited || isServerError) && attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `Groq API ${status} error (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }

  throw lastError;
}

module.exports = { groqRetry };
