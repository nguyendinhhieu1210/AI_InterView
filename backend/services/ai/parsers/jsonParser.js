const { JsonOutputParser } = require("@langchain/core/output_parsers");

const jsonParser = new JsonOutputParser();

function cleanJsonString(str) {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function extractJSON(str) {
  str = cleanJsonString(str);

  // tìm object
  const objectMatch = str.match(/\{[\s\S]*\}/);

  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) {}
  }

  // tìm array
  const arrayMatch = str.match(/\[[\s\S]*\]/);

  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {}
  }

  return null;
}

async function safeParseJson(raw) {
  try {
    return await jsonParser.parse(raw);
  } catch (e) {
    try {
      const extracted = extractJSON(raw);

      if (extracted) {
        return extracted;
      }

      console.error("RAW AI RESPONSE:\n", raw);

      throw new Error("Cannot parse JSON from AI response");
    } catch (err) {
      console.error("JSON PARSE ERROR:", err.message);
      throw err;
    }
  }
}

module.exports = {
  safeParseJson,
  extractJSON,
};