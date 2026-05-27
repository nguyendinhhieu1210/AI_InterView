import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Loader2, RefreshCw, AlertCircle, Eye, BarChart3, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function CVHistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCVHistory();
  }, []);

  const fetchCVHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/cv/history');
      const rawList = res.data?.success && Array.isArray(res.data.history) ? res.data.history : [];
      const normalized = rawList.map(item => {
        let questionCount = 0;
        if (item.results && Array.isArray(item.results)) questionCount = item.results.length;
        else if (item.questions) {
          if (Array.isArray(item.questions)) questionCount = item.questions.length;
          else if (typeof item.questions === 'object') questionCount = Object.keys(item.questions).length;
        }
        let skillTags = [];
        if (item.topic) {
          if (Array.isArray(item.topic)) skillTags = item.topic;
          else if (typeof item.topic === 'string') skillTags = item.topic.split(',').map(s => s.trim());
        }
        return {
          id: item._id,
          cvName: item.cvName || 'CV-based Interview',
          skillTags: skillTags.slice(0, 4),
          questionCount,
          createdAt: item.createdAt,
          totalScore: item.totalScore || 0,
          detailPath: `/cv-history/${item._id}`
        };
      });
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load CV interview history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading CV‑based interviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchCVHistory} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-purple-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all duration-300 hover:gap-3 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
            <BarChart3 className="w-4 h-4 inline mr-2 text-purple-500" />
            <span className="font-semibold">{history.length} CV sessions</span>
          </div>
        </div>

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold pb-2 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            CV-Based Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Interviews generated from your uploaded CV</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-12 text-center">
            <FileText className="w-20 h-20 text-purple-300 dark:text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No CV‑based interviews yet</h3>
            <button onClick={() => navigate('/welcome')} className="mt-4 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700">Upload a CV to start</button>
          </div>
        ) : (
          <>
            {/* Different card design: gradient background on hover, skill tags prominent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHistory.map((item) => (
                <div key={item.id} className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden hover:scale-[1.02] border border-purple-200 dark:border-purple-800">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-200/40 to-transparent rounded-bl-3xl -z-0" />
                  <div className="p-5 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{item.cvName}</h3>
                      <Layers className="w-5 h-5 text-purple-500" />
                    </div>
                    {item.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.skillTags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(item.createdAt)}
                      <FileText className="w-3.5 h-3.5 ml-1" /> {item.questionCount} questions
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs text-gray-500">Overall Score</span>
                        <div className={`text-3xl font-black ${getScoreColor(item.totalScore)}`}>
                          {item.totalScore}<span className="text-sm">/100</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(item.detailPath)} className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-3 py-1.5 rounded-full text-sm font-medium transition">
                        Review <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="p-2 rounded-xl disabled:opacity-40"><ChevronLeft /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => handlePageChange(p)} className={`w-9 h-9 rounded-full ${currentPage === p ? 'bg-purple-600 text-white' : 'bg-white/70 dark:bg-gray-800/70 hover:bg-purple-100'}`}>{p}</button>
                ))}
                <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="p-2 rounded-xl disabled:opacity-40"><ChevronRight /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}