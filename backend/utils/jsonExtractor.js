function extractJson(content) {
  if (!content || typeof content !== 'string') {
    console.error('JSON EXTRACT ERROR: Content is empty or not a string');
    return null;
  }

  try {
    // Trường hợp AI trả JSON sạch
    return JSON.parse(content.trim());
  } catch (_) {}

  try {
    // Xóa markdown code fence nếu có
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Thử parse lại sau khi remove markdown
    try {
      return JSON.parse(cleaned);
    } catch (_) {}

    // Tìm tất cả object JSON
    const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) || [];

    for (let i = objectMatches.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(objectMatches[i]);
      } catch (_) {
        // thử object tiếp theo
      }
    }

    // Tìm tất cả array JSON
    const arrayMatches = cleaned.match(/\[[\s\S]*?\]/g) || [];

    for (let i = arrayMatches.length - 1; i >= 0; i--) {
      try {
        return JSON.parse(arrayMatches[i]);
      } catch (_) {
        // thử array tiếp theo
      }
    }

    throw new Error('Không tìm thấy JSON hợp lệ');
  } catch (err) {
    console.error('JSON EXTRACT ERROR:', err.message);
    console.error('RAW CONTENT:\n', content);

    return null;
  }
}

module.exports = {
  extractJson,
};