// frontend/src/pages/Dashboard/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import {
  Users,
  Mic,
  FileText,
  Terminal,
  Zap,
  TrendingUp,
  Activity,
  Award,
  RefreshCw,
  Code,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  BarElement,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  BarElement,
);

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

function timeAgo(dateStr) {
  if (!dateStr) return "Just now";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} sec ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day(s) ago`;
}

function initials(name = "") {
  if (!name || name === "—") return "U";
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
}

// ── constants ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "#E6F1FB", text: "#185FA5" },
  { bg: "#EEEDFE", text: "#534AB7" },
  { bg: "#FAEEDA", text: "#854F0B" },
  { bg: "#E1F5EE", text: "#0F6E56" },
  { bg: "#FAECE7", text: "#993C1D" },
];

const TYPE_META = {
  interview: { label: "Interview", bg: "#E6F1FB", color: "#185FA5" },
  "live-coding": { label: "Coding", bg: "#E1F5EE", color: "#0F6E56" },
  cv: { label: "CV Interview", bg: "#EEEDFE", color: "#534AB7" },
  adaptive: { label: "Adaptive", bg: "#FAEEDA", color: "#854F0B" },
};

const DONUT_COLORS = ["#378ADD", "#534AB7", "#BA7517", "#1D9E75"];
const BAR_COLORS = [
  "#378ADD",
  "#534AB7",
  "#BA7517",
  "#1D9E75",
  "#D85A30",
  "#E24B4A",
  "#16A34A",
];
const RANK_COLORS = ["#F59E0B", "#6B7280", "#DC2626", "#4B5563", "#9CA3AF"];

// Language display names
const LANGUAGE_NAMES = {
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
};

// ── sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, suffix = "" }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
        style={{ background: iconBg }}
      >
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white leading-none">
        {fmtCount(value)}
        {suffix && <span className="text-sm ml-0.5">{suffix}</span>}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function TypeBadge({ type }) {
  const m = TYPE_META[type] ?? {
    label: type || "Unknown",
    bg: "#F1EFE8",
    color: "#5F5E5A",
  };
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded ml-1 font-medium"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
  });
  const [totals, setTotals] = useState({
    interview: 0,
    cv: 0,
    adaptive: 0,
    coding: 0,
    tokens: 0,
    totalTokens: 0,
    today: 0,
  });
  const [dailySessions, setDaily] = useState({ labels: [], counts: [] });
  const [activity, setActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [languageStats, setLanguageStats] = useState({
    labels: [],
    counts: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Helper: extract array from admin response
  function extractSessions(res, expectedKey = "sessions") {
    if (!res?.data) return [];
    const data = res.data;
    if (data.success && data[expectedKey] && Array.isArray(data[expectedKey]))
      return data[expectedKey];
    if (Array.isArray(data)) return data;
    if (data.sessions && Array.isArray(data.sessions)) return data.sessions;
    if (data.interviews && Array.isArray(data.interviews))
      return data.interviews;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.history && Array.isArray(data.history)) return data.history;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  }

  // Helper: get user info from session object
  function getUserFromSession(session) {
    if (session.userId && typeof session.userId === "object") {
      return {
        uid: session.userId._id || session.userId.id,
        name:
          session.userId.fullName ||
          session.userId.userName ||
          session.userId.name ||
          "User",
        email: session.userId.email || "",
      };
    }
    if (session.user && typeof session.user === "object") {
      return {
        uid: session.user._id || session.user.id,
        name:
          session.user.fullName ||
          session.user.userName ||
          session.user.name ||
          "User",
        email: session.user.email || "",
      };
    }
    if (session.userId && typeof session.userId === "string") {
      return {
        uid: session.userId,
        name: session.userName || "User",
        email: session.userEmail || "",
      };
    }
    return {
      uid: session._id || session.id,
      name: session.userName || "User",
      email: "",
    };
  }

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. User stats
      const statsRes = await api.get("/users/admin/users/stats");
      setStats(statsRes.data);

      // 2. Fetch token usage từ file log
      let todayTokens = 0;
      let totalTokensAllTime = 0;
      try {
        const tokenRes = await api.get("/admin/tokens/today");
        todayTokens = tokenRes.data?.todayTokens || 0;
        totalTokensAllTime = tokenRes.data?.totalTokensAllTime || 0;
      } catch (tokenErr) {
        console.warn("Không thể lấy token từ file log:", tokenErr);
        // Fallback: lấy từ statsRes nếu có
        todayTokens = statsRes.data?.totalTokens || 0;
        totalTokensAllTime = statsRes.data?.totalTokens || 0;
      }

      // 3. Fetch all admin endpoints with ?limit=all
      const [ivRes, cvRes, adRes, lcRes] = await Promise.allSettled([
        api.get("/interview/admin/interviews?limit=all"),
        api.get("/cv/admin/sessions?limit=all"),
        api.get("/adaptive/admin/sessions?limit=all"),
        api.get("/live-coding/admin/sessions?limit=all"),
      ]);

      const interviewSessions =
        ivRes.status === "fulfilled"
          ? extractSessions(ivRes.value, "interviews")
          : [];
      const cvSessions =
        cvRes.status === "fulfilled"
          ? extractSessions(cvRes.value, "sessions")
          : [];
      const adaptiveSessions =
        adRes.status === "fulfilled"
          ? extractSessions(adRes.value, "sessions")
          : [];
      const codingSessions =
        lcRes.status === "fulfilled"
          ? extractSessions(lcRes.value, "sessions")
          : [];

      // Today sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toDateString();
      const isToday = (session) => {
        const createdAt =
          session.createdAt || session.created_at || session.timestamp;
        return createdAt
          ? new Date(createdAt).toDateString() === todayStr
          : false;
      };
      const totalToday = [
        ...interviewSessions.filter(isToday),
        ...cvSessions.filter(isToday),
        ...adaptiveSessions.filter(isToday),
        ...codingSessions.filter(isToday),
      ].length;

      setTotals({
        interview: interviewSessions.length,
        cv: cvSessions.length,
        adaptive: adaptiveSessions.length,
        coding: codingSessions.length,
        tokens: todayTokens,
        totalTokens: totalTokensAllTime,
        today: totalToday,
      });

      // Language stats from coding sessions
      const langMap = new Map();
      codingSessions.forEach((session) => {
        const lang = session.language || session.language?.toLowerCase();
        if (lang) {
          const display = LANGUAGE_NAMES[lang] || lang;
          langMap.set(display, (langMap.get(display) || 0) + 1);
        }
      });
      const sortedLangs = Array.from(langMap.entries()).sort(
        (a, b) => b[1] - a[1],
      );
      setLanguageStats({
        labels: sortedLangs.map(([lang]) => lang),
        counts: sortedLangs.map(([, count]) => count),
      });

      // Merge all sessions for activity & charts
      const allSessions = [
        ...interviewSessions.map((s) => ({ ...s, _type: "interview" })),
        ...cvSessions.map((s) => ({ ...s, _type: "cv" })),
        ...adaptiveSessions.map((s) => ({ ...s, _type: "adaptive" })),
        ...codingSessions.map((s) => ({ ...s, _type: "live-coding" })),
      ];

      // Daily chart (last 7 days)
      const days = [];
      const dayLabels = [];
      const dayCounts = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
        dayLabels.push(formatDate(d));
      }
      days.forEach((day) => {
        const dayStr = day.toDateString();
        const count = allSessions.filter((session) => {
          const createdAt =
            session.createdAt || session.created_at || session.timestamp;
          return createdAt
            ? new Date(createdAt).toDateString() === dayStr
            : false;
        }).length;
        dayCounts.push(count);
      });
      setDaily({ labels: dayLabels, counts: dayCounts });

      // Activity feed (latest 10)
      const sortedActivities = [...allSessions]
        .filter((s) => s.createdAt || s.created_at || s.timestamp)
        .sort((a, b) => {
          const dateA = new Date(
            a.createdAt || a.created_at || a.timestamp || 0,
          );
          const dateB = new Date(
            b.createdAt || b.created_at || b.timestamp || 0,
          );
          return dateB - dateA;
        })
        .slice(0, 10);
      setActivity(sortedActivities);

      // Top 5 users by sessions
      const userSessionMap = new Map();
      allSessions.forEach((session) => {
        const userInfo = getUserFromSession(session);
        if (userInfo.uid && userInfo.uid !== "undefined") {
          if (!userSessionMap.has(userInfo.uid)) {
            userSessionMap.set(userInfo.uid, {
              uid: userInfo.uid,
              name: userInfo.name,
              email: userInfo.email,
              count: 0,
            });
          }
          userSessionMap.get(userInfo.uid).count++;
        }
      });
      const top5 = Array.from(userSessionMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopUsers(top5);

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── chart configurations ─────────────────────────────────────────────────────

  const avg = dailySessions.counts.length
    ? Math.round(
        dailySessions.counts.reduce((a, b) => a + b, 0) /
          dailySessions.counts.length,
      )
    : 0;

  const lineData = {
    labels: dailySessions.labels,
    datasets: [
      {
        label: "Sessions",
        data: dailySessions.counts,
        borderColor: "#378ADD",
        backgroundColor: "rgba(55,138,221,0.08)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#378ADD",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: "Average",
        data: dailySessions.labels.map(() => avg),
        borderColor: "#E24B4A",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y} sessions`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#888780" },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 11 },
          color: "#888780",
          stepSize: 1,
          precision: 0,
        },
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of sessions",
          font: { size: 10 },
          color: "#888780",
        },
      },
    },
  };

  const donutTotal =
    totals.interview + totals.cv + totals.adaptive + totals.coding;
  const donutData = {
    labels: [
      "Interview",
      "CV Interview",
      "Adaptive Interview",
      "Coding Interview",
    ],
    datasets: [
      {
        data: [totals.interview, totals.cv, totals.adaptive, totals.coding],
        backgroundColor: DONUT_COLORS,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.parsed / total) * 100);
            return `${context.label}: ${context.parsed} sessions (${percentage}%)`;
          },
        },
      },
    },
  };

  const donutPercentages = [
    {
      label: "Interview",
      pct: donutTotal ? Math.round((totals.interview / donutTotal) * 100) : 0,
      color: "#378ADD",
      count: totals.interview,
    },
    {
      label: "CV Interview",
      pct: donutTotal ? Math.round((totals.cv / donutTotal) * 100) : 0,
      color: "#534AB7",
      count: totals.cv,
    },
    {
      label: "Adaptive Interview",
      pct: donutTotal ? Math.round((totals.adaptive / donutTotal) * 100) : 0,
      color: "#BA7517",
      count: totals.adaptive,
    },
    {
      label: "Coding Interview",
      pct: donutTotal ? Math.round((totals.coding / donutTotal) * 100) : 0,
      color: "#1D9E75",
      count: totals.coding,
    },
  ];

  // Language bar chart
  const barData = {
    labels: languageStats.labels,
    datasets: [
      {
        label: "Coding Interviews",
        data: languageStats.counts,
        backgroundColor: BAR_COLORS.slice(0, languageStats.labels.length),
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw} sessions` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        title: {
          display: true,
          text: "Number of sessions",
          font: { size: 10 },
        },
      },
      x: { ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 } },
    },
  };

  const maxSessions = topUsers[0]?.count ?? 1;

  // KPI Cards - Đã bỏ Tokens Used và thay bằng Tokens Used Today
  const kpiCards = [
    {
      icon: Users,
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
      value: stats.totalUsers,
      label: "Total Users",
    },
    {
      icon: Mic,
      iconBg: "#E1F5EE",
      iconColor: "#0F6E56",
      value: totals.interview,
      label: "Interview",
    },
    {
      icon: FileText,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      value: totals.cv,
      label: "CV Interview",
    },
    {
      icon: Terminal,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      value: totals.adaptive,
      label: "Adaptive Interview",
    },
    {
      icon: Code,
      iconBg: "#EAF3DE",
      iconColor: "#3B6D11",
      value: totals.coding,
      label: "Coding Interview",
    },
    {
      icon: Zap,
      iconBg: "#FAECE7",
      iconColor: "#993C1D",
      value: totals.tokens,
      label: "Tokens Used Today",
      suffix: " tokens",
    },
    {
      icon: TrendingUp,
      iconBg: "#FFF1F0",
      iconColor: "#C2410C",
      value: totals.today,
      label: "Today's Sessions",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const totalAllSessions =
    totals.interview + totals.cv + totals.adaptive + totals.coding;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            System overview — Last updated{" "}
            {lastUpdated.toLocaleTimeString("en-US")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* KPI Cards - 7 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {kpiCards.map((c, i) => (
          <KpiCard key={i} {...c} />
        ))}
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line chart - Sessions per day */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="mb-4">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Sessions per day
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last 7 days — Total: {totalAllSessions} sessions
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "#378ADD" }}
              />
              Actual sessions
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="w-3 h-0.5 bg-red-400"
                style={{ borderTop: "2px dashed #E24B4A" }}
              />
              Average ({avg} sessions/day)
            </span>
          </div>
          <div style={{ position: "relative", height: 220 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Donut chart - Feature distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="mb-4">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Feature Distribution
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total sessions: {totalAllSessions}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {donutPercentages.map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {d.label}: <span className="font-medium">{d.pct}%</span>
                  <span className="text-gray-400 ml-1">({d.count})</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ position: "relative", height: 200 }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>

        {/* Bar chart - Most used programming languages in Coding Interviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="mb-4">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Top Languages in Coding Interviews
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on {totals.coding} coding sessions
            </p>
          </div>
          {languageStats.labels.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No coding sessions yet
            </div>
          ) : (
            <div style={{ position: "relative", height: 220 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Activity + Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Recent Activity
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time feed
              </p>
            </div>
            <Activity size={18} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
            {activity.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                No activity yet
              </p>
            )}
            {activity.map((item, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const { name } = getUserFromSession(item);
              let actionText = "";
              switch (item._type) {
                case "interview":
                  actionText = "completed an Interview";
                  break;
                case "cv":
                  actionText = "completed a CV Interview";
                  break;
                case "live-coding":
                  actionText = "completed a Coding Interview";
                  break;
                case "adaptive":
                  actionText = "completed an Adaptive Interview";
                  break;
                default:
                  actionText = "had new activity";
              }
              return (
                <div
                  key={item._id || item.id || i}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                    style={{ background: c.bg, color: c.text }}
                  >
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-white">
                      <span className="font-medium">{name}</span> {actionText}
                      <TypeBadge type={item._type} />
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {timeAgo(
                        item.createdAt || item.created_at || item.timestamp,
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Top 5 Users
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Most sessions
              </p>
            </div>
            <Award size={18} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {topUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No data</p>
            )}
            {topUsers.map((user, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const percentage =
                maxSessions > 0 ? (user.count / maxSessions) * 100 : 0;
              return (
                <div key={user.uid} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-7 text-center">
                      <span
                        className="text-sm font-bold"
                        style={{ color: RANK_COLORS[i] }}
                      >
                        #{i + 1}
                      </span>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ background: c.bg, color: c.text }}
                    >
                      {initials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                        {user.name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                              background: BAR_COLORS[i % BAR_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {user.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {topUsers.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Total sessions: {totalAllSessions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
