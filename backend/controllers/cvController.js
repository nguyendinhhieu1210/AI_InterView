const fs = require("fs");
const mammoth = require("mammoth");

const CVInterviewSession = require("../models/CVInterviewSession");
const { analyzeCVSkills } = require("../services/cv/analyzeSkills");
const {
  generateQuestionsFromCV,
} = require("../services/interview/generateQuestions");
const {
  gradeCVAnswersAdvanced,
} = require("../services/interview/gradingService");
const { extractTextFromPDF } = require("../utils/pdfReader");
const saveActivity = require("../utils/saveActivity");
const { sendInterviewResultEmail } = require("../services/email/emailService");

/**
 * FIX: Server-side dedup guard — nếu cùng user upload file trùng tên + size
 * trong vòng 5 giây, bỏ qua request thứ 2 (tránh double request từ client bug)
 */
const recentUploads = new Map(); // key: `${userId}-${fileName}-${fileSize}`, value: timestamp

function isDuplicateUpload(userId, fileName, fileSize) {
  const key = `${userId || "anon"}-${fileName}-${fileSize}`;
  const now = Date.now();
  const last = recentUploads.get(key);
  if (last && now - last < 5000) return true;
  recentUploads.set(key, now);
  // Cleanup entries cũ sau 10 giây để tránh memory leak
  setTimeout(() => recentUploads.delete(key), 10000);
  return false;
}

/**
 * Extract text from uploaded file
 */
const extractTextFromFile = async (filePath, mimetype) => {
  if (mimetype === "application/pdf") {
    return await extractTextFromPDF(filePath);
  }
  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  throw new Error("Unsupported file type");
};

/**
 * Upload CV file
 */
const uploadCV = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // FIX: check duplicate trước khi gọi AI để tiết kiệm token
    const userId = req.user?.id;
    if (isDuplicateUpload(userId, file.originalname, file.size)) {
      console.warn(
        `[uploadCV] Duplicate upload blocked: ${file.originalname} (${file.size} bytes)`,
      );
      // Cleanup file trùng
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res
        .status(429)
        .json({ error: "Duplicate upload detected, please wait a moment" });
    }

    console.log("=== UPLOAD CV ===");
    console.log("File:", file.originalname, "Type:", file.mimetype);

    let text = await extractTextFromFile(file.path, file.mimetype);
    text = text.replace(/\s+/g, " ").trim();

    console.log("Extracted text length:", text.length);

    const analyzed = await analyzeCVSkills(text);
    const { fullName, skills } = analyzed;

    console.log(
      "Analyzed result:",
      JSON.stringify({ fullName, skills }, null, 2),
    );

    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return res.json({
      success: true,
      fullName,
      skills,
      rawText: text,
      fileName: file.originalname,
    });
  } catch (error) {
    console.error("Upload CV error:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Delete file error:", e.message);
      }
    }

    return res.status(500).json({ error: "Failed to process CV" });
  }
};

/**
 * Analyze CV text directly
 */
const analyzeCVText = async (req, res) => {
  try {
    let { cvText } = req.body;

    if (!cvText) {
      return res.status(400).json({ error: "Missing cvText" });
    }

    cvText = cvText.replace(/\s+/g, " ").trim();
    console.log("=== ANALYZE CV TEXT ===");

    const result = await analyzeCVSkills(cvText);
    return res.json(result);
  } catch (err) {
    console.error("analyzeCVText error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Generate interview questions
 */
const generateQuestionsFromText = async (req, res) => {
  try {
    const { cvText, selectedSkills } = req.body;

    if (!cvText || !selectedSkills) {
      return res.status(400).json({ error: "Missing data" });
    }

    const questions = await generateQuestionsFromCV(selectedSkills, cvText);
    return res.json({ success: true, questions });
  } catch (error) {
    console.error("Generate questions error:", error);
    return res.status(500).json({ error: "Failed to generate questions" });
  }
};

/**
 * Submit interview answers
 */
const submitCVAnswers = async (req, res) => {
  try {
    const { questions, answers, selectedSkills, cvName } = req.body;

    if (!questions || !answers) {
      return res.status(400).json({ error: "Missing questions or answers" });
    }

    const results = await gradeCVAnswersAdvanced(questions, answers);

    let session;

    if (req.user?.id) {
      const combinedResults = [...(results.mcq || []), ...(results.text || [])];

      session = new CVInterviewSession({
        userId: req.user.id,
        cvName: cvName || "",
        topic: selectedSkills || [],
        questions,
        answers,
        results: combinedResults,
        totalScore: results.totalScore,
        summary: results.summary,
      });

      await session.save();
      await saveActivity(req.user.id, "cv_interview");

      // gửi email
      sendInterviewResultEmail(req.user.id, "cv", {
        cvName: cvName || "",
        topic: selectedSkills || [],
        totalScore: results.totalScore,
        summary: results.summary,
        results: combinedResults,
      }).catch((err) => {
        console.error("Email send failed:", err);
      });
    }

    return res.json({
      success: true,
      results: {
        mcq: results.mcq,
        text: results.text,
        totalScore: results.totalScore,
        summary: results.summary,
      },
    });
  } catch (error) {
    console.error("Submit CV answers error:", error);
    return res.status(500).json({ error: "Failed to grade answers" });
  }
};

/**
 * Get all CV interview history
 */
const getCVSessionHistory = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const sessions = await CVInterviewSession.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, history: sessions });
  } catch (error) {
    console.error("Get CV session history error:", error);
    return res.status(500).json({ error: "Failed to fetch CV history" });
  }
};

/**
 * Get CV interview detail
 */
const getCVSessionDetail = async (req, res) => {
  try {
    const sessionId = req.params.id;

    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const session = await CVInterviewSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: "CV session not found" });
    }

    return res.json({ success: true, history: session });
  } catch (error) {
    console.error("Get CV session detail error:", error);
    return res.status(500).json({ error: "Failed to fetch CV session detail" });
  }
};

// backend/controllers/cvController.js
// Thêm vào cuối file, trước module.exports

/**
 * ADMIN: Get all CV interview sessions (all users)
 */
const getAllCVSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, fromDate, toDate } = req.query;

    let query = {};

    // Search by user name or email or cvName
    if (search) {
      const User = require("../models/User");
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.userId = { $in: users.map((u) => u._id) };
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + "T23:59:59");
    }

    const total = await CVInterviewSession.countDocuments(query);
    const sessions = await CVInterviewSession.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get user info for each session
    const User = require("../models/User");
    const sessionsWithUser = await Promise.all(
      sessions.map(async (session) => {
        const user = await User.findById(session.userId).select(
          "fullName email userName",
        );
        return {
          id: session._id,
          userId: session.userId,
          userName: user?.fullName || user?.userName || "Unknown",
          userEmail: user?.email || "Unknown",
          cvName: session.cvName || "Untitled CV",
          topic: session.topic || [],
          totalScore: session.totalScore || 0,
          summary: session.summary || {},
          createdAt: session.createdAt,
        };
      }),
    );

    // Get stats
    const totalSessions = await CVInterviewSession.countDocuments();
    const uniqueUsers = await CVInterviewSession.distinct("userId");
    const avgScoreResult = await CVInterviewSession.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$totalScore" } } },
    ]);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await CVInterviewSession.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    res.json({
      success: true,
      sessions: sessionsWithUser,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      stats: {
        total: totalSessions,
        uniqueUsers: uniqueUsers.length,
        avgScore: avgScoreResult[0]?.avgScore || 0,
        thisWeek,
      },
    });
  } catch (error) {
    console.error("Get all CV sessions error:", error);
    res.status(500).json({ message: "Failed to fetch CV sessions" });
  }
};

/**
 * ADMIN: Get single CV session by id
 */
const getCVSessionByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await CVInterviewSession.findById(id).lean();

    if (!session) {
      return res.status(404).json({ message: "CV session not found" });
    }

    // Get user info
    const User = require("../models/User");
    const user = await User.findById(session.userId).select(
      "fullName email userName",
    );

    // Format response
    const results = session.results || [];
    const mcqResults = results.filter((r) => r.type === "mcq" || !r.type);
    const textResults = results.filter((r) => r.type === "text");

    const mcqScore = mcqResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const textScore = textResults.reduce((sum, r) => sum + (r.score || 0), 0);

    res.json({
      success: true,
      session: {
        id: session._id,
        userId: session.userId,
        userName: user?.fullName || user?.userName || "Unknown",
        userEmail: user?.email || "Unknown",
        cvName: session.cvName || "Untitled CV",
        topic: session.topic || [],
        totalScore: session.totalScore || 0,
        mcqScore,
        textScore,
        summary: session.summary || {},
        questions: session.questions || {},
        answers: session.answers || {},
        results: session.results || [],
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    console.error("Get CV session by id error:", error);
    res.status(500).json({ message: "Failed to fetch CV session" });
  }
};

/**
 * ADMIN: Delete CV session by id
 */
const deleteCVSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CVInterviewSession.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "CV session not found" });
    }

    res.json({ success: true, message: "CV session deleted successfully" });
  } catch (error) {
    console.error("Delete CV session error:", error);
    res.status(500).json({ message: "Failed to delete CV session" });
  }
};

module.exports = {
  uploadCV,
  analyzeCVText,
  generateQuestionsFromText,
  submitCVAnswers,
  getCVSessionHistory,
  getCVSessionDetail,
  getAllCVSessions,
  getCVSessionByIdForAdmin,
  deleteCVSessionById,
};
