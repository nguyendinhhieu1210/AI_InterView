const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function extractTextFromPDF(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File không tồn tại: ${absolutePath}`);
    }

    const dataBuffer = fs.readFileSync(absolutePath);
    const data = await pdfParse(dataBuffer);

    let text = data.text;

    // ================== FIX TIẾNG VIỆT ==================
    // Ghép dấu với chữ (thường gặp ở PDF tiếng Việt)
    text = text.replace(/(\p{L})\s+([\u0300-\u036f])/gu, '$1$2');
    text = text.replace(/([\u0300-\u036f])\s+(\p{L})/gu, '$1$2');

    // Thay thế khoảng trắng thừa
    text = text.replace(/\s+/g, ' ');

    // Tách từ in hoa (ví dụ: FullStack → Full Stack)
    text = text.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Xóa bullet points
    text = text.replace(/[•●▪►➢―–\-•]/g, ' ');

    text = text.trim();

    console.log(`✅ PDF extracted successfully | Length: ${text.length} chars`);
    return text;

  } catch (err) {
    console.error('❌ PDF Extraction Error:', err.message);
    throw new Error('Không thể đọc file PDF. Hãy thử convert sang text hoặc dùng file PDF khác.');
  }
}

module.exports = { extractTextFromPDF };