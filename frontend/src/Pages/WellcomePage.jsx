// src/pages/WelcomePage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Brain,
  Zap,
  ChevronDown,
  Settings,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  FileText,
  Clock,
  Flame,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';
import { BaseDropdown, DropdownItem } from '../components/base/BaseDropdown';

// Import existing components
import { StartInterviewModal } from '../components/StartInterviewModal';
import { UploadCV } from '../components/UploadCV';
import { AIFeedback } from '../components/AIFeedback';
import PerformanceTrendChart from '../components/PerformanceTrendChart';
import ActivityCalendar from '../components/ActivityCalendar';
import { CVInfoModal } from '../components/CVInfoModal';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from '../contexts/HistoryContext';

const toVietnamDateKey = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    normal,
    cv,
    adaptive,
    coding,
    loading: historyLoading,
    refreshHistory,
  } = useHistory();

  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [stats, setStats] = useState({ totalInterviews: 0, streak: 0 });
  const [todayStats, setTodayStats] = useState({
    normalInterview: 0,
    cvInterview: 0,
    adaptiveInterview: 0,
    codingInterview: 0,
    total: 0,
  });
  const [activities, setActivities] = useState([]);

  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [cvData, setCvData] = useState(null);

  const texts = {
    totalSessions: 'Total Interviews',
    streak: 'Current Streak',
    days: 'days',
    performanceTrend: 'Performance Overview',
    quickActions: 'Quick Actions',
    startNewInterview: 'Start Interview',
    uploadCV: 'CV-based Interview',
    interviewHistory: 'History',
    logout: 'Sign Out',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    yourProfile: 'Your Profile',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    readyMessage:
      'Ready to ace your next interview? Your AI coach is here to help.',
    todaySessions: "Today's Activity",
    normalInt: 'Standard',
    cvInt: 'CV Based',
    adaptiveInt: 'Adaptive',
    codingInt: 'Coding',
    total: 'Total',
    keepGoing: 'Great progress today! Keep going! 💪',
    restDay: 'Take a break today',
    codingInterview: 'Coding Challenge',
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return texts.goodMorning;
    if (hour < 18) return texts.goodAfternoon;
    return texts.goodEvening;
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const calculateStreakFromActivities = (activitiesList) => {
    if (!activitiesList || activitiesList.length === 0) return 0;
    const activeDates = new Set(
      activitiesList.map((act) => act.dateVN).filter(Boolean)
    );
    let streak = 0;
    let currentDate = new Date();
    while (true) {
      const todayKey = toVietnamDateKey(currentDate);
      if (!todayKey) break;
      if (activeDates.has(todayKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseURL}/activity/calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
        const newStreak = calculateStreakFromActivities(data.activities);
        setStats((prev) => ({ ...prev, streak: newStreak }));
      }
    } catch (err) {
      console.error('Fetch activities error:', err);
    }
  };

  useEffect(() => {
    if (historyLoading) return;
    const allSessions = [...normal, ...cv, ...adaptive, ...coding];
    const total = allSessions.length;
    const todayKey = toVietnamDateKey(new Date());
    const normalCount = normal.filter(
      (s) => toVietnamDateKey(s.createdAt) === todayKey
    ).length;
    const cvCount = cv.filter(
      (s) => toVietnamDateKey(s.createdAt) === todayKey
    ).length;
    const adaptiveCount = adaptive.filter(
      (s) => toVietnamDateKey(s.createdAt) === todayKey
    ).length;
    const codingCount = coding.filter(
      (s) => toVietnamDateKey(s.createdAt) === todayKey
    ).length;
    setTodayStats({
      normalInterview: normalCount,
      cvInterview: cvCount,
      adaptiveInterview: adaptiveCount,
      codingInterview: codingCount,
      total: normalCount + cvCount + adaptiveCount + codingCount,
    });
    setStats((prev) => ({ ...prev, totalInterviews: total }));
  }, [normal, cv, adaptive, coding, historyLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () =>
      window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(async () => {
      await logout();
      navigate('/login');
    }, 2000);
  };

  const handleCVUploadSuccess = (uploadedCvData) => {
    if (uploadedCvData && uploadedCvData.fileUrl) {
      setCvData(uploadedCvData);
      setIsCVModalOpen(true);
    }
  };

  const handleCloseCVModal = () => {
    setIsCVModalOpen(false);
    setCvData(null);
  };

  const handleStartCVInterview = (interviewData) => {
    console.log('Start CV interview:', interviewData);
    setIsCVModalOpen(false);
    fetchActivities();
    refreshHistory();
  };

  const displayName = user?.fullName || user?.userName;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || 'U';

  const statsCards = [
    {
      icon: BarChart3,
      label: texts.totalSessions,
      value: stats.totalInterviews,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      icon: Flame,
      label: texts.streak,
      value: `${stats.streak} ${texts.days}`,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const todaySessionsCard = [
    {
      label: texts.normalInt,
      value: todayStats.normalInterview,
      icon: MessageCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/40',
      borderColor: '#3b82f6',
    },
    {
      label: texts.cvInt,
      value: todayStats.cvInterview,
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/40',
      borderColor: '#10b981',
    },
    {
      label: texts.adaptiveInt,
      value: todayStats.adaptiveInterview,
      icon: Brain,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-100 dark:bg-violet-900/40',
      borderColor: '#8b5cf6',
    },
    {
      label: texts.codingInt,
      value: todayStats.codingInterview,
      icon: Zap,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-100 dark:bg-rose-900/40',
      borderColor: '#f43f5e',
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <BaseCard className="p-8 text-center">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text font-medium">{texts.logout}...</p>
          </BaseCard>
        </div>
      )}

      {/* Header */}
      <header className="bg-card/70 backdrop-blur-xl border-b border-border sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/welcome')}
          >
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">AI Interview</h1>
              <p className="text-xs text-muted">Smart Platform</p>
            </div>
          </div>

          <BaseDropdown
            ref={dropdownRef}
            isOpen={dropdownOpen}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            align="right"
            trigger={
              <div className="flex items-center gap-2 focus:outline-none group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800 group-hover:ring-primary/30 transition-all">
                  <span className="text-white font-semibold text-base">
                    {avatarLetter}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-text">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            }
          >
            <DropdownItem
              icon={<User className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/profile');
              }}
            >
              {texts.yourProfile}
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings');
              }}
            >
              {texts.settings}
            </DropdownItem>
            <DropdownItem
              icon={<HelpCircle className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/help');
              }}
            >
              {texts.helpSupport}
            </DropdownItem>
            <DropdownItem
              icon={<FileText className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/history');
              }}
            >
              {texts.interviewHistory}
            </DropdownItem>
            <div className="border-t border-border my-1"></div>
            <DropdownItem
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-error hover:bg-error/10"
            >
              {texts.logout}
            </DropdownItem>
          </BaseDropdown>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        {/* Welcome Banner */}
        <BaseCard gradient className="p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text mb-1">
                {getGreeting()}, {displayName}!
              </h2>
              <p className="text-muted">{texts.readyMessage}</p>
            </div>
            <div className="flex items-center gap-3 bg-card/50 rounded-xl px-4 py-2 border border-border">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted">Local Time</div>
                <div className="text-sm font-semibold text-text">
                  {formatDate(currentDateTime)}
                </div>
                <div className="text-lg font-mono font-bold text-primary">
                  {formatTime(currentDateTime)}
                </div>
              </div>
            </div>
          </div>
        </BaseCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsCards.map((stat, idx) => (
            <BaseCard key={idx} hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-text">
                    {historyLoading ? '--' : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </BaseCard>
          ))}
        </div>

        {/* Today's Activity Card */}
        <BaseCard
          className="relative overflow-hidden p-6 md:p-7 mb-10 group"
          hover
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 group-hover:animate-pulse"></div>

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-700/30">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text">
                {texts.todaySessions}
              </h3>
            </div>
            <BaseBadge variant="primary" rounded>
              {todayStats.total} {texts.total}
            </BaseBadge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {todaySessionsCard.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 ${item.bgColor} border-l-4 text-center hover:scale-105 transition-all duration-200`}
                style={{ borderLeftColor: item.borderColor }}
              >
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800/50">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-text">
                  {historyLoading ? '...' : item.value}
                </p>
                <p className="text-xs text-muted mt-1 font-medium">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 text-center border-t border-border">
            <p
              className={`text-sm font-semibold flex items-center justify-center gap-2 ${
                todayStats.total > 0 ? 'text-success' : 'text-muted'
              }`}
            >
              <Award className="w-4 h-4" />
              {todayStats.total > 0 ? texts.keepGoing : texts.restDay}
            </p>
          </div>
        </BaseCard>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Performance Chart */}
          <div className="lg:col-span-2">
            <BaseCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-text">
                  {texts.performanceTrend}
                </h3>
              </div>
              <PerformanceTrendChart />
            </BaseCard>
          </div>

          {/* Right Column - Actions & Calendar & Feedback */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <BaseCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-text">
                  {texts.quickActions}
                </h3>
              </div>
              <div className="space-y-3">
                <BaseButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  leftIcon={<MessageCircle className="w-4 h-4" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  {texts.startNewInterview}
                </BaseButton>

                {/* UploadCV đã dùng BaseButton bên trong */}
                <UploadCV onUploadSuccess={handleCVUploadSuccess} />

                <BaseButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-purple-500/30"
                  leftIcon={<Zap className="w-4 h-4" />}
                  onClick={() => navigate('/live-coding')}
                >
                  {texts.codingInterview}
                </BaseButton>

                <BaseButton
                  variant="outline"
                  size="lg"
                  fullWidth
                  leftIcon={<FileText className="w-4 h-4" />}
                  onClick={() => navigate('/history')}
                >
                  {texts.interviewHistory}
                </BaseButton>
              </div>
            </BaseCard>

            {/* Activity Calendar */}
            <BaseCard>
              <ActivityCalendar sessions={activities} />
            </BaseCard>

            {/* AI Feedback */}
            <BaseCard>
              <AIFeedback />
            </BaseCard>
          </div>
        </div>
      </main>

      {/* Modals */}
      <StartInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {isCVModalOpen && cvData && (
        <CVInfoModal
          cvData={cvData}
          onClose={handleCloseCVModal}
          onStartInterview={handleStartCVInterview}
          onQuestionsGenerated={(data) =>
            console.log('Questions generated from CV:', data)
          }
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        
        @keyframes blob {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(30px,-50px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
        .group-hover:animate-pulse:hover { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
      `}</style>
    </div>
  );
}
