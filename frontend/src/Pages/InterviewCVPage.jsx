import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Award, User, Loader2, ClipboardList,
  FileText, HelpCircle, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { useInterview } from '../contexts/InterviewContext';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewCVPage() {
  const navigate = useNavigate();
  const { interviewData, clearInterview, isGenerating } = useInterview();
  const { isAuthenticated, user } = useAuth(); // ✅ không lấy updateActivity

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState({ mcq: [], text: [] });
  const [cvInfo, setCvInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('mcq');

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // ✅ KHÔNG có useEffect nào đăng ký sự kiện updateActivity riêng
  // AuthContext đã có global events (mousemove, click, keydown, scroll, touchstart)

  // Tải dữ liệu phỏng vấn từ context
  useEffect(() => {
    if (isGenerating) {
      setLoading(true);
      return;
    }
    if (!interviewData) {
      navigate('/welcome');
      return;
    }
    setQuestions(interviewData.questions || { mcq: [], text: [] });
    setCvInfo(interviewData.cvInfo);
    setLoading(false);
  }, [interviewData, navigate, isGenerating]);

  const handleAnswerChange = (key, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitting(true);
    try {
      const allSkills = [
        ...(cvInfo?.selectedSkills?.frontend || []),
        ...(cvInfo?.selectedSkills?.backend || []),
        ...(cvInfo?.selectedSkills?.theory || []),
        ...(cvInfo?.selectedSkills?.devops || [])
      ];

      const payload = {
        questions,
        answers,
        selectedSkills: allSkills,
        cvName: cvInfo?.fullName || ''
      };

      const res = await api.post('/cv/submit-answers', payload);
      if (res.data.success) {
        setResults(res.data.results);
        setSubmitted(true);
      } else {
        alert('Grading failed: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    clearInterview();
    navigate('/welcome');
  };

  // Tiện ích tính toán tiến độ
  const mcqList = questions.mcq || [];
  const textList = questions.text || [];
  const totalQuestions = mcqList.length + textList.length;
  const answeredMcq = Object.keys(answers).filter(k => k.startsWith('mcq_')).length;
  const answeredText = Object.keys(answers).filter(k => k.startsWith('text_')).length;
  const answeredTotal = answeredMcq + answeredText;
  const progressPercent = totalQuestions === 0 ? 0 : (answeredTotal / totalQuestions) * 100;

  const mcqResults = results?.mcq || [];
  const textResults = results?.text || [];
  const totalScore = results?.totalScore || 0;
  const userName = user?.fullName || user?.userName || 'Candidate';

  // Phân tích điểm mạnh/yếu
  const computeStrengthsWeaknesses = () => {
    if (!results) return { strengths: [], weaknesses: [], suggestions: [] };
    const strengths = [];
    const weaknesses = [];
    const suggestions = [];

    const correctMcq = mcqResults.filter(r => r.isCorrect).length;
    if (correctMcq === mcqResults.length && mcqResults.length > 0) {
      strengths.push('Perfect score on multiple choice questions – good theoretical knowledge.');
    } else if (correctMcq >= mcqResults.length * 0.7) {
      strengths.push('Strong performance on multiple choice questions.');
    } else if (correctMcq <= mcqResults.length * 0.4) {
      weaknesses.push('Low accuracy on multiple choice questions. Review core concepts.');
      suggestions.push('Re‑study fundamental topics and practice with similar quizzes.');
    }

    let totalEssayScore = 0;
    textResults.forEach(r => { totalEssayScore += r.score || 0; });
    const avgEssay = textResults.length ? totalEssayScore / textResults.length : 0;
    if (avgEssay >= 8) {
      strengths.push('Excellent essay answers – clear reasoning and technical depth.');
    } else if (avgEssay >= 6) {
      strengths.push('Good essay answers, but can be improved with more examples.');
    } else if (avgEssay < 5 && textResults.length > 0) {
      weaknesses.push('Essay answers lack detail or miss key points.');
      suggestions.push('Focus on structuring answers: define terms, give examples, and explain trade‑offs.');
    }

    textResults.forEach((r) => {
      if (r.strengths?.length) strengths.push(...r.strengths.slice(0, 1));
      if (r.mistakes?.length) weaknesses.push(...r.mistakes.slice(0, 2));
      if (r.improvements?.length) suggestions.push(...r.improvements.slice(0, 2));
    });

    return {
      strengths: [...new Set(strengths)].slice(0, 5),
      weaknesses: [...new Set(weaknesses)].slice(0, 5),
      suggestions: [...new Set(suggestions)].slice(0, 5)
    };
  };

  const { strengths, weaknesses, suggestions } = computeStrengthsWeaknesses();

  // Trạng thái tải / đang sinh câu hỏi
  if (loading || isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-100/80 dark:bg-indigo-900/80 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
            {isGenerating ? 'Preparing your personalized interview...' : 'Loading interview...'}
          </p>
        </div>
      </div>
    );
  }

  if (mcqList.length === 0 && textList.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <p className="text-red-600 dark:text-red-400 font-semibold">No questions were generated.</p>
          <button onClick={handleBack} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium px-3 py-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 w-fit"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-full shadow-sm">
              <User className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{userName}</span>
            </div>
            {!submitted && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm rounded-full shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">In Progress</span>
              </div>
            )}
            {submitted && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-sm">
                <Award className="w-4 h-4" />
                <span className="text-xs font-medium">Score: {totalScore}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* CV Info Card */}
        {cvInfo && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-6 border border-indigo-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full">
                <User size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                {cvInfo.fullName || 'Candidate'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.values(cvInfo.selectedSkills || {}).flat().map((skill, i) => (
                <span key={i} className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Interview Card */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8 text-white">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-7 h-7" />
                <h1 className="text-2xl md:text-3xl font-bold">Interview Questions</h1>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {mcqList.length} MCQ
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {textList.length} Essay
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!submitted && totalQuestions > 0 && (
            <div className="px-6 pt-6 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{answeredTotal} / {totalQuestions} answered</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
            <button
              onClick={() => setActiveSection('mcq')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'mcq'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <HelpCircle className="w-4 h-4" /> MCQ
              {submitted && mcqResults.length > 0 && ` (${mcqResults.filter(r => r.isCorrect).length}/${mcqList.length})`}
              {activeSection === 'mcq' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>}
            </button>
            <button
              onClick={() => setActiveSection('text')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'text'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <FileText className="w-4 h-4" /> Essay Questions
              {activeSection === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>}
            </button>
          </div>

          {/* Questions Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
            {/* MCQ Section */}
            <div style={{ display: activeSection === 'mcq' ? 'block' : 'none' }}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-500" /> Multiple Choice Questions
                </h2>
                {mcqList.map((q, idx) => {
                  const isGraded = submitted && mcqResults[idx];
                  const isCorrect = isGraded && mcqResults[idx].isCorrect;
                  const userChoice = answers[`mcq_${idx}`];
                  const resultScore = isGraded ? mcqResults[idx].score : null;
                  return (
                    <div
                      key={`mcq-${idx}`}
                      className={`group rounded-xl p-5 border transition-all duration-300 ${submitted
                        ? isCorrect
                          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
                          : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                        : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700 hover:border-indigo-200'
                        }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <p className="font-medium text-gray-800 dark:text-white flex-1">{q.question}</p>
                        {submitted && (
                          <div className="flex-shrink-0">
                            {isCorrect ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                          </div>
                        )}
                      </div>
                      <div className="ml-10 space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={`${idx}-opt-${optIdx}`}
                            className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${submitted
                              ? 'cursor-default'
                              : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                              } ${submitted && opt === q.correctAnswer
                                ? 'bg-green-100 dark:bg-green-900/40'
                                : ''
                              } ${submitted && userChoice === opt && !isCorrect
                                ? 'bg-red-100 dark:bg-red-900/40'
                                : ''
                              }`}
                          >
                            <input
                              type="radio"
                              name={`mcq_${idx}`}
                              value={opt}
                              checked={userChoice === opt}
                              onChange={() => handleAnswerChange(`mcq_${idx}`, opt)}
                              disabled={submitted}
                              className="mt-0.5 w-4 h-4 text-indigo-600 focus:ring-indigo-500 disabled:opacity-70"
                            />
                            <span
                              className={`text-sm ${submitted && opt === q.correctAnswer
                                ? 'text-green-700 dark:text-green-400 font-medium'
                                : submitted && userChoice === opt && !isCorrect
                                  ? 'text-red-700 dark:text-red-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300'
                                }`}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                      {submitted && isGraded && (
                        <div className="ml-10 mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm shadow-inner">
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Explanation:</span> {mcqResults[idx].explanation || 'No explanation available.'}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-semibold">Your answer:</span> {userChoice || 'Not answered'}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            <span className="font-semibold">Correct answer:</span> {q.correctAnswer}
                          </p>
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                            Score: {resultScore}/10
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {mcqList.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No multiple choice questions available.</p>
                )}
              </div>
            </div>

            {/* Essay Section */}
            <div style={{ display: activeSection === 'text' ? 'block' : 'none' }}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" /> Essay Questions
                </h2>
                {textList.map((q, idx) => {
                  const essayResult = submitted && textResults[idx];
                  const resultScore = essayResult?.score;
                  const isLowScore = resultScore < 5;
                  return (
                    <div
                      key={`text-${idx}`}
                      className={`rounded-xl p-5 border transition-all duration-300 ${submitted
                        ? isLowScore
                          ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                          : 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700'
                        }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <p className="font-medium text-gray-800 dark:text-white flex-1">{q.question}</p>
                      </div>
                      <div className="ml-10">
                        <textarea
                          rows={4}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-80"
                          placeholder="Type your answer here..."
                          value={answers[`text_${idx}`] || ''}
                          onChange={(e) => handleAnswerChange(`text_${idx}`, e.target.value)}
                          disabled={submitted}
                        />
                      </div>
                      {submitted && essayResult && (
                        <div className="ml-10 mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm shadow-inner space-y-2">
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">Your answer:</span> {essayResult.yourAnswer || 'Not answered'}
                          </p>
                          {essayResult.importantKeywords && essayResult.importantKeywords.length > 0 && (
                            <p className="text-gray-600 dark:text-gray-300">
                              <span className="font-semibold">Matched keywords:</span> {essayResult.importantKeywords.join(', ')}
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">AI Review:</span> {essayResult.aiReview || 'No review provided.'}
                          </p>
                          {essayResult.aiSuggestedAnswer && (
                            <p className="text-gray-600 dark:text-gray-300">
                              <span className="font-semibold">Suggested answer:</span> {essayResult.aiSuggestedAnswer}
                            </p>
                          )}
                          {essayResult.strengths && essayResult.strengths.length > 0 && (
                            <div className="text-green-700 dark:text-green-400">
                              <span className="font-semibold">✅ Strengths:</span> {essayResult.strengths.join('; ')}
                            </div>
                          )}
                          {essayResult.mistakes && essayResult.mistakes.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">
                              <span className="font-semibold">❌ Weaknesses:</span> {essayResult.mistakes.join('; ')}
                            </div>
                          )}
                          {essayResult.improvements && essayResult.improvements.length > 0 && (
                            <div className="text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">📚 Improvements:</span> {essayResult.improvements.join('; ')}
                            </div>
                          )}
                          <p className={`font-semibold ${isLowScore ? 'text-red-600' : 'text-purple-600'}`}>
                            Score: {resultScore}/10
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {textList.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No essay questions available.</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            {!submitted && totalQuestions > 0 && (
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Answers
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                  * Review your answers carefully before submitting
                </p>
              </div>
            )}

            {/* Results after submission */}
            {submitted && (
              <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
                  <Award className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-lg font-bold text-gray-800 dark:text-white">Your total score: {totalScore}/100</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{results?.level}</p>

                  <div className="mt-4 text-left space-y-3">
                    {strengths.length > 0 && (
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <p className="font-semibold text-green-700 dark:text-green-400">✅ Strengths</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <p className="font-semibold text-amber-700 dark:text-amber-400">⚠️ Areas for Improvement</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <p className="font-semibold text-blue-700 dark:text-blue-400">📚 Suggestions</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                          {suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button onClick={handleBack} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                      Back to Dashboard
                    </button>
                    <button onClick={() => navigate('/history')} className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      View History
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          <TrendingUp className="inline w-3 h-3 mr-1" /> Powered by AI
        </div>
      </div>
    </div>
  );
}