const fs = require('fs');
const path = require('path');

// Log tập trung vào backend/logs/ — không phụ thuộc vào vị trí file aiLogger.js
const LOG_DIR = path.join(__dirname, '..', 'logs');
const logFilePath = path.join(LOG_DIR, 'ai.log');
const tokenLogPath = path.join(LOG_DIR, 'token_usage.log');

// Tạo thư mục logs/ nếu chưa có (chạy 1 lần lúc khởi động)
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => new Date().toISOString();

const writeJsonLog = (targetFile, logObject) => {
  const logLine = JSON.stringify(logObject) + '\n';
  fs.appendFile(targetFile, logLine, (err) => {
    if (err) console.error('Lỗi ghi log JSON:', err);
  });
};

const logRequest = (model, requestId, prompt, temperature) => {
  writeJsonLog(logFilePath, {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'REQUEST',
    model,
    requestId,
    temperature,
    promptPreview: prompt.substring(0, 200),
  });
};

const logResponse = (model, requestId, responseText, durationMs) => {
  writeJsonLog(logFilePath, {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'RESPONSE',
    model,
    requestId,
    durationMs,
    responsePreview: (typeof responseText === 'string' ? responseText : JSON.stringify(responseText)).substring(0, 200),
  });
};

const logError = (model, requestId, error, context = '') => {
  writeJsonLog(logFilePath, {
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
  });
};

const logTimeout = (model, requestId, timeoutMs) => {
  writeJsonLog(logFilePath, {
    timestamp: getTimestamp(),
    level: 'WARN',
    type: 'TIMEOUT',
    model,
    requestId,
    timeoutMs,
    message: `Request exceeded ${timeoutMs}ms without response`,
  });
};

const logRateLimit = (model, requestId, retryAfter, error) => {
  writeJsonLog(logFilePath, {
    timestamp: getTimestamp(),
    level: 'WARN',
    type: 'RATE_LIMIT',
    model,
    requestId,
    retryAfter: retryAfter || 'unknown',
    errorMessage: error?.message,
  });
};

const logTokenUsage = (model, requestId, inputTokens, outputTokens, totalTokens, feature = 'general') => {
  writeJsonLog(tokenLogPath, {
    timestamp: getTimestamp(),
    level: 'INFO',
    type: 'TOKEN_USAGE',
    feature,
    model,
    requestId,
    inputTokens,
    outputTokens,
    totalTokens,
  });
};

const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

module.exports = {
  logRequest,
  logResponse,
  logError,
  logTimeout,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
};