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
  FileText,
  Sparkles,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';

import { StartInterviewModal } from '../components/StartInterviewModal';
import { UploadCV } from '../components/UploadCV';
import { AIFeedback } from '../components/AIFeedback';
import PerformanceTrendChart from '../components/PerformanceTrendChart';

import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ActivityCalendar from '../components/ActivityCalendar';

export default function WelcomePage() {
  // ------------------------------
  // 1. All hooks
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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    change: '+0%',
    streak: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [activities, setActivities] = useState([]);

  // ------------------------------
  // 2. Helper functions
  // ------------------------------
  const t = (key) => {
    const translations = {
      en: {
        interviewsCompleted: 'Completed',
        averageScore: 'Avg Score',
        streak: 'Current Streak',
        recentActivity: 'Recent Activity',
        viewAll: 'View all',
        performanceTrend: 'Performance Trend',
        quickActions: 'Quick Actions',
        startNewInterview: 'Start New Interview',
        viewDashboard: 'Performance Dashboard',
        scheduleMock: 'Mock Interview',
        logout: 'Sign Out',
        settings: 'Settings',
        helpSupport: 'Help & Support',
        yourProfile: 'Your Profile',
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        readyMessage:
          'Ready to ace your next interview? Your AI coach is here to help.',
        days: 'days',
      },
      vi: {
        interviewsCompleted: 'Đã hoàn thành',
        averageScore: 'Điểm TB',
        streak: 'Chuỗi hiện tại',
        recentActivity: 'Hoạt động gần đây',
        viewAll: 'Xem tất cả',
        performanceTrend: 'Xu hướng điểm',
        quickActions: 'Thao tác nhanh',
        startNewInterview: 'Phỏng vấn mới',
        viewDashboard: 'Bảng điều khiển',
        scheduleMock: 'Lên lịch thử',
        logout: 'Đăng xuất',
        settings: 'Cài đặt',
        helpSupport: 'Trợ giúp',
        yourProfile: 'Hồ sơ',
        goodMorning: 'Chào buổi sáng',
        goodAfternoon: 'Chào buổi chiều',
        goodEvening: 'Chào buổi tối',
        readyMessage:
          'Sẵn sàng chinh phục? Trợ lý AI luôn đồng hành.',
        days: 'ngày',
      },
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

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-emerald-500 text-white';
    if (score >= 50) return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Tính current streak (chuỗi hiện tại)
  const calculateStreak = (sessions) => {
    if (!sessions.length) return 0;
    const dates = sessions.map(s => new Date(s.createdAt).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;
    let currentDate = uniqueDates[0] === today ? today : yesterday;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentDate) {
        streak++;
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        currentDate = prevDate.toDateString();
      } else {
        break;
      }
    }
    return streak;
  };

  // ------------------------------
  // 3. Data fetching
  // ------------------------------
  const fetchDashboardData = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const [normalRes, cvRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } })),
      ]);

      const normalList = normalRes.data?.success ? normalRes.data.history : [];
      const cvList = cvRes.data?.success ? cvRes.data.history : [];
      const allSessions = [...normalList, ...cvList];

      const total = allSessions.length;
      const avgScore = total === 0 ? 0 : Math.round(allSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / total);

      const now = new Date();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const recentSessions = allSessions.filter((item) => new Date(item.createdAt) >= monthAgo);
      const prevSessions = allSessions.filter((item) => new Date(item.createdAt) < monthAgo);

      const recentAvg = recentSessions.length ? recentSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / recentSessions.length : 0;
      const prevAvg = prevSessions.length ? prevSessions.reduce((sum, item) => sum + (item.totalScore || 0), 0) / prevSessions.length : 0;

      const change = prevAvg === 0 ? '+0%' : `${recentAvg > prevAvg ? '+' : ''}${Math.round((recentAvg - prevAvg))}%`;
      const streak = calculateStreak(allSessions);

      setStats({
        totalInterviews: total,
        averageScore: avgScore,
        change,
        streak,
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
          icon: session.cvName ? FileText : MessageCircle,
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
  // 4. useEffect hooks
  // ------------------------------
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'user' || e.key === 'token') fetchDashboardData();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
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
      const res = await fetch('http://localhost:5000/api/activity/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setActivities(data.activities);
    } catch (err) {
      console.error('Fetch activities error:', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ------------------------------
  // 5. Early returns
  // ------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // ------------------------------
  // 6. Event handlers
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

  const handleCVUploadSuccess = () => fetchDashboardData();

  const displayName = user.fullName || user.userName;
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Chỉ 3 card: Completed, Avg Score, Current Streak
  const statsCards = [
    {
      icon: Zap,
      label: t('interviewsCompleted'),
      value: stats.totalInterviews.toString(),
      change: stats.change,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      icon: Award,
      label: t('averageScore'),
      value: `${stats.averageScore}%`,
      change: stats.change,
      color: getScoreColorClass(stats.averageScore),
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      icon: Flame,
      label: t('streak'),
      value: `${stats.streak} ${t('days')}`,
      change: null,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  // ------------------------------
  // 7. JSX
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center animate-fadeIn">
            <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">{t('logout')}...</p>
          </div>
        </div>
      )}

      {/* Header */}
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

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800 group-hover:ring-indigo-300 dark:group-hover:ring-indigo-700 transition-all">
                <span className="text-white font-semibold text-base">{avatarLetter}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 animate-fadeIn overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{avatarLetter}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>
                <div className="py-1">
                  {[
                    { icon: User, label: t('yourProfile'), path: '/profile' },
                    { icon: Settings, label: t('settings'), path: '/settings' },
                    { icon: HelpCircle, label: t('helpSupport'), path: '/help' },
                    { icon: FileText, label: 'Interview History', path: '/history' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => { setDropdownOpen(false); navigate(item.path); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-indigo-500" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                  <LogOut className="w-4 h-4" /> {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 mb-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2 drop-shadow-lg">
                {getGreeting()}, {displayName}!
                <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
              </h2>
              <p className="text-indigo-100 text-base md:text-lg max-w-2xl drop-shadow-md">{t('readyMessage')}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/30 shadow-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-7 h-7 text-white drop-shadow" />
                <div>
                  <div className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Local Time</div>
                  <div className="text-sm font-semibold text-white drop-shadow">{formatDate(currentDateTime)}</div>
                  <div className="text-xl md:text-2xl font-mono font-bold text-white tracking-wider drop-shadow">{formatTime(currentDateTime)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - 3 cột */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-3">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.change && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${stat.change.startsWith('+')
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : stat.change.startsWith('-')
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {statsLoading ? <div className="w-12 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> : stat.value}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  {t('recentActivity')}
                </h3>
                <button onClick={() => navigate('/history')} className="text-indigo-500 text-sm hover:text-indigo-600 flex items-center gap-1">
                  {t('viewAll')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">No interviews yet. Start your first one!</div>
                ) : (
                  recentActivities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-center gap-4 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                          <Icon className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium dark:text-white">{activity.action}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</p>
                        </div>
                        {activity.score !== null && (
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getScoreBadgeClass(activity.score)}`}>
                            {activity.score}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                {t('performanceTrend')}
              </h3>
              <PerformanceTrendChart />
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                {t('quickActions')}
              </h3>
              <div className="space-y-3">
                <button onClick={() => setIsModalOpen(true)} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t('startNewInterview')}
                </button>
                <UploadCV onUploadSuccess={handleCVUploadSuccess} />
                <button
                  onClick={() => navigate('/history')}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Interview History
                </button>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
              <ActivityCalendar sessions={activities} />
            </div>

            {/* AI Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <AIFeedback />
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <StartInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onStart={handleStartInterview} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}