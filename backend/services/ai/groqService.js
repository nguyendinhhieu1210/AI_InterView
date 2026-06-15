// services/ai/groqService.js

const { ChatGroq } = require("@langchain/groq");

const MODEL_MAX_TOKENS = {
  "llama-3.3-70b-versatile": 4096,
  "llama-3.1-8b-instant": 1000,
};

const DEFAULT_MAX_TOKENS = 4096;

class GroqService {
  constructor(
    apiKey,
    modelName = "llama-3.3-70b-versatile",
    temperature = 0.2,
    maxTokens = null,
  ) {
    const resolvedMaxTokens =
      maxTokens ?? MODEL_MAX_TOKENS[modelName] ?? DEFAULT_MAX_TOKENS;

    this.modelName = modelName;

    this.model = new ChatGroq({
      apiKey,
      model: modelName,
      temperature,
      maxTokens: resolvedMaxTokens,
    });

    this.maxRetries = 2;
    this.lastUsage = null;
    this.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  }

  async invokeWithRetry(messages, retryCount = 1) {
    try {
      const response = await this.model.invoke(messages);

      this.lastUsage =
        response.usage_metadata ||
        response.response_metadata?.tokenUsage ||
        response.response_metadata?.token_usage ||
        null;

      // GIỮ TƯƠNG THÍCH TOÀN BỘ CODE CŨ
      return response.content;
    } catch (err) {
      const isRateLimit =
        err.status === 429 || err.message?.includes("rate limit");

      if (isRateLimit && retryCount <= this.maxRetries) {
        const waitTime = Math.min(10000, Math.pow(2, retryCount) * 1000);

        console.warn(
          `[Groq:${this.modelName}] Rate limit hit, retry ${retryCount}/${this.maxRetries} in ${waitTime / 1000}s`,
        );

        await this.delay(waitTime);

        return this.invokeWithRetry(messages, retryCount + 1);
      }

      throw err;
    }
  }

  // Dùng khi cần usage metadata
  async invokeWithRetryV2(messages, retryCount = 1) {
    try {
      const response = await this.model.invoke(messages);

      const usage =
        response.usage_metadata ||
        response.response_metadata?.tokenUsage ||
        response.response_metadata?.token_usage ||
        null;

      this.lastUsage = usage;

      return {
        content: response.content,
        usage,
      };
    } catch (err) {
      const isRateLimit =
        err.status === 429 || err.message?.includes("rate limit");

      if (isRateLimit && retryCount <= this.maxRetries) {
        const waitTime = Math.min(10000, Math.pow(2, retryCount) * 1000);

        console.warn(
          `[Groq:${this.modelName}] Rate limit hit, retry ${retryCount}/${this.maxRetries} in ${waitTime / 1000}s`,
        );

        await this.delay(waitTime);

        return this.invokeWithRetryV2(messages, retryCount + 1);
      }

      throw err;
    }
  }

  getLastUsage() {
    return this.lastUsage;
  }
}

module.exports = { GroqService };
