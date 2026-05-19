import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Brain,
  Zap,
  Award,
  ChevronDown,
  Settings,
  HelpCircle,
  BarChart3,
  Calendar,
  MessageCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

import { StartInterviewModal } from '../components/StartInterviewModal';
import { UploadCV } from '../components/UploadCV';
import { AIFeedback } from '../components/AIFeedback';
import PerformanceTrendChart from '../components/PerformanceTrendChart';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import WeaknessAnalysis from '../components/WeaknessAnalysis';
import api from '../services/api';
import ActivityCalendar from '../components/ActivityCalendar';

export default function WelcomePage() {
  // ------------------------------
  // 1. All hooks (unconditionally)
  // ------------------------------
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { language } = useLanguage();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  const dropdownRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    progressPercent: 0,
    change: '+0%'
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [activities, setActivities] = useState([]);

  // ------------------------------
  // 2. Helper functions (no hooks)
  // ------------------------------
  const t = (key) => {
    const translations = {
      en: {
        interviewsCompleted: 'Completed',
        averageScore: 'Avg Score',
        aiAccuracy: 'AI Accuracy',
        progress: 'Progress',
        recentActivity: 'Recent Activity',
        viewAll: 'View all',
        performanceTrend: 'Performance Trend',
        quickActions: 'Quick Actions',
        startNewInterview: 'Start New Interview',
        viewDashboard: 'Performance Dashboard',
        scheduleMock: 'Mock Interview',
        upcomingSchedule: 'Upcoming Schedule',
        noUpcoming: 'No upcoming interviews',
        scheduleNow: 'Schedule one →',
        logout: 'Sign Out',
        settings: 'Settings',
        helpSupport: 'Help & Support',
        yourProfile: 'Your Profile',
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        readyMessage:
          'Ready to ace your next interview? Your AI coach is here to help.',
        score: 'Score'
      },
      vi: {
        interviewsCompleted: 'Đã hoàn thành',
        averageScore: 'Điểm TB',
        aiAccuracy: 'Độ chính xác AI',
        progress: 'Tiến độ',
        recentActivity: 'Hoạt động gần đây',
        viewAll: 'Xem tất cả',
        performanceTrend: 'Xu hướng điểm',
        quickActions: 'Thao tác nhanh',
        startNewInterview: 'Phỏng vấn mới',
        viewDashboard: 'Bảng điều khiển',
        scheduleMock: 'Lên lịch thử',
        upcomingSchedule: 'Lịch sắp tới',
        noUpcoming: 'Chưa có lịch phỏng vấn',
        scheduleNow: 'Đặt lịch ngay →',
        logout: 'Đăng xuất',
        settings: 'Cài đặt',
        helpSupport: 'Trợ giúp',
        yourProfile: 'Hồ sơ',
        goodMorning: 'Chào buổi sáng',
        goodAfternoon: 'Chào buổi chiều',
        goodEvening: 'Chào buổi tối',
        readyMessage:
          'Sẵn sàng chinh phục? Trợ lý AI luôn đồng hành.',
        score: 'Điểm'
      }
    };
    return translations[language]?.[key] || translations.en[key];
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500 text-white';
    if (score >= 75) return 'from-blue-500 to-cyan-500 text-white';
    if (score >= 60) return 'from-yellow-500 to-orange-500 text-white';
    return 'from-rose-500 to-pink-500 text-white';
  };

  // ------------------------------
  // 3. Data fetching function
  // ------------------------------
  const fetchDashboardData = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const [normalRes, cvRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } }))
      ]);

      const normalList = normalRes.data?.success ? normalRes.data.history : [];
      const cvList = cvRes.data?.success ? cvRes.data.history : [];
      const allSessions = [...normalList, ...cvList];

      const total = allSessions.length;
      const avgScore = total === 0
        ? 0
        : Math.round(allSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / total);
      const progress = avgScore;

      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const recentSessions = allSessions.filter((item) => new Date(item.createdAt) >= monthAgo);
      const prevSessions = allSessions.filter((item) => new Date(item.createdAt) < monthAgo);

      const recentAvg = recentSessions.length
        ? recentSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / recentSessions.length
        : 0;
      const prevAvg = prevSessions.length
        ? prevSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / prevSessions.length
        : 0;

      const change = prevAvg === 0
        ? '+0%'
        : `${recentAvg > prevAvg ? '+' : ''}${Math.round(recentAvg - prevAvg)}%`;

      setStats({
        totalInterviews: total,
        averageScore: avgScore,
        progressPercent: progress,
        change
      });

      const sorted = [...allSessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latest = sorted.slice(0, 3).map((session) => {
        let actionText = '';
        if (Array.isArray(session.topic)) {
          actionText = session.topic.join(' • ');
        } else if (typeof session.topic === 'string') {
          actionText = session.topic;
        } else if (session.cvName) {
          actionText = `CV: ${session.cvName}`;
        } else {
          actionText = 'Interview';
        }
        return {
          id: session._id || session.id,
          action: actionText,
          score: session.totalScore !== undefined && session.totalScore !== null ? session.totalScore : null,
          date: formatRelativeTime(session.createdAt),
          icon: session.cvName ? FileText : MessageCircle
        };
      });
      setRecentActivities(latest);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ------------------------------
  // 4. All useEffect hooks (unconditional)
  // ------------------------------
  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch dashboard data when user is available
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to storage changes (e.g., logout from another tab)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        fetchDashboardData();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []); // fetchDashboardData intentionally omitted, runs only once

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
  fetchActivities();
}, []);

const fetchActivities = async () => {

  try {

    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://localhost:5000/api/activity/calendar',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (data.success) {
      setActivities(data.activities);
    }

  } catch (err) {

    console.error(
      'Fetch activities error:',
      err
    );

  }
};

  // ------------------------------
  // 5. Early returns (after all hooks)
  // ------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // ------------------------------
  // 6. Event handlers & render helpers
  // ------------------------------
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(async () => {
      await logout();
      navigate('/login');
    }, 2000);
  };

  const handleStartInterview = (data) => {
    console.log('Starting interview:', data);
    alert(`Starting ${data.difficulty} interview on ${data.topic}`);
    fetchDashboardData();
  };

  const handleCVUploadSuccess = () => {
    fetchDashboardData();
  };



  

  const displayName = user.fullName || user.userName;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const statsCards = [
    {
      icon: Zap,
      label: t('interviewsCompleted'),
      value: stats.totalInterviews.toString(),
      change: stats.change,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      icon: Award,
      label: t('averageScore'),
      value: `${stats.averageScore}%`,
      change: stats.change,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      icon: Brain,
      label: t('aiAccuracy'),
      value: '94%',
      change: '+2%',
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      icon: TrendingUp,
      label: t('progress'),
      value: `${stats.progressPercent}%`,
      change: stats.change,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20'
    }
  ];

  // ------------------------------
  // 7. JSX return
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-500">
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center animate-fadeIn">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">{t('logout')}...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/welcome')}>
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Interview</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Smart Platform</p>
            </div>
          </div>

          {/* USER MENU - CẢI TIẾN GIAO DIỆN SÁNG/TỐI */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-700 transition-all duration-200">
                <span className="text-white font-semibold text-base">{avatarLetter}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-fadeIn overflow-hidden">
                {/* Thông tin user rút gọn (tuỳ chọn) */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/20 dark:to-blue-900/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{avatarLetter}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors duration-150 rounded-lg"
                  >
                    <User className="w-4 h-4 text-indigo-500" /> {t('yourProfile')}
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors duration-150 rounded-lg"
                  >
                    <Settings className="w-4 h-4 text-indigo-500" /> {t('settings')}
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/help'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors duration-150 rounded-lg"
                  >
                    <HelpCircle className="w-4 h-4 text-indigo-500" /> {t('helpSupport')}
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/history'); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors duration-150 rounded-lg"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" /> Interview History
                  </button>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-150 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HERO */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-2">{getGreeting()}, {displayName}!</h2>
          <p className="text-indigo-100">{t('readyMessage')}</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-semibold text-green-500">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? '...' : stat.value}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            {/* RECENT ACTIVITY */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold dark:text-white">{t('recentActivity')}</h3>
                <button onClick={() => navigate('/history')} className="text-indigo-500 text-sm">
                  {t('viewAll')}
                </button>
              </div>
              <div>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No interviews yet</div>
                ) : (
                  recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border-b dark:border-gray-700">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-xl">
                          <Icon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{activity.action}</p>
                          <p className="text-sm text-gray-500">{activity.date}</p>
                        </div>
                        {activity.score !== null && (
                          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(activity.score)}`}>
                            {activity.score}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CHART */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4">{t('performanceTrend')}</h3>
              <PerformanceTrendChart />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* QUICK ACTIONS */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4">{t('quickActions')}</h3>
              <div className="space-y-3">
                <button onClick={() => setIsModalOpen(true)} className="w-full p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                  {t('startNewInterview')}
                </button>
                <UploadCV onUploadSuccess={handleCVUploadSuccess} />
                <button className="w-full p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {t('viewDashboard')}
                </button>
                <button className="w-full p-3 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                  {t('scheduleMock')}
                </button>
              </div>
            </div>


            <ActivityCalendar
              sessions={activities}
            />

            {/* AI FEEDBACK */}
            <AIFeedback />





          </div>
        </div>
        {/* <WeaknessAnalysis /> */}
      </main>
      <StartInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onStart={handleStartInterview} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}