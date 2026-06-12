// backend/controllers/interviewController.js
const {
  generateInterviewQuestions,
  gradeEssay,
} = require("../services/standardinterview/aiService");
const InterviewResult = require("../models/InterviewResult");
const saveActivity = require("../utils/saveActivity");
const { sendInterviewResultEmail } = require("../services/email/emailService");
const User = require("../models/User");

// Sinh câu hỏi (giữ nguyên)
const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic) return res.status(400).json({ message: "Topic is required" });

    const questions = await generateInterviewQuestions(topic, difficulty);
    res.json({ success: true, questions });
  } catch (error) {
    console.error("AI generate error:", error);
    res.status(500).json({ message: "Failed to generate questions" });
  }
};

// Nộp bài và chấm điểm
const submitAnswers = async (req, res) => {
  try {
    // ✅ LẤY userId TỪ req.user (đã được xác thực qua token)
    const userId = req.user.id; // ⚠️ THAY ĐỔI: từ req.user.id, KHÔNG từ body

    const { topic, difficulty, questions, answers } = req.body; // ⚠️ BỎ userId khỏi đây

    // Kiểm tra dữ liệu đầu vào
    if (!userId || !questions) {
      return res.status(400).json({ message: "Missing data" });
    }

    // 1. Chấm MCQ (7 câu, mỗi câu 10 điểm)
    const mcqResults = [];
    let mcqTotalScore = 0;

    // Kiểm tra nếu có câu hỏi MCQ
    if (questions.mcq && Array.isArray(questions.mcq)) {
      questions.mcq.forEach((q, idx) => {
        const userChoice = answers[`mcq_${idx}`];
        const isCorrect = userChoice === q.correctAnswer;
        const score = isCorrect ? 10 : 0;
        mcqTotalScore += score;
        mcqResults.push({
          question: q.question,
          options: q.options,
          userAnswer: userChoice,
          correctAnswer: q.correctAnswer,
          isCorrect,
          score,
          explanation: q.explanation,
        });
      });
    }

    // 2. Chấm tự luận (3 câu, mỗi câu 0-10 điểm)
    const textResults = [];
    let textTotalScore = 0;

    if (questions.text && Array.isArray(questions.text)) {
      for (let idx = 0; idx < questions.text.length; idx++) {
        const q = questions.text[idx];
        const userAnswer = answers[`text_${idx}`] || "";
        const essayResult = await gradeEssay(
          q.question,
          userAnswer,
          q.idealAnswerKeywords,
        );
        const score = essayResult.score;
        textTotalScore += score;
        textResults.push({
          question: q.question,
          idealAnswerKeywords: q.idealAnswerKeywords,
          sampleAnswer: q.sampleAnswer,
          userAnswer,
          score,
          explanation: essayResult.explanation,
          feedback: essayResult.feedback,
        });
      }
    }

    const totalScore = mcqTotalScore + textTotalScore;

    // 3. Lưu vào database
    const interviewRecord = new InterviewResult({
      userId, // userId từ token, an toàn
      topic,
      difficulty,
      mcqResults,
      textResults,
      totalScore,
    });
    await interviewRecord.save();

    await saveActivity(userId, "interview");

    sendInterviewResultEmail(userId, "standard", {
      topic,
      difficulty,
      totalScore,
      mcqScore: mcqTotalScore,
      essayScore: textTotalScore,
      completedAt: interviewRecord.completedAt,
    }).catch((err) => console.error("Email error:", err.message));

    return res.json({
      success: true,
      results: {
        totalScore,
        mcq: mcqResults,
        text: textResults,
      },
    });
  } catch (error) {
    console.error("Submit error:", error);
    res.status(500).json({ message: "Failed to grade answers" });
  }
};

// Lấy lịch sử tất cả bài làm của user
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await InterviewResult.find({ userId })
      .sort({ completedAt: -1 })
      .lean();

    const formattedHistory = history.map((record) => {
      // Hỗ trợ cả cấu trúc mới (mcqResults, textResults) và cấu trúc cũ (results.mcq, results.text)
      let mcqResultsArray = record.mcqResults;
      let textResultsArray = record.textResults;
      let mcqQuestionsArray = record.questions?.mcq || [];
      let textQuestionsArray = record.questions?.text || [];

      // Nếu không có cấu trúc mới, thử lấy từ record.results (cũ)
      if (!mcqResultsArray && record.results?.mcq) {
        mcqResultsArray = record.results.mcq;
      }
      if (!textResultsArray && record.results?.text) {
        textResultsArray = record.results.text;
      }

      const mcqCount = mcqResultsArray?.length || mcqQuestionsArray.length;
      const essayCount = textResultsArray?.length || textQuestionsArray.length;

      const mcqScore = mcqResultsArray
        ? mcqResultsArray.reduce((sum, m) => sum + (m.score || 0), 0)
        : record.results?.mcq?.reduce((sum, m) => sum + (m.score || 0), 0) || 0;
      const essayScore = textResultsArray
        ? textResultsArray.reduce((sum, e) => sum + (e.score || 0), 0)
        : record.results?.text?.reduce((sum, e) => sum + (e.score || 0), 0) ||
          0;

      return {
        id: record._id,
        topic: record.topic,
        difficulty: record.difficulty,
        totalScore: record.totalScore,
        mcqScore,
        essayScore,
        mcqCount,
        essayCount,
        totalQuestions: mcqCount + essayCount,
        createdAt: record.completedAt,
        mcqResults: mcqResultsArray || [],
        textResults: textResultsArray || [],
      };
    });
    res.json({ success: true, history: formattedHistory });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

// Xóa một bài làm
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await InterviewResult.findOneAndDelete({ _id: id, userId });
    if (!result)
      return res.status(404).json({ message: "Interview not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete history error:", error);
    res.status(500).json({ message: "Failed to delete interview" });
  }
};

// Lấy chi tiết một bài làm theo id
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const record = await InterviewResult.findOne({ _id: id, userId }).lean();
    if (!record)
      return res
        .status(404)
        .json({ success: false, message: "Interview not found" });

    let mcqResultsArray = record.mcqResults;
    let textResultsArray = record.textResults;
    if (!mcqResultsArray && record.results?.mcq)
      mcqResultsArray = record.results.mcq;
    if (!textResultsArray && record.results?.text)
      textResultsArray = record.results.text;

    const mcqCount = mcqResultsArray?.length || 0;
    const essayCount = textResultsArray?.length || 0;
    const mcqScore = mcqResultsArray
      ? mcqResultsArray.reduce((sum, m) => sum + (m.score || 0), 0)
      : record.results?.mcq?.reduce((sum, m) => sum + (m.score || 0), 0) || 0;
    const essayScore = textResultsArray
      ? textResultsArray.reduce((sum, e) => sum + (e.score || 0), 0)
      : record.results?.text?.reduce((sum, e) => sum + (e.score || 0), 0) || 0;

    const formatted = {
      id: record._id,
      topic: record.topic,
      difficulty: record.difficulty,
      totalScore: record.totalScore,
      mcqScore,
      essayScore,
      mcqCount,
      essayCount,
      totalQuestions: mcqCount + essayCount,
      createdAt: record.completedAt,
      mcqResults: mcqResultsArray || [],
      textResults: textResultsArray || [],
    };
    res.json({ success: true, interview: formatted });
  } catch (error) {
    console.error("Get history by id error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//ADMIN Từ bên dưới đổ xuống là của ADMIN

// Get all interviews (admin)
const getAllInterviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, difficulty, topic, fromDate, toDate } = req.query;

    let query = {};

    // Search by user name or email
    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { userId: { $in: users.map((u) => u._id) } },
        { topic: { $regex: search, $options: "i" } },
      ];
    }
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = { $regex: topic, $options: "i" };
    if (fromDate || toDate) {
      query.completedAt = {};
      if (fromDate) query.completedAt.$gte = new Date(fromDate);
      if (toDate) query.completedAt.$lte = new Date(toDate + "T23:59:59");
    }

    const total = await InterviewResult.countDocuments(query);
    const interviews = await InterviewResult.find(query)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user info for each interview
    const interviewsWithUser = await Promise.all(
      interviews.map(async (interview) => {
        const user = await User.findById(interview.userId).select(
          "fullName email userName",
        );
        return {
          id: interview._id,
          userId: interview.userId,
          userName: user?.fullName || user?.userName || "Unknown",
          userEmail: user?.email || "Unknown",
          topic: interview.topic,
          difficulty: interview.difficulty,
          totalScore: interview.totalScore,
          createdAt: interview.completedAt,
        };
      }),
    );

    res.json({
      success: true,
      interviews: interviewsWithUser,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Get all interviews error:", error);
    res.status(500).json({ message: "Failed to fetch interviews" });
  }
};

// Get interview stats
const getInterviewStats = async (req, res) => {
  try {
    const total = await InterviewResult.countDocuments();
    const avgScoreResult = await InterviewResult.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$totalScore" } } },
    ]);
    const uniqueUsers = await InterviewResult.distinct("userId");

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await InterviewResult.countDocuments({
      completedAt: { $gte: oneWeekAgo },
    });

    res.json({
      success: true,
      stats: {
        total,
        avgScore: avgScoreResult[0]?.avgScore || 0,
        uniqueUsers: uniqueUsers.length,
        thisWeek,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// Get single interview by id (admin)
const getInterviewByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const interview = await InterviewResult.findById(id).lean();
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Format response
    let mcqResultsArray = interview.mcqResults;
    let textResultsArray = interview.textResults;
    if (!mcqResultsArray && interview.results?.mcq)
      mcqResultsArray = interview.results.mcq;
    if (!textResultsArray && interview.results?.text)
      textResultsArray = interview.results.text;

    const mcqScore = mcqResultsArray
      ? mcqResultsArray.reduce((sum, m) => sum + (m.score || 0), 0)
      : 0;
    const essayScore = textResultsArray
      ? textResultsArray.reduce((sum, e) => sum + (e.score || 0), 0)
      : 0;

    res.json({
      success: true,
      interview: {
        id: interview._id,
        topic: interview.topic,
        difficulty: interview.difficulty,
        totalScore: interview.totalScore,
        mcqScore,
        essayScore,
        mcqResults: mcqResultsArray || [],
        textResults: textResultsArray || [],
        createdAt: interview.completedAt,
      },
    });
  } catch (error) {
    console.error("Get interview by id error:", error);
    res.status(500).json({ message: "Failed to fetch interview" });
  }
};

// Delete interview by id (admin)
const deleteInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InterviewResult.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: "Interview not found" });
    }
    res.json({ success: true, message: "Interview deleted successfully" });
  } catch (error) {
    console.error("Delete interview error:", error);
    res.status(500).json({ message: "Failed to delete interview" });
  }
};

module.exports = {
  generateQuestions,
  submitAnswers,
  getHistory,
  deleteHistory,
  getHistoryById,
  //Admin
  getAllInterviews,
  getInterviewStats,
  getInterviewByIdForAdmin,
  deleteInterviewById,
};
