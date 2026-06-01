// services/liveCoding/sessionService.js
const LiveCodingSession = require('../../models/LiveCodingSession');
const crypto = require('crypto');

const sessions = new Map();

function createSession(language) {
  const id = crypto.randomUUID();
  const session = new LiveCodingSession(id, language);
  sessions.set(id, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function updateSession(sessionId, updates) {
  const session = sessions.get(sessionId);
  if (session) {
    Object.assign(session, updates);
    sessions.set(sessionId, session);
  }
  return session;
}

module.exports = { createSession, getSession, updateSession };