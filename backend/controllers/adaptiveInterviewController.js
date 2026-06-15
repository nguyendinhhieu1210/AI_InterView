import { useState, useEffect, useMemo } from "react";
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

function getSessionDate(s) {
  return s.createdAt || s.created_at || s.timestamp || null;
}

// Tạo dữ liệu cho line chart "Sessions theo ngày"
// - period === "7days": 7 ngày gần nhất, group theo ngày
// - period === "all": toàn bộ thời gian (từ session đầu tiên đến hôm nay)
//     + nếu <= 31 ngày -> group theo ngày
//     + nếu > 31 ngày -> group theo tháng (tránh quá nhiều điểm trên biểu đồ)
function buildDailySeries(sessions, period) {
  if (period === "7days") {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    const labels = days.map(formatDate);
    const counts = days.map((day) => {
      const dayStr = day.toDateString();
      return sessions.filter((s) => {
        const c = getSessionDate(s);
        return c && new Date(c).toDateString() === dayStr;
      }).length;
    });
    return { labels, counts, granularity: "day" };
  }

  // period === "all"
  const dates = sessions
    .map(getSessionDate)
    .filter(Boolean)
    .map((d) => new Date(d));

  if (dates.length === 0) {
    return { labels: [], counts: [], granularity: "day" };
  }

  const minDate = new Date(Math.min(...dates));
  minDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.round((today - minDate) / 86400000) + 1;

  if (totalDays <= 31) {
    const labels = [];
    const counts = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i);
      const dayStr = d.toDateString();
      labels.push(formatDate(d));
      counts.push(
        sessions.filter((s) => {
          const c = getSessionDate(s);
          return c && new Date(c).toDateString() === dayStr;
        }).length,
      );
    }
    return { labels, counts, granularity: "day" };
  }

  // group theo tháng
  const map = new Map();
  sessions.forEach((s) => {
    const c = getSessionDate(s);
    if (!c) return;
    const d = new Date(c);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) || 0) + 1);
  });

  const sortedKeys = Array.from(map.keys()).sort();
  const labels = sortedKeys.map((k) => {
    const [y, m] = k.split("-");
    return `${m}/${y}`;
  });
  const counts = sortedKeys.map((k) => map.get(k));

  return { labels, counts, granularity: "month" };
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

// Số lượng record tối đa lấy về cho mỗi loại session (để tránh bị cắt do phân trang backend)
const MAX_FETCH_LIMIT = 10000;

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

function PeriodToggle({ period, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-0.5">
      <button
        onClick={() => onChange("7days")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
          period === "7days"
            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        7 ngày gần đây
      </button>
      <button
        onClick={() => onChange("all")}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
          period === "all"
            ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        Tất cả
      </button>
    </div>
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
  const [allSessions, setAllSessions] = useState([]);
  const [activity, setActivity] = useState([]);
  const [period, setPeriod] = useState("7days"); // "7days" | "all"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAll();
  }, []);

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

  async function fetchAll() {
    try {
      setLoading(true);
      setError(null);

      // ── 1. User stats ──────────────────────────────────────────────────────
      const statsRes = await api.get("/users/admin/users/stats");
      setStats(statsRes.data);

      // ── 2. Admin endpoints ────────────────────────────────────────────────
      // QUAN TRỌNG: 3/4 endpoint (interview / cv / live-coding) có phân trang
      // mặc định limit = 10. Nếu không truyền limit, dashboard chỉ nhận được
      // 10 bản ghi mới nhất của mỗi loại -> tổng số, top users, biểu đồ đều sai.
      // -> truyền limit lớn để lấy đủ toàn bộ dữ liệu.
      const [ivRes, cvRes, adRes, lcRes] = await Promise.allSettled([
        api.get("/interview/admin/interviews", {
          params: { page: 1, limit: MAX_FETCH_LIMIT },
        }),
        api.get("/cv/admin/sessions", {
          params: { page: 1, limit: MAX_FETCH_LIMIT },
        }),
        // adaptive/admin/sessions không phân trang -> trả về full, không cần limit
        api.get("/adaptive/admin/sessions"),
        api.get("/live-coding/admin/sessions", {
          params: { page: 1, limit: MAX_FETCH_LIMIT },
        }),
      ]);

      // Extract sessions
      const interviewSessions =
        ivRes.status === "fulfilled" ? extractSessions(ivRes.value) : [];
      const cvSessions =
        cvRes.status === "fulfilled" ? extractSessions(cvRes.value) : [];
      const adaptiveSessions =
        adRes.status === "fulfilled" ? extractSessions(adRes.value) : [];
      const codingSessions =
        lcRes.status === "fulfilled" ? extractSessions(lcRes.value) : [];

      // ── 3. Gom tất cả sessions ────────────────────────────────────────────
      const combined = [
        ...interviewSessions.map((s) => ({ ...s, _type: "interview" })),
        ...cvSessions.map((s) => ({ ...s, _type: "cv" })),
        ...adaptiveSessions.map((s) => ({ ...s, _type: "adaptive" })),
        ...codingSessions.map((s) => ({ ...s, _type: "live-coding" })),
      ];

      setAllSessions(combined);

      // ── 4. Activity feed (10 hoạt động mới nhất, toàn thời gian) ──────────
      const sortedActivities = [...combined]
        .filter((s) => getSessionDate(s))
        .sort(
          (a, b) => new Date(getSessionDate(b)) - new Date(getSessionDate(a)),
        )
        .slice(0, 10);

      setActivity(sortedActivities);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
  };

  // ── derived data ───────────────────────────────────────────────────────────

  const totalTokens = stats.totalTokens || 0;

  // Sessions hôm nay (luôn tính trên toàn bộ dữ liệu, không phụ thuộc toggle)
  const todayCount = useMemo(() => {
    const todayStr = new Date().toDateString();
    return allSessions.filter((s) => {
      const c = getSessionDate(s);
      return c && new Date(c).toDateString() === todayStr;
    }).length;
  }, [allSessions]);

  // Tổng số session theo từng loại - toàn thời gian (dùng cho KPI cards)
  const totalsByType = useMemo(() => {
    const t = { interview: 0, cv: 0, adaptive: 0, coding: 0 };
    allSessions.forEach((s) => {
      if (s._type === "interview") t.interview++;
      else if (s._type === "cv") t.cv++;
      else if (s._type === "adaptive") t.adaptive++;
      else if (s._type === "live-coding") t.coding++;
    });
    return t;
  }, [allSessions]);

  // Sessions trong khoảng thời gian đang chọn (7 ngày / tất cả)
  const periodSessions = useMemo(() => {
    if (period === "7days") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 6);
      cutoff.setHours(0, 0, 0, 0);
      return allSessions.filter((s) => {
        const c = getSessionDate(s);
        return c && new Date(c) >= cutoff;
      });
    }
    return allSessions;
  }, [allSessions, period]);

  // Tổng theo loại trong khoảng thời gian đang chọn (dùng cho donut + top users)
  const periodTotalsByType = useMemo(() => {
    const t = { interview: 0, cv: 0, adaptive: 0, coding: 0 };
    periodSessions.forEach((s) => {
      if (s._type === "interview") t.interview++;
      else if (s._type === "cv") t.cv++;
      else if (s._type === "adaptive") t.adaptive++;
      else if (s._type === "live-coding") t.coding++;
    });
    return t;
  }, [periodSessions]);

  // Dữ liệu line chart theo khoảng thời gian đang chọn
  const dailySessions = useMemo(
    () => buildDailySeries(allSessions, period),
    [allSessions, period],
  );

  // Top 5 users theo khoảng thời gian đang chọn
  const topUsers = useMemo(() => {
    const userSessionMap = new Map();
    periodSessions.forEach((session) => {
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
    return Array.from(userSessionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodSessions]);

  // ── chart configs ──────────────────────────────────────────────────────────

  const avg = dailySessions.counts.length
    ? Math.round(
        dailySessions.counts.reduce((a, b) => a + b, 0) /
          dailySessions.counts.length,
      )
    : 0;

  const avgUnitLabel =
    dailySessions.granularity === "month" ? "sessions/tháng" : "sessions/ngày";

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

  const periodTotalSessions =
    periodTotalsByType.interview +
    periodTotalsByType.cv +
    periodTotalsByType.adaptive +
    periodTotalsByType.coding;

  const donutData = {
    labels: ["Phỏng vấn thường", "CV Mock", "Adaptive", "Coding"],
    datasets: [
      {
        data: [
          periodTotalsByType.interview,
          periodTotalsByType.cv,
          periodTotalsByType.adaptive,
          periodTotalsByType.coding,
        ],
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
            const percentage = total
              ? Math.round((context.parsed / total) * 100)
              : 0;
            return `${context.label}: ${context.parsed} sessions (${percentage}%)`;
          },
        },
      },
    },
  };

  const donutPercentages = [
    {
      label: "Phỏng vấn thường",
      pct: periodTotalSessions
        ? Math.round((periodTotalsByType.interview / periodTotalSessions) * 100)
        : 0,
      color: "#378ADD",
      count: periodTotalsByType.interview,
    },
    {
      label: "CV Mock",
      pct: periodTotalSessions
        ? Math.round((periodTotalsByType.cv / periodTotalSessions) * 100)
        : 0,
      color: "#534AB7",
      count: periodTotalsByType.cv,
    },
    {
      label: "Adaptive",
      pct: periodTotalSessions
        ? Math.round((periodTotalsByType.adaptive / periodTotalSessions) * 100)
        : 0,
      color: "#BA7517",
      count: periodTotalsByType.adaptive,
    },
    {
      label: "Coding",
      pct: periodTotalSessions
        ? Math.round((periodTotalsByType.coding / periodTotalSessions) * 100)
        : 0,
      color: "#1D9E75",
      count: periodTotalsByType.coding,
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
      value: totalsByType.interview,
      label: "Phỏng vấn thường",
    },
    {
      icon: FileText,
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      value: totalsByType.cv,
      label: "CV Mock",
    },
    {
      icon: Terminal,
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      value: totalsByType.coding,
      label: "Coding Interview",
    },
    {
      icon: Zap,
      iconBg: "#FAECE7",
      iconColor: "#993C1D",
      value: totalTokens,
      label: "Tokens đã dùng",
      suffix: " tokens",
    },
    {
      icon: TrendingUp,
      iconBg: "#EAF3DE",
      iconColor: "#3B6D11",
      value: todayCount,
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
    totalsByType.interview +
    totalsByType.cv +
    totalsByType.adaptive +
    totalsByType.coding;

  const periodLabel = period === "7days" ? "7 ngày gần nhất" : "Toàn thời gian";

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
        <div className="flex items-center gap-3">
          <PeriodToggle period={period} onChange={setPeriod} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Đang tải..." : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Row 1 — KPI cards (luôn là tổng toàn thời gian) */}
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
              Sessions theo{" "}
              {dailySessions.granularity === "month" ? "tháng" : "ngày"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {periodLabel} — Tổng số: {periodTotalSessions} sessions
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
              Trung bình ({avg} {avgUnitLabel})
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
              {periodLabel} — Tổng số sessions: {periodTotalSessions}
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
                      {timeAgo(getSessionDate(item))}
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
                Nhiều sessions nhất — {periodLabel}
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
                Tổng số sessions (toàn thời gian): {totalAllSessions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
