const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { fixBrokenText } = require('./textUtils');

async function extractTextFromPDF(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`File not found: ${absolutePath}`);
    const dataBuffer = fs.readFileSync(absolutePath);
    const data = await pdfParse(dataBuffer);
    let text = data.text;
    text = fixBrokenText(text);
    text = text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').replace(/[•●▪►➢―–\-•]/g, ' ').trim();
    return text;
  } catch (err) {
    throw new Error('Cannot read PDF. Please try another file.');
  }
}

module.exports = { extractTextFromPDF };