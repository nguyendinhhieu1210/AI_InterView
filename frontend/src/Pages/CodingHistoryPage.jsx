import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Code, Loader2, RefreshCw, AlertCircle, Eye, BarChart3, ChevronLeft, ChevronRight, Layers, Terminal, Tag } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CodingHistoryPage() {
  const navigate = useNavigate();
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
      case 'beginner': return 'bg-success/20 text-success';
      case 'intermediate': return 'bg-warning/20 text-warning';
      case 'advanced': return 'bg-error/20 text-error';
      default: return 'bg-muted/20 text-muted';
    }
  };

  const getLanguageColor = (lang) => {
    const map = {
      javascript: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300',
      python: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
      java: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
      cpp: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
      go: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300',
    };
    return map[lang?.toLowerCase()] || 'bg-muted/20 text-muted';
  };

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Màu chính cho Coding: Rose (giống card Coding trong HistoryPage)
  const codingColor = {
    primary: 'rose',
    bgLight: 'bg-rose-100 dark:bg-rose-950/40',
    textLight: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    gradient: 'from-rose-600 to-pink-600'
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted animate-pulse">Loading coding sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <div className="bg-card rounded-2xl p-8 text-center max-w-md shadow-soft border border-border">
          <AlertCircle className="w-14 h-14 text-error mx-auto mb-4" />
          <p className="text-text mb-6">{error}</p>
          <button onClick={fetchCodingSessions} className="px-5 py-2.5 bg-primary text-white rounded-xl flex items-center gap-2 mx-auto hover:brightness-105 transition shadow-md">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header - Back button row */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 hover:gap-3 font-medium bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back
          </button>
          <div className="bg-card/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-soft border border-border">
            <Code className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-semibold text-text">{sessions.length} Coding Sessions</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-normal pb-2 bg-gradient-to-r from-rose-600 to-pink-600 dark:from-rose-400 dark:to-pink-400 bg-clip-text text-transparent">
            Coding Interview History
          </h1>
          <p className="text-muted mt-2 text-sm md:text-base">
            Live coding sessions with AI code evaluation & explanation Q&A
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-card backdrop-blur rounded-2xl p-12 text-center shadow-soft border border-border">
            <Code className="w-20 h-20 text-primary/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-2">No coding sessions yet</h3>
            <p className="text-muted mb-4">Start a live coding session and test your programming skills.</p>
            <button onClick={() => navigate('/welcome')} className="px-6 py-2.5 bg-primary text-white rounded-xl hover:brightness-105 transition shadow-md">
              Start Coding Session →
            </button>
          </div>
        ) : (
          <>
            {/* Stats summary cards - màu rose */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-950/40 rounded-xl">
                    <Code className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">{sessions.length}</div>
                    <div className="text-xs text-muted">Total Sessions</div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl">
                    <Layers className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">
                      {sessions.reduce((sum, s) => sum + s.totalRounds, 0)}
                    </div>
                    <div className="text-xs text-muted">Total Code Rounds</div>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-950/40 rounded-xl">
                    <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">
                      {[...new Set(sessions.map(s => s.language))].length}
                    </div>
                    <div className="text-xs text-muted">Languages Used</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Session Cards - border-l-rose-500 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSessions.map((session) => (
                <div
                  key={session.id}
                  className="group bg-card rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border-l-8 border-l-rose-500 overflow-hidden flex flex-col hover:-translate-y-1"
                >
                  <div className="p-5 flex-1">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-sm font-bold rounded-full flex items-center gap-1">
                        <Code className="w-3 h-3" /> Coding
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-text mb-3 line-clamp-1">
                      {session.topic}
                    </h3>

                    {/* Thông tin chi tiết với nhãn rõ ràng */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-muted" />
                        <span className="text-muted w-20">Language:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLanguageColor(session.language)}`}>
                          {session.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted" />
                        <span className="text-muted w-20">Domain:</span>
                        <span className="text-text">{session.domain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-muted" />
                        <span className="text-muted w-20">Rounds:</span>
                        <span className="text-text">{session.totalRounds} code round(s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted" />
                        <span className="text-muted w-20">Date:</span>
                        <span className="text-text text-xs">{formatDate(session.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end items-center pt-2 border-t border-border">
                      <button
                        onClick={() => navigate(`/coding-history/${session.id}`)}
                        className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-full text-sm font-medium transition group/btn"
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
                  className="p-2 rounded-xl disabled:opacity-40 text-text hover:bg-primary/10 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                      currentPage === p
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-card text-text hover:bg-primary/10'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 rounded-xl disabled:opacity-40 text-text hover:bg-primary/10 transition"
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