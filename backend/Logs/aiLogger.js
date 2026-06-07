// logs/aiLogger.js
const fs = require('fs');
const path = require('path');

// Vì file này nằm trong thư mục logs, file log sẽ được ghi ngay cạnh nó
const logFilePath = path.join(__dirname, 'ai.log');

// Hàm tạo timestamp
const getTimestamp = () => new Date().toISOString();

// Ghi log bất đồng bộ
const writeLog = (level, message, data = null) => {
  const timestamp = getTimestamp();
  let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    let dataStr;
    if (data instanceof Error) {
      dataStr = data.stack || data.message;
    } else if (typeof data === 'object') {
      dataStr = JSON.stringify(data, null, 2);
    } else {
      dataStr = String(data);
    }
    logEntry += `\n${dataStr}`;
  }
  logEntry += '\n----------------------------------------\n';
  
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error('Lỗi ghi log:', err);
  });
};

// Các hàm tiện ích
const logRequest = (model, requestId, prompt, temperature) => {
  writeLog('INFO', `REQUEST | Model: ${model} | RequestId: ${requestId} | Temp: ${temperature}`, { promptPreview: prompt.substring(0, 200) });
};

const logResponse = (model, requestId, responseText, durationMs) => {
  writeLog('INFO', `RESPONSE | Model: ${model} | RequestId: ${requestId} | Duration: ${durationMs}ms`, { responsePreview: responseText.substring(0, 200) });
};

const logError = (model, requestId, error, context = '') => {
  writeLog('ERROR', `ERROR | Model: ${model} | RequestId: ${requestId} | ${context}`, error);
};

const logTimeout = (model, requestId, timeoutMs) => {
  writeLog('WARN', `TIMEOUT | Model: ${model} | RequestId: ${requestId} | Timeout: ${timeoutMs}ms`, `Request exceeded ${timeoutMs}ms without response`);
};

const logRateLimit = (model, requestId, retryAfter, error) => {
  writeLog('WARN', `RATE_LIMIT | Model: ${model} | RequestId: ${requestId} | RetryAfter: ${retryAfter || 'unknown'}s`, error);
};

const logTokenUsage = (model, requestId, promptTokens, completionTokens, totalTokens) => {
  writeLog('INFO', `TOKEN_USAGE | Model: ${model} | RequestId: ${requestId} | Prompt: ${promptTokens} | Completion: ${completionTokens} | Total: ${totalTokens}`);
};

const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
};

module.exports = {
  logRequest,
  logResponse,
  logError,
  logTimeout,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
};