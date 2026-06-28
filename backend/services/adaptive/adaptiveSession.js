// services/adaptive/adaptiveSession.js
const { v4: uuidv4 } = require('uuid');
const AdaptiveSession = require('../../models/AdaptiveSession');
const {
  getRoadmapForTopic,
  pickFirstSubtopic,
  normalizeQuestion,
  isSessionTimedOut,
  analyzeAnswerQuality,
  MAX_CONSECUTIVE_DEEP_DIVES,
  GOOD_ANSWERS_THRESHOLD,
} = require('./adaptiveCore');
const {
  generateNextQuestion,
  generateFinalReport,
  generateFirstQuestion,
} = require('./adaptiveAI');

// Lưu session tạm trong RAM
const pendingSessions = new Map();

// Dọn dẹp session quá hạn
setInterval(
  () => {
    const now = new Date();
    for (const [id, sess] of pendingSessions.entries()) {
      const lastUpdate = sess.updatedAt || sess.startedAt;
      const hoursInactive = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursInactive > 2) {
        pendingSessions.delete(id);
      }
    }
  },
  60 * 60 * 1000
);

async function startSession(
  userId,
  topic,
  maxQuestions = 5,
  mode = 'adaptive'
) {
  if (!topic || !topic.trim()) throw new Error('Topic is required.');

  // Giới hạn số câu hỏi 5-8
  const totalQuestions = Math.min(Math.max(maxQuestions, 5), 8);

  const { structured, flattened } = getRoadmapForTopic(topic);
  const firstSubtopic = pickFirstSubtopic(structured) || flattened[0] || topic;

  // ✅ Sử dụng generateFirstQuestion từ adaptiveAI đã import
  const firstQuestion = await generateFirstQuestion(topic, firstSubtopic);

  const sessionId = uuidv4();
  const session = {
    _id: sessionId,
    userId,
    topic: topic.trim(),
    mode,
    status: 'active',
    maxQuestions: totalQuestions,
    conversation: [
      {
        role: 'assistant',
        type: 'question',
        content: firstQuestion,
        subtopic: firstSubtopic,
        questionType: 'conceptual',
        topic: topic.trim(),
        createdAt: new Date(),
      },
    ],
    coveredTopics: [firstSubtopic],
    currentSubtopic: firstSubtopic,
    lastSubtopic: firstSubtopic,
    roadmapStructured: structured,
    roadmapFlattened: flattened,
    askedQuestions: [normalizeQuestion(firstQuestion)],
    questionTypeHistory: ['conceptual'],
    consecutiveDeepDives: 0,
    goodAnswersCount: 0,
    startedAt: new Date(),
    updatedAt: new Date(),
    topicDeepCount: {}, // thêm mới
  };

  pendingSessions.set(sessionId, session);

  return {
    sessionId,
    firstQuestion,
    totalQuestions,
    progress: {
      current: 1,
      total: totalQuestions,
      percentage: Math.round((1 / totalQuestions) * 100),
    },
  };
}

async function processAnswer(sessionId, userId, answer) {
  if (!answer || !answer.trim()) throw new Error('Answer is required');

  const session = pendingSessions.get(sessionId);
  if (!session) throw new Error('Session not found or expired');
  if (session.status !== 'active')
    throw new Error('Interview already completed');
  if (session.userId !== userId) throw new Error('Unauthorized');

  if (isSessionTimedOut({ updatedAt: session.updatedAt })) {
    pendingSessions.delete(sessionId);
    throw new Error('Session expired due to inactivity.');
  }

  // Đảm bảo các mảng tồn tại
  if (!Array.isArray(session.askedQuestions)) session.askedQuestions = [];
  if (!Array.isArray(session.questionTypeHistory))
    session.questionTypeHistory = [];
  if (!Array.isArray(session.coveredTopics)) session.coveredTopics = [];
  if (
    !Array.isArray(session.roadmapFlattened) ||
    session.roadmapFlattened.length === 0
  ) {
    const roadmap = getRoadmapForTopic(session.topic);
    session.roadmapFlattened = roadmap.flattened;
    session.roadmapStructured = roadmap.structured;
  }
  if (!session.currentSubtopic) {
    session.currentSubtopic = session.roadmapFlattened[0] || session.topic;
  }

  if (session.consecutiveDeepDives === undefined)
    session.consecutiveDeepDives = 0;
  if (session.goodAnswersCount === undefined) session.goodAnswersCount = 0;
  if (!session.topicDeepCount) session.topicDeepCount = {};

  // Thêm câu trả lời
  session.conversation.push({
    role: 'user',
    type: 'answer',
    content: answer.trim(),
    createdAt: new Date(),
  });
  session.updatedAt = new Date();

  const answersGiven = session.conversation.filter(
    (m) => m.role === 'user' && m.type === 'answer'
  ).length;
  const maxQ = session.maxQuestions || 5;

  // Nếu chưa đủ câu hỏi -> sinh câu hỏi tiếp theo
  if (answersGiven < maxQ) {
    const {
      question: nextQuestion,
      subtopic: nextSubtopic,
      questionType,
      adaptiveDifficulty,
      answerQuality,
      isNewTopic,
    } = await generateNextQuestion(session, answer);

    session.conversation.push({
      role: 'assistant',
      type: 'question',
      content: nextQuestion,
      subtopic: nextSubtopic,
      questionType,
      difficulty: adaptiveDifficulty,
      topic: session.topic,
      createdAt: new Date(),
    });
    session.updatedAt = new Date();
    pendingSessions.set(sessionId, session);

    return {
      isFinished: false,
      sessionId,
      nextQuestion,
      currentSubtopic: nextSubtopic,
      adaptiveDifficulty,
      answerQuality,
      isNewTopic,
      progress: {
        current: answersGiven + 1,
        total: maxQ,
        percentage: Math.round(((answersGiven + 1) / maxQ) * 100),
      },
    };
  }

  // Đã đủ số câu hỏi -> hoàn thành, lưu vào database
  const finalSession = new AdaptiveSession({
    userId: session.userId,
    topic: session.topic,
    mode: session.mode,
    status: 'completed',
    maxQuestions: session.maxQuestions,
    conversation: session.conversation,
    coveredTopics: session.coveredTopics,
    currentSubtopic: session.currentSubtopic,
    roadmapStructured: session.roadmapStructured,
    roadmapFlattened: session.roadmapFlattened,
    askedQuestions: session.askedQuestions,
    questionTypeHistory: session.questionTypeHistory,
    consecutiveDeepDives: session.consecutiveDeepDives,
    goodAnswersCount: session.goodAnswersCount,
    startedAt: session.startedAt,
    endedAt: new Date(),
    topicDeepCount: session.topicDeepCount, // lưu thêm
  });

  if (session.startedAt) {
    finalSession.durationInSeconds = Math.floor(
      (finalSession.endedAt - new Date(session.startedAt)) / 1000
    );
  }

  const { report, finalScore } = await generateFinalReport(finalSession);
  finalSession.finalScore = finalScore;
  await finalSession.save();

  pendingSessions.delete(sessionId);

  return {
    isFinished: true,
    sessionId: finalSession._id,
    finalScore: finalSession.finalScore,
    durationInSeconds: finalSession.durationInSeconds || null,
    summary: finalSession.summary,
    conversation: finalSession.conversation.map((msg) => ({
      role: msg.role,
      type: msg.type,
      content: msg.content,
      subtopic: msg.subtopic || null,
      questionType: msg.questionType || null,
      score: msg.score || null,
      strengths: msg.strengths || [],
      weaknesses: msg.weaknesses || [],
      missingConcepts: msg.missingConcepts || [],
      createdAt: msg.createdAt,
    })),
  };
}

module.exports = { startSession, processAnswer };
