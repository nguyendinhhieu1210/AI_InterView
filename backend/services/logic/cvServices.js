const fs = require('fs');
const mammoth = require('mammoth');
const CVInterviewSession = require('../../models/CVInterviewSession');
const User = require('../../models/User');
const { analyzeCVSkills } = require('../cv/analyzeSkills');
const { generateQuestionsFromCV } = require('../interview/generateQuestions');
const { gradeCVAnswersAdvanced } = require('../interview/gradingService');
const { extractTextFromPDF } = require('../../utils/pdfReader');
const saveActivity = require('../../utils/saveActivity');
const { sendInterviewResultEmail } = require('../email/emailService');

class CVService {
  // Server-side dedup guard: map lưu các upload gần đây
  static recentUploads = new Map();

  static isDuplicateUpload(userId, fileName, fileSize) {
    const key = `${userId || 'anon'}-${fileName}-${fileSize}`;
    const now = Date.now();
    const last = this.recentUploads.get(key);
    if (last && now - last < 5000) return true;
    this.recentUploads.set(key, now);
    setTimeout(() => this.recentUploads.delete(key), 10000);
    return false;
  }

  /**
   * Extract text from uploaded file
   */
  static async extractTextFromFile(filePath, mimetype) {
    if (mimetype === 'application/pdf') {
      return await extractTextFromPDF(filePath);
    }
    if (
      mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
    throw new Error('Unsupported file type');
  }

  /**
   * Upload CV – xử lý file và phân tích kỹ năng
   */
  static async uploadCV(file, userId) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // Check duplicate
    if (this.isDuplicateUpload(userId, file.originalname, file.size)) {
      // Xóa file trùng
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new Error('Duplicate upload detected, please wait a moment');
    }

    let text = await this.extractTextFromFile(file.path, file.mimetype);
    text = text.replace(/\s+/g, ' ').trim();

    const analyzed = await analyzeCVSkills(text);
    const { fullName, skills } = analyzed;

    // Xóa file sau khi xử lý
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    return {
      fullName,
      skills,
      rawText: text,
      fileName: file.originalname,
    };
  }

  /**
   * Phân tích CV text trực tiếp
   */
  static async analyzeCVText(cvText) {
    if (!cvText) {
      throw new Error('Missing cvText');
    }
    cvText = cvText.replace(/\s+/g, ' ').trim();
    return await analyzeCVSkills(cvText);
  }

  /**
   * Tạo câu hỏi phỏng vấn
   */
  static async generateQuestions(cvText, selectedSkills) {
    if (!cvText || !selectedSkills) {
      throw new Error('Missing data');
    }
    return await generateQuestionsFromCV(selectedSkills, cvText);
  }

  /**
   * Nộp bài trả lời và chấm điểm
   */
  static async submitAnswers(
    userId,
    questions,
    answers,
    selectedSkills,
    cvName
  ) {
    if (!questions || !answers) {
      throw new Error('Missing questions or answers');
    }

    const results = await gradeCVAnswersAdvanced(questions, answers);

    let session = null;
    if (userId) {
      const combinedResults = [...(results.mcq || []), ...(results.text || [])];

      session = new CVInterviewSession({
        userId,
        cvName: cvName || '',
        topic: selectedSkills || [],
        questions,
        answers,
        results: combinedResults,
        totalScore: results.totalScore,
        summary: results.summary,
      });

      await session.save();
      await saveActivity(userId, 'cv_interview');

      // Gửi email không chặn
      sendInterviewResultEmail(userId, 'cv', {
        cvName: cvName || '',
        topic: selectedSkills || [],
        totalScore: results.totalScore,
        summary: results.summary,
        results: combinedResults,
      }).catch((err) => {
        console.error('Email send failed:', err);
      });
    }

    return {
      mcq: results.mcq,
      text: results.text,
      totalScore: results.totalScore,
      summary: results.summary,
      sessionId: session?._id,
    };
  }

  /**
   * Lấy lịch sử phỏng vấn của user
   */
  static async getHistory(userId) {
    if (!userId) {
      throw new Error('Unauthorized');
    }
    const sessions = await CVInterviewSession.find({ userId }).sort({
      createdAt: -1,
    });
    return sessions;
  }

  /**
   * Lấy chi tiết một phiên phỏng vấn
   */
  static async getDetail(userId, sessionId) {
    if (!userId) {
      throw new Error('Unauthorized');
    }
    const session = await CVInterviewSession.findOne({
      _id: sessionId,
      userId,
    });
    if (!session) {
      throw new Error('CV session not found');
    }
    return session;
  }

  // ------------- ADMIN METHODS -------------

  /**
   * Lấy tất cả phiên CV (có phân trang, search, filter)
   */
  static async getAllSessionsForAdmin(queryParams) {
    const { page = 1, limit, search, fromDate, toDate } = queryParams;

    let usePagination = true;
    let realLimit = parseInt(limit) || 10;
    if (limit === 'all' || limit === '0') {
      usePagination = false;
      realLimit = null;
    }

    const skip = usePagination ? (page - 1) * realLimit : 0;

    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { userName: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      query.$or = [
        { userId: { $in: users.map((u) => u._id) } },
        { cvName: { $regex: search, $options: 'i' } },
      ];
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate + 'T23:59:59');
    }

    const total = await CVInterviewSession.countDocuments(query);

    let sessionsQuery = CVInterviewSession.find(query).sort({ createdAt: -1 });
    if (usePagination) {
      sessionsQuery = sessionsQuery.skip(skip).limit(realLimit);
    }
    const sessions = await sessionsQuery.lean();

    // Gắn thông tin user
    const sessionsWithUser = await Promise.all(
      sessions.map(async (session) => {
        const user = await User.findById(session.userId).select(
          'fullName email userName'
        );
        return {
          id: session._id,
          userId: session.userId,
          userName: user?.fullName || user?.userName || 'Unknown',
          userEmail: user?.email || 'Unknown',
          cvName: session.cvName || 'Untitled CV',
          topic: session.topic || [],
          totalScore: session.totalScore || 0,
          summary: session.summary || {},
          createdAt: session.createdAt,
        };
      })
    );

    // Thống kê chung
    const totalSessions = await CVInterviewSession.countDocuments();
    const uniqueUsers = await CVInterviewSession.distinct('userId');
    const avgScoreResult = await CVInterviewSession.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$totalScore' } } },
    ]);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await CVInterviewSession.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });

    return {
      sessions: sessionsWithUser,
      total,
      pages: usePagination ? Math.ceil(total / realLimit) : 1,
      currentPage: usePagination ? page : 1,
      stats: {
        total: totalSessions,
        uniqueUsers: uniqueUsers.length,
        avgScore: avgScoreResult[0]?.avgScore || 0,
        thisWeek,
      },
    };
  }

  /**
   * Lấy chi tiết phiên CV cho admin
   */
  static async getSessionDetailForAdmin(sessionId) {
    const session = await CVInterviewSession.findById(sessionId).lean();
    if (!session) {
      throw new Error('CV session not found');
    }

    const user = await User.findById(session.userId).select(
      'fullName email userName'
    );

    const results = session.results || [];
    const mcqResults = results.filter((r) => r.type === 'mcq' || !r.type);
    const textResults = results.filter((r) => r.type === 'text');

    const mcqScore = mcqResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const textScore = textResults.reduce((sum, r) => sum + (r.score || 0), 0);

    return {
      id: session._id,
      userId: session.userId,
      userName: user?.fullName || user?.userName || 'Unknown',
      userEmail: user?.email || 'Unknown',
      cvName: session.cvName || 'Untitled CV',
      topic: session.topic || [],
      totalScore: session.totalScore || 0,
      mcqScore,
      textScore,
      summary: session.summary || {},
      questions: session.questions || {},
      answers: session.answers || {},
      results: session.results || [],
      createdAt: session.createdAt,
    };
  }

  /**
   * Xóa phiên CV cho admin
   */
  static async deleteSessionForAdmin(sessionId) {
    const result = await CVInterviewSession.findByIdAndDelete(sessionId);
    if (!result) {
      throw new Error('CV session not found');
    }
    return true;
  }
}

module.exports = CVService;
