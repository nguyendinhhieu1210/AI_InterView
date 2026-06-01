// PerformanceTrendChart.jsx
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Area } from 'recharts';
import api from '../services/api';
import {
  Loader2, TrendingUp, CalendarDays, Lightbulb, TrendingDown,
  ChevronLeft, ChevronRight, MessageCircle, FolderOpen, Cpu, BarChart3, Award, Target, AlertCircle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// ... rest of the component remains unchanged

// ==================== HELPERS ====================
const getScoreColor = (score, isAdaptive) => {
  if (isAdaptive) {
    if (score >= 8) return '#10b981';
    if (score >= 5) return '#f59e0b';
    return '#ef4444';
  }
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const getScoreColorClass = (score, isAdaptive) => {
  if (isAdaptive) {
    return score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : score >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
  }
  return score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
};

// ==================== CUSTOM TOOLTIP (theme‑aware via Tailwind classes) ====================
const CustomTooltip = memo(({ active, payload }) => {
  if (active && payload?.length) {
    const p = payload[0].payload;
    return (
      <div
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-2xl text-xs max-w-xs z-50"
        style={{ pointerEvents: 'none' }}
      >
        <p className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {p.tooltipDate}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-[10px]">Time: {p.tooltipTime}</p>
        <div className="flex items-center gap-2 my-2">
          <span className="text-gray-600 dark:text-gray-400">Score:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{p.score}</span>
        </div>
        <div className="text-gray-700 dark:text-gray-300 text-xs border-t border-gray-100 dark:border-gray-700 pt-3">
          <span className="font-medium text-gray-500 dark:text-gray-400">Session:</span>
          <br />
          {p.label}
        </div>
      </div>
    );
  }
  return null;
});

// ==================== ANALYSIS (pure data) ====================
const computeAnalysis = (data, type, miniStats) => {
  if (!data.length || !miniStats) return null;

  const isAdaptive = type === 'adaptive';
  const unit = isAdaptive ? '/10' : '/100';
  const { avg, trend, total } = miniStats;
  const scores = data.map(d => d.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  let performanceLevel = '';
  let levelColor = '';
  let summary = '';
  let recommendation = '';
  let percentileHint = '';

  if (isAdaptive) {
    if (avg >= 8.5) {
      performanceLevel = 'Outstanding'; levelColor = 'text-emerald-600 dark:text-emerald-400';
      summary = 'Your adaptive interview performance is exceptional. You consistently demonstrate deep understanding.';
      recommendation = 'Challenge yourself with expert-level topics and consider mentoring others.';
      percentileHint = 'Top 10% of learners';
    } else if (avg >= 7) {
      performanceLevel = 'Proficient'; levelColor = 'text-teal-600 dark:text-teal-400';
      summary = 'You have solid grasp of topics. The adaptive system finds your sweet spot.';
      recommendation = 'Focus on topics where you scored below 7. Review missed questions.';
      percentileHint = 'Top 30% of learners';
    } else if (avg >= 5) {
      performanceLevel = 'Developing'; levelColor = 'text-amber-600 dark:text-amber-400';
      summary = 'You are making progress but have room for improvement.';
      recommendation = "Practice foundational concepts more. Use the system's hints and explanations.";
      percentileHint = 'Average range';
    } else {
      performanceLevel = 'Needs Attention'; levelColor = 'text-rose-600 dark:text-rose-400';
      summary = "Your scores indicate significant gaps. Don't worry – we'll help you improve.";
      recommendation = "Start with beginner-level topics. Review each question's explanation thoroughly.";
      percentileHint = 'Bottom 20% – room to grow';
    }
  } else {
    if (avg >= 85) {
      performanceLevel = 'Outstanding'; levelColor = 'text-emerald-600 dark:text-emerald-400';
      summary = "Excellent command of interview topics. You're well-prepared for real interviews.";
      recommendation = 'Practice with timed mock interviews and focus on communication clarity.';
      percentileHint = 'Top 15% of users';
    } else if (avg >= 70) {
      performanceLevel = 'Proficient'; levelColor = 'text-teal-600 dark:text-teal-400';
      summary = 'Good understanding with some weak spots. Targeted practice will help.';
      recommendation = 'Review questions you scored low on. Practice similar topics.';
      percentileHint = 'Above average';
    } else if (avg >= 50) {
      performanceLevel = 'Developing'; levelColor = 'text-amber-600 dark:text-amber-400';
      summary = 'You have basic knowledge but need deeper understanding.';
      recommendation = 'Focus on core concepts first. Use the learning resources provided.';
      percentileHint = 'Average range';
    } else {
      performanceLevel = 'Needs Attention'; levelColor = 'text-rose-600 dark:text-rose-400';
      summary = "Your scores suggest you're new to these topics. Start from basics.";
      recommendation = 'Begin with introductory materials. Practice each topic multiple times.';
      percentileHint = 'Beginner level';
    }
  }

  let trendText = '';
  let trendVariant = 'neutral';
  if (trend > 8) {
    trendText = `Your performance is improving rapidly (+${trend}% over last session). Keep up the momentum!`;
    trendVariant = 'up-fast';
  } else if (trend > 3) {
    trendText = `Steady improvement detected (+${trend}%). Consistent practice is paying off.`;
    trendVariant = 'up-slow';
  } else if (trend > 0) {
    trendText = `Slight improvement (+${trend}%). Small steps matter – continue regular practice.`;
    trendVariant = 'up-tiny';
  } else if (trend < -8) {
    trendText = `Your score dropped significantly (${trend}%). Consider reviewing fundamentals before attempting harder topics.`;
    trendVariant = 'down-fast';
  } else if (trend < 0) {
    trendText = `Mild decline (${trend}%). Identify challenging topics and focus there.`;
    trendVariant = 'down-slow';
  } else {
    trendText = 'Your performance is stable. To advance, try increasing difficulty or new topics.';
    trendVariant = 'neutral';
  }

  const range = maxScore - minScore;
  let consistencyText = '';
  if (range < (isAdaptive ? 1.5 : 15)) {
    consistencyText = '⭐ Very consistent performer – you deliver reliable results.';
  } else if (range < (isAdaptive ? 3 : 30)) {
    consistencyText = '📊 Moderately consistent – some variation based on topic difficulty.';
  } else {
    consistencyText = '🎢 High variation – your performance depends heavily on topic familiarity.';
  }

  const bestSession = data.reduce((best, curr) => curr.score > best.score ? curr : best, data[0]);
  const worstSession = data.reduce((worst, curr) => curr.score < worst.score ? curr : worst, data[0]);

  let insightMessage = '';
  if (total >= 5) {
    const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
    if (recentAvg > avg + (isAdaptive ? 0.5 : 5)) {
      insightMessage = '🔝 Your recent sessions show improvement over your historical average. Great trend!';
    } else if (recentAvg < avg - (isAdaptive ? 0.5 : 5)) {
      insightMessage = '⚠️ Recent scores are below your average. Maybe try easier topics or review mistakes.';
    } else {
      insightMessage = '📈 Your performance is stable. Try increasing difficulty to challenge yourself.';
    }
  } else {
    insightMessage = '📚 Keep practicing – more sessions will give you better insights.';
  }

  return {
    unit, performanceLevel, levelColor, summary, recommendation, percentileHint,
    trendText, trendVariant, consistencyText, insightMessage,
    bestSession, worstSession, total,
  };
};

// ==================== ANALYSIS DISPLAY ====================
const AnalysisPanel = memo(({ analysisData }) => {
  if (!analysisData) return null;

  const {
    unit, performanceLevel, levelColor, summary, recommendation, percentileHint,
    trendText, trendVariant, consistencyText, insightMessage,
    bestSession, worstSession, total,
  } = analysisData;

  const trendIcon = (() => {
    if (trendVariant === 'up-fast') return <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (trendVariant === 'up-slow') return <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    if (trendVariant === 'up-tiny') return <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (trendVariant === 'down-fast') return <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    if (trendVariant === 'down-slow') return <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    return null;
  })();

  return (
    <div className="space-y-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      <div className="flex items-start gap-2">
        <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-gray-800 dark:text-white">Performance Summary:</span> {summary}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 dark:text-white">Level:</span>
            <span className={`font-bold ${levelColor}`}>{performanceLevel}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{percentileHint}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            {trendIcon}
            <span>{trendText}</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Based on {total} session{total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-between border-t border-gray-200 dark:border-gray-700 pt-3 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Best session:</span>{' '}
          <span className="text-gray-800 dark:text-white font-medium">{bestSession.score}{unit}</span>
          <br />
          <span className="text-gray-400 dark:text-gray-500">{bestSession.label.substring(0, 40)}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Lowest session:</span>{' '}
          <span className="text-gray-800 dark:text-white font-medium">{worstSession.score}{unit}</span>
          <br />
          <span className="text-gray-400 dark:text-gray-500">{worstSession.label.substring(0, 40)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs">
        <Target className="w-4 h-4" />
        <span>{consistencyText}</span>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl">
        <div className="flex items-center gap-2 font-medium mb-2 text-indigo-700 dark:text-indigo-300">
          <Lightbulb className="w-5 h-5" />
          Personalized Recommendation
        </div>
        <p className="text-indigo-800 dark:text-indigo-100 text-sm">{recommendation}</p>
        {insightMessage && (
          <div className="mt-3 pt-2 border-t border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-700 dark:text-indigo-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {insightMessage}
          </div>
        )}
      </div>
    </div>
  );
});

// ==================== SCROLL BUTTONS ====================
const ScrollButtons = memo(({ scroll }) => (
  <>
    <button
      onClick={() => scroll('left')}
      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
    >
      <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
    <button
      onClick={() => scroll('right')}
      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
    >
      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  </>
));

// ==================== CHART CARD ====================
const ChartCard = memo(({ title, icon, color, data, type }) => {
  const { darkMode } = useTheme(); // for dynamic chart colors
  const scrollContainerRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const isAdaptive = type === 'adaptive';
  const scoreSuffix = isAdaptive ? '/10' : '/100';

  const miniStats = useMemo(() => {
    if (!data.length) return null;
    const scores = data.map(d => d.score);
    const latest = scores[scores.length - 1];
    const avg = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    let trend = 0;
    if (scores.length >= 2) {
      const prev = scores[scores.length - 2];
      if (prev > 0) trend = parseFloat(((latest - prev) / prev * 100).toFixed(1));
    }
    return { latest, avg, trend, total: data.length };
  }, [data]);

  const analysisData = useMemo(() => computeAnalysis(data, type, miniStats), [data, type, miniStats]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const saved = sessionStorage.getItem(`scroll-${type}`);
      if (saved) scrollContainerRef.current.scrollLeft = parseInt(saved, 10);
    }
  }, [data, type]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      sessionStorage.setItem(`scroll-${type}`, scrollContainerRef.current.scrollLeft);
    }
  }, [type]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const checkScroll = () => setShowScrollButtons(el.scrollWidth > el.clientWidth);
    checkScroll();
    window.addEventListener('resize', checkScroll);
    el.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [data, handleScroll]);

  const scroll = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }, []);

  const legendItems = useMemo(() => isAdaptive ? [
    { color: '#10b981', label: '≥8.0 (Excellent)' },
    { color: '#f59e0b', label: '5.0–7.9 (Good)' },
    { color: '#ef4444', label: '<5.0 (Needs improvement)' },
  ] : [
    { color: '#10b981', label: '≥80 (Excellent)' },
    { color: '#f59e0b', label: '50–79 (Good)' },
    { color: '#ef4444', label: '<50 (Needs improvement)' },
  ], [isAdaptive]);

  // Dynamic chart colors based on theme
  const axisTickFill = darkMode ? '#e5e7eb' : '#374151';
  const axisLineStroke = darkMode ? '#4b5563' : '#d1d5db';
  const gridStroke = darkMode ? '#374151' : '#e5e7eb';

  if (!data.length) {
    return (
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>{icon}</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
          <BarChart3 className="w-12 h-12 mb-3" />
          <p>No data available in this period</p>
        </div>
      </div>
    );
  }

  const chartWidth = Math.max(400, data.length * 70);
  const yDomain = isAdaptive ? [0, 10] : [0, 100];

  const xAxisProps = {
    dataKey: 'date',
    tick: { fontSize: data.length > 10 ? 9 : 10, fill: axisTickFill },
    tickLine: false,
    axisLine: { stroke: axisLineStroke },
    interval: 0,
    angle: data.length > 8 ? -25 : 0,
    textAnchor: data.length > 8 ? 'end' : 'middle',
  };

  const renderChart = () => {
    if (type === 'standard') {
      return (
        <div className="relative">
          {showScrollButtons && <ScrollButtons scroll={scroll} />}
          <div ref={scrollContainerRef} className="overflow-x-auto pb-2 custom-scrollbar" onScroll={handleScroll}>
            <div style={{ width: chartWidth, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} vertical={false} />
                  <XAxis {...xAxisProps} />
                  <YAxis domain={yDomain} tick={{ fontSize: 10, fill: axisTickFill }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }} activeDot={{ r: 10, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'cv') {
      return (
        <div className="relative">
          {showScrollButtons && <ScrollButtons scroll={scroll} />}
          <div ref={scrollContainerRef} className="overflow-x-auto pb-2 custom-scrollbar" onScroll={handleScroll}>
            <div style={{ width: chartWidth, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} vertical={false} />
                  <XAxis {...xAxisProps} />
                  <YAxis domain={yDomain} tick={{ fontSize: 10, fill: axisTickFill }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {data.map((entry, idx) => (
                      <Cell key={idx} fill={getScoreColor(entry.score, false)} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    // Adaptive
    return (
      <div className="relative">
        {showScrollButtons && <ScrollButtons scroll={scroll} />}
        <div ref={scrollContainerRef} className="overflow-x-auto pb-2 custom-scrollbar" onScroll={handleScroll}>
          <div style={{ width: chartWidth, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} vertical={false} />
                <XAxis {...xAxisProps} />
                <YAxis domain={yDomain} tick={{ fontSize: 10, fill: axisTickFill }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} />
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="none" fill="url(#scoreGradient)" isAnimationActive={false} />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }} activeDot={{ r: 10, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-${color}-100 dark:bg-${color}-900/30`}>{icon}</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          </div>
          {miniStats && (
            <div className="flex gap-5 text-sm text-gray-600 dark:text-gray-300">
              <div>Latest: <span className={`font-bold ${getScoreColorClass(miniStats.latest, isAdaptive)}`}>{miniStats.latest}{scoreSuffix}</span></div>
              <div>Avg: <span className={`font-bold ${getScoreColorClass(miniStats.avg, isAdaptive)}`}>{miniStats.avg}{scoreSuffix}</span></div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        {renderChart()}

        <div className="flex justify-center gap-5 mt-6 text-xs border-t border-gray-200 dark:border-gray-700 pt-4 text-gray-500 dark:text-gray-400">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {analysisData && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium mb-3">
              <Lightbulb className="w-5 h-5" />
              Insights &amp; Analysis
            </div>
            <AnalysisPanel analysisData={analysisData} />
          </div>
        )}
      </div>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
export default function PerformanceTrendChart() {
  const [dataSets, setDataSets] = useState({ standard: [], cv: [], adaptive: [] });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    let isMounted = true;

    const fetchAllHistories = async () => {
      setLoading(true);
      try {
        const [normalRes, cvRes, adaptiveRes] = await Promise.all([
          api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
          api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } })),
          api.get('/adaptive/history').catch(() => ({ data: { success: false, history: [] } })),
        ]);

        if (!isMounted) return;

        const standardRaw = normalRes.data?.success ? normalRes.data.history : [];
        const cvRaw = cvRes.data?.success ? cvRes.data.history : [];
        const adaptiveRaw = adaptiveRes.data?.success ? adaptiveRes.data.history : [];

        const processSessions = (sessions, type) => {
          const items = [];
          sessions.forEach(session => {
            let label = 'Unknown Session';

            if (type === 'standard') {
              label = Array.isArray(session.topic) ? session.topic.join(' • ') : (session.topic || 'Standard Interview');
              if (session.difficulty) label += ` (${session.difficulty})`;
            } else if (type === 'cv') {
              const cvName = session.cvName || 'CV Interview';
              let topicText = '';
              if (session.topic) topicText = Array.isArray(session.topic) ? session.topic.join(' • ') : session.topic;
              else if (session.topics) topicText = Array.isArray(session.topics) ? session.topics.join(' • ') : session.topics;
              else if (session.cvTopic) topicText = session.cvTopic;
              else if (session.position) topicText = session.position;
              else if (session.cvData && typeof session.cvData === 'object') topicText = session.cvData.topic || '';
              label = topicText ? `${cvName} - ${topicText}` : cvName;
            } else {
              let topicPart = session.topic || 'Adaptive Interview';
              if (Array.isArray(topicPart)) topicPart = topicPart.join(' • ');
              const difficultyPart = session.difficulty ? ` (${session.difficulty})` : '';
              label = topicPart + difficultyPart;
            }

            const timestamp = new Date(session.createdAt || session.startedAt);
            if (isNaN(timestamp.getTime())) return;

            let score = 0;
            if (type === 'adaptive') {
              score = session.finalScore ?? (session.totalScore ? session.totalScore / 10 : 0);
              score = Math.round(score * 10) / 10;
            } else {
              score = session.totalScore ?? 0;
            }

            items.push({ timestamp, score, type, label, id: session._id || session.id });
          });
          return items;
        };

        const now = new Date();
        let cutoffTime = null;
        if (timeRange === '7days') cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (timeRange === '30days') cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const filterAndSort = (sessions) => {
          let s = cutoffTime ? sessions.filter(x => x.timestamp >= cutoffTime) : sessions;
          return s.sort((a, b) => a.timestamp - b.timestamp);
        };

        const buildChartData = (sessions) =>
          sessions.map((item, idx, arr) => {
            const date = item.timestamp;
            const displayDate = idx > 0 && date.toDateString() === arr[idx - 1].timestamp.toDateString()
              ? `🕐 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : `📅 ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear()}` : ''}`;

            return {
              date: displayDate,
              fullTimestamp: item.timestamp,
              score: item.score,
              label: item.label,
              tooltipDate: date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
              tooltipTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
          });

        setDataSets({
          standard: buildChartData(filterAndSort(processSessions(standardRaw, 'standard'))),
          cv: buildChartData(filterAndSort(processSessions(cvRaw, 'cv'))),
          adaptive: buildChartData(filterAndSort(processSessions(adaptiveRaw, 'adaptive'))),
        });
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllHistories();
    return () => { isMounted = false; };
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-6">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
          {['7days', '30days', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-xs rounded-full transition-all ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7days' ? '7 days' : range === '30days' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        <ChartCard title="Standard (Topic-based)" icon={<MessageCircle className="w-5 h-5 text-indigo-500" />} color="indigo" data={dataSets.standard} type="standard" />
        <ChartCard title="CV-based (Resume-focused)" icon={<FolderOpen className="w-5 h-5 text-purple-500" />} color="purple" data={dataSets.cv} type="cv" />
        <ChartCard title="Adaptive (Smart Difficulty)" icon={<Cpu className="w-5 h-5 text-emerald-500" />} color="emerald" data={dataSets.adaptive} type="adaptive" />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .dark .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
      `}</style>
    </div>
  );
}