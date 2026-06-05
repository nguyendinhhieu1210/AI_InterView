import { useState, useMemo, useCallback, useEffect, useRef, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Area } from 'recharts';
import {
  Loader2, TrendingUp, CalendarDays, Lightbulb, TrendingDown,
  ChevronLeft, ChevronRight, MessageCircle, FolderOpen, Cpu, BarChart3, Award, Target, AlertCircle
} from 'lucide-react';
import { useHistory } from '../contexts/HistoryContext';

// ==================== Helper: detect dark mode from html class ====================
const useIsDark = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

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
    return score >= 8 ? 'text-success' : score >= 5 ? 'text-warning' : 'text-error';
  }
  return score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error';
};

// ==================== CUSTOM TOOLTIP ====================
const CustomTooltip = memo(({ active, payload }) => {
  if (active && payload?.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-card border border-border p-4 rounded-xl shadow-soft text-xs max-w-xs z-50" style={{ pointerEvents: 'none' }}>
        <p className="font-bold text-text mb-1 flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {p.tooltipDate}
        </p>
        <p className="text-muted text-[10px]">Time: {p.tooltipTime}</p>
        <div className="flex items-center gap-2 my-2">
          <span className="text-muted">Score:</span>
          <span className="font-semibold text-primary text-base">{p.score}</span>
        </div>
        <div className="text-text-muted text-xs border-t border-border pt-3">
          <span className="font-medium text-muted">Session:</span><br />
          {p.label}
        </div>
      </div>
    );
  }
  return null;
});

// ==================== ANALYSIS ====================
const computeAnalysis = (data, type, miniStats) => {
  if (!data.length || !miniStats) return null;
  const isAdaptive = type === 'adaptive';
  const unit = isAdaptive ? '/10' : '/100';
  const { avg, trend, total } = miniStats;
  const scores = data.map(d => d.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  let performanceLevel = '', levelColor = '', summary = '', recommendation = '', percentileHint = '';
  if (isAdaptive) {
    if (avg >= 8.5) {
      performanceLevel = 'Outstanding'; levelColor = 'text-success';
      summary = 'Your adaptive interview performance is exceptional. You consistently demonstrate deep understanding.';
      recommendation = 'Challenge yourself with expert-level topics and consider mentoring others.';
      percentileHint = 'Top 10% of learners';
    } else if (avg >= 7) {
      performanceLevel = 'Proficient'; levelColor = 'text-secondary';
      summary = 'You have solid grasp of topics. The adaptive system finds your sweet spot.';
      recommendation = 'Focus on topics where you scored below 7. Review missed questions.';
      percentileHint = 'Top 30% of learners';
    } else if (avg >= 5) {
      performanceLevel = 'Developing'; levelColor = 'text-warning';
      summary = 'You are making progress but have room for improvement.';
      recommendation = "Practice foundational concepts more. Use the system's hints and explanations.";
      percentileHint = 'Average range';
    } else {
      performanceLevel = 'Needs Attention'; levelColor = 'text-error';
      summary = "Your scores indicate significant gaps. Don't worry – we'll help you improve.";
      recommendation = "Start with beginner-level topics. Review each question's explanation thoroughly.";
      percentileHint = 'Bottom 20% – room to grow';
    }
  } else {
    if (avg >= 85) {
      performanceLevel = 'Outstanding'; levelColor = 'text-success';
      summary = "Excellent command of interview topics. You're well-prepared for real interviews.";
      recommendation = 'Practice with timed mock interviews and focus on communication clarity.';
      percentileHint = 'Top 15% of users';
    } else if (avg >= 70) {
      performanceLevel = 'Proficient'; levelColor = 'text-secondary';
      summary = 'Good understanding with some weak spots. Targeted practice will help.';
      recommendation = 'Review questions you scored low on. Practice similar topics.';
      percentileHint = 'Above average';
    } else if (avg >= 50) {
      performanceLevel = 'Developing'; levelColor = 'text-warning';
      summary = 'You have basic knowledge but need deeper understanding.';
      recommendation = 'Focus on core concepts first. Use the learning resources provided.';
      percentileHint = 'Average range';
    } else {
      performanceLevel = 'Needs Attention'; levelColor = 'text-error';
      summary = "Your scores suggest you're new to these topics. Start from basics.";
      recommendation = 'Begin with introductory materials. Practice each topic multiple times.';
      percentileHint = 'Beginner level';
    }
  }

  let trendText = '', trendVariant = 'neutral';
  const absChange = Math.abs(trend);
  const thresholdFast = isAdaptive ? 1.0 : 10;
  const thresholdSlow = isAdaptive ? 0.5 : 5;
  if (trend > 0) {
    if (absChange >= thresholdFast) {
      trendText = `Your performance is improving rapidly (+${trend.toFixed(1)} point${trend !== 1 ? 's' : ''}). Keep up the momentum!`;
      trendVariant = 'up-fast';
    } else if (absChange >= thresholdSlow) {
      trendText = `Steady improvement detected (+${trend.toFixed(1)} point${trend !== 1 ? 's' : ''}). Consistent practice is paying off.`;
      trendVariant = 'up-slow';
    } else if (trend > 0) {
      trendText = `Slight improvement (+${trend.toFixed(1)} point${trend !== 1 ? 's' : ''}). Small steps matter – continue regular practice.`;
      trendVariant = 'up-tiny';
    }
  } else if (trend < 0) {
    if (absChange >= thresholdFast) {
      trendText = `Your score dropped significantly (${trend.toFixed(1)} point${trend !== -1 ? 's' : ''}). Consider reviewing fundamentals before attempting harder topics.`;
      trendVariant = 'down-fast';
    } else if (absChange >= thresholdSlow) {
      trendText = `Mild decline (${trend.toFixed(1)} point${trend !== -1 ? 's' : ''}). Identify challenging topics and focus there.`;
      trendVariant = 'down-slow';
    } else {
      trendText = `Very slight decline (${trend.toFixed(1)} point${trend !== -1 ? 's' : ''}). Check if topics are getting harder.`;
      trendVariant = 'down-slow';
    }
  } else {
    trendText = 'Your performance is stable. To advance, try increasing difficulty or new topics.';
    trendVariant = 'neutral';
  }

  const range = maxScore - minScore;
  let consistencyText = '';
  if (range < (isAdaptive ? 1.5 : 15)) consistencyText = '⭐ Very consistent performer – you deliver reliable results.';
  else if (range < (isAdaptive ? 3 : 30)) consistencyText = '📊 Moderately consistent – some variation based on topic difficulty.';
  else consistencyText = '🎢 High variation – your performance depends heavily on topic familiarity.';

  const bestSession = data.reduce((best, curr) => curr.score > best.score ? curr : best, data[0]);
  const worstSession = data.reduce((worst, curr) => curr.score < worst.score ? curr : worst, data[0]);

  let insightMessage = '';
  if (total >= 5) {
    const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
    if (recentAvg > avg + (isAdaptive ? 0.5 : 5)) insightMessage = '🔝 Your recent sessions show improvement over your historical average. Great trend!';
    else if (recentAvg < avg - (isAdaptive ? 0.5 : 5)) insightMessage = '⚠️ Recent scores are below your average. Maybe try easier topics or review mistakes.';
    else insightMessage = '📈 Your performance is stable. Try increasing difficulty to challenge yourself.';
  } else insightMessage = '📚 Keep practicing – more sessions will give you better insights.';

  return {
    unit, performanceLevel, levelColor, summary, recommendation, percentileHint,
    trendText, trendVariant, consistencyText, insightMessage,
    bestSession, worstSession, total,
  };
};

const AnalysisPanel = memo(({ analysisData }) => {
  if (!analysisData) return null;
  const { unit, performanceLevel, levelColor, summary, recommendation, percentileHint, trendText, trendVariant, consistencyText, insightMessage, bestSession, worstSession, total } = analysisData;
  const trendIcon = (() => {
    if (trendVariant === 'up-fast') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trendVariant === 'up-slow') return <TrendingUp className="w-4 h-4 text-secondary" />;
    if (trendVariant === 'up-tiny') return <TrendingUp className="w-4 h-4 text-primary" />;
    if (trendVariant === 'down-fast') return <TrendingDown className="w-4 h-4 text-error" />;
    if (trendVariant === 'down-slow') return <TrendingDown className="w-4 h-4 text-warning" />;
    return null;
  })();

  return (
    <div className="space-y-5 text-sm leading-relaxed text-text-muted">
      <div className="flex items-start gap-2">
        <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div><span className="font-semibold text-text">Performance Summary:</span> {summary}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/10 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-text">Level:</span><span className={`font-bold ${levelColor}`}>{performanceLevel}</span></div>
          <div className="mt-2 text-xs text-muted">{percentileHint}</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5">{trendIcon}<span>{trendText}</span></div>
          <div className="mt-2 text-xs text-muted">Based on {total} session{total !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 justify-between border-t border-border pt-3 text-xs">
        <div><span className="text-muted">Best session:</span> <span className="text-text font-medium">{bestSession.score}{unit}</span><br /><span className="text-muted">{bestSession.label.substring(0, 40)}</span></div>
        <div><span className="text-muted">Lowest session:</span> <span className="text-text font-medium">{worstSession.score}{unit}</span><br /><span className="text-muted">{worstSession.label.substring(0, 40)}</span></div>
      </div>
      <div className="flex items-center gap-2 text-warning text-xs"><Target className="w-4 h-4" /><span>{consistencyText}</span></div>
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
        <div className="flex items-center gap-2 font-medium mb-2 text-primary"><Lightbulb className="w-5 h-5" />Personalized Recommendation</div>
        <p className="text-text text-sm">{recommendation}</p>
        {insightMessage && <div className="mt-3 pt-2 border-t border-primary/20 text-xs text-text-muted flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {insightMessage}</div>}
      </div>
    </div>
  );
});

// ==================== SCROLL BUTTONS ====================
const ScrollButtons = memo(({ scroll }) => (
  <>
    <button onClick={() => scroll('left')} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-full p-1.5 hover:bg-muted/20 shadow-md"><ChevronLeft className="w-5 h-5 text-text" /></button>
    <button onClick={() => scroll('right')} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-full p-1.5 hover:bg-muted/20 shadow-md"><ChevronRight className="w-5 h-5 text-text" /></button>
  </>
));

// ==================== CHART CARD ====================
const ChartCard = memo(({ title, icon, color, data, type }) => {
  const isDark = useIsDark();
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
      trend = parseFloat((latest - prev).toFixed(1));
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
    if (scrollContainerRef.current) sessionStorage.setItem(`scroll-${type}`, scrollContainerRef.current.scrollLeft);
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
    if (scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
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

  const axisTickFill = isDark ? '#e5e7eb' : '#374151';
  const axisLineStroke = isDark ? '#4b5563' : '#d1d5db';
  const gridStroke = isDark ? '#374151' : '#e5e7eb';

  if (!data.length) {
    return (
      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-xl bg-primary/10">{icon}</div><h3 className="text-xl font-bold text-text">{title}</h3></div>
        <div className="h-64 flex flex-col items-center justify-center text-muted"><BarChart3 className="w-12 h-12 mb-3" /><p>No data available in this period</p></div>
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
                    {data.map((entry, idx) => <Cell key={idx} fill={getScoreColor(entry.score, false)} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }
    // adaptive
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
                <defs><linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
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
    <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-primary/10">{icon}</div><h3 className="text-xl font-bold text-text">{title}</h3></div>
          {miniStats && <div className="flex gap-5 text-sm text-muted"><div>Latest: <span className={`font-bold ${getScoreColorClass(miniStats.latest, isAdaptive)}`}>{miniStats.latest}{scoreSuffix}</span></div><div>Avg: <span className={`font-bold ${getScoreColorClass(miniStats.avg, isAdaptive)}`}>{miniStats.avg}{scoreSuffix}</span></div></div>}
        </div>
      </div>
      <div className="p-5">
        {renderChart()}
        <div className="flex justify-center gap-5 mt-6 text-xs border-t border-border pt-4 text-muted">
          {legendItems.map((item, idx) => <div key={idx} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span>{item.label}</span></div>)}
        </div>
        {analysisData && <div className="mt-6 bg-muted/5 border border-border rounded-xl p-5"><div className="flex items-center gap-2 text-primary font-medium mb-3"><Lightbulb className="w-5 h-5" />Insights &amp; Analysis</div><AnalysisPanel analysisData={analysisData} /></div>}
      </div>
    </div>
  );
});

// ==================== MAIN COMPONENT ====================
export default function PerformanceTrendChart() {
  const { normal, cv, adaptive, loading: historyLoading } = useHistory();
  const [timeRange, setTimeRange] = useState('30days');

  const buildChartData = useCallback((sessions, type) => {
    if (!sessions || sessions.length === 0) return [];
    const now = new Date();
    let cutoffTime = null;
    if (timeRange === '7days') cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (timeRange === '30days') cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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

    let processed = processSessions(sessions, type);
    if (cutoffTime) processed = processed.filter(item => item.timestamp >= cutoffTime);
    processed.sort((a, b) => a.timestamp - b.timestamp);
    return processed.map((item, idx, arr) => {
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
  }, [timeRange]);

  const dataSets = useMemo(() => ({
    standard: buildChartData(normal, 'standard'),
    cv: buildChartData(cv, 'cv'),
    adaptive: buildChartData(adaptive, 'adaptive'),
  }), [buildChartData, normal, cv, adaptive]);

  if (historyLoading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <div className="flex gap-1 bg-muted/20 p-1 rounded-full">
          {['7days', '30days', 'all'].map((range) => (
            <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-1.5 text-xs rounded-full transition-all ${timeRange === range ? 'bg-card text-text shadow-sm' : 'text-muted hover:bg-muted/20'}`}>
              {range === '7days' ? '7 days' : range === '30days' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col space-y-8">
        <ChartCard title="Standard (Topic-based)" icon={<MessageCircle className="w-5 h-5 text-primary" />} color="indigo" data={dataSets.standard} type="standard" />
        <ChartCard title="CV-based (Resume-focused)" icon={<FolderOpen className="w-5 h-5 text-secondary" />} color="purple" data={dataSets.cv} type="cv" />
        <ChartCard title="Adaptive (Smart Difficulty)" icon={<Cpu className="w-5 h-5 text-success" />} color="emerald" data={dataSets.adaptive} type="adaptive" />
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--border-color); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--muted-text); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-color); }
      `}</style>
    </div>
  );
}