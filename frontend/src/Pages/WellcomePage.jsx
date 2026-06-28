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
  Flame,
  Target,
  Award,
  BarChart3,
  ArrowRight,
  Sparkles,
  CalendarDays,
  History,
} from 'lucide-react';

import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';
import { BaseDropdown, DropdownItem } from '../components/base/BaseDropdown';
import { BaseModal } from '../components/base/BaseModal';
import { StartInterviewModal } from '../components/StartInterviewModal';
import { StartAdaptiveInterviewModal } from '../components/StartAdaptiveInterviewModal';
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
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [isCVUploadModalOpen, setIsCVUploadModalOpen] = useState(false);
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
  const [isCVInfoModalOpen, setIsCVInfoModalOpen] = useState(false);
  const [cvData, setCvData] = useState(null);

  const texts = {
    totalSessions: 'Total Interviews',
    streak: 'Day Streak',
    days: 'days',
    performanceTrend: 'Performance Overview',
    quickActions: 'Start Practicing',
    startNewInterview: 'Standard Interview',
    uploadCV: 'CV-Based Interview',
    adaptiveInterview: 'Adaptive Interview',
    interviewHistory: 'View History',
    logout: 'Sign Out',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    yourProfile: 'Your Profile',
    goodMorning: 'Good Morning',
    goodAfternoon: 'Good Afternoon',
    goodEvening: 'Good Evening',
    readyMessage: 'Your AI coach is ready. Pick a session to begin.',
    todaySessions: "Today's Sessions",
    normalInt: 'Standard',
    cvInt: 'CV Based',
    adaptiveInt: 'Adaptive',
    codingInt: 'Coding',
    total: 'total',
    keepGoing: 'Great progress today! Keep it up 💪',
    restDay: 'No sessions yet — start one above!',
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
      setIsCVUploadModalOpen(false);
      setIsCVInfoModalOpen(true);
    }
  };

  const handleCloseCVInfoModal = () => {
    setIsCVInfoModalOpen(false);
    setCvData(null);
  };

  const handleStartCVInterview = (interviewData) => {
    console.log('Start CV interview:', interviewData);
    setIsCVInfoModalOpen(false);
    fetchActivities();
    refreshHistory();
  };

  const handleStartAdaptiveInterview = (data) => {
    console.log('Start Adaptive Interview:', data);
    setIsAdaptiveModalOpen(false);
    navigate('/adaptive-interview', {
      state: {
        topic: data.topic,
        difficulty: data.difficulty,
        mode: 'adaptive',
        questionCount: data.questionCount,
      },
    });
  };

  const displayName = user?.fullName || user?.userName;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || 'U';

  const quickActions = [
    {
      label: 'Standard Interview',
      desc: 'General Q&A practice',
      icon: MessageCircle,
      gradient: 'from-blue-500 to-indigo-600',
      color: 'blue',
      onClick: () => setIsModalOpen(true),
    },
    {
      label: 'CV-Based Interview',
      desc: 'Tailored to your résumé',
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-600',
      color: 'emerald',
      onClick: () => setIsCVUploadModalOpen(true),
    },
    {
      label: 'Adaptive Interview',
      desc: 'AI adjusts in real-time',
      icon: Brain,
      gradient: 'from-purple-500 to-pink-600',
      color: 'purple',
      onClick: () => setIsAdaptiveModalOpen(true),
    },
    {
      label: 'Coding Challenge',
      desc: 'Live coding session',
      icon: Zap,
      gradient: 'from-rose-500 to-red-600',
      color: 'rose',
      onClick: () => navigate('/live-coding'),
    },
  ];

  const todaySessionsCard = [
    {
      label: texts.normalInt,
      value: todayStats.normalInterview,
      icon: MessageCircle,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      accent: '#3b82f6',
    },
    {
      label: texts.cvInt,
      value: todayStats.cvInterview,
      icon: FileText,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      accent: '#10b981',
    },
    {
      label: texts.adaptiveInt,
      value: todayStats.adaptiveInterview,
      icon: Brain,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      accent: '#8b5cf6',
    },
    {
      label: texts.codingInt,
      value: todayStats.codingInterview,
      icon: Zap,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-900/30',
      accent: '#f43f5e',
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
      {/* Subtle ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.07] dark:opacity-[0.05]"></div>
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.07] dark:opacity-[0.05]"></div>
      </div>

      {/* Logout overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <BaseCard className="p-8 text-center">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text font-medium">Signing out…</p>
          </BaseCard>
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-3 group p-0 hover:bg-transparent"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-base">AI</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text leading-none">
                AI Interview
              </h1>
              <p className="text-xs text-muted mt-0.5">Smart Platform</p>
            </div>
          </BaseButton>

          <BaseDropdown
            ref={dropdownRef}
            isOpen={dropdownOpen}
            onToggle={() => setDropdownOpen(!dropdownOpen)}
            align="right"
            trigger={
              <BaseButton
                variant="ghost"
                size="sm"
                className="flex items-center gap-2.5 group p-0 hover:bg-transparent focus:ring-0 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-white font-semibold text-sm">
                    {avatarLetter}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-text leading-none">
                    {displayName}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </BaseButton>
            }
          >
            <DropdownItem
              icon={<User className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/profile');
              }}
              className="dropdown-item"
            >
              {texts.yourProfile}
            </DropdownItem>
            <DropdownItem
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/settings');
              }}
              className="dropdown-item"
            >
              {texts.settings}
            </DropdownItem>
            <DropdownItem
              icon={<HelpCircle className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/help');
              }}
              className="dropdown-item"
            >
              {texts.helpSupport}
            </DropdownItem>
            <DropdownItem
              icon={<History className="w-4 h-4" />}
              onClick={() => {
                setDropdownOpen(false);
                navigate('/history');
              }}
              className="dropdown-item"
            >
              History
            </DropdownItem>
            <div className="border-t border-border my-1"></div>
            <DropdownItem
              icon={<LogOut className="w-4 h-4" />}
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="dropdown-item-danger"
            >
              {texts.logout}
            </DropdownItem>
          </BaseDropdown>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
        {/* ── Welcome Section ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Dashboard
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {displayName}
              </span>
            </h2>
            <p className="text-muted mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              {texts.readyMessage}
            </p>
          </div>
          <BaseCard className="flex items-center gap-3 px-5 py-3 shrink-0 border-border">
            <CalendarDays className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted">
                {formatDate(currentDateTime)}
              </p>
              <p className="text-xl font-mono font-bold text-text leading-none mt-0.5">
                {formatTime(currentDateTime)}
              </p>
            </div>
          </BaseCard>
        </div>

        {/* ── Quick Actions ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-semibold text-text">
              {texts.quickActions}
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <BaseButton
                key={idx}
                variant="ghost"
                size="lg"
                fullWidth
                onClick={action.onClick}
                className="group relative flex flex-col items-start gap-3 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all duration-200 text-left shadow-sm hover:shadow-md h-auto"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-200`}
                ></div>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-text text-sm">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{action.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
              </BaseButton>
            ))}
          </div>
        </section>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 gap-4">
          <BaseCard hover className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  {texts.totalSessions}
                </p>
                <p className="text-4xl font-bold text-text">
                  {historyLoading ? '–' : stats.totalInterviews}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </BaseCard>
          <BaseCard hover className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
                  {texts.streak}
                </p>
                <p className="text-4xl font-bold text-text">
                  {historyLoading ? '–' : stats.streak}
                  <span className="text-base font-normal text-muted ml-1">
                    {texts.days}
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-500/10">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </div>
          </BaseCard>
        </div>

        {/* ── Today's Sessions ── */}
        <BaseCard className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-text">{texts.todaySessions}</h3>
            </div>
            <BaseBadge variant="primary" rounded className="px-3 py-1">
              {todayStats.total} {texts.total}
            </BaseBadge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {todaySessionsCard.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-4 ${item.bgColor} border border-transparent hover:scale-[1.02] transition-transform duration-150`}
                style={{ borderLeftColor: item.accent, borderLeftWidth: 3 }}
              >
                <item.icon className={`w-4 h-4 ${item.color} mb-3`} />
                <p className="text-2xl font-bold text-text">
                  {historyLoading ? '…' : item.value}
                </p>
                <p className="text-xs text-muted mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2">
            <Award
              className={`w-4 h-4 ${todayStats.total > 0 ? 'text-success' : 'text-muted'}`}
            />
            <p
              className={`text-sm font-medium ${todayStats.total > 0 ? 'text-success' : 'text-muted'}`}
            >
              {todayStats.total > 0 ? texts.keepGoing : texts.restDay}
            </p>
          </div>
        </BaseCard>

        {/* ── Performance + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <div className="lg:col-span-2">
            <BaseCard className="p-6 h-full">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-text">
                  {texts.performanceTrend}
                </h3>
              </div>
              <PerformanceTrendChart />
            </BaseCard>
          </div>

          {/* Sidebar: Calendar + AI Feedback */}
          <div className="space-y-6">
            <BaseCard>
              <ActivityCalendar sessions={activities} />
            </BaseCard>
            <BaseCard>
              <AIFeedback />
            </BaseCard>
          </div>
        </div>
      </main>

      {/* ─── Modals ─── */}

      {/* Standard Interview Modal */}
      <StartInterviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Adaptive Interview Modal */}
      <StartAdaptiveInterviewModal
        isOpen={isAdaptiveModalOpen}
        onClose={() => setIsAdaptiveModalOpen(false)}
        onStart={handleStartAdaptiveInterview}
      />

      {/* CV Upload Modal */}
      <BaseModal
        isOpen={isCVUploadModalOpen}
        onClose={() => setIsCVUploadModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-text">Upload Your CV</h3>
          </div>
        }
        size="md"
        showCloseButton={true}
      >
        <div className="py-2">
          <p className="text-sm text-muted mb-4">
            Upload your CV in PDF format. We'll analyze it and generate tailored
            interview questions.
          </p>
          <UploadCV onUploadSuccess={handleCVUploadSuccess} />
        </div>
      </BaseModal>

      {/* CV Info Modal */}
      {isCVInfoModalOpen && cvData && (
        <CVInfoModal
          cvData={cvData}
          onClose={handleCloseCVInfoModal}
          onStartInterview={handleStartCVInterview}
          onQuestionsGenerated={(data) =>
            console.log('Questions generated from CV:', data)
          }
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
        
        /* Dropdown container - gọn nhẹ */
        .dropdown-menu {
          min-width: 200px !important;
          padding: 4px !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.06) !important;
        }
        
        /* Dropdown items - thon gọn */
        .dropdown-item {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 8px 14px !important;
          margin: 2px 2px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #374151 !important;
          transition: all 0.15s ease !important;
          cursor: pointer !important;
          width: 100% !important;
          min-height: 36px !important;
          white-space: nowrap !important;
          background: transparent !important;
        }
        
        .dropdown-item:hover {
          background-color: rgba(99, 102, 241, 0.08) !important;
          color: #4f46e5 !important;
          transform: scale(1.02) !important;
        }
        
        .dropdown-item svg {
          width: 16px !important;
          height: 16px !important;
          flex-shrink: 0 !important;
          opacity: 0.7 !important;
        }
        
        .dropdown-item:hover svg {
          opacity: 1 !important;
        }
        
        /* Dropdown item danger - Logout */
        .dropdown-item-danger {
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          padding: 8px 14px !important;
          margin: 2px 2px !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          color: #dc2626 !important;
          transition: all 0.15s ease !important;
          cursor: pointer !important;
          width: 100% !important;
          min-height: 36px !important;
          white-space: nowrap !important;
          background: transparent !important;
        }
        
        .dropdown-item-danger:hover {
          background-color: rgba(220, 38, 38, 0.08) !important;
          color: #b91c1c !important;
          transform: scale(1.02) !important;
        }
        
        .dropdown-item-danger svg {
          width: 16px !important;
          height: 16px !important;
          flex-shrink: 0 !important;
          opacity: 0.7 !important;
        }
        
        .dropdown-item-danger:hover svg {
          opacity: 1 !important;
        }
        
        /* Bỏ outline và ring */
        .dropdown-item:focus,
        .dropdown-item:focus-visible,
        .dropdown-item-danger:focus,
        .dropdown-item-danger:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          ring: 0 !important;
        }
        
        .dropdown-trigger:focus,
        .dropdown-trigger:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          ring: 0 !important;
        }
        
        /* Dark mode */
        .dark .dropdown-menu {
          background: #1f2937 !important;
          border-color: rgba(255, 255, 255, 0.06) !important;
        }
        
        .dark .dropdown-item {
          color: #e5e7eb !important;
        }
        
        .dark .dropdown-item:hover {
          background-color: rgba(99, 102, 241, 0.15) !important;
          color: #818cf8 !important;
        }
        
        .dark .dropdown-item-danger {
          color: #f87171 !important;
        }
        
        .dark .dropdown-item-danger:hover {
          background-color: rgba(220, 38, 38, 0.15) !important;
          color: #fca5a5 !important;
        }
      `}</style>
    </div>
  );
}
