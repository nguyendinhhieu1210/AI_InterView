import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, User, Brain, Zap, ChevronDown, Settings, HelpCircle,
  MessageCircle, TrendingUp, FileText, Sparkles, Clock, Flame,
  CalendarDays, Lightbulb, Quote, Code2, Target, Award
} from 'lucide-react';

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
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { normal, cv, adaptive, coding, loading: historyLoading, refreshHistory } = useHistory();

  const dropdownRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [stats, setStats] = useState({ totalInterviews: 0, streak: 0 });
  const [todayStats, setTodayStats] = useState({
    normalInterview: 0, cvInterview: 0,
    adaptiveInterview: 0, codingInterview: 0, total: 0
  });
  const [activities, setActivities] = useState([]);
  const [dailyTip, setDailyTip] = useState({ tip: '', quote: '' });

  const [isCVModalOpen, setIsCVModalOpen] = useState(false);
  const [cvData, setCvData] = useState(null);

  const texts = {
    totalSessions: 'Total Sessions', streak: 'Current Streak', days: 'days',
    performanceTrend: 'Performance Trend', quickActions: 'Quick Actions',
    startNewInterview: 'Start New Interview', uploadCV: 'Upload CV & Start',
    interviewHistory: 'History', logout: 'Sign Out', settings: 'Settings',
    helpSupport: 'Help & Support', yourProfile: 'Your Profile',
    goodMorning: 'Good Morning', goodAfternoon: 'Good Afternoon', goodEvening: 'Good Evening',
    readyMessage: 'Ready to ace your next interview? Your AI coach is here to help.',
    slogan: 'Master your craft, one interview at a time.',
    motivationTitle: '✨ Daily Growth & Inspiration',
    helpfulTip: '💡 Tip for today', inspiringQuote: '🌟 Fuel your mind',
    todaySessions: "Today's Sessions", normalInt: 'Standard Interviews',
    cvInt: 'CV Interviews', adaptiveInt: 'Adaptive Interviews', codingInt: 'Coding Interviews',
    total: 'Total', keepGoing: 'Keep going! 💪', restDay: 'Rest day',
  };

  const tipsList = { en: ["Notice a knowledge gap? Turn it into your next mini-project. Master it step by step."] };
  const quotesList = { en: ["The expert in anything was once a beginner. – Helen Hayes"] };

  const getRandomMotivation = () => {
    const tips = tipsList.en;
    const quotes = quotesList.en;
    setDailyTip({
      tip: tips[Math.floor(Math.random() * tips.length)],
      quote: quotes[Math.floor(Math.random() * quotes.length)],
    });
  };

  useEffect(() => { getRandomMotivation(); }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return texts.goodMorning;
    if (hour < 18) return texts.goodAfternoon;
    return texts.goodEvening;
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const calculateStreakFromActivities = (activitiesList) => {
    if (!activitiesList || activitiesList.length === 0) return 0;
    const activeDates = new Set(activitiesList.map(act => act.dateVN).filter(Boolean));
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
      const res = await fetch('http://localhost:5000/api/activity/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
        const newStreak = calculateStreakFromActivities(data.activities);
        setStats(prev => ({ ...prev, streak: newStreak }));
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
    const normalCount = normal.filter(s => toVietnamDateKey(s.createdAt) === todayKey).length;
    const cvCount = cv.filter(s => toVietnamDateKey(s.createdAt) === todayKey).length;
    const adaptiveCount = adaptive.filter(s => toVietnamDateKey(s.createdAt) === todayKey).length;
    const codingCount = coding.filter(s => toVietnamDateKey(s.createdAt) === todayKey).length;
    setTodayStats({
      normalInterview: normalCount, cvInterview: cvCount,
      adaptiveInterview: adaptiveCount, codingInterview: codingCount,
      total: normalCount + cvCount + adaptiveCount + codingCount,
    });
    setStats(prev => ({ ...prev, totalInterviews: total }));
  }, [normal, cv, adaptive, coding, historyLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) fetchActivities();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(async () => { await logout(); navigate('/login'); }, 2000);
  };

  const handleStartInterview = (data) => {
    console.log('Starting interview:', data);
    // FIX: không tăng stats thủ công ở đây nữa
    // refreshHistory sẽ trigger useEffect tính lại từ data thực
    fetchActivities();
    refreshHistory();
  };

  // FIX: handleCVUploadSuccess chỉ lưu data và mở modal
  // KHÔNG tăng stats ở đây — stats sẽ được tính lại sau khi interview thực sự hoàn thành
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

  // FIX: chỉ tăng stats 1 lần duy nhất ở đây khi interview CV thực sự bắt đầu
  const handleStartCVInterview = (interviewData) => {
    console.log('Start CV interview:', interviewData);
    setIsCVModalOpen(false);
    fetchActivities();
    refreshHistory(); // trigger useEffect → tính lại stats từ server data
  };

  const displayName = user?.fullName || user?.userName;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || 'U';

  const statsCards = [
    { icon: Zap, label: texts.totalSessions, value: stats.totalInterviews, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', gradient: 'from-yellow-500/10 to-orange-500/10' },
    { icon: Flame, label: texts.streak, value: `${stats.streak} ${texts.days}`, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', gradient: 'from-orange-500/10 to-red-500/10' },
  ];

  const todaySessionsCard = [
    { label: texts.normalInt, value: todayStats.normalInterview, icon: MessageCircle, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/40' },
    { label: texts.cvInt, value: todayStats.cvInterview, icon: FileText, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40' },
    { label: texts.adaptiveInt, value: todayStats.adaptiveInterview, icon: Brain, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/40' },
    { label: texts.codingInt, value: todayStats.codingInterview, icon: Code2, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-900/40' }
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
    <div className="min-h-screen bg-bg transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 shadow-soft text-center animate-fadeIn">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text font-medium">{texts.logout}...</p>
          </div>
        </div>
      )}

      <header className="bg-card/70 backdrop-blur-xl border-b border-border sticky top-0 z-40 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/welcome')}>
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">AI Interview</h1>
              <p className="text-xs text-muted">Smart Platform</p>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800 group-hover:ring-primary/30 transition-all">
                <span className="text-white font-semibold text-base">{avatarLetter}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-text">{displayName}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fadeIn overflow-hidden">
                <div className="py-1">
                  {[
                    { icon: User, label: texts.yourProfile, path: '/profile' },
                    { icon: Settings, label: texts.settings, path: '/settings' },
                    { icon: HelpCircle, label: texts.helpSupport, path: '/help' },
                    { icon: FileText, label: texts.interviewHistory, path: '/history' },
                  ].map((item) => (
                    <button key={item.path} onClick={() => { setDropdownOpen(false); navigate(item.path); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <item.icon className="w-4 h-4 text-primary" /> {item.label}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button onClick={handleLogout} disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut className="w-4 h-4" /> {texts.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700 p-8 mb-10 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2 drop-shadow-lg">
                {getGreeting()}, {displayName}! <Sparkles className="w-7 h-7 text-yellow-300 animate-pulse" />
              </h2>
              <p className="text-indigo-100 text-base md:text-lg max-w-2xl drop-shadow-md">{texts.readyMessage}</p>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {statsCards.map((stat, idx) => (
            <div key={idx} className="group relative bg-card/80 backdrop-blur-sm rounded-2xl p-5 shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-[1.02]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, ${stat.gradient})` }}></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold text-text">
                    {historyLoading ? <span className="inline-block w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></span> : stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative rounded-2xl shadow-soft overflow-hidden mb-10 bg-card border border-border transition-all duration-300 hover:shadow-lg group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 group-hover:animate-pulse"></div>
          <div className="p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl shadow-sm ring-1 ring-blue-200/50 dark:ring-blue-700/30">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-text">{texts.todaySessions}</h3>
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full">
                <p className="text-sm font-bold text-primary dark:text-primary/90">{todayStats.total} {texts.total}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {todaySessionsCard.map((item, idx) => (
                <div key={idx} className={`rounded-xl p-4 ${item.bgColor} border-l-4 text-center hover:scale-105 transition-all duration-200`}
                  style={{ borderLeftColor: idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : idx === 2 ? '#8b5cf6' : '#f43f5e' }}>
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-white dark:bg-gray-800/50">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-text">{historyLoading ? '...' : item.value}</p>
                  <p className="text-xs text-muted mt-1 font-medium">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 text-center border-t border-border">
              <p className={`text-sm font-semibold flex items-center justify-center gap-2 ${todayStats.total > 0 ? 'text-success' : 'text-muted'}`}>
                <Award className="w-4 h-4" />
                {todayStats.total > 0 ? texts.keepGoing : texts.restDay}
              </p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl shadow-soft overflow-hidden mb-10 bg-card border border-border transition-all duration-300 hover:shadow-lg group">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 group-hover:animate-pulse"></div>
          <div className="p-6 md:p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-700/30">
                  <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-text">{texts.motivationTitle}</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm p-5 border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute -right-6 -top-6 w-16 h-16 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full shadow-sm">
                    <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h4 className="font-semibold text-text text-sm uppercase tracking-wide">{texts.helpfulTip}</h4>
                </div>
                <p className="text-text text-md leading-relaxed relative z-10">{dailyTip.tip}</p>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm p-5 border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/60 dark:bg-gray-800/60 rounded-full shadow-sm">
                    <Quote className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-text text-sm uppercase tracking-wide">{texts.inspiringQuote}</h4>
                </div>
                <p className="text-text text-md italic leading-relaxed relative z-10">"{dailyTip.quote}"</p>
              </div>
            </div>
            <div className="mt-6 pt-4 text-center border-t border-border">
              <p className="text-xs text-muted italic flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>{texts.slogan}</span>
                <Sparkles className="w-3 h-3 text-primary" />
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-border">
              <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg"><TrendingUp className="w-5 h-5 text-primary" /></div>
                {texts.performanceTrend}
              </h3>
              <div className="w-full"><PerformanceTrendChart /></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-soft p-5 border border-border">
              <h3 className="text-md font-semibold text-text mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg"><Zap className="w-5 h-5 text-yellow-500" /></div>
                {texts.quickActions}
              </h3>
              <div className="space-y-3">
                <button onClick={() => setIsModalOpen(true)} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> {texts.startNewInterview}
                </button>
                <UploadCV onUploadSuccess={handleCVUploadSuccess} />
                <button onClick={() => navigate('/live-coding')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                  <Code2 className="w-4 h-4" />Coding Interview
                </button>
                <button onClick={() => navigate('/history')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-success to-teal-500 text-white text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2">
                  <Brain className="w-4 h-4" /> {texts.interviewHistory}
                </button>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-soft p-4 border border-border">
              <ActivityCalendar sessions={activities} />
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-soft border border-border overflow-hidden">
              <AIFeedback />
            </div>
          </div>
        </div>
      </main>

      <StartInterviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onStart={handleStartInterview} />
      {isCVModalOpen && cvData && (
        <CVInfoModal
          cvData={cvData}
          onClose={handleCloseCVModal}
          onStartInterview={handleStartCVInterview}
          onQuestionsGenerated={(data) => console.log('Questions generated from CV:', data)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite; }
      `}</style>
    </div>
  );
}