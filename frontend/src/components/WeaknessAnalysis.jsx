import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, AlertTriangle, Lightbulb, Target, FileText, RotateCcw, 
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Activity, Award, BarChart3, BookOpen, Clock,Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';

export default function WeaknessAnalysis() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // === Translations (học tập thân thiện) ===
  const t = (key) => {
    const translations = {
      en: {
        // Main titles
        overallHealth: '🔥 Overall Learning Health',
        priorityWeaknesses: '🎯 Priority Weaknesses',
        aiInsights: '🧠 AI Learning Insights',
        recentMistakes: '📝 Recent Mistakes',
        // Metrics
        accuracy: 'Accuracy',
        avgScore: 'Avg Score',
        improvement: 'Improvement',
        strongestSkill: 'Strongest Skill',
        weakestSkill: 'Weakest Skill',
        practiceSessions: 'Practice Sessions',
        // Status
        immediateFocus: 'Needs Immediate Focus',
        gettingBetter: 'Getting Better',
        consistent: 'Consistent',
        needsReview: 'Needs Review',
        improving: 'Improving',
        declining: 'Declining',
        stable: 'Stable',
        // Actions & tips
        practiceNow: 'Practice Now',
        recommended: 'Recommended',
        viewDetails: 'View details',
        // AI section
        studyPlan: 'Personalized Study Plan',
        step: 'Step',
        action: 'Action',
        resource: 'Resource',
        time: 'Time',
        patterns: 'Common Mistake Patterns',
        occurrences: 'times',
        // Messages
        loadingMsg: 'Analyzing your learning data...',
        noDataMsg: 'Complete a few interviews to unlock your dashboard.',
        errorMsg: 'Unable to load insights. Please try again.',
        reviewAll: 'Review all recent mistakes'
      },
      vi: {
        overallHealth: '🔥 Sức khỏe học tập tổng thể',
        priorityWeaknesses: '🎯 Điểm yếu cần ưu tiên',
        aiInsights: '🧠 Góc nhìn từ AI',
        recentMistakes: '📝 Lỗi gần đây',
        accuracy: 'Độ chính xác',
        avgScore: 'Điểm TB',
        improvement: 'Tiến bộ',
        strongestSkill: 'Kỹ năng mạnh nhất',
        weakestSkill: 'Kỹ năng yếu nhất',
        practiceSessions: 'Buổi luyện tập',
        immediateFocus: 'Cần xử lý ngay',
        gettingBetter: 'Đang tiến bộ',
        consistent: 'Ổn định',
        needsReview: 'Cần xem lại',
        improving: 'Tiến bộ',
        declining: 'Đang giảm',
        stable: 'Ổn định',
        practiceNow: 'Luyện ngay',
        recommended: 'Gợi ý',
        viewDetails: 'Xem chi tiết',
        studyPlan: 'Kế hoạch cá nhân',
        step: 'Bước',
        action: 'Hành động',
        resource: 'Tài nguyên',
        time: 'Thời gian',
        patterns: 'Mẫu lỗi phổ biến',
        occurrences: 'lần',
        loadingMsg: 'Đang phân tích dữ liệu học tập...',
        noDataMsg: 'Hoàn thành vài buổi phỏng vấn để mở bảng điều khiển.',
        errorMsg: 'Không thể tải dữ liệu. Vui lòng thử lại.',
        reviewAll: 'Xem tất cả lỗi gần đây'
      }
    };
    return translations[language]?.[key] || translations.en[key];
  };

  // === Helper: gợi ý hành động cho từng chủ đề ===
  const getRecommendationForTopic = (topic, level, trend) => {
    const topicLower = topic.toLowerCase();
    if (topicLower.includes('react')) return 'Practice useEffect & Context API';
    if (topicLower.includes('javascript') || topicLower.includes('js')) return 'Review closures & async patterns';
    if (topicLower.includes('oop')) return 'Solve OOP design problems';
    if (topicLower.includes('docker')) return 'Hands-on with Dockerfiles & volumes';
    if (level === 'critical') return 'Start with fundamentals and simple exercises';
    if (trend === 'improving') return 'Keep momentum with daily challenges';
    return 'Focus on weak subtopics first';
  };

  // === Helper: chuyển level cũ → ngôn ngữ thân thiện ===
  const getFriendlyLevel = (level) => {
    if (level === 'critical') return t('immediateFocus');
    if (level === 'improving') return t('gettingBetter');
    if (level === 'stableLevel') return t('consistent');
    return t('consistent');
  };

  // === Helper: xu hướng + icon ===
  const getTrendDisplay = (trend) => {
    if (trend === 'improving') return { text: t('improving'), icon: <TrendingUp className="w-4 h-4 text-green-500" />, color: 'text-green-600 dark:text-green-400' };
    if (trend === 'declining') return { text: t('needsReview'), icon: <TrendingDown className="w-4 h-4 text-red-500" />, color: 'text-red-600 dark:text-red-400' };
    return { text: t('stable'), icon: <Minus className="w-4 h-4 text-gray-400" />, color: 'text-gray-500 dark:text-gray-400' };
  };

  // === Fetch data ===
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/weakness/me');
      if (res.data.success) setData(res.data.data);
      else setData(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  // === Actions ===
  const handlePracticeTopic = (topic) => navigate(`/practice?topic=${encodeURIComponent(topic)}`);
  const handlePracticePattern = (pattern) => navigate(`/practice?skill=${encodeURIComponent(pattern)}`);

  // Loading / Error / Empty
  if (loading) return <Skeleton t={t} />;
  if (error) return <ErrorView onRetry={fetchData} t={t} />;
  if (!data?.weakTopics?.length) return <EmptyState t={t} />;

  // === Chuẩn bị dữ liệu dashboard ===
  const { averageScore, totalQuestions, overallTrend, weakTopics, learningPatterns, studyPlan, wrongQuestions } = data;
  const accuracy = Math.round(averageScore); // % đúng trung bình
  
  // Tính % cải thiện sơ bộ (nếu có trend improving/declining)
  let improvementText = '0%';
  let improvementPositive = true;
  if (overallTrend === 'improving') { improvementText = '+12%'; improvementPositive = true; }
  else if (overallTrend === 'declining') { improvementText = '-8%'; improvementPositive = false; }
  else { improvementText = '0%'; improvementPositive = true; }
  
  // Tìm mạnh nhất / yếu nhất trong weakTopics (dựa trên averageScore - điểm càng cao càng mạnh)
  const sortedByScore = [...weakTopics].sort((a,b) => b.averageScore - a.averageScore);
  const strongest = sortedByScore[0]?.topic || '—';
  const weakest = sortedByScore[sortedByScore.length-1]?.topic || '—';
  
  // Tổng số buổi luyện tập = totalQuestions (có thể mapping)
  const practiceSessions = totalQuestions;

  // === 1. Khu vực Overall Performance ===
  const OverallHealth = () => (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
      <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-500" /> {t('overallHealth')}
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label={t('accuracy')} value={`${accuracy}%`} icon={<Target className="w-4 h-4" />} color="blue" />
        <MetricCard label={t('avgScore')} value={`${averageScore}%`} icon={<BarChart3 className="w-4 h-4" />} color="purple" />
        <MetricCard label={t('improvement')} value={improvementText} icon={improvementPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} color={improvementPositive ? 'green' : 'orange'} />
        <MetricCard label={t('strongestSkill')} value={strongest} icon={<Award className="w-4 h-4" />} color="green" />
        <MetricCard label={t('weakestSkill')} value={weakest} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>{t('practiceSessions')}: {practiceSessions}</span>
        <span className="italic">📈 {overallTrend === 'improving' ? 'Keep up the great work!' : overallTrend === 'declining' ? 'Let’s turn this around together →' : 'Stay consistent!'}</span>
      </div>
    </div>
  );

  // === 2. Priority Weaknesses (storytelling card) ===
  const PriorityWeaknesses = () => (
    <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> {t('priorityWeaknesses')}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Focus on these first to boost your score</p>
      </div>
      <div className="p-5 space-y-4">
        {weakTopics.map((topic, idx) => {
          const accuracyTopic = topic.averageScore; // % đúng
          const trendDisplay = getTrendDisplay(topic.trend);
          const friendlyLevel = getFriendlyLevel(topic.level);
          const recommendation = getRecommendationForTopic(topic.topic, topic.level, topic.trend);
          return (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h5 className="font-bold text-gray-800 dark:text-gray-200 capitalize text-lg">{topic.topic}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      topic.level === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                      topic.level === 'improving' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{friendlyLevel}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="font-medium">You struggled with</span> {recommendation.toLowerCase()}.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1 rounded-full shadow-sm">
                      <Target className="w-3 h-3 text-blue-500" /> 
                      <span>{t('accuracy')}: <strong className="text-blue-600 dark:text-blue-400">{accuracyTopic}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1 rounded-full shadow-sm">
                      {trendDisplay.icon}
                      <span className={trendDisplay.color}>{trendDisplay.text}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-2 py-1 rounded-full shadow-sm">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{topic.count} {t('practiceSessions').toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" /> {t('recommended')}: {recommendation}
                  </div>
                </div>
                <button onClick={() => handlePracticeTopic(topic.topic)} className="self-start px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition shadow-sm">
                  <RotateCcw className="w-4 h-4" /> {t('practiceNow')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // === 3. AI Learning Insights (kết hợp study plan + patterns) ===
  const AIInsights = () => (
    <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/20 dark:to-indigo-950/20 rounded-2xl p-5 border border-sky-200 dark:border-sky-800/50 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-indigo-500" />
        <h4 className="font-bold text-gray-800 dark:text-gray-100">{t('aiInsights')}</h4>
      </div>
      
      {/* Study Plan */}
      {studyPlan?.steps?.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">📘 {t('studyPlan')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {studyPlan.steps.map((step, idx) => (
              <div key={idx} className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{t('step')} {idx+1}</div>
                <div className="font-medium text-gray-800 dark:text-gray-200 text-sm mt-1">{step.action}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-2"><BookOpen className="w-3 h-3" /> {step.resource}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {step.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Learning patterns */}
      {learningPatterns?.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">🔍 {t('patterns')}</p>
          <div className="flex flex-wrap gap-2">
            {learningPatterns.map((p, i) => (
              <button key={i} onClick={() => handlePracticePattern(p.name)} className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition flex items-center gap-1">
                {p.name} <span className="text-xs bg-indigo-100 dark:bg-indigo-900/50 px-1.5 rounded-full">{p.count} {t('occurrences')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // === 4. Recent Mistakes (gọn, dễ xem) ===
  const RecentMistakes = () => (
    <div className="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" /> {t('recentMistakes')}
        </h4>
        <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1 hover:underline">
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} {t('viewDetails')}
        </button>
      </div>
      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        {wrongQuestions?.slice(0, 3).map((q, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{q.questionText}</span>
              <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">{Math.round(q.score)}%</span>
            </div>
            {q.aiFeedback && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">💡 {q.aiFeedback.substring(0, 100)}</p>}
          </div>
        ))}
        {!wrongQuestions?.length && <p className="text-xs text-gray-400 text-center py-4">No mistakes yet! 🎉</p>}
        {showDetails && wrongQuestions?.length > 3 && (
          <div className="mt-2 space-y-2 border-t pt-2 border-gray-200 dark:border-gray-700">
            {wrongQuestions.slice(3).map((q, idx) => (
              <div key={idx+3} className="bg-gray-50 dark:bg-gray-800/30 p-2 rounded-lg text-sm">
                <div className="font-medium">{q.questionText}</div>
                <div className="text-xs text-red-500">Score: {Math.round(q.score)}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // === Layout chính: 4 khu vực ===
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-white" />
          <h3 className="text-lg font-bold text-white">Learning Dashboard</h3>
        </div>
        <p className="text-indigo-100 text-xs mt-1">Your personal AI coach — focus what matters</p>
      </div>
      
      <div className="p-6 space-y-6">
        <OverallHealth />
        <PriorityWeaknesses />
        <AIInsights />
        <RecentMistakes />
      </div>
    </div>
  );
}

// === Helper Components ===
const MetricCard = ({ label, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    purple: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
    green: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    orange: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
  };
  return (
    <div className={`p-3 rounded-xl border ${colorClasses[color]} transition-all`}>
      <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">{icon} {label}</div>
      <p className="text-xl font-bold mt-1 truncate">{value}</p>
    </div>
  );
};

const Skeleton = ({ t }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 animate-pulse border border-gray-200 dark:border-gray-700">
    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
    <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('loadingMsg')}</p>
  </div>
);

const ErrorView = ({ onRetry, t }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
    <p className="text-red-600 dark:text-red-400">{t('errorMsg')}</p>
    <button onClick={onRetry} className="mt-3 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm">Retry</button>
  </div>
);

const EmptyState = ({ t }) => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
    <BookOpen className="w-14 h-14 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600 dark:text-gray-400">{t('noDataMsg')}</p>
  </div>
);