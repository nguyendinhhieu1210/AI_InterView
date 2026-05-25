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
  Award
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdaptiveHistoryPage() {
  const navigate = useNavigate();
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

  // Định dạng ngày giờ đầy đủ (không relative)
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

  // Màu sắc dựa trên thang điểm 10
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

  // Pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchAdaptiveHistory}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-indigo-700 transition"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/welcome')}
            className="p-2 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-indigo-50 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Adaptive Interview History
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              AI-powered interviews that adapt to your knowledge
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl shadow-sm">
            <Brain className="w-20 h-20 text-indigo-300 dark:text-indigo-600 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No adaptive interviews yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start an adaptive interview and test your knowledge in real-time.
            </p>
            <button
              onClick={() => navigate('/adaptive-interview')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md"
            >
              Start Adaptive Interview →
            </button>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">{sessions.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  {/* Điểm trung bình thang 10 */}
                  <div className="text-2xl font-bold text-gray-800 dark:text-white">
                    {(sessions.reduce((sum, s) => sum + (s.totalScore / 10), 0) / sessions.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Score (0-10)</div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
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

            {/* Session Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSessions.map((session) => {
                // Chuyển totalScore (thang 100) về thang 10
                const score10 = (session.totalScore / 10).toFixed(1);
                return (
                  <div
                    key={session.id}
                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col hover:-translate-y-1"
                  >
                    <div className="p-5 flex-1">
                      {/* Header badges */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> Adaptive
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getDifficultyBadge(session.difficulty)}`}>
                          {session.difficulty}
                        </span>
                      </div>

                      {/* Topic */}
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-1">
                        {session.topic}
                      </h3>

                      {/* Date & questions - chỉ hiển thị ngày giờ đầy đủ, không relative */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateTime(session.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{session.totalQuestions} questions</span>
                        </div>
                      </div>

                      {/* Score section - thang 10 */}
                      <div className="flex justify-between items-end mt-2">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Average Score (0-10)</div>
                          <div className={`text-2xl font-bold ${getScoreColor(parseFloat(score10))}`}>
                            {score10}
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/10</span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(session.detailPath)}
                          className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-sm font-medium flex items-center gap-1 transition group/btn"
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
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/70 dark:bg-gray-800/70 disabled:opacity-40 hover:bg-indigo-100 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white shadow-md scale-105'
                          : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-indigo-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/70 dark:bg-gray-800/70 disabled:opacity-40 hover:bg-indigo-100 transition"
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