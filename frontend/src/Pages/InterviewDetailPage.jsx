import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, TrendingUp, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Trash2
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function InterviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const idleTimer = useRef(null);
  const countdownTimer = useRef(null);
  const isCountingDown = useRef(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/interview/history/${id}`);
      if (response.data.success && response.data.interview) {
        setInterview(response.data.interview);
      } else {
        throw new Error('Interview not found');
      }
    } catch (err) {
      console.error('Detail fetch error:', err);
      if (err.response?.status === 404) {
        setError('Interview not found. It may have been deleted.');
      } else if (err.response?.status === 401) {
        return;
      } else {
        setError(err.message || 'Failed to load interview details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return;
    try {
      await api.delete(`/interview/history/${id}`);
      navigate('/history');
    } catch (error) {
      alert('Delete failed');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      navigate('/login');
    }, 2000);
  };

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    if (isCountingDown.current) isCountingDown.current = false;
    idleTimer.current = setTimeout(() => {
      isCountingDown.current = true;
      countdownTimer.current = setTimeout(() => handleLogout(), 30 * 60 * 1000);
    }, 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    const resetAndStart = () => resetIdleTimer();
    events.forEach(event => window.addEventListener(event, resetAndStart));
    resetIdleTimer();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetAndStart));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading details...</span>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'Interview not found'}</p>
          <button onClick={() => navigate('/history')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // Lấy dữ liệu từ kết quả trả về (backend mới trả về mcqResults và textResults)
  const mcqResults = interview.mcqResults || [];
  const essayResults = interview.textResults || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 md:py-8 transition-colors duration-300">
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center animate-fadeIn">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Logging out...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Delete */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:gap-3 font-medium"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to History
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>

        {/* Title & Meta */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            {interview.topic} · {interview.difficulty}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Completed on {formatDate(interview.createdAt)}</p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <TrendingUp className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <div className={`text-2xl font-bold ${getScoreColor(interview.totalScore)}`}>
              {interview.totalScore}<span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{interview.mcqScore || 0}<span className="text-sm text-gray-500 dark:text-gray-400">/{interview.mcqCount * 10}</span></div>
            <div className="text-xs text-gray-600 dark:text-gray-400">MCQ Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{interview.essayScore || 0}<span className="text-sm text-gray-500 dark:text-gray-400">/{interview.essayCount * 10}</span></div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Essay Score</div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
            <Award className="w-5 h-5 text-indigo-500" /> Questions & Answers
          </h2>

          {/* MCQ Questions - using mcqResults */}
          {mcqResults.map((result, idx) => {
            const isCorrect = result.isCorrect;
            const userAnswer = result.userAnswer || '';
            const correctAnswer = result.correctAnswer;
            const explanation = result.explanation;
            const options = result.options || [];
            const questionText = result.question;
            const score = result.score || 0;

            return (
              <div key={`mcq-${idx}`} className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === `mcq_${idx}` ? null : `mcq_${idx}`)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">Question {idx + 1}: {questionText}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
                          Score: {score}/10
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedQuestion === `mcq_${idx}` ? <ChevronUp className="w-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 text-gray-400 shrink-0" />}
                </button>

                {expandedQuestion === `mcq_${idx}` && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm animate-slideDown">
                    {/* Options list with highlighting */}
                    <div className="space-y-2">
                      {options.map((option, optIdx) => {
                        const isCorrectOption = option === correctAnswer;
                        const isUserOption = option === userAnswer;
                        let bgClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
                        let textClass = 'text-gray-700 dark:text-gray-300';
                        let icon = null;

                        if (isCorrectOption) {
                          bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
                          textClass = 'text-emerald-800 dark:text-emerald-200 font-medium';
                          icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
                        } else if (isUserOption) {
                          bgClass = 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700';
                          textClass = 'text-rose-800 dark:text-rose-200 font-medium';
                          icon = <XCircle className="w-4 h-4 text-rose-500" />;
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center justify-between p-3 rounded-lg border ${bgClass} transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold w-6 text-gray-500 dark:text-gray-400">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className={`text-sm ${textClass}`}>{option}</span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {explanation && (
                      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs mb-1">Explanation:</p>
                        <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">{explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Essay Questions - using textResults */}
          {essayResults.map((result, idx) => {
            const userAnswer = result.userAnswer || '';
            const sampleAnswer = result.sampleAnswer || '';
            const idealKeywords = result.idealAnswerKeywords || [];
            const score = result.score || 0;
            const explanation = result.explanation || '';
            const feedback = result.feedback || '';
            const questionText = result.question;

            return (
              <div key={`essay-${idx}`} className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <button
                  onClick={() => setExpandedQuestion(expandedQuestion === `essay_${idx}` ? null : `essay_${idx}`)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">Question {idx + 1}: {questionText}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getScoreBg(score)} text-gray-800 dark:text-gray-200`}>
                        Score: {score}/10
                      </span>
                    </div>
                  </div>
                  {expandedQuestion === `essay_${idx}` ? <ChevronUp className="w-5 text-gray-400" /> : <ChevronDown className="w-5 text-gray-400" />}
                </button>
                {expandedQuestion === `essay_${idx}` && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 space-y-3 text-sm animate-slideDown">
                    <div>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Your answer:</p>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mt-1 whitespace-pre-wrap border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {userAnswer || '—'}
                      </div>
                    </div>
                    {sampleAnswer && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Sample answer:</p>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mt-1 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                          {sampleAnswer}
                        </div>
                      </div>
                    )}
                    {idealKeywords.length > 0 && (
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Ideal keywords:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {idealKeywords.map((kw, i) => (
                            <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {explanation && (
                      <div>
                        <p className="font-semibold text-indigo-600 dark:text-indigo-400">Grading explanation:</p>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">{explanation}</p>
                      </div>
                    )}
                    {feedback && (
                      <div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400">Feedback:</p>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">{feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {mcqResults.length === 0 && essayResults.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No questions found.</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}