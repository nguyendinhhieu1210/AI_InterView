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
import { useTheme } from '../contexts/ThemeContext';

export default function AdaptiveSessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
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
    if (score >= 8) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200';
    if (score >= 6) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200';
    if (score >= 4) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    return 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200';
  };

  const toggleExpand = (index) => {
    setExpandedQA(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse leading-relaxed">Loading interview report...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{error || 'Session not found'}</p>
          <button
            onClick={() => navigate('/adaptive-history')}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md"
          >
            Back 
          </button>
        </div>
      </div>
    );
  }

  // Build Q&A pairs from conversation
  const breakdownMap = new Map();
  if (session.summary && session.summary.questionBreakdown) {
    session.summary.questionBreakdown.forEach((item) => {
      breakdownMap.set(item.questionNumber, item);
    });
  }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/30 to-teal-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/adaptive-history')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Adaptive Interview</span>
          </div>
        </div>

        {/* Thông tin chính */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">
            <Brain className="w-4 h-4" />
            <span>AI-Powered Adaptive Interview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            {session.topic}
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(session.createdAt)}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              session.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
              session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' :
              'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
            }`}>{session.difficulty}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{qaPairs.length} questions</span>
          </div>
        </div>

        {/* 4 thẻ thống kê */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition">
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(finalScore10)} leading-none`}>
              {finalScore10.toFixed(1)}<span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Final Score</div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/70 transition">
              <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{summary.overallEvaluation || 'N/A'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Evaluation</div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/70 transition">
              <Target className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{summary.hireRecommendation || 'N/A'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Recommendation</div>
          </div>

          <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/70 transition">
              <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{summary.grade || 'N/A'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Grade</div>
          </div>
        </div>

        {/* AI Summary Section */}
        {summary.summary && (
          <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 shadow-sm mb-8 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-2 leading-tight">AI Interviewer's Summary</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{summary.summary}</p>
                {(summary.strengths?.length > 0 || summary.weaknesses?.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-4">
                    {summary.strengths?.length > 0 && (
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1 leading-relaxed">
                          <CheckCircle className="w-3 h-3" /> Key Strengths
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.strengths.map((s, i) => (
                            <span key={i} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full leading-relaxed">
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {summary.weaknesses?.length > 0 && (
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1 leading-relaxed">
                          <XCircle className="w-3 h-3" /> Areas to Improve
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.weaknesses.map((w, i) => (
                            <span key={i} className="px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full leading-relaxed">
                              - {w}
                            </span>
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
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">Interview Transcript & Detailed Scoring</h2>
          </div>

          <div className="space-y-4">
            {qaPairs.map((qa, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full p-5 text-left flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${getScoreBg(qa.answerScore)} ${getScoreColor(qa.answerScore)} leading-tight`}>
                      {qa.answerScore?.toFixed(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        {/* ✅ ĐÃ SỬA: class như yêu cầu */}
                        <span className="font-semibold text-gray-800 dark:text-white text-base leading-relaxed">
                          Question {qa.index}
                        </span>
                        {qa.questionSubtopic && (
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full leading-relaxed">
                            {qa.questionSubtopic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-1 max-w-md leading-relaxed font-medium">
                        {qa.question}
                      </p>
                    </div>
                  </div>
                  {expandedQA[idx] ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                  )}
                </button>

                {expandedQA[idx] && (
                  <div className="p-5 border-t border-gray-200 dark:border-gray-700 space-y-5 bg-gray-50 dark:bg-gray-800/50 animate-slideDown">
                    {/* Question */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 leading-relaxed">Interviewer Question</div>
                        <p className="text-gray-800 dark:text-white leading-relaxed text-sm">{qa.question}</p>
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
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1 leading-relaxed">Your Answer</div>
                        <p className="text-gray-800 dark:text-white whitespace-pre-wrap leading-relaxed text-sm">{qa.answer}</p>
                      </div>
                    </div>

                    {/* Score & Verdict */}
                    {qa.answerScore !== null && (
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBg(qa.answerScore)} ${getScoreColor(qa.answerScore)} leading-relaxed`}>
                          Score: {qa.answerScore.toFixed(1)}/10
                        </div>
                        {qa.verdict && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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

                    {/* AI Ideal Answer */}
                    {qa.idealAnswer && (
                      <div className="flex gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1 leading-relaxed">✨ Ideal Answer (What the interviewer expected)</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{qa.idealAnswer}</p>
                        </div>
                      </div>
                    )}

                    {/* AI Feedback */}
                    {qa.feedback && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 leading-relaxed">📝 AI Feedback</div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{qa.feedback}</p>
                        </div>
                      </div>
                    )}

                    {/* Strengths */}
                    {qa.strengths.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1 leading-relaxed">
                          <CheckCircle className="w-3 h-3" /> What you did well
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.strengths.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-full leading-relaxed">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {qa.weaknesses.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1 leading-relaxed">
                          <XCircle className="w-3 h-3" /> Areas for improvement
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.weaknesses.map((w, i) => (
                            <span key={i} className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-full leading-relaxed">
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Concepts */}
                    {qa.missingConcepts && qa.missingConcepts.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1 leading-relaxed">
                          <BookOpen className="w-3 h-3" /> Missing concepts to study
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {qa.missingConcepts.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full leading-relaxed">
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
                <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-3 leading-tight">Recommended Learning Roadmap</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.learningRoadmap.map((item, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 leading-relaxed">
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
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}