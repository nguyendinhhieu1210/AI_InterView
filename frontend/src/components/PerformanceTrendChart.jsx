// PerformanceTrendChart.jsx – Fix lỗi lấy sai session mới nhất
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { 
  Loader2, TrendingUp, CalendarDays, Sparkles, BarChart3, Clock, 
  TrendingDown, Award, Target, AlertCircle, Info, Zap
} from 'lucide-react';

export default function PerformanceTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30days');
  const [analysis, setAnalysis] = useState({
    latestScore: { score: 0, label: '', type: '', timestamp: null, previousScore: null, trend: 0 },
    avgScore: 0,
    trendOverall: '+0%',
    bestScore: { score: 0, label: '', type: '' },
    worstScore: { score: 100, label: '', type: '' },
    totalSessions: 0,
    recommendation: ''
  });

  useEffect(() => {
    fetchHistoryAndBuildChart();
  }, [filter, timeRange]);

  const parseUTCDate = (utcString) => {
    const d = new Date(utcString);
    return isNaN(d.getTime()) ? null : d;
  };

  const fetchHistoryAndBuildChart = async () => {
    setLoading(true);
    try {
      const [normalRes, cvRes] = await Promise.all([
        api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
        api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } }))
      ]);

      let combined = [];

      if (filter === 'all' || filter === 'interview') {
        const normalList = normalRes.data?.success ? normalRes.data.history : [];
        normalList.forEach(item => {
          let topicStr = '';
          if (Array.isArray(item.topic)) topicStr = item.topic.join(' • ');
          else if (typeof item.topic === 'string') topicStr = item.topic;
          else topicStr = 'Interview';
          
          const timestamp = parseUTCDate(item.createdAt);
          if (!timestamp) return; // bỏ qua nếu timestamp lỗi
          
          combined.push({
            timestamp,
            score: item.totalScore,
            type: 'standard',
            label: `${topicStr} (${item.difficulty || 'N/A'})`,
            rawDate: item.createdAt
          });
        });
      }

      if (filter === 'all' || filter === 'cv') {
        const cvList = cvRes.data?.success ? cvRes.data.history : [];
        cvList.forEach(item => {
          let skillStr = '';
          if (Array.isArray(item.topic)) skillStr = item.topic.join(' • ');
          else if (typeof item.topic === 'string') skillStr = item.topic;
          
          const displayLabel = item.cvName
            ? `${item.cvName}${skillStr ? ` (${skillStr})` : ''}`
            : (skillStr || 'CV Interview');
          
          const timestamp = parseUTCDate(item.createdAt);
          if (!timestamp) return;
          
          combined.push({
            timestamp,
            score: item.totalScore,
            type: 'cv',
            label: displayLabel,
            rawDate: item.createdAt
          });
        });
      }

      // Lọc theo timeRange
      const now = new Date();
      let cutoffTime = null;
      if (timeRange === '7days') {
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30days') {
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      let filtered = combined;
      if (cutoffTime) {
        filtered = filtered.filter(d => d.timestamp >= cutoffTime);
      }

      // Sắp xếp theo timestamp TĂNG DẦN (cũ -> mới) để vẽ biểu đồ
      filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Log để debug (có thể xóa sau)
      console.log('Filtered sessions (sorted by timestamp):', filtered.map(s => ({ label: s.label, score: s.score, timestamp: s.timestamp.toISOString() })));

      const chartData = filtered.map((item, idx) => {
        const date = item.timestamp;
        let displayDate;
        if (idx > 0 && date.toDateString() === filtered[idx-1].timestamp.toDateString()) {
          displayDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (date.getFullYear() !== now.getFullYear()) {
            displayDate += `, ${date.getFullYear()}`;
          }
        }
        return {
          date: displayDate,
          fullTimestamp: item.timestamp,
          score: item.score,
          type: item.type,
          label: item.label,
          rawDate: item.rawDate,
          tooltipDate: date.toLocaleString()
        };
      });

      setData(chartData);
      computeAnalysis(filtered);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeAnalysis = (sessions) => {
    if (!sessions.length) {
      setAnalysis({
        latestScore: { score: 0, label: '', type: '', timestamp: null, previousScore: null, trend: 0 },
        avgScore: 0,
        trendOverall: '+0%',
        bestScore: { score: 0, label: '', type: '' },
        worstScore: { score: 100, label: '', type: '' },
        totalSessions: 0,
        recommendation: 'Start your first interview to see insights!'
      });
      return;
    }

    // Sắp xếp theo timestamp TĂNG DẦN (cũ nhất -> mới nhất)
    const sorted = [...sessions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Lấy session mới nhất (cuối mảng)
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    
    // Tính % thay đổi so với bài trước
    let trendValue = 0;
    if (previous && previous.score > 0) {
      trendValue = Math.round(((latest.score - previous.score) / previous.score) * 100);
    } else if (previous && previous.score === 0) {
      trendValue = latest.score > 0 ? 100 : 0;
    }
    
    const scores = sorted.map(s => s.score);
    const avg = Math.round(scores.reduce((a,b) => a+b,0) / scores.length);
    const best = Math.max(...scores);
    const worst = Math.min(...scores);
    const bestSession = sorted.find(s => s.score === best);
    const worstSession = sorted.find(s => s.score === worst);

    // Xu hướng tổng thể (so sánh nửa gần nhất vs nửa cũ hơn)
    const mid = Math.floor(sorted.length / 2);
    const recentHalf = sorted.slice(0, mid);
    const olderHalf = sorted.slice(mid);
    const recentAvg = recentHalf.length ? recentHalf.reduce((a,b) => a+b.score,0)/recentHalf.length : avg;
    const olderAvg = olderHalf.length ? olderHalf.reduce((a,b) => a+b.score,0)/olderHalf.length : avg;
    const overallTrendValue = olderAvg === 0 ? (recentAvg > 0 ? 100 : 0) : Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    const overallTrend = overallTrendValue >= 0 ? `+${overallTrendValue}%` : `${overallTrendValue}%`;

    // Tạo recommendation dựa trên điểm mới nhất
    let recommendation = '';
    const latestScore = latest.score;
    if (latestScore < 50) {
      recommendation = '🔴 Your latest score is low. Focus on fundamentals and practice more. Try reviewing the questions you got wrong.';
    } else if (latestScore < 70) {
      recommendation = '🟡 Your latest score shows potential. Keep practicing and target your weak topics.';
    } else if (latestScore < 85) {
      recommendation = '🟢 Great job! Maintain this momentum by challenging yourself with harder difficulty levels.';
    } else {
      recommendation = '🌟 Excellent! You\'re mastering interviews. Consider sharing your strategies with the community.';
    }

    if (trendValue < -10) {
      recommendation += ' ⚠️ Your score dropped significantly compared to previous attempt. Take time to review mistakes.';
    } else if (trendValue > 10) {
      recommendation += ' 🚀 Impressive improvement! Keep up the good work.';
    }

    if (latest.type === 'cv' && latestScore < 60) {
      recommendation += ' Your CV-based score is low – improve your CV content and practice describing experiences clearly.';
    } else if (latest.type === 'standard' && latestScore < 60) {
      const topic = latest.label.split('(')[0].trim();
      recommendation += ` Focus on "${topic}" to boost your score.`;
    }

    setAnalysis({
      latestScore: {
        score: latestScore,
        label: latest.label,
        type: latest.type,
        timestamp: latest.timestamp,
        previousScore: previous?.score || null,
        trend: trendValue
      },
      avgScore: avg,
      trendOverall: overallTrend,
      bestScore: { score: best, label: bestSession?.label || 'N/A', type: bestSession?.type || '' },
      worstScore: { score: worst, label: worstSession?.label || 'N/A', type: worstSession?.type || '' },
      totalSessions: sessions.length,
      recommendation
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 h-80 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/30 rounded-xl">
        <BarChart3 className="w-12 h-12 mb-2 opacity-40" />
        <p className="text-sm font-medium">No performance data yet.</p>
        <p className="text-xs mt-1">Start an interview to see your trend!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 text-xs max-w-xs transition-all animate-fadeIn z-50">
          <p className="font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> {p.tooltipDate}
          </p>
          <div className="flex items-center gap-2 mb-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Score:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-base">{p.score}<span className="text-xs">/100</span></span>
          </div>
          <div className="text-gray-500 dark:text-gray-400 text-xs border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 mr-1">
              {p.type === 'cv' ? '📄 CV based' : '🎤 Standard'}
            </span>
            <p className="mt-2 break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">{p.label}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-rose-500" />;
    return <span className="w-4 h-4 text-gray-400">→</span>;
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex gap-2 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-full backdrop-blur-sm">
          {['all', 'interview', 'cv'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                filter === f
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-md scale-105'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'interview' ? 'Topic' : 'CV'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-full backdrop-blur-sm">
          {['7days', '30days', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-semibold ring-1 ring-indigo-200 dark:ring-indigo-800'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {range === '7days' ? '7 days' : range === '30days' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
              dy={5}
              interval={0}
              angle={data.length > 6 ? -15 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={50}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
              label={{ value: 'Score', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 11, fontWeight: 500 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#818cf8', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
            <Legend 
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              formatter={() => <span className="text-gray-600 dark:text-gray-300 text-xs font-medium">📈 Score trend</span>}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#4f46e5" 
              strokeWidth={2.5} 
              dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }} 
              activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} 
              name="Score" 
              animationDuration={800} 
              animationEasing="ease-out" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* PERFORMANCE ANALYSIS */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Performance Analysis</h3>
          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Based on {analysis.totalSessions} session(s)
          </div>
        </div>

        {/* Latest + Average */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/30 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800/50 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Latest Score</span>
              </div>
              {analysis.latestScore.trend !== 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${analysis.latestScore.trend > 0 ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700'}`}>
                  {getTrendIcon(analysis.latestScore.trend)}
                  <span>{analysis.latestScore.trend > 0 ? '+' : ''}{analysis.latestScore.trend}% vs previous</span>
                </div>
              )}
            </div>
            <div className={`text-4xl font-bold ${getScoreColorClass(analysis.latestScore.score)}`}>
              {analysis.latestScore.score}<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/100</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 break-words">
              {analysis.latestScore.label}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                {analysis.latestScore.type === 'cv' ? '📄 CV based' : '🎤 Topic based'}
              </span>
              {analysis.latestScore.previousScore !== null && (
                <span className="text-[10px] text-gray-400">Previous: {analysis.latestScore.previousScore}/100</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/30 rounded-2xl p-5 border border-gray-200 dark:border-gray-700/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Average Score</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(parseInt(analysis.trendOverall))}
                <span className={analysis.trendOverall.startsWith('+') && analysis.trendOverall !== '+0%' ? 'text-emerald-600' : analysis.trendOverall.startsWith('-') ? 'text-rose-600' : 'text-gray-500'}>
                  {analysis.trendOverall}
                </span>
              </div>
            </div>
            <div className={`text-4xl font-bold ${getScoreColorClass(analysis.avgScore)}`}>
              {analysis.avgScore}<span className="text-lg font-normal text-gray-500 dark:text-gray-400">/100</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">overall trend (recent vs older)</p>
          </div>
        </div>

        {/* Best, Worst, Total */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Best</span>
              <Target className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {analysis.bestScore.score}<span className="text-sm font-normal">/100</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words line-clamp-2" title={analysis.bestScore.label}>
              {analysis.bestScore.label}
            </div>
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              {analysis.bestScore.type === 'cv' ? 'CV' : 'Topic'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">Lowest</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
              {analysis.worstScore.score}<span className="text-sm font-normal">/100</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words line-clamp-2" title={analysis.worstScore.label}>
              {analysis.worstScore.label}
            </div>
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
              {analysis.worstScore.type === 'cv' ? 'CV' : 'Topic'}
            </span>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/40 dark:to-gray-800/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Sessions</span>
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {analysis.totalSessions}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">in selected period</p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full shrink-0">
              <Info className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Personalized Recommendation</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{analysis.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-center text-gray-400 dark:text-gray-500 mt-5 flex items-center justify-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>{data.length} session(s) displayed on chart</span>
        <Clock className="w-3 h-3 text-gray-400" />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
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