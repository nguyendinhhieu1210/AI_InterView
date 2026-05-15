// utils/normalizeQuestions.js
function extractAllQuestions(assessment) {
  const questionsList = [];

  // Trường hợp style cũ (có trường results)
  if (assessment.results && Array.isArray(assessment.results)) {
    assessment.results.forEach((result, index) => {
      const qId = result.questionId || `q_${index}`;
      const questionText = assessment.questions?.[qId]?.text || 'Không rõ câu hỏi';
      questionsList.push({
        assessmentId: assessment._id,
        topic: Array.isArray(assessment.topic) ? assessment.topic.join(', ') : assessment.topic,
        questionText,
        userAnswer: assessment.answers?.[qId] || '',
        isCorrect: result.isCorrect,
        score: result.score,
        aiFeedback: result.aiFeedback || '',
        // Thêm metadata nếu có
        difficulty: result.difficulty || assessment.difficulty,
      });
    });
  }

  // Trường hợp upload mới (mcqResults + textResults)
  if (assessment.mcqResults && Array.isArray(assessment.mcqResults)) {
    assessment.mcqResults.forEach(mcq => {
      questionsList.push({
        assessmentId: assessment._id,
        topic: assessment.topic,
        questionText: mcq.question,
        userAnswer: mcq.userAnswer,
        isCorrect: mcq.correct,
        score: mcq.score,
        aiFeedback: mcq.aiFeedback || '',
        difficulty: assessment.difficulty,
      });
    });
  }

  if (assessment.textResults && Array.isArray(assessment.textResults)) {
    assessment.textResults.forEach(text => {
      questionsList.push({
        assessmentId: assessment._id,
        topic: assessment.topic,
        questionText: text.question,
        userAnswer: text.userAnswer,
        isCorrect: null, // text thường không có đúng/sai, chỉ có điểm
        score: text.score,
        aiFeedback: text.aiFeedback || '',
        difficulty: assessment.difficulty,
      });
    });
  }

  return questionsList;
}