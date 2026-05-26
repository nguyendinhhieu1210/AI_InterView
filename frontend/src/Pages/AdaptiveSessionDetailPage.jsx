import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Clock,
  User,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Sparkles,
  Target,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdaptiveSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQA, setExpandedQA] = useState({});

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/adaptive/session/${sessionId}`);
      setSession(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 6) return 'text-amber-600 dark:text-amber-400';
    if (score >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (score >= 6) return 'bg-amber-100 dark:bg-amber-900/30';
    if (score >= 4) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-rose-100 dark:bg-rose-900/30';
  };

  const toggleExpand = (index) => {
    setExpandedQA(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading your interview report...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Session not found'}</p>
          <button
            onClick={() => navigate('/adaptive-history')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-indigo-700 transition shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Back to History
          </button>
        </div>
      </div>
    );
  }

  // Lấy breakdown từ summary để lấy idealAnswer và feedback theo thứ tự
  const breakdownMap = new Map();
  if (session.summary && session.summary.questionBreakdown) {
    session.summary.questionBreakdown.forEach((item) => {
      breakdownMap.set(item.questionNumber, item);
    });
  }

  // Xây dựng các cặp Q&A từ conversation
  const qaPairs = [];
  for (let i = 0; i < session.conversation.length - 1; i++) {
    const msg = session.conversation[i];
    const next = session.conversation[i + 1];
    if (msg.role === 'assistant' && msg.type === 'question' && next.role === 'user' && next.type === 'answer') {
      const qNumber = qaPairs.length + 1;
      const breakdown = breakdownMap.get(qNumber) || {};
      qaPairs.push({
        index: qNumber,
        question: msg.content,
        questionScore: msg.score || null,
        questionSubtopic: msg.subtopic || null,
        answer: next.content,
        answerScore: next.score || null,
        strengths: next.strengths || [],
        weaknesses: next.weaknesses || [],
        missingConcepts: next.missingConcepts || [],
        idealAnswer: breakdown.idealAnswer || null,
        feedback: breakdown.feedback || null,
        verdict: breakdown.verdict || null,
        createdAt: msg.createdAt
      });
    }
  }

  const summary = session.summary || {};
  const finalScore10 = session.finalScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/adaptive-history')}
            className="group p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
          </button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-normal bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-1">
                  {session.topic}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(session.createdAt)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    session.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  }`}>{session.difficulty}</span>
                  <span className="flex items-center gap-1.5"><Brain className="w-4 h-4" />{qaPairs.length} questions</span>
                  {session.status && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs font-medium">
                      {session.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-sm border border-indigo-100 dark:border-indigo-900">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Final Score</div>
                  <div className={`text-3xl font-black ${getScoreColor(finalScore10)}`}>
                    {finalScore10.toFixed(1)}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/30 dark:border-gray-700/50 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{finalScore10.toFixed(1)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score (0-10)</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/30 dark:border-gray-700/50 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-white truncate">{summary.overallEvaluation || 'N/A'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Evaluation</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/30 dark:border-gray-700/50 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800 dark:text-white">{summary.grade || 'N/A'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Grade</div>
              </div>
            </div>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/30 dark:border-gray-700/50 hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-gray-800 dark:text-white">{summary.hireRecommendation || 'N/A'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Recommendation</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        {summary.summary && (
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-sm mb-8 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-2">AI Interviewer's Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{summary.summary}</p>
                {(summary.strengths?.length > 0 || summary.weaknesses?.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {summary.strengths?.length > 0 && (
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Key Strengths</div>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.strengths.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">+ {s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.weaknesses?.length > 0 && (
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> Areas to Improve</div>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.weaknesses.map((w, i) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full">- {w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Q&A Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Interview Transcript & Detailed Scoring</h2>
          </div>

          <div className="space-y-4">
            {qaPairs.map((qa, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-md"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex justify-between items-center"
                  onClick={() => toggleExpand(idx)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${getScoreBg(qa.answerScore)} ${getScoreColor(qa.answerScore)}`}>
                      {qa.answerScore?.toFixed(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">
                        Question {qa.index}
                        {qa.questionSubtopic && (
                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                            {qa.questionSubtopic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-md">
                        {qa.question}
                      </p>
                    </div>
                  </div>
                  {expandedQA[idx] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 transition-transform" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 transition-transform" />
                  )}
                </div>

                {expandedQA[idx] && (
                  <div className="p-5 border-t border-gray-200 dark:border-gray-700 space-y-5 bg-gray-50/50 dark:bg-gray-800/50">
                    {/* Question */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Interviewer Question</div>
                        <p className="text-gray-800 dark:text-white">{qa.question}</p>
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Your Answer</div>
                        <p className="text-gray-800 dark:text-white whitespace-pre-wrap">{qa.answer}</p>
                      </div>
                    </div>

                    {/* Score & Verdict */}
                    {qa.answerScore !== null && (
                      <div className="flex items-center gap-2 pt-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBg(qa.answerScore)} ${getScoreColor(qa.answerScore)}`}>
                          Score: {qa.answerScore.toFixed(1)}/10
                        </div>
                        {qa.verdict && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Verdict: <span className="font-semibold">{qa.verdict}</span>
                          </div>
                        )}
                        {qa.answerScore >= 7 ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Good Answer</span>
                          </div>
                        ) : qa.answerScore >= 4 ? (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Needs Improvement</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Weak Answer</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Ideal Answer (THÊM MỚI) */}
                    {qa.idealAnswer && (
                      <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">✨ Ideal Answer (What the interviewer expected)</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{qa.idealAnswer}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Feedback (THÊM MỚI) */}
                    {qa.feedback && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">📝 AI Feedback</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{qa.feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {qa.strengths.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> What you did well
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.strengths.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {qa.weaknesses.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Areas for improvement
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.weaknesses.map((w, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full">
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Concepts */}
                    {qa.missingConcepts && qa.missingConcepts.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Missing concepts to study
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.missingConcepts.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Learning Roadmap */}
        {summary.learningRoadmap && summary.learningRoadmap.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-3">Recommended Learning Roadmap</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.learningRoadmap.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 text-sm rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                      📘 {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}