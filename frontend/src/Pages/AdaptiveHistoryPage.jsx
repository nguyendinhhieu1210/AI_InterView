// frontend/src/pages/AdaptiveHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AdaptiveHistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchAdaptiveHistory();
  }, []);

  const fetchAdaptiveHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/adaptive/history');
      if (res.data.success) {
        setSessions(res.data.history);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load adaptive interview history');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreColor = (score10) => {
    if (score10 >= 8) return 'text-emerald-600 dark:text-emerald-400';
    if (score10 >= 6) return 'text-amber-600 dark:text-amber-400';
    if (score10 >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      easy: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
      hard: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
    };
    return colors[difficulty?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading adaptive history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchAdaptiveHistory} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-emerald-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header - Back button row (giống InterviewHistoryPage) */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 hover:gap-3 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to History
          </button>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
            <BarChart3 className="w-4 h-4 inline mr-2 text-emerald-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{sessions.length} Adaptive Sessions</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Adaptive Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            AI-powered interviews that adapt to your knowledge level
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-12 text-center">
            <Brain className="w-20 h-20 text-emerald-300 dark:text-emerald-600 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No adaptive interviews yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start an adaptive interview and test your knowledge in real-time.</p>
            <button onClick={() => navigate('/adaptive-interview')} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition shadow-md">
              Start Adaptive Interview →
            </button>
          </div>
        ) : (
          <>
            {/* Stats summary cards - đồng bộ style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                    <Brain className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{sessions.length}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
                    <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {(sessions.reduce((sum, s) => sum + (s.totalScore / 10), 0) / sessions.length).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score (0-10)</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {sessions.filter(s => (s.totalScore / 10) >= 7).length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">High Scores (≥7.0)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Cards - border-left-emerald-500 giống interview và cv */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSessions.map((session) => {
                const score10 = (session.totalScore / 10).toFixed(1);
                return (
                  <div
                    key={session.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-8 border-l-emerald-500 overflow-hidden flex flex-col hover:-translate-y-1"
                  >
                    <div className="p-5 flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 text-sm font-bold rounded-full flex items-center gap-1">
                          <Brain className="w-3 h-3" /> Adaptive
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyBadge(session.difficulty)}`}>
                          {session.difficulty}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">
                        {session.topic}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDateTime(session.createdAt)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {session.totalQuestions} questions</span>
                      </div>

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Average Score</span>
                          <div className={`text-2xl font-bold ${getScoreColor(parseFloat(score10))}`}>
                            {score10}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">/10</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(session.detailPath)}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-1.5 rounded-full text-sm font-medium transition group/btn"
                        >
                          Details <Eye className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2 rounded-xl disabled:opacity-40 hover:bg-emerald-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                      currentPage === p
                        ? 'bg-emerald-600 text-white shadow-md scale-105'
                        : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 rounded-xl disabled:opacity-40 hover:bg-emerald-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
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