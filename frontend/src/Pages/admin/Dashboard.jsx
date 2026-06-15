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
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
);

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

function timeAgo(dateStr) {
  if (!dateStr) return "Vừa xong";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
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
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
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
  cv: { label: "CV Mock", bg: "#EEEDFE", color: "#534AB7" },
  adaptive: { label: "Adaptive", bg: "#FAEEDA", color: "#854F0B" },
};

const DONUT_COLORS = ["#378ADD", "#534AB7", "#BA7517", "#1D9E75"];
const BAR_COLORS = ["#378ADD", "#534AB7", "#BA7517", "#1D9E75", "#D85A30"];
const RANK_COLORS = ["#F59E0B", "#6B7280", "#DC2626", "#4B5563", "#9CA3AF"];

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
    today: 0,
  });
  const [dailySessions, setDaily] = useState({ labels: [], counts: [] });
  const [activity, setActivity] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Helper: extract array từ response của admin endpoints
  function extractSessions(res) {
    if (!res?.data) return [];
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data.sessions && Array.isArray(data.sessions)) return data.sessions;
    if (data.interviews && Array.isArray(data.interviews))
      return data.interviews;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.success && data.history && Array.isArray(data.history))
      return data.history;
    if (data.results && Array.isArray(data.results)) return data.results;

    return [];
  }

  // Helper: lấy user info từ session object
  function getUserFromSession(session) {
    if (session.userId && typeof session.userId === "object") {
      return {
        uid: session.userId._id || session.userId.id,
        name:
          session.userId.fullName ||
          session.userId.userName ||
          session.userId.name ||
          "Người dùng",
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
          "Người dùng",
        email: session.user.email || "",
      };
    }
    if (session.userId && typeof session.userId === "string") {
      return {
        uid: session.userId,
        name: session.userName || "Người dùng",
        email: session.userEmail || "",
      };
    }
    return {
      uid: session._id || session.id,
      name: session.userName || "Người dùng",
      email: "",
    };
  }
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ── 1. User stats ──────────────────────────────────────────────────────
      const statsRes = await api.get("/users/admin/users/stats");
      setStats(statsRes.data);

      // ── 2. Admin endpoints ────────────────────────────────────────────────
      const [ivRes, cvRes, adRes, lcRes] = await Promise.allSettled([
        api.get("/interview/admin/interviews"),
        api.get("/cv/admin/sessions"),
        api.get("/adaptive/admin/sessions"),
        api.get("/live-coding/admin/sessions"),
      ]);

      const interviewSessions =
        ivRes.status === "fulfilled" ? extractSessions(ivRes.value) : [];

      const cvSessions =
        cvRes.status === "fulfilled" ? extractSessions(cvRes.value) : [];

      const adaptiveSessions =
        adRes.status === "fulfilled" ? extractSessions(adRes.value) : [];

      const codingSessions =
        lcRes.status === "fulfilled" ? extractSessions(lcRes.value) : [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toDateString();

      const isToday = (session) => {
        const createdAt =
          session.createdAt || session.created_at || session.timestamp;

        if (!createdAt) return false;

        return new Date(createdAt).toDateString() === todayStr;
      };

      const totalToday = [
        ...interviewSessions.filter(isToday),
        ...cvSessions.filter(isToday),
        ...adaptiveSessions.filter(isToday),
        ...codingSessions.filter(isToday),
      ].length;

      const totalTokens = statsRes.data.totalTokens || 0;

      setTotals({
        interview: interviewSessions.length,
        cv: cvSessions.length,
        adaptive: adaptiveSessions.length,
        coding: codingSessions.length,
        tokens: totalTokens,
        today: totalToday,
      });

      const allSessions = [
        ...interviewSessions.map((s) => ({
          ...s,
          _type: "interview",
        })),
        ...cvSessions.map((s) => ({
          ...s,
          _type: "cv",
        })),
        ...adaptiveSessions.map((s) => ({
          ...s,
          _type: "adaptive",
        })),
        ...codingSessions.map((s) => ({
          ...s,
          _type: "live-coding",
        })),
      ];

      // Chart 7 ngày
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

          if (!createdAt) return false;

          return new Date(createdAt).toDateString() === dayStr;
        }).length;

        dayCounts.push(count);
      });

      setDaily({
        labels: dayLabels,
        counts: dayCounts,
      });

      // Activity
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

      // Top users
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
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
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

  // ── chart configs ──────────────────────────────────────────────────────────

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
        label: "Trung bình",
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
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y} sessions`;
          },
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
          text: "Số lượng sessions",
          font: { size: 10 },
          color: "#888780",
        },
      },
    },
  };

  const donutTotal =
    totals.interview + totals.cv + totals.adaptive + totals.coding;
  const donutData = {
    labels: ["Phỏng vấn thường", "CV Mock", "Adaptive", "Coding"],
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
          label: function (context) {
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
      label: "Phỏng vấn thường",
      pct: donutTotal ? Math.round((totals.interview / donutTotal) * 100) : 0,
      color: "#378ADD",
      count: totals.interview,
    },
    {
      label: "CV Mock",
      pct: donutTotal ? Math.round((totals.cv / donutTotal) * 100) : 0,
      color: "#534AB7",
      count: totals.cv,
    },
    {
      label: "Adaptive",
      pct: donutTotal ? Math.round((totals.adaptive / donutTotal) * 100) : 0,
      color: "#BA7517",
      count: totals.adaptive,
    },
    {
      label: "Coding",
      pct: donutTotal ? Math.round((totals.coding / donutTotal) * 100) : 0,
      color: "#1D9E75",
      count: totals.coding,
    },
  ];

  const maxSessions = topUsers[0]?.count ?? 1;

  const kpiCards = [
    {
      icon: Users,
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
      value: stats.totalUsers,
      label: "Tổng người dùng",
    },
    {
      icon: Mic,
      iconBg: "#E1F5EE",
      iconColor: "#0F6E56",
      value: totals.interview,
      label: "Phỏng vấn thường",
    },
    {
      icon: FileText,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      value: totals.cv,
      label: "CV Mock",
    },
    {
      icon: Terminal,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      value: totals.coding,
      label: "Coding Interview",
    },
    {
      icon: Zap,
      iconBg: "#FAECE7",
      iconColor: "#993C1D",
      value: totals.tokens,
      label: "Tokens đã dùng",
      suffix: " tokens",
    },
    {
      icon: TrendingUp,
      iconBg: "#EAF3DE",
      iconColor: "#3B6D11",
      value: totals.today,
      label: "Sessions hôm nay",
    },
  ];

  // ── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu dashboard...
          </p>
        </div>
      </div>
    );
  }

  const totalAllSessions =
    totals.interview + totals.cv + totals.adaptive + totals.coding;

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Tổng quan hệ thống — Cập nhật lúc{" "}
            {lastUpdated.toLocaleTimeString("vi-VN")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Đang tải..." : "Làm mới"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((c, i) => (
          <KpiCard key={i} {...c} />
        ))}
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart - Sessions by day */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <div className="mb-4">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              Sessions theo ngày
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              7 ngày gần nhất — Tổng số: {totalAllSessions} sessions
            </p>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "#378ADD" }}
              />
              Sessions thực tế
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span
                className="w-3 h-0.5 bg-red-400"
                style={{ borderTop: "2px dashed #E24B4A" }}
              />
              Trung bình ({avg} sessions/ngày)
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
              Phân bố tính năng
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tổng số sessions: {totalAllSessions}
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
      </div>

      {/* Row 3 — Activity + Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Hoạt động gần đây
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
                Chưa có hoạt động nào
              </p>
            )}
            {activity.map((item, i) => {
              const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const { name } = getUserFromSession(item);

              let actionText = "";
              switch (item._type) {
                case "interview":
                  actionText = "đã hoàn thành phỏng vấn";
                  break;
                case "cv":
                  actionText = "đã phân tích CV";
                  break;
                case "live-coding":
                  actionText = "đã hoàn thành coding challenge";
                  break;
                case "adaptive":
                  actionText = "đã hoàn thành adaptive interview";
                  break;
                default:
                  actionText = "có hoạt động mới";
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
                Top 5 người dùng
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Nhiều sessions nhất
              </p>
            </div>
            <Award size={18} className="text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {topUsers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">
                Chưa có dữ liệu
              </p>
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
                Tổng số sessions: {totalAllSessions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
