const { ChatGroq } = require("@langchain/groq");

class GroqService {

  constructor(
    apiKey,
    modelName = "llama-3.3-70b-versatile",
    temperature = 0.2
  ) {

    this.model = new ChatGroq({
      apiKey,
      model: modelName,
      temperature,
      maxTokens: 2000,
    });

    this.maxRetries = 3;

    this.delay = (ms) =>
      new Promise(resolve =>
        setTimeout(resolve, ms)
      );
  }

  async invokeWithRetry(
    messages,
    retryCount = 1
  ) {

    try {

      const response =
        await this.model.invoke(messages);

      return response.content;

    } catch (err) {

      const isRateLimit =
        err.status === 429 ||
        err.message?.includes("rate limit");

      if (
        isRateLimit &&
        retryCount <= this.maxRetries
      ) {

        const waitTime = Math.min(
          60 * 1000,
          Math.pow(2, retryCount) * 1000
        );

        console.warn(
          `[Groq] Rate limit, retry in ${waitTime / 1000}s`
        );

        await this.delay(waitTime);

        return this.invokeWithRetry(
          messages,
          retryCount + 1
        );
      }

      throw err;
    }
  }
}

module.exports = {
  GroqService,
};