// backend/controllers/interviewController.js
const { generateInterviewQuestions, gradeEssay } = require('../services/aiService');
const InterviewResult = require('../models/InterviewResult');
const saveActivity = require('../utils/saveActivity');


// Sinh câu hỏi (giữ nguyên)
const generateQuestions = async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    if (!topic) return res.status(400).json({ message: 'Topic is required' });

    const questions = await generateInterviewQuestions(topic, difficulty);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({ message: 'Failed to generate questions' });
  }
};

// Nộp bài và chấm điểm
const submitAnswers = async (req, res) => {
  try {
    const { topic, difficulty, questions, answers, userId } = req.body;
    if (!userId || !questions) return res.status(400).json({ message: 'Missing data' });

    // 1. Chấm MCQ (7 câu, mỗi câu 10 điểm)
    const mcqResults = [];
    let mcqTotalScore = 0;
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
        explanation: q.explanation   // giải thích đáp án đúng (có sẵn)
      });
    });

    // 2. Chấm tự luận (3 câu, mỗi câu 0-10 điểm)
    const textResults = [];
    let textTotalScore = 0;
    for (let idx = 0; idx < questions.text.length; idx++) {
      const q = questions.text[idx];
      const userAnswer = answers[`text_${idx}`] || '';
      // Gọi AI chấm, nhận object { score, explanation, feedback }
      const essayResult = await gradeEssay(q.question, userAnswer, q.idealAnswerKeywords);
      const score = essayResult.score;
      textTotalScore += score;
      textResults.push({
        question: q.question,
        idealAnswerKeywords: q.idealAnswerKeywords,
        sampleAnswer: q.sampleAnswer,
        userAnswer,
        score,
        explanation: essayResult.explanation,
        feedback: essayResult.feedback
      });
    }

    const totalScore = mcqTotalScore + textTotalScore; // tối đa 100

    // 3. Lưu vào database
    const interviewRecord = new InterviewResult({
      userId,
      topic,
      difficulty,
      mcqResults,
      textResults,
      totalScore
    });
    await interviewRecord.save();
    await saveActivity(
      userId,
      'interview'
    );

    res.json({
      success: true,
      results: {
        totalScore,
        mcq: mcqResults,
        text: textResults
      }
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Failed to grade answers' });
  }
};

// Lấy lịch sử tất cả bài làm của user
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await InterviewResult.find({ userId })
      .sort({ completedAt: -1 })
      .lean();

    const formattedHistory = history.map(record => {
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

      const mcqScore = mcqResultsArray ? mcqResultsArray.reduce((sum, m) => sum + (m.score || 0), 0) : (record.results?.mcq?.reduce((sum, m) => sum + (m.score || 0), 0) || 0);
      const essayScore = textResultsArray ? textResultsArray.reduce((sum, e) => sum + (e.score || 0), 0) : (record.results?.text?.reduce((sum, e) => sum + (e.score || 0), 0) || 0);

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
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

// Xóa một bài làm
const deleteHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await InterviewResult.findOneAndDelete({ _id: id, userId });
    if (!result) return res.status(404).json({ message: 'Interview not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete history error:', error);
    res.status(500).json({ message: 'Failed to delete interview' });
  }
};

// Lấy chi tiết một bài làm theo id
const getHistoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const record = await InterviewResult.findOne({ _id: id, userId }).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Interview not found' });

    let mcqResultsArray = record.mcqResults;
    let textResultsArray = record.textResults;
    if (!mcqResultsArray && record.results?.mcq) mcqResultsArray = record.results.mcq;
    if (!textResultsArray && record.results?.text) textResultsArray = record.results.text;

    const mcqCount = mcqResultsArray?.length || 0;
    const essayCount = textResultsArray?.length || 0;
    const mcqScore = mcqResultsArray ? mcqResultsArray.reduce((sum, m) => sum + (m.score || 0), 0) : (record.results?.mcq?.reduce((sum, m) => sum + (m.score || 0), 0) || 0);
    const essayScore = textResultsArray ? textResultsArray.reduce((sum, e) => sum + (e.score || 0), 0) : (record.results?.text?.reduce((sum, e) => sum + (e.score || 0), 0) || 0);

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
    console.error('Get history by id error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { generateQuestions, submitAnswers, getHistory, deleteHistory, getHistoryById };