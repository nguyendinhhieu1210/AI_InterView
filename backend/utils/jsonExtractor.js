/**
 * repairJson
 *
 * Sửa JSON bị lỗi do AI trả về string values không có dấu ngoặc kép
 * và/hoặc thiếu dấu phẩy giữa các field.
 *
 * Ví dụ AI trả về (lỗi kép):
 *   "feedback": Correct, the answer is good.    ← không có "  và  không có ,
 *   "modelAnswer": The loop runs until empty.
 *
 * Sau repair:
 *   "feedback": "Correct, the answer is good.",
 *   "modelAnswer": "The loop runs until empty."
 */
function repairJson(raw) {
  if (!raw || typeof raw !== 'string') return raw;

  // Nếu đã parse được thì trả ngay, không cần repair
  try { JSON.parse(raw); return raw; } catch (_) {}

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return raw;

  // Parse từng dòng để tái tạo lại JSON đúng chuẩn
  const inner = raw.slice(start + 1, end);
  const lines = inner.split('\n');
  const fields = [];
  let currentKey = null;
  let currentValueLines = [];

  // Match: "key": rest_of_line
  const KEY_VALUE_RE = /^\s*"([\w]+)"\s*:\s*([\s\S]*)$/;

  function flushField() {
    if (currentKey === null) return;

    // Gộp multi-line value, bỏ dấu , thừa ở cuối
    let valueRaw = currentValueLines.join(' ').trim().replace(/,\s*$/, '').trim();
    let value;

    if (valueRaw.startsWith('"') && valueRaw.endsWith('"')) {
      // Đã có dấu ngoặc kép hợp lệ
      value = valueRaw;
    } else if (/^(true|false|null|-?\d+(\.\d+)?)$/.test(valueRaw)) {
      // boolean / null / number
      value = valueRaw;
    } else if (
      (valueRaw.startsWith('[') && valueRaw.endsWith(']')) ||
      (valueRaw.startsWith('{') && valueRaw.endsWith('}'))
    ) {
      // array hoặc nested object
      value = valueRaw;
    } else {
      // String không có dấu ngoặc → bọc lại + escape
      const escaped = valueRaw
        .replace(/\\/g, '\\\\')   // escape backslash trước
        .replace(/"/g, '\\"');    // escape dấu " trong value
      value = '"' + escaped + '"';
    }

    fields.push('"' + currentKey + '": ' + value);
    currentKey = null;
    currentValueLines = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    const match = trimmed.match(KEY_VALUE_RE);
    if (match) {
      flushField(); // lưu field trước đó
      currentKey = match[1];
      const v = match[2].trim().replace(/,\s*$/, '').trim();
      currentValueLines = v ? [v] : [];
    } else {
      // Dòng tiếp theo thuộc value của field hiện tại (multi-line value)
      if (currentKey !== null) {
        currentValueLines.push(trimmed.replace(/,\s*$/, ''));
      }
    }
  }
  flushField();

  return '{' + fields.join(',\n  ') + '}';
}

/**
 * extractJson
 *
 * Parse JSON từ AI response qua 6 pass, có repair tự động.
 * Xử lý được: JSON sạch, có markdown fence, thiếu dấu ngoặc kép,
 * thiếu dấu phẩy, có text thừa bên ngoài JSON.
 */
function extractJson(content) {
  if (!content || typeof content !== 'string') {
    console.error('JSON EXTRACT ERROR: Content is empty or not a string');
    return null;
  }

  // ── Pass 1: Parse thẳng ──────────────────────────────────────────────────
  try { return JSON.parse(content.trim()); } catch (_) {}

  // ── Pass 2: Bỏ markdown fence rồi parse ─────────────────────────────────
  const cleaned = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  try { return JSON.parse(cleaned); } catch (_) {}

  // ── Pass 3: Repair (thiếu dấu " hoặc thiếu ,) rồi parse ─────────────────
  try { return JSON.parse(repairJson(cleaned)); } catch (_) {}

  // ── Pass 4: Greedy match { } lớn nhất + repair ───────────────────────────
  const greedyMatch = cleaned.match(/\{[\s\S]*\}/);
  if (greedyMatch) {
    try { return JSON.parse(greedyMatch[0]); } catch (_) {}
    try { return JSON.parse(repairJson(greedyMatch[0])); } catch (_) {}
  }

  // ── Pass 5: Từng object nhỏ non-greedy + repair ──────────────────────────
  const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) || [];
  for (let i = objectMatches.length - 1; i >= 0; i--) {
    try { return JSON.parse(objectMatches[i]); } catch (_) {}
    try { return JSON.parse(repairJson(objectMatches[i])); } catch (_) {}
  }

  // ── Pass 6: Array JSON ───────────────────────────────────────────────────
  const arrayMatches = cleaned.match(/\[[\s\S]*?\]/g) || [];
  for (let i = arrayMatches.length - 1; i >= 0; i--) {
    try { return JSON.parse(arrayMatches[i]); } catch (_) {}
  }

  console.error('JSON EXTRACT ERROR: Không tìm thấy JSON hợp lệ');
  console.error('RAW CONTENT:\n', content);
  return null;
}

module.exports = {
  extractJson,
  repairJson,
};