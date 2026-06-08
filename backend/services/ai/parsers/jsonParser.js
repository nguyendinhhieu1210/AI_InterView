// safeParseJson và repairTruncatedJson

async function safeParseJson(str) {
  if (!str || typeof str !== 'string') return null;
  // Loại bỏ markdown code block
  let cleaned = str.replace(/```json\s*|\s*```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Thử repair nếu là truncate
    const repaired = repairTruncatedJson(cleaned);
    if (repaired) {
      try {
        return JSON.parse(repaired);
      } catch (e2) {}
    }
    return null;
  }
}

function repairTruncatedJson(jsonString) {
  // Nếu thiếu dấu đóng ngoặc ở cuối
  let repaired = jsonString.trim();
  if (!repaired.endsWith('}') && !repaired.endsWith(']')) {
    // Đếm số dấu { và } còn thiếu
    let openBraces = (repaired.match(/{/g) || []).length;
    let closeBraces = (repaired.match(/}/g) || []).length;
    let missingBraces = openBraces - closeBraces;
    if (missingBraces > 0) {
      repaired += '}'.repeat(missingBraces);
    }
    // Thêm dấu đóng ngoặc vuông nếu cần
    let openBrackets = (repaired.match(/\[/g) || []).length;
    let closeBrackets = (repaired.match(/\]/g) || []).length;
    let missingBrackets = openBrackets - closeBrackets;
    if (missingBrackets > 0) {
      repaired += ']'.repeat(missingBrackets);
    }
    // Nếu cắt giữa string, thêm dấu " và đóng ngoặc
    if ((repaired.match(/"/g) || []).length % 2 !== 0) {
      repaired += '"';
    }
  }
  return repaired;
}

module.exports = { safeParseJson, repairTruncatedJson };