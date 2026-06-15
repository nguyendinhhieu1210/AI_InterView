// controllers/adaptiveInterviewController.js
const adaptiveService = require("../services/adaptive/adaptiveSession");
const AdaptiveSession = require("../models/AdaptiveSession");
const saveActivity = require("../utils/saveActivity");
const User = require("../models/User"); // thêm để lấy thông tin user

// ========== USER FUNCTIONS ==========
const startAdaptiveInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user.id;

    if (!topic || !difficulty) {
      return res.status(400).json({
        error: "Topic and difficulty are required",
      });
    }

    const { sessionId, firstQuestion } = await adaptiveService.startSession(
      userId,
      topic,
      difficulty,
    );

    res.status(201).json({
      sessionId,
      firstQuestion,
    });
  } catch (error) {
    console.error("Start adaptive interview error:", error);
    res.status(500).json({
      error: "Failed to start interview",
    });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const userId = req.user.id;

    if (!sessionId || !answer) {
      return res.status(400).json({
        error: "Session ID and answer are required",
      });
    }

    const result = await adaptiveService.processAnswer(
      sessionId,
      userId,
      answer,
    );

    if (result.isFinished) {
      await saveActivity(userId);
    }

    res.json(result);
  } catch (error) {
    console.error("Submit answer error:", error);

    if (error.message === "Session not found") {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    if (error.message === "Session is already finished") {
      return res.status(400).json({
        error: "Session already completed",
      });
    }

    res.status(500).json({
      error: "Failed to process answer",
    });
  }
};

const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await AdaptiveSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch session",
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await AdaptiveSession.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const history = sessions.map((session) => {
      const questions =
        session.conversation?.filter(
          (msg) => msg.role === "assistant" && msg.type === "question",
        ) || [];

      const totalQuestions = questions.length;
      // totalScore here is intentionally on a 0-100 scale for the
      // generic history list UI (matches CV/quiz history display).
      const totalScore = (session.finalScore || 0) * 10;

      return {
        id: session._id,
        type: "adaptive",
        topic: session.topic || "Adaptive Interview",
        difficulty: session.difficulty || "Adaptive",
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

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch history",
    });
  }
};

// ========== ADMIN FUNCTIONS ==========
const getAllSessions = async (req, res) => {
  try {
    // Lấy tất cả adaptive sessions, populate thông tin user
    const sessions = await AdaptiveSession.find()
      .populate("userId", "userName email fullName")
      .sort({ createdAt: -1 })
      .lean();

    // Format lại dữ liệu cho admin
    const formatted = sessions.map((session) => {
      const totalQuestions =
        session.summary?.questionBreakdown?.length ||
        session.conversation?.filter(
          (msg) => msg.role === "assistant" && msg.type === "question",
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
        difficulty: session.difficulty,
        totalQuestions,
        // finalScore kept on its native 0-10 scale, same as session.finalScore
        finalScore:
          session.finalScore !== undefined && session.finalScore !== null
            ? session.finalScore
            : null,
        status: session.status || "active",
        createdAt: session.createdAt,
        startedAt: session.startedAt,
        endedAt: session.endedAt || null,
      };
    });

    res.json({
      success: true,
      sessions: formatted,
    });
  } catch (error) {
    console.error("Admin get all sessions error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sessions",
    });
  }
};

const getSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AdaptiveSession.findById(sessionId)
      .populate("userId", "userName email fullName")
      .lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    const totalQuestions =
      session.summary?.questionBreakdown?.length ||
      session.conversation?.filter(
        (msg) => msg.role === "assistant" && msg.type === "question",
      ).length ||
      0;

    const durationInSeconds =
      session.startedAt && session.endedAt
        ? Math.floor(
            (new Date(session.endedAt) - new Date(session.startedAt)) / 1000,
          )
        : (session.durationInSeconds ?? null);

    const result = {
      id: session._id,
      user: session.userId
        ? {
            id: session.userId._id,
            name: session.userId.fullName || session.userId.userName,
            email: session.userId.email,
          }
        : null,
      topic: session.topic,
      difficulty: session.difficulty,
      status: session.status || "active",
      startedAt: session.startedAt,
      endedAt: session.endedAt || null,
      durationInSeconds,
      // finalScore kept on its native 0-10 scale
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

    res.json({
      success: true,
      session: result,
    });
  } catch (error) {
    console.error("Admin get session detail error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch session detail",
    });
  }
};

const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AdaptiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    await session.deleteOne();

    res.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Admin delete session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete session",
    });
  }
};

// Export tất cả các hàm
module.exports = {
  startAdaptiveInterview,
  submitAnswer,
  getSession,
  getHistory,
  getAllSessions,
  getSessionDetail,
  deleteSession,
};
