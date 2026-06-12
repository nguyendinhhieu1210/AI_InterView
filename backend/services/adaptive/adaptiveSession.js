// services/adaptive/adaptiveSession.js
const { v4: uuidv4 } = require("uuid");
const AdaptiveSession = require("../../models/AdaptiveSession");
const {
  TOTAL_QUESTIONS,
  SESSION_TIMEOUT_HOURS,
  getRoadmapForTopic,
  pickFirstSubtopic,
  normalizeQuestion,
  isSessionTimedOut,
} = require("./adaptiveCore");
const {
  generateFirstQuestion,
  generateNextQuestion,
  generateFinalReport,
} = require("./adaptiveAI");

// Lưu session tạm trong RAM (chưa lưu DB)
const pendingSessions = new Map();

// Dọn dẹp session quá hạn trong RAM
setInterval(
  () => {
    const now = new Date();
    for (const [id, sess] of pendingSessions.entries()) {
      const lastUpdate = sess.updatedAt || sess.startedAt;
      const hoursInactive = (now - lastUpdate) / (1000 * 60 * 60);
      if (hoursInactive > SESSION_TIMEOUT_HOURS) {
        pendingSessions.delete(id);
      }
    }
  },
  60 * 60 * 1000,
);

async function startSession(
  userId,
  topic,
  difficulty = "medium",
  interviewStyle = "friendly",
  mode = "adaptive",
) {
  if (!topic || !topic.trim()) throw new Error("Topic is required.");

  const { structured, flattened } = getRoadmapForTopic(topic);
  const firstSubtopic = pickFirstSubtopic(structured) || flattened[0] || topic;
  const remainingFlattened = flattened.includes(firstSubtopic)
    ? flattened
    : [firstSubtopic, ...flattened].slice(0, TOTAL_QUESTIONS);

  const firstQuestion = await generateFirstQuestion(
    topic,
    difficulty,
    firstSubtopic,
  );

  const sessionId = uuidv4(); // ID tạm, không phải ObjectId
  const session = {
    _id: sessionId,
    userId,
    topic: topic.trim(),
    difficulty,
    interviewStyle,
    mode,
    status: "active",
    conversation: [
      {
        role: "assistant",
        type: "question",
        content: firstQuestion,
        subtopic: firstSubtopic,
        questionType: "conceptual",
        difficulty,
        topic: topic.trim(),
        createdAt: new Date(),
      },
    ],
    coveredTopics: [firstSubtopic],
    currentSubtopic: firstSubtopic,
    roadmapStructured: structured,
    roadmapFlattened: remainingFlattened,
    askedQuestions: [normalizeQuestion(firstQuestion)],
    questionTypeHistory: ["conceptual"],
    startedAt: new Date(),
    updatedAt: new Date(),
  };

  pendingSessions.set(sessionId, session);

  return {
    sessionId, // trả về sessionId tạm (UUID) – controller dùng để ghi Activity
    firstQuestion,
    progress: {
      current: 1,
      total: TOTAL_QUESTIONS,
      percentage: Math.round((1 / TOTAL_QUESTIONS) * 100),
    },
  };
}

async function processAnswer(sessionId, userId, answer) {
  if (!answer || !answer.trim()) throw new Error("Answer is required");

  const session = pendingSessions.get(sessionId);
  if (!session) throw new Error("Session not found or expired");
  if (session.status !== "active")
    throw new Error("Interview already completed");
  if (session.userId !== userId) throw new Error("Unauthorized");

  if (isSessionTimedOut({ updatedAt: session.updatedAt })) {
    pendingSessions.delete(sessionId);
    throw new Error(
      "Session expired due to inactivity. Please start a new interview.",
    );
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
  if (!session.currentSubtopic)
    session.currentSubtopic = session.roadmapFlattened[0] || session.topic;

  // Thêm câu trả lời
  session.conversation.push({
    role: "user",
    type: "answer",
    content: answer.trim(),
    createdAt: new Date(),
  });
  session.updatedAt = new Date();

  const answersGiven = session.conversation.filter(
    (m) => m.role === "user" && m.type === "answer",
  ).length;
  const questionsAsked = session.conversation.filter(
    (m) => m.role === "assistant" && m.type === "question",
  ).length;

  // Nếu chưa đủ câu hỏi -> sinh câu hỏi tiếp theo (vẫn trong RAM)
  if (answersGiven < TOTAL_QUESTIONS) {
    const lastScoredAnswer = [...session.conversation]
      .reverse()
      .find(
        (m) =>
          m.role === "user" &&
          m.type === "answer" &&
          typeof m.score === "number",
      );
    const lastScore = lastScoredAnswer ? lastScoredAnswer.score : null;

    const {
      question: nextQuestion,
      subtopic: nextSubtopic,
      questionType,
      adaptiveDifficulty,
    } = await generateNextQuestion(session, lastScore);

    session.conversation.push({
      role: "assistant",
      type: "question",
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
      progress: {
        current: questionsAsked + 1,
        total: TOTAL_QUESTIONS,
        percentage: Math.round(((questionsAsked + 1) / TOTAL_QUESTIONS) * 100),
      },
    };
  }

  // Đã đủ câu trả lời -> hoàn thành, lưu vào database
  const finalSession = new AdaptiveSession({
    userId: session.userId,
    topic: session.topic,
    difficulty: session.difficulty,
    interviewStyle: session.interviewStyle,
    mode: session.mode,
    status: "completed",
    conversation: session.conversation,
    coveredTopics: session.coveredTopics,
    currentSubtopic: session.currentSubtopic,
    roadmapStructured: session.roadmapStructured,
    roadmapFlattened: session.roadmapFlattened,
    askedQuestions: session.askedQuestions,
    questionTypeHistory: session.questionTypeHistory,
    startedAt: session.startedAt,
    endedAt: new Date(),
  });

  if (session.startedAt) {
    finalSession.durationInSeconds = Math.floor(
      (finalSession.endedAt - new Date(session.startedAt)) / 1000,
    );
  }

  const { report, finalScore } = await generateFinalReport(finalSession);
  finalSession.finalScore = finalScore;
  // generateFinalReport đã gán finalSession.summary bên trong
  await finalSession.save();

  // Xóa session tạm khỏi RAM
  pendingSessions.delete(sessionId);

  // Trả về sessionId thật (ObjectId) và các thông tin
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
