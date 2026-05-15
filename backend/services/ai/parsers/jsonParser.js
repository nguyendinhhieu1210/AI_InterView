const { JsonOutputParser } = require("@langchain/core/output_parsers");

const jsonParser = new JsonOutputParser();

// Hàm dự phòng trích xuất JSON từ string khi parser chính thất bại
function extractJSON(str) {
  let start = str.indexOf('{');
  if (start === -1) return null;
  let braceCount = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') braceCount++;
    if (str[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        let jsonStr = str.substring(start, i + 1);
        try {
          JSON.parse(jsonStr);
          return jsonStr;
        } catch (e) {
          start = str.indexOf('{', i + 1);
          if (start === -1) return null;
          i = start - 1;
          braceCount = 0;
        }
      }
    }
  }
  return null;
}

async function safeParseJson(raw) {
  try {
    return await jsonParser.parse(raw);
  } catch (e) {
    const extracted = extractJSON(raw);
    if (extracted) return JSON.parse(extracted);
    throw new Error("Cannot parse JSON from AI response");
  }
}

module.exports = { safeParseJson, extractJSON };