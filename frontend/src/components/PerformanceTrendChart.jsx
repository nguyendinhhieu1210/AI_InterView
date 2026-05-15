import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { Loader2, TrendingUp, CalendarDays, Sparkles, BarChart3, Clock } from 'lucide-react';

export default function PerformanceTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    fetchHistoryAndBuildChart();
  }, [filter, timeRange]);

  const parseUTCDate = (utcString) => {
    return new Date(utcString);
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
          
          combined.push({
            timestamp: parseUTCDate(item.createdAt),
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
          
          combined.push({
            timestamp: parseUTCDate(item.createdAt),
            score: item.totalScore,
            type: 'cv',
            label: displayLabel,
            rawDate: item.createdAt
          });
        });
      }

      const now = new Date();
      let cutoffTime = null;
      if (timeRange === '7days') {
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30days') {
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      let filtered = combined;
      if (cutoffTime) {
        filtered = combined.filter(d => d.timestamp >= cutoffTime);
      }

      filtered.sort((a, b) => a.timestamp - b.timestamp);

      const chartData = filtered.map((item, idx) => {
        const date = item.timestamp;
        let displayDate;
        if (idx > 0 && date.toDateString() === filtered[idx-1].timestamp.toDateString()) {
          displayDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (date.getFullYear() !== new Date().getFullYear()) {
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
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
    } finally {
      setLoading(false);
    }
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
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 text-xs max-w-xs transition-all animate-fadeIn">
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
            <p className="mt-2 break-words whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-mono text-[11px]">{p.label}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
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

      <div className="text-xs text-center text-gray-400 dark:text-gray-500 mt-5 flex items-center justify-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        <Sparkles className="w-3 h-3 text-indigo-400" />
        <span>{data.length} session(s) in selected period</span>
        <Clock className="w-3 h-3 text-gray-400" />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
      `}</style>
    </div>
  );
}