import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Code, Loader2, RefreshCw, AlertCircle, Eye, BarChart3, ChevronLeft, ChevronRight, Layers, Terminal, Tag } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function CodingHistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCodingSessions();
  }, []);

  const fetchCodingSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/live-coding/history');
      const rawList = res.data?.history || [];
      const normalized = rawList.map(item => ({
        id: item.id,
        language: item.language,
        domain: item.domain,
        topic: item.topic,
        difficulty: item.difficulty,
        totalRounds: item.totalQuestions || 0,
        createdAt: item.createdAt,
      }));
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load coding session history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200';
      case 'intermediate': return 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200';
      case 'advanced': return 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getLanguageColor = (lang) => {
    const map = {
      javascript: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200',
      python: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
      java: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200',
      cpp: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
      go: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200',
    };
    return map[lang?.toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-sky-500 dark:text-sky-400 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading coding sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchCodingSessions} className="px-5 py-2.5 bg-sky-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-sky-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header - Back button row (giống AdaptiveHistoryPage) */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-all duration-300 hover:gap-3 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back
          </button>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
            <Code className="w-4 h-4 inline mr-2 text-sky-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{sessions.length} Coding Sessions</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-normal pb-2 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
            Coding Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            Live coding sessions with AI code evaluation & explanation Q&A
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-12 text-center">
            <Code className="w-20 h-20 text-sky-300 dark:text-sky-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No coding sessions yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Start a live coding session and test your programming skills.</p>
            <button onClick={() => navigate('/welcome')} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition shadow-md">
              Start Coding Session →
            </button>
          </div>
        ) : (
          <>
            {/* Stats summary cards (tương tự Adaptive) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-100 dark:bg-sky-900/50 rounded-xl">
                    <Code className="w-5 h-5 text-sky-600 dark:text-sky-400" />
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
                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {sessions.reduce((sum, s) => sum + s.totalRounds, 0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Code Rounds</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                    <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {[...new Set(sessions.map(s => s.language))].length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Languages Used</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Cards - border-left-sky-500, layout rõ ràng */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSessions.map((session) => (
                <div
                  key={session.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-8 border-l-sky-500 overflow-hidden flex flex-col hover:-translate-y-1"
                >
                  <div className="p-5 flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-200 text-sm font-bold rounded-full flex items-center gap-1">
                        <Code className="w-3 h-3" /> Coding
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 line-clamp-1">
                      {session.topic}
                    </h3>

                    {/* Thông tin chi tiết với nhãn rõ ràng */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 w-20">Language:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLanguageColor(session.language)}`}>
                          {session.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 w-20">Domain:</span>
                        <span className="text-gray-700 dark:text-gray-300">{session.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 w-20">Rounds:</span>
                        <span className="text-gray-700 dark:text-gray-300">{session.totalRounds} code round(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400 w-20">Date:</span>
                        <span className="text-gray-700 dark:text-gray-300 text-xs">{formatDate(session.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => navigate(`/coding-history/${session.id}`)}
                        className="flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 px-3 py-1.5 rounded-full text-sm font-medium transition group/btn"
                      >
                        View Details <Eye className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2 rounded-xl disabled:opacity-40 hover:bg-sky-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                      currentPage === p
                        ? 'bg-sky-600 text-white shadow-md scale-105'
                        : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-sky-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 rounded-xl disabled:opacity-40 hover:bg-sky-100 dark:hover:bg-gray-700 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
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