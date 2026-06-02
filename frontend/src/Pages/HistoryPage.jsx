import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Loader2, RefreshCw, AlertCircle,
  FolderOpen, FileText, Cpu, Code, Eye
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
    adaptive: 0,
    coding: 0
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

      const [normalRes, cvRes, adaptiveRes, codingRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/adaptive/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/live-coding/history').catch(() => ({ data: { success: false, history: [] } }))
      ]);

      const normalCount = normalRes.data?.success && Array.isArray(normalRes.data.history) ? normalRes.data.history.length : 0;
      const cvCount = cvRes.data?.success && Array.isArray(cvRes.data.history) ? cvRes.data.history.length : 0;
      const adaptiveCount = adaptiveRes.data?.success && Array.isArray(adaptiveRes.data.history) ? adaptiveRes.data.history.length : 0;
      const codingCount = codingRes.data?.history?.length || 0;

      setCounts({
        interview: normalCount,
        cv: cvCount,
        adaptive: adaptiveCount,
        coding: codingCount
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load history counts');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (type) => {
    switch (type) {
      case 'interview': navigate('/interview-history'); break;
      case 'cv': navigate('/cv-history'); break;
      case 'adaptive': navigate('/adaptive-history'); break;
      case 'coding': navigate('/coding-history'); break;
      default: break;
    }
  };

  const themes = {
    interview: {
      bgIcon: 'bg-indigo-100 dark:bg-indigo-900/50',
      textIcon: 'text-indigo-600 dark:text-indigo-400',
      textCount: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800'
    },
    cv: {
      bgIcon: 'bg-purple-100 dark:bg-purple-900/50',
      textIcon: 'text-purple-600 dark:text-purple-400',
      textCount: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800'
    },
    adaptive: {
      bgIcon: 'bg-emerald-100 dark:bg-emerald-900/50',
      textIcon: 'text-emerald-600 dark:text-emerald-400',
      textCount: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800'
    },
    coding: {
      bgIcon: 'bg-sky-100 dark:bg-sky-900/50',
      textIcon: 'text-sky-600 dark:text-sky-400',
      textCount: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800'
    }
  };

  const cards = [
    { id: 'interview', title: 'Standard', desc: 'Topic-based MCQ + Essay interviews', icon: FileText, count: counts.interview, theme: themes.interview },
    { id: 'cv', title: 'CV Based', desc: 'Interviews generated from your CV', icon: FolderOpen, count: counts.cv, theme: themes.cv },
    { id: 'adaptive', title: 'Adaptive', desc: 'Difficulty adjusts to your skill level', icon: Cpu, count: counts.adaptive, theme: themes.adaptive },
    { id: 'coding', title: 'Coding', desc: 'Live coding with AI evaluation', icon: Code, count: counts.coding, theme: themes.coding }
  ];

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
        {/* Header */}
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

        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.25] pb-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Interview History
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
            Select an interview type to view detailed history and performance analytics
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleNavigate(card.id)}
                className={`group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl border ${card.theme.border} shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden transform-gpu flex flex-col`}
              >
                <div className="p-6 text-center flex flex-col items-center h-full">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${card.theme.bgIcon} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 ${card.theme.textIcon}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{card.title}</h2>
                  {/* Fix chiều cao đồng đều cho description */}
                  <div className="min-h-[3rem] mb-4 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                  {/* Số sessions */}
                  <div className="mt-2">
                    <span className={`text-4xl font-black ${card.theme.textCount}`}>{card.count}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm ml-1">sessions</span>
                  </div>
                  {/* Hint */}
                  <div className="mt-6 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>Click to view history</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-gray-400 dark:text-gray-500 text-xs">
          <p>💡 Click on any card to see detailed history for that interview type.</p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}