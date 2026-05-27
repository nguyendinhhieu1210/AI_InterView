import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Brain, HelpCircle, BarChart3, Loader2, RefreshCw, AlertCircle, Eye, Info,
  ChevronLeft, ChevronRight, FolderOpen, FileText, Cpu
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { loading: authLoading } = useAuth();
  const [counts, setCounts] = useState({
    interview: 0,
    cv: 0,
    adaptive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    fetchCounts();
    setTimeout(() => setPageLoaded(true), 50);
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch only the history lists to get the lengths (or use count endpoints if available)
      const [normalRes, cvRes, adaptiveRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/adaptive/history').catch(() => ({ data: { success: false, history: [] } }))
      ]);

      const normalCount = normalRes.data?.success && Array.isArray(normalRes.data.history) ? normalRes.data.history.length : 0;
      const cvCount = cvRes.data?.success && Array.isArray(cvRes.data.history) ? cvRes.data.history.length : 0;
      const adaptiveCount = adaptiveRes.data?.success && Array.isArray(adaptiveRes.data.history) ? adaptiveRes.data.history.length : 0;

      setCounts({
        interview: normalCount,
        cv: cvCount,
        adaptive: adaptiveCount
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load history counts');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (type) => {
  switch(type) {
    case 'interview':
      navigate('/interview-history');   // ✅ route riêng cho danh sách standard
      break;
    case 'cv':
      navigate('/cv-history');          // ✅ route riêng cho danh sách CV
      break;
    case 'adaptive':
      navigate('/adaptive-history');    // ✅ route riêng cho adaptive
      break;
    default: break;
  }
};

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse">Loading history data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={fetchCounts} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 mx-auto hover:bg-indigo-700 transition-all">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-700 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header with back button */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slideDown">
          <button
            onClick={() => navigate('/welcome')}
            className="group flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 hover:gap-3 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
            <BarChart3 className="w-4 h-4 inline mr-2 text-indigo-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">History Hub</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.25] pb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
            Select an interview type to view detailed history and performance analytics
          </p>
        </div>

        {/* Three Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Standard Interviews Card */}
          <div
            onClick={() => handleNavigate('interview')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden transform-gpu"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Standard</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Topic-based MCQ + Essay interviews</p>
              <div className="inline-flex items-baseline gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{counts.interview}</span>
                <span className="text-gray-600 dark:text-gray-300">sessions</span>
              </div>
              <div className="mt-5 text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View history <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>

          {/* CV Based Interviews Card */}
          <div
            onClick={() => handleNavigate('cv')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden transform-gpu"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FolderOpen className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">CV Based</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Interviews generated from your CV</p>
              <div className="inline-flex items-baseline gap-1 bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-full">
                <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{counts.cv}</span>
                <span className="text-gray-600 dark:text-gray-300">sessions</span>
              </div>
              <div className="mt-5 text-purple-600 dark:text-purple-400 font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View history <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>

          {/* Adaptive Interviews Card */}
          <div
            onClick={() => handleNavigate('adaptive')}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden transform-gpu"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Adaptive</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Difficulty adjusts to your skill level</p>
              <div className="inline-flex items-baseline gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full">
                <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{counts.adaptive}</span>
                <span className="text-gray-600 dark:text-gray-300">sessions</span>
              </div>
              <div className="mt-5 text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                View history <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </div>
          </div>
        </div>

        {/* Optional: Recent Activity Summary (could add later) */}
        <div className="mt-16 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Click on any card to see detailed history for that interview type.</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-slideDown { animation: slideDown 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1); }
        .animate-scaleIn { animation: scaleIn 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards; opacity: 0; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
      `}</style>
    </div>
  );
}