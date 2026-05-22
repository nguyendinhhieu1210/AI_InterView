import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Brain, HelpCircle, BarChart3, Loader2, RefreshCw, AlertCircle, Eye, Info,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchAllHistory();
    setTimeout(() => setPageLoaded(true), 50);
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  const fetchAllHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const [normalRes, cvRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } }))
      ]);

      const normalList = normalRes.data?.success && Array.isArray(normalRes.data.history) ? normalRes.data.history : [];
      const normalizedNormal = normalList.map(item => ({
        id: `interview_${item.id}`,
        originalId: item.id,
        type: 'interview',
        topic: item.topic || 'General',
        difficulty: item.difficulty || 'N/A',
        totalQuestions: item.totalQuestions || 0,
        createdAt: item.createdAt,
        totalScore: item.totalScore || 0,
        mcqScore: item.mcqScore,
        mcqCount: item.mcqCount,
        essayScore: item.essayScore,
        essayCount: item.essayCount,
        detailPath: `/history/${item.id}`,
        skillTags: null
      }));

      const cvList = cvRes.data?.success && Array.isArray(cvRes.data.history) ? cvRes.data.history : [];
      const normalizedCV = cvList.map(item => {
        let questionCount = 0;
        if (item.results && Array.isArray(item.results)) questionCount = item.results.length;
        else if (item.questions) {
          if (Array.isArray(item.questions)) questionCount = item.questions.length;
          else if (typeof item.questions === 'object') questionCount = Object.keys(item.questions).length;
        }
        const displayName = item.cvName || 'CV-based Interview';
        let skillTags = [];
        if (item.topic) {
          if (Array.isArray(item.topic)) skillTags = item.topic;
          else if (typeof item.topic === 'string') skillTags = item.topic.split(',').map(s => s.trim());
        }
        return {
          id: `cv_${item._id}`,
          originalId: item._id,
          type: 'cv',
          topic: displayName,
          difficulty: 'CV-based',
          totalQuestions: questionCount,
          createdAt: item.createdAt,
          totalScore: item.totalScore || 0,
          mcqScore: null,
          mcqCount: null,
          essayScore: item.totalScore,
          essayCount: questionCount,
          detailPath: `/cv-history/${item._id}`,
          skillTags: skillTags.slice(0, 3)
        };
      });

      const merged = [...normalizedNormal, ...normalizedCV];
      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(merged);
    } catch (err) {
      console.error(err);
      setError('Failed to load history');
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
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-700 dark:text-amber-400';
    if (score >= 40) return 'text-orange-700 dark:text-orange-400';
    return 'text-rose-700 dark:text-rose-400';
  };

  const filteredHistory = history.filter(item => filterType === 'all' ? true : item.type === filterType);
  const getFilterCount = (type) => type === 'all' ? history.length : history.filter(item => item.type === type).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchAllHistory} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-all">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-700 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header with back button and info */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slideDown">
          <button
            onClick={() => navigate('/welcome')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:gap-3 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-500 hover:text-indigo-500 transition-colors bg-white/60 dark:bg-gray-800/60 p-2 rounded-full"
              >
                <Info className="w-5 h-5" />
              </button>
              {showTooltip && (
                <div className="absolute right-0 top-10 z-10 w-64 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 backdrop-blur-md">
                  <p className="font-semibold mb-1">📋 Standard Interviews</p>
                  <p className="mb-2">Topic-based MCQ + Essay questions</p>
                  <p className="font-semibold mb-1">📄 CV Based Interviews</p>
                  <p>Scored on overall quality from your uploaded CV</p>
                </div>
              )}
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
              <BarChart3 className="w-4 h-4 inline mr-2 text-indigo-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredHistory.length} / {history.length} Sessions</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-10">
          {[
            { type: 'all', label: 'All' },
            { type: 'interview', label: 'Standard' },
            { type: 'cv', label: 'CV Based' }
          ].map(tab => (
            <button
              key={tab.type}
              onClick={() => setFilterType(tab.type)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${filterType === tab.type
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:scale-102'
                }`}
            >
              {tab.label} ({getFilterCount(tab.type)})
            </button>
          ))}
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.25] pb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Interview History
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base">
            Track your progress — both standard topic quizzes and CV-based interviews
          </p>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-12 text-center animate-fadeIn">
            <Brain className="w-20 h-20 text-indigo-300 dark:text-indigo-600 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              No {filterType !== 'all' ? (filterType === 'cv' ? 'CV-based' : 'standard') : ''} interviews yet
            </h3>
            <button onClick={() => navigate('/welcome')} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-md">
              Start your first interview →
            </button>
          </div>
        ) : (
          <>
            {/* Cards Grid with improved spacing and no descender cut-off */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {paginatedHistory.map((item, index) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col transform-gpu"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="p-5 md:p-6 flex-1">
                    {/* Header badges with proper line-height to avoid clipping */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 text-xs font-bold rounded-full leading-relaxed">
                        {item.type === 'cv' ? `📄 ${item.topic.length > 25 ? item.topic.slice(0, 25) + '…' : item.topic}` : item.topic}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full leading-relaxed">
                        {item.difficulty}
                      </span>
                    </div>

                    {/* Skill tags for CV */}
                    {item.type === 'cv' && item.skillTags && item.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.skillTags.map((tag, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full leading-relaxed">
                            {tag}
                          </span>
                        ))}
                        {item.skillTags.length > 3 && <span className="text-xs text-gray-400">+{item.skillTags.length - 3}</span>}
                      </div>
                    )}

                    {/* Date and questions info - fixed line-height */}
                    <div className="flex flex-wrap items-center text-xs text-gray-600 dark:text-gray-400 gap-x-4 gap-y-2 mb-3">
                      <span className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate leading-normal">{formatDate(item.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <HelpCircle className="w-3.5 h-3.5" /> {item.totalQuestions} questions
                      </span>
                    </div>

                    {/* Score breakdown */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium mb-2">
                      {item.type === 'interview' ? (
                        <>
                          <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 leading-relaxed">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> MCQ: {item.mcqScore}/{item.mcqCount * 10}
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 leading-relaxed">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div> Essay: {item.essayScore}/{item.essayCount * 10}
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 leading-relaxed">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div> Score: {item.essayScore}/{item.essayCount * 10}
                        </span>
                      )}
                    </div>

                    {/* Total Score */}
                    <div className="flex justify-end items-baseline gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                      <span className={`text-2xl font-extrabold ${getScoreColor(item.totalScore)} leading-none`}>
                        {item.totalScore}<span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => navigate(item.detailPath)}
                      className="w-full flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold group/btn active:scale-95"
                    >
                      View Details <Eye className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12 mb-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-100 dark:hover:bg-gray-700'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${currentPage === page
                          ? 'bg-indigo-600 text-white shadow-md scale-105'
                          : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-indigo-100 dark:hover:bg-gray-700'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-slideDown { animation: slideDown 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards; opacity: 0; }
        .animate-gradient { animation: gradient 8s ease infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
        .leading-relaxed { line-height: 1.5; }
        .leading-none { line-height: 1; }
      `}</style>
    </div>
  );
}