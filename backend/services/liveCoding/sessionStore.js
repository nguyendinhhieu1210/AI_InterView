// services/liveCoding/sessionStore.js
const sessions = new Map();

// TTL mặc định 1 giờ (3600000 ms)
const DEFAULT_TTL = 3600000;

function setSession(sessionId, data, ttl = DEFAULT_TTL) {
  sessions.set(sessionId, {
    data,
    expiresAt: Date.now() + ttl
  });
}

function getSession(sessionId) {
  const entry = sessions.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return entry.data;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

// Dọn dẹp định kỳ (mỗi 5 phút)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sessions.entries()) {
    if (now > entry.expiresAt) {
      sessions.delete(key);
    }
  }
}, 300000);

module.exports = { setSession, getSession, deleteSession };