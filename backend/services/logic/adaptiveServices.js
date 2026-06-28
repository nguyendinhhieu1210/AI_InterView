// services/logic/adaptiveServices.js
const adaptiveSession = require('../adaptive/adaptiveSession');
const AdaptiveSession = require('../../models/AdaptiveSession');
const saveActivity = require('../../utils/saveActivity');

class AdaptiveServices {
  /**
   * Start a new adaptive interview session
   */
  async startInterview(userId, topic, questionCount) {
    if (!topic) {
      throw new Error('Topic is required');
    }

    // Validate and limit question count (5-8)
    let maxQuestions = 5;
    if (questionCount) {
      maxQuestions = Math.min(Math.max(questionCount, 5), 8);
    }

    const result = await adaptiveSession.startSession(
      userId,
      topic,
      maxQuestions
    );

    return result;
  }

  /**
   * Process user's answer
   */
  async submitAnswer(sessionId, userId, answer) {
    if (!sessionId || !answer) {
      throw new Error('Session ID and answer are required');
    }

    const result = await adaptiveSession.processAnswer(
      sessionId,
      userId,
      answer
    );

    // Save activity if interview is finished
    if (result.isFinished) {
      await saveActivity(userId);
    }

    return result;
  }

  /**
   * Get session by ID for user
   */
  async getSessionById(sessionId, userId) {
    const session = await AdaptiveSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  /**
   * Get user's interview history
   */
  async getUserHistory(userId) {
    const sessions = await AdaptiveSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const history = sessions.map((session) => {
      const questions =
        session.conversation?.filter(
          (msg) => msg.role === 'assistant' && msg.type === 'question'
        ) || [];

      const totalQuestions = questions.length;
      const totalScore = (session.finalScore || 0) * 10;

      return {
        id: session._id,
        type: 'adaptive',
        topic: session.topic || 'Adaptive Interview',
        difficulty: 'Adaptive',
        totalQuestions,
        createdAt: session.createdAt,
        totalScore,
        mcqScore: null,
        mcqCount: null,
        essayScore: totalScore,
        essayCount: totalQuestions,
        detailPath: `/adaptive-history/${session._id}`,
        skillTags: null,
      };
    });

    return history;
  }

  /**
   * Get all sessions for admin
   */
  async getAllSessionsForAdmin() {
    const sessions = await AdaptiveSession.find()
      .populate('userId', 'userName email fullName')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = sessions.map((session) => {
      const totalQuestions =
        session.summary?.questionBreakdown?.length ||
        session.conversation?.filter(
          (msg) => msg.role === 'assistant' && msg.type === 'question'
        ).length ||
        0;

      return {
        id: session._id,
        user: session.userId
          ? {
              id: session.userId._id,
              name: session.userId.fullName || session.userId.userName,
              email: session.userId.email,
            }
          : null,
        topic: session.topic,
        difficulty: 'Adaptive',
        totalQuestions,
        finalScore:
          session.finalScore !== undefined && session.finalScore !== null
            ? session.finalScore
            : null,
        status: session.status || 'active',
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        endedAt: session.endedAt || null,
      };
    });

    return formatted;
  }

  /**
   * Get session detail for admin
   */
  async getSessionDetailForAdmin(sessionId) {
    const session = await AdaptiveSession.findById(sessionId)
      .populate('userId', 'userName email fullName')
      .lean();

    if (!session) {
      throw new Error('Session not found');
    }

    const totalQuestions =
      session.summary?.questionBreakdown?.length ||
      session.conversation?.filter(
        (msg) => msg.role === 'assistant' && msg.type === 'question'
      ).length ||
      0;

    const durationInSeconds =
      session.startedAt && session.endedAt
        ? Math.floor(
            (new Date(session.endedAt) - new Date(session.startedAt)) / 1000
          )
        : (session.durationInSeconds ?? null);

    return {
      id: session._id,
      user: session.userId
        ? {
            id: session.userId._id,
            name: session.userId.fullName || session.userId.userName,
            email: session.userId.email,
          }
        : null,
      topic: session.topic,
      difficulty: 'Adaptive',
      status: session.status || 'active',
      startedAt: session.startedAt,
      endedAt: session.endedAt || null,
      durationInSeconds,
      finalScore:
        session.finalScore !== undefined && session.finalScore !== null
          ? session.finalScore
          : null,
      totalQuestions,
      conversation: session.conversation || [],
      summary: session.summary || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  /**
   * Delete session for admin
   */
  async deleteSessionForAdmin(sessionId) {
    const session = await AdaptiveSession.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    await session.deleteOne();
  }
}

module.exports = new AdaptiveServices();
