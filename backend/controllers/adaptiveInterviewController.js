// controllers/adaptiveInterviewController.js

const adaptiveService = require('../services/adaptiveInterviewService');
const AdaptiveSession = require('../models/AdaptiveSession');
const Activity = require('../models/Activity'); // ✅ thêm

exports.startAdaptiveInterview = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const userId = req.user.id;

    if (!topic || !difficulty) {
      return res.status(400).json({
        error: 'Topic and difficulty are required'
      });
    }

    const {
      sessionId,
      firstQuestion
    } = await adaptiveService.startSession(
      userId,
      topic,
      difficulty
    );

    res.status(201).json({
      sessionId,
      firstQuestion
    });

  } catch (error) {
    console.error(
      'Start adaptive interview error:',
      error
    );

    res.status(500).json({
      error: 'Failed to start interview'
    });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const userId = req.user.id;

    if (!sessionId || !answer) {
      return res.status(400).json({
        error: 'Session ID and answer are required'
      });
    }

    const result =
      await adaptiveService.processAnswer(
        sessionId,
        userId,
        answer
      );

    // ✅ chỉ lưu activity khi hoàn thành interview
    if (result.isFinished) {
      await Activity.create({
        userId,
        type: 'adaptive_interview'
      });
    }

    res.json(result);

  } catch (error) {
    console.error(
      'Submit answer error:',
      error
    );

    if (error.message === 'Session not found') {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    if (error.message === 'Session is already finished') {
      return res.status(400).json({
        error: 'Session already completed'
      });
    }

    res.status(500).json({
      error: 'Failed to process answer'
    });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session =
      await AdaptiveSession.findOne({
        _id: sessionId,
        userId
      });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json(session);

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch session'
    });
  }
};

// ✅ SỬA LẠI: Trả về đúng cấu trúc frontend cần
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions =
      await AdaptiveSession.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

    const history = sessions.map(session => {

      // Đếm số câu hỏi thực tế
      const questions =
        session.conversation?.filter(
          msg =>
            msg.role === 'assistant' &&
            msg.type === 'question'
        ) || [];

      const totalQuestions =
        questions.length;

      // thang điểm 10 -> 100
      const totalScore =
        (session.finalScore || 0) * 10;

      return {
        id: session._id,

        type: 'adaptive',

        topic:
          session.topic ||
          'Adaptive Interview',

        difficulty:
          session.difficulty ||
          'Adaptive',

        totalQuestions,

        createdAt:
          session.createdAt,

        totalScore,

        mcqScore: null,
        mcqCount: null,

        essayScore:
          totalScore,

        essayCount:
          totalQuestions,

        detailPath:
          `/adaptive-history/${session._id}`,

        skillTags: null
      };
    });

    res.json({
      success: true,
      history
    });

  } catch (error) {
    console.error(
      'Get history error:',
      error
    );

    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
};