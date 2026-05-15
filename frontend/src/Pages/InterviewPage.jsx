// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, HelpCircle, Send, Brain, TrendingUp,
  User, CheckCircle, XCircle, Award, AlertCircle
} from 'lucide-react';
import { generateQuestions } from '../services/interviewAPI';
import { useAuth } from '../contexts/AuthContext';

// ==================== Error Boundary ====================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('InterviewPage ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{this.state.errorMsg || 'Failed to render interview page.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
// ========================================================

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty } = location.state || {};

  // Lấy thông tin auth tập trung
  const { isAuthenticated, user, token, updateActivity, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('mcq');
  const [errorMessage, setErrorMessage] = useState('');

  const isMounted = useRef(true);

  // Kiểm tra đăng nhập – nếu không còn authenticated, chuyển về login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Xoá thông báo lỗi sau 5 giây
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Tự động reset idle timer khi có tương tác (AuthContext đã làm global, nhưng gọi thêm ở các action quan trọng)
  // Chỉ gọi updateActivity khi bắt đầu tạo câu hỏi (API call) để tránh logout giữa chừng
  // Không cần gọi ở onChange hay chuyển tab vì click/scroll đã được AuthContext bắt

  // Tạo câu hỏi
  useEffect(() => {
    if (!topic) {
      navigate('/welcome');
      return;
    }

    const fetchQuestions = async () => {
      try {
        updateActivity(); // đánh dấu hoạt động trước khi gọi API
        const data = await generateQuestions(topic, difficulty);
        if (isMounted.current) {
          const enriched = {
            mcq: (data.mcq || []).map((q, idx) => ({
              ...q,
              _uid: `mcq-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`
            })),
            text: (data.text || []).map((q, idx) => ({
              ...q,
              _uid: `text-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`
            }))
          };
          setQuestions(Object.freeze(enriched));
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted.current) {
          setErrorMessage('Failed to generate questions. Please try again.');
          setTimeout(() => navigate('/welcome'), 2000);
        }
      }
    };

    fetchQuestions();
  }, [topic, difficulty, navigate, updateActivity]);

  // Hàm gọi API có xác thực (dùng token từ context)
  const fetchWithAuth = async (url, options = {}) => {
    const currentToken = token; // lấy token mới nhất từ context (đã được refresh nếu có)
    if (!currentToken) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error('Your session has expired. Please login again.');
    }
    return response;
  };

  const handleAnswerChange = (qIndex, type, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Loại bỏ _uid trước khi gửi
      const cleanQuestions = {
        mcq: questions.mcq.map(({ _uid, ...rest }) => rest),
        text: questions.text.map(({ _uid, ...rest }) => rest)
      };
      const payload = {
        topic,
        difficulty,
        questions: cleanQuestions,
        answers,
        userId: user?.id
      };
      const response = await fetchWithAuth('/api/interview/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (isMounted.current) {
        if (data.success) {
          setResults(data.results);
          setSubmitted(true);
        } else {
          throw new Error(data.message || 'Grading failed');
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Error submitting answers. Please try again.');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setActiveSection(tab);
  };

  const mcqCount = questions?.mcq?.length || 0;
  const textCount = questions?.text?.length || 0;
  const answeredMcq = Object.keys(answers).filter(k => k.startsWith('mcq_')).length;
  const answeredText = Object.keys(answers).filter(k => k.startsWith('text_')).length;
  const userName = user?.fullName || user?.userName || 'Guest';

  const totalQuestions = mcqCount + textCount;
  const answeredTotal = answeredMcq + answeredText;
  const progressPercent = totalQuestions === 0 ? 0 : (answeredTotal / totalQuestions) * 100;

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-indigo-100/80 dark:bg-indigo-900/80 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">
            AI is generating questions about <span className="text-indigo-600 dark:text-indigo-400 font-bold">“{topic}”</span>...
          </p>
        </div>
      </div>
    );
  }

  if (!questions || (mcqCount === 0 && textCount === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <p className="text-red-600 dark:text-red-400 font-semibold">No questions available. Please try again.</p>
          <button onClick={() => navigate('/welcome')} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalScore = results?.totalScore || 0;
  const mcqResults = results?.mcq || [];
  const textResults = results?.text || [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <button
              onClick={() => navigate('/welcome')}
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

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-red-700">{errorMessage}</div>
              <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden">
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8 text-white">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-7 h-7" />
                  <h1 className="text-2xl md:text-3xl font-bold">Interview: {topic}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">Difficulty: {difficulty}</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">{mcqCount} MCQ</span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">{textCount} Essay</span>
                </div>
              </div>
            </div>

            {!submitted && (
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

            {/* Tab headers */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
              <button
                onClick={() => switchTab('mcq')}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'mcq' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                <HelpCircle className="w-4 h-4" /> MCQ {submitted && mcqResults.length > 0 && `(${mcqResults.filter(r => r.isCorrect).length}/${mcqCount})`}
                {activeSection === 'mcq' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>}
              </button>
              <button
                onClick={() => switchTab('text')}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'text' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                <FileText className="w-4 h-4" /> Essay Questions
                {activeSection === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>}
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
              {/* MCQ Section */}
              <div style={{ display: activeSection === 'mcq' ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-500" /> Multiple Choice Questions
                  </h2>
                  {questions.mcq.map((q, idx) => {
                    const isGraded = submitted && mcqResults[idx];
                    const isCorrect = isGraded && mcqResults[idx].isCorrect;
                    const userChoice = answers[`mcq_${idx}`];
                    const stableKey = q._uid;

                    return (
                      <div
                        key={stableKey}
                        className={`group bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 border transition-all duration-300 ${submitted
                            ? isCorrect
                              ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
                              : 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200'
                          }`}
                      >
                        {/* QUESTION */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>

                          <p className="font-medium text-gray-800 dark:text-white flex-1">
                            {q.question}
                          </p>

                          {submitted && (
                            <div>
                              {isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              ) : (
                                <XCircle className="w-6 h-6 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* OPTIONS */}
                        <div className="ml-10 space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrectAnswer = opt === q.correctAnswer;
                            const isUserAnswer = opt === userChoice;

                            return (
                              <label
                                key={`${stableKey}-opt-${optIdx}`}
                                className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition border

              ${!submitted
                                    ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-transparent'
                                    : 'cursor-default border-transparent'
                                  }

              /* ✅ correct answer ALWAYS green */
              ${submitted && isCorrectAnswer
                                    ? 'bg-green-100 dark:bg-green-900/40 border-green-400'
                                    : ''
                                  }

              /* ❌ user answer ALWAYS visible even if wrong */
              ${submitted && isUserAnswer && !isCorrectAnswer
                                    ? 'bg-red-100 dark:bg-red-900/40 border-red-400'
                                    : ''
                                  }
              `}
                              >
                                <input
                                  type="radio"
                                  name={`mcq_${idx}`}
                                  value={opt}
                                  checked={userChoice === opt}
                                  onChange={() =>
                                    handleAnswerChange(`mcq_${idx}`, 'mcq', opt)
                                  }
                                  disabled={submitted}
                                  className="mt-0.5 w-4 h-4"
                                />

                                <span
                                  className={`text-sm ${submitted && isCorrectAnswer
                                      ? 'text-green-700 dark:text-green-400 font-semibold'
                                      : submitted && isUserAnswer && !isCorrectAnswer
                                        ? 'text-red-700 dark:text-red-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                  {opt}
                                </span>

                                {/* LABELS giúp dễ nhìn hơn */}
                                {submitted && isCorrectAnswer && (
                                  <span className="ml-auto text-xs text-green-600 font-semibold">
                                    Correct
                                  </span>
                                )}

                                {submitted && isUserAnswer && !isCorrectAnswer && (
                                  <span className="ml-auto text-xs text-red-600 font-semibold">
                                    Your answer
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* EXPLANATION */}
                        {submitted && (
                          <div className="ml-10 mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm shadow-inner">
                            <p className="text-gray-600 dark:text-gray-300">
                              <span className="font-semibold">Explanation:</span>{' '}
                              {mcqResults[idx]?.explanation || 'No explanation available.'}
                            </p>

                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              <span className="font-semibold">Your answer:</span>{' '}
                              {userChoice || 'Not answered'}
                            </p>

                            <p className="text-green-600 dark:text-green-400 mt-1 font-semibold">
                              <span className="font-semibold">Correct answer:</span>{' '}
                              {q.correctAnswer}
                            </p>

                            <p className="text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                              Score: {mcqResults[idx]?.score || 0}/10
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Essay Section */}
              <div style={{ display: activeSection === 'text' ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Essay Questions
                  </h2>
                  {questions.text.map((q, idx) => {
                    const essayResult = submitted && textResults[idx];
                    const isLowScore = essayResult?.score < 5;
                    const stableKey = q._uid;
                    return (
                      <div
                        key={stableKey}
                        className={`bg-gray-50 dark:bg-gray-700/40 rounded-xl p-5 border transition-all duration-300 ${submitted
                            ? isLowScore
                              ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                              : 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20'
                            : 'border-gray-100 dark:border-gray-700'
                          }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">{idx + 1}</div>
                          <p className="font-medium text-gray-800 dark:text-white flex-1">{q.question}</p>
                        </div>
                        <div className="ml-10">
                          <textarea
                            rows={4}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-80"
                            placeholder="Type your answer here..."
                            value={answers[`text_${idx}`] || ''}
                            onChange={(e) => handleAnswerChange(`text_${idx}`, 'text', e.target.value)}
                            disabled={submitted}
                          />
                        </div>
                        {submitted && essayResult && (
                          <div className="ml-10 mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm shadow-inner space-y-2">
                            <p className="text-gray-600 dark:text-gray-300">
                              <span className="font-semibold">Your answer:</span> {essayResult.userAnswer || 'Not answered'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              <span className="font-semibold">Ideal keywords:</span> {essayResult.idealAnswerKeywords?.join(', ') || 'None'}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              <span className="font-semibold">Sample answer:</span> {essayResult.sampleAnswer || essayResult.aiSuggestedAnswer || 'N/A'}
                            </p>
                            <p className={`font-semibold mt-1 ${isLowScore ? 'text-red-600' : 'text-purple-600'}`}>
                              Score: {essayResult.score}/10
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button / Results Footer */}
              {!submitted && (
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Grading...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Submit Answers
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">* Review your answers carefully before submitting</p>
                </div>
              )}

              {submitted && (
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4">
                    <Award className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-gray-800 dark:text-white">Your total score: {totalScore}/100</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <button onClick={() => navigate('/welcome')} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
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
    </ErrorBoundary>
  );
}