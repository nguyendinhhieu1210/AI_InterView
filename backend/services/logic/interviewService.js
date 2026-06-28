// backend/services/logic/interviewService.js
const {
  generateInterviewQuestions,
  gradeEssay,
} = require('../standardinterview/aiService');
const InterviewResult = require('../../models/InterviewResult');
const saveActivity = require('../../utils/saveActivity');
const { sendInterviewResultEmail } = require('../email/emailService');
const User = require('../../models/User');

class InterviewServices {
  /**
   * Generate interview questions
   */
  async generateQuestions(topic, difficulty) {
    if (!topic) {
      throw new Error('Topic is required');
    }
    return await generateInterviewQuestions(topic, difficulty);
  }

  /**
   * Submit and grade answers
   */
  async submitAnswers(userId, topic, difficulty, questions, answers) {
    // Validate input
    if (!userId || !questions) {
      throw new Error('Missing required data');
    }

    // 1. Grade MCQ (7 questions, each 10 points)
    const mcqResults = [];
    let mcqTotalScore = 0;

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

    // 2. Grade essay questions (3 questions, each 0-10 points)
    const textResults = [];
    let textTotalScore = 0;

    if (questions.text && Array.isArray(questions.text)) {
      for (let idx = 0; idx < questions.text.length; idx++) {
        const q = questions.text[idx];
        const userAnswer = answers[`text_${idx}`] || '';
        const essayResult = await gradeEssay(
          q.question,
          userAnswer,
          q.idealAnswerKeywords
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

    // 3. Save to database
    const interviewRecord = new InterviewResult({
      userId,
      topic,
      difficulty,
      mcqResults,
      textResults,
      totalScore,
    });
    await interviewRecord.save();

    // 4. Save activity
    await saveActivity(userId, 'interview');

    // 5. Send email (async, don't wait for result)
    sendInterviewResultEmail(userId, 'standard', {
      topic,
      difficulty,
      totalScore,
      mcqScore: mcqTotalScore,
      essayScore: textTotalScore,
      completedAt: interviewRecord.completedAt,
    }).catch((err) => console.error('Email error:', err.message));

    // 6. Return results
    return {
      totalScore,
      mcq: mcqResults,
      text: textResults,
    };
  }

  /**
   * Get user's interview history
   */
  async getUserHistory(userId) {
    const history = await InterviewResult.find({ userId })
      .sort({ completedAt: -1 })
      .lean();

    return history.map((record) => {
      // Support both new structure (mcqResults, textResults) and old structure (results.mcq, results.text)
      let mcqResultsArray = record.mcqResults;
      let textResultsArray = record.textResults;
      let mcqQuestionsArray = record.questions?.mcq || [];
      let textQuestionsArray = record.questions?.text || [];

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
  }

  /**
   * Delete a specific interview
   */
  async deleteUserHistory(userId, interviewId) {
    const result = await InterviewResult.findOneAndDelete({
      _id: interviewId,
      userId,
    });
    if (!result) {
      throw new Error('Interview not found');
    }
    return result;
  }

  /**
   * Get interview details by ID
   */
  async getHistoryById(userId, interviewId) {
    const record = await InterviewResult.findOne({
      _id: interviewId,
      userId,
    }).lean();

    if (!record) {
      throw new Error('Interview not found');
    }

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
      textResults: (textResultsArray || []).map((e) => ({
        question: e.question,
        userAnswer: e.userAnswer,
        score: e.score,
        feedback: e.feedback,
        sampleAnswer: e.sampleAnswer,
        idealKeywords: e.idealKeywords,
        gradingExplanation: e.gradingExplanation,
      })),
    };
  }

  // ============ ADMIN SERVICES ============

  /**
   * Get all interviews with filters and pagination
   */
  async getAllInterviews(filters = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      difficulty,
      topic,
      fromDate,
      toDate,
    } = filters;

    let usePagination = true;
    let skip = (page - 1) * limit;
    let queryLimit = limit;

    if (limit === 'all' || limit === '0') {
      usePagination = false;
      queryLimit = null;
      skip = null;
    } else {
      queryLimit = parseInt(limit) || 10;
      skip = (page - 1) * queryLimit;
    }

    let query = {};

    // Search by user name/email or topic
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
        { topic: { $regex: search, $options: 'i' } },
      ];
    }

    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = { $regex: topic, $options: 'i' };
    if (fromDate || toDate) {
      query.completedAt = {};
      if (fromDate) query.completedAt.$gte = new Date(fromDate);
      if (toDate) query.completedAt.$lte = new Date(toDate + 'T23:59:59');
    }

    const total = await InterviewResult.countDocuments(query);

    let interviewsQuery = InterviewResult.find(query).sort({ completedAt: -1 });
    if (usePagination) {
      interviewsQuery = interviewsQuery.skip(skip).limit(queryLimit);
    }
    const interviews = await interviewsQuery.lean();

    // Attach user info
    const interviewsWithUser = await Promise.all(
      interviews.map(async (interview) => {
        const user = await User.findById(interview.userId).select(
          'fullName email userName'
        );
        return {
          id: interview._id,
          userId: interview.userId,
          userName: user?.fullName || user?.userName || 'Unknown',
          userEmail: user?.email || 'Unknown',
          topic: interview.topic,
          difficulty: interview.difficulty,
          totalScore: interview.totalScore,
          createdAt: interview.completedAt,
        };
      })
    );

    return {
      interviews: interviewsWithUser,
      total,
      pages: usePagination ? Math.ceil(total / queryLimit) : 1,
      currentPage: usePagination ? page : 1,
    };
  }

  /**
   * Get interview statistics
   */
  async getInterviewStats() {
    const total = await InterviewResult.countDocuments();
    const avgScoreResult = await InterviewResult.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$totalScore' } } },
    ]);
    const uniqueUsers = await InterviewResult.distinct('userId');

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = await InterviewResult.countDocuments({
      completedAt: { $gte: oneWeekAgo },
    });

    return {
      total,
      avgScore: avgScoreResult[0]?.avgScore || 0,
      uniqueUsers: uniqueUsers.length,
      thisWeek,
    };
  }

  /**
   * Get interview by ID (admin)
   */
  async getInterviewByIdForAdmin(interviewId) {
    const interview = await InterviewResult.findById(interviewId).lean();
    if (!interview) {
      throw new Error('Interview not found');
    }

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

    return {
      id: interview._id,
      topic: interview.topic,
      difficulty: interview.difficulty,
      totalScore: interview.totalScore,
      mcqScore,
      essayScore,
      mcqResults: mcqResultsArray || [],
      textResults: textResultsArray || [],
      createdAt: interview.completedAt,
    };
  }

  /**
   * Delete interview by ID (admin)
   */
  async deleteInterviewById(interviewId) {
    const result = await InterviewResult.findByIdAndDelete(interviewId);
    if (!result) {
      throw new Error('Interview not found');
    }
    return result;
  }
}

module.exports = new InterviewServices();
