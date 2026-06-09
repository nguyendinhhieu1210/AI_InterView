const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'ai.log');
const tokenLogPath = path.join(__dirname, 'token_usage.log');

const getTimestamp = () => new Date().toISOString();

// Ghi log dạng JSON (mỗi dòng 1 object)
const writeJsonLog = (targetFile, logObject) => {
  const logLine = JSON.stringify(logObject) + '\n';
  fs.appendFile(targetFile, logLine, (err) => {
    if (err) console.error('Lỗi ghi log JSON:', err);
  });
};

// ========== LOG CHUNG (ai.log) ==========
const logRequest = (model, requestId, prompt, temperature) => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'REQUEST',
    model,
    requestId,
    temperature,
    promptPreview: prompt.substring(0, 200),
  };
  writeJsonLog(logFilePath, entry);
};

const logResponse = (model, requestId, responseText, durationMs) => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'RESPONSE',
    model,
    requestId,
    durationMs,
    responsePreview: responseText.substring(0, 200),
  };
  writeJsonLog(logFilePath, entry);
};

const logError = (model, requestId, error, context = '') => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'ERROR',
    type: 'ERROR',
    model,
    requestId,
    context,
    error: {
      message: error.message,
      stack: error.stack,
    },
  };
  writeJsonLog(logFilePath, entry);
};

const logTimeout = (model, requestId, timeoutMs) => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'WARN',
    type: 'TIMEOUT',
    model,
    requestId,
    timeoutMs,
    message: `Request exceeded ${timeoutMs}ms without response`,
  };
  writeJsonLog(logFilePath, entry);
};

const logRateLimit = (model, requestId, retryAfter, error) => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'WARN',
    type: 'RATE_LIMIT',
    model,
    requestId,
    retryAfter: retryAfter || 'unknown',
    errorMessage: error?.message,
  };
  writeJsonLog(logFilePath, entry);
};

// ========== LOG TOKEN RIÊNG (token_usage.log) ==========
const logTokenUsage = (model, requestId, inputTokens, outputTokens, totalTokens, feature = 'general') => {
  const entry = {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'TOKEN_USAGE',
    feature,
    model,
    requestId,
    inputTokens,
    outputTokens,
    totalTokens,
  };
  writeJsonLog(tokenLogPath, entry);
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
//nhưng mà thêm tính năng nào để xem token với chỉnh sao cho dễ nhìn tính năng này vừa log vào file ai.log nhưng có định dạng rõ ràng hơn để dễ dàng phân biệt với các log khác. Dưới đây là phiên bản đã chỉnh sửa: