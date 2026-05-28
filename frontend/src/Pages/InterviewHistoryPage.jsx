import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, HelpCircle, Brain, Loader2, RefreshCw, AlertCircle, Eye, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/interview/history');
      const rawList = res.data?.success && Array.isArray(res.data.history) ? res.data.history : [];
      const normalized = rawList.map(item => ({
        id: item.id,
        topic: item.topic || 'General',
        difficulty: item.difficulty || 'N/A',
        totalQuestions: item.totalQuestions || 0,
        createdAt: item.createdAt,
        totalScore: item.totalScore || 0,
        mcqScore: item.mcqScore,
        mcqCount: item.mcqCount,
        essayScore: item.essayScore,
        essayCount: item.essayCount,
        detailPath: `/history/${item.id}`
      }));
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load interview history');
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
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-300';
    if (score >= 60) return 'text-amber-600 dark:text-amber-300';
    if (score >= 40) return 'text-orange-600 dark:text-orange-300';
    return 'text-rose-600 dark:text-rose-300';
  };

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading interview history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchInterviewHistory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header with Back button and Stats */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/history')}
            className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:gap-3 font-medium bg-white/90 dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-full px-5 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
            <BarChart3 className="w-4 h-4 inline mr-2 text-blue-500 dark:text-blue-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">{history.length} Interview sessions</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold pb-2 text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Interview History
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Topic‑based MCQ + Essay interviews</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-md border border-gray-200 dark:border-gray-700">
            <Brain className="w-20 h-20 text-blue-300 dark:text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No interviews yet</h3>
            <button onClick={() => navigate('/welcome')} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
              Start your first interview →
            </button>
          </div>
        ) : (
          <>
            {/* Grid of interview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-8 border-l-blue-500 overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1">
                    {/* Topic and Difficulty badges */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-sm font-bold rounded-full">
                        {item.topic}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        {item.difficulty}
                      </span>
                    </div>
                    
                    {/* Date and questions count */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <Calendar className="w-3.5 h-3.5" /> 
                      <span>{formatDate(item.createdAt)}</span>
                      <HelpCircle className="w-3.5 h-3.5 ml-1" /> 
                      <span>{item.totalQuestions} questions</span>
                    </div>
                    
                    {/* MCQ & Essay scores */}
                    <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span>MCQ: {item.mcqScore}/{item.mcqCount * 10}</span>
                      <span>Essay: {item.essayScore}/{item.essayCount * 10}</span>
                    </div>
                    
                    {/* Total score */}
                    <div className="flex justify-end items-baseline gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                      <span className={`text-2xl font-bold ${getScoreColor(item.totalScore)}`}>
                        {item.totalScore}<span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Detail button */}
                  <div className="p-4 pt-0">
                    <button 
                      onClick={() => navigate(item.detailPath)} 
                      className="w-full flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 py-2 rounded-xl transition font-medium"
                    >
                      Details <Eye className="w-4 h-4" />
                    </button>
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
                  className="p-2 rounded-xl disabled:opacity-40 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button 
                    key={p} 
                    onClick={() => handlePageChange(p)} 
                    className={`w-9 h-9 rounded-full font-medium transition ${
                      currentPage === p 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  className="p-2 rounded-xl disabled:opacity-40 text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}