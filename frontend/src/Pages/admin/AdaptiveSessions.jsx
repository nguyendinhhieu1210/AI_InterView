// src/pages/admin/AdaptiveSessions.jsx
import { useState, useEffect, useMemo } from "react";
import {
  Brain,
  Trash2,
  Eye,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Calendar,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../../services/api";
import { toast } from "react-hot-toast";

export default function AdaptiveSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: "",
    topic: "",
    fromDate: "",
    toDate: "",
  });
  const itemsPerPage = 10;

  // Helper: format date safely
  const formatDateSafe = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleDateString();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/adaptive/admin/sessions");
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load adaptive sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId, userName) => {
    if (
      !window.confirm(
        `Delete session for ${userName}? This action cannot be undone.`,
      )
    )
      return;
    try {
      await api.delete(`/adaptive/admin/session/${sessionId}`);
      toast.success("Session deleted");
      fetchSessions();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleViewDetail = async (sessionId) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/adaptive/admin/session/${sessionId}`);
      if (res.data.success) {
        setSelectedSession(res.data.session);
        setShowDetailModal(true);
      } else {
        toast.error("Failed to load detail");
      }
    } catch (err) {
      toast.error("Error loading detail");
    } finally {
      setDetailLoading(false);
    }
  };

  // Score helpers
  const normalizeTo10 = (score) => {
    if (score === undefined || score === null) return null;
    return score > 10 ? score / 10 : score;
  };

  const getDisplayFinalScore = (session) => {
    if (session.finalScore !== undefined && session.finalScore !== null) {
      return normalizeTo10(session.finalScore);
    }
    if (session.summary?.overallScore !== undefined) {
      return normalizeTo10(session.summary.overallScore);
    }
    return null;
  };

  // Stats from sessions
  const stats = useMemo(() => {
    const total = sessions.length;
    const uniqueUsers = new Set(
      sessions.map((s) => s.user?.id || s.user?.email),
    ).size;
    const avgScore =
      sessions.reduce((sum, s) => {
        const score = getDisplayFinalScore(s);
        return sum + (score !== null ? score : 0);
      }, 0) / (total || 1);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeek = sessions.filter(
      (s) => new Date(s.createdAt) >= oneWeekAgo,
    ).length;
    return { total, avgScore, uniqueUsers, thisWeek };
  }, [sessions]);

  // Filter sessions
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !search ||
        s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.topic?.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty =
        !filters.difficulty ||
        s.difficulty?.toLowerCase() === filters.difficulty.toLowerCase();

      const matchesTopic =
        !filters.topic ||
        s.topic?.toLowerCase().includes(filters.topic.toLowerCase());

      let matchesDate = true;
      const createdAt = new Date(s.createdAt);
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) matchesDate = false;
      }
      if (filters.toDate && matchesDate) {
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) matchesDate = false;
      }

      return matchesSearch && matchesDifficulty && matchesTopic && matchesDate;
    });
  }, [sessions, search, filters]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getScoreBadgeClass = (score) => {
    if (score === undefined || score === null)
      return "bg-gray-100 text-gray-700";
    if (score >= 7)
      return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400";
    if (score >= 4)
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getScoreColor = (scorePercent) => {
    if (scorePercent >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (scorePercent >= 60) return "text-blue-600 dark:text-blue-400";
    if (scorePercent >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const resetFilters = () => {
    setFilters({ difficulty: "", topic: "", fromDate: "", toDate: "" });
    setSearch("");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-500" /> Adaptive Interviews
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and review all AI-powered adaptive interview sessions
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg text-sm font-medium shadow hover:shadow-md transition-all"
        >
          <Filter size={16} />
          <span className="hidden sm:inline">
            {showFilters ? "Hide Filters" : "Show Filters"}
          </span>
          <span className="sm:hidden">{showFilters ? "Hide" : "Filter"}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Sessions
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <Brain
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Score
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.avgScore.toFixed(1)}
                <span className="text-sm font-normal text-gray-400 ml-0.5">
                  /10
                </span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <TrendingUp
                size={16}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Unique Users
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.uniqueUsers}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This Week
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.thisWeek}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <Calendar
                size={16}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-3 md:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    difficulty: e.target.value,
                    page: 1,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                Topic
              </label>
              <input
                type="text"
                placeholder="Filter by topic..."
                value={filters.topic}
                onChange={(e) =>
                  setFilters({ ...filters, topic: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={resetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by user name, email, or topic..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Topic
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Questions
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginated.map((session) => {
                const totalQuestions =
                  session.totalQuestions ??
                  session.summary?.questionBreakdown?.length ??
                  (session.conversation
                    ? session.conversation.filter(
                        (m) => m.role === "assistant" && m.type === "question",
                      ).length
                    : 0) ??
                  0;
                const displayScore = getDisplayFinalScore(session);

                return (
                  <tr
                    key={session.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 text-white flex items-center justify-center font-bold text-xs">
                          {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {session.user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-sm text-gray-700 dark:text-gray-300">
                        {session.topic}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`capitalize text-xs px-2 py-1 rounded-full ${getDifficultyColor(session.difficulty)}`}
                      >
                        {session.difficulty || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {totalQuestions}
                    </td>
                    <td className="px-4 py-3">
                      {displayScore !== null ? (
                        <span
                          className={`text-sm font-semibold ${getScoreColor(displayScore * 10)}`}
                        >
                          {displayScore}/10
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateSafe(session.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleViewDetail(session.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(session.id, session.user?.name)
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No adaptive sessions found.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal - Đồng bộ màu xanh indigo/blue */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Brain size={20} /> Adaptive Session Details
                </h3>
                <p className="text-indigo-100 text-sm mt-0.5">
                  {selectedSession.topic} • {selectedSession.difficulty}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold">
                    {selectedSession.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedSession.user?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedSession.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Final Score</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {getDisplayFinalScore(selectedSession) !== null
                      ? `${getDisplayFinalScore(selectedSession)}/10`
                      : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Questions</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedSession.summary?.questionBreakdown?.length ??
                      (selectedSession.conversation
                        ? selectedSession.conversation.filter(
                            (m) =>
                              m.role === "assistant" && m.type === "question",
                          ).length
                        : "—")}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedSession.status === "completed"
                      ? "Completed"
                      : "Active"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Started</p>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedSession.startedAt
                      ? new Date(selectedSession.startedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Evaluation Summary */}
              {selectedSession.summary &&
                typeof selectedSession.summary === "object" && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg">
                      Evaluation Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedSession.summary.overallScore !== undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">Overall Score</p>
                          <p className="text-xl font-bold">
                            {normalizeTo10(
                              selectedSession.summary.overallScore,
                            )}
                            /10
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.grade !== undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">Grade</p>
                          <p className="text-xl font-bold">
                            {selectedSession.summary.grade}
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.hireRecommendation !==
                        undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">
                            Hire Recommendation
                          </p>
                          <p className="text-sm font-bold">
                            {selectedSession.summary.hireRecommendation}
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.communicationScore !==
                        undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">Communication</p>
                          <p className="text-xl font-bold">
                            {selectedSession.summary.communicationScore}/10
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.technicalDepth !== undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">
                            Technical Depth
                          </p>
                          <p className="text-xl font-bold">
                            {selectedSession.summary.technicalDepth}/10
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.problemSolving !== undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">
                            Problem Solving
                          </p>
                          <p className="text-xl font-bold">
                            {selectedSession.summary.problemSolving}/10
                          </p>
                        </div>
                      )}
                      {selectedSession.summary.confidence !== undefined && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                          <p className="text-xs text-gray-500">Confidence</p>
                          <p className="text-xl font-bold">
                            {selectedSession.summary.confidence}/10
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedSession.summary.overallEvaluation && (
                      <div>
                        <p className="text-sm font-semibold mb-1">
                          Evaluation Level
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedSession.summary.overallEvaluation}
                        </p>
                      </div>
                    )}
                    {typeof selectedSession.summary.summary === "string" && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Summary</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {selectedSession.summary.summary}
                        </p>
                      </div>
                    )}
                    {selectedSession.summary.topicBreakdown &&
                      typeof selectedSession.summary.topicBreakdown ===
                        "object" &&
                      !Array.isArray(selectedSession.summary.topicBreakdown) &&
                      Object.keys(selectedSession.summary.topicBreakdown)
                        .length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">
                            Topic Breakdown
                          </p>
                          <div className="space-y-2">
                            {Object.entries(
                              selectedSession.summary.topicBreakdown,
                            ).map(([subtopic, score], i) => (
                              <div
                                key={i}
                                className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm flex justify-between items-center"
                              >
                                <span className="capitalize">{subtopic}</span>
                                <span className="font-semibold">
                                  {(() => {
                                    const norm = normalizeTo10(score);
                                    return norm !== null ? `${norm}/10` : "—";
                                  })()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

              {selectedSession.summary &&
                typeof selectedSession.summary === "string" && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedSession.summary}
                    </p>
                  </div>
                )}

              {/* Question & Answer Details */}
              <h3 className="font-semibold text-lg mb-3">
                Question & Answer Details
              </h3>
              <div className="space-y-4">
                {(selectedSession.summary?.questionBreakdown || []).map(
                  (q, idx) => {
                    const conv = selectedSession.conversation || [];
                    let answer = null;
                    let qCount = 0;
                    for (let i = 0; i < conv.length; i++) {
                      if (
                        conv[i].role === "assistant" &&
                        conv[i].type === "question"
                      ) {
                        qCount++;
                        if (
                          qCount === (q.questionNumber ?? idx + 1) &&
                          conv[i + 1]?.role === "user"
                        ) {
                          answer = conv[i + 1].content;
                          break;
                        }
                      }
                    }
                    return (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="font-medium text-gray-800 dark:text-white">
                            <span className="text-indigo-600">
                              Q{q.questionNumber ?? idx + 1}:
                            </span>{" "}
                            {q.question}
                            {q.subtopic && (
                              <span className="text-gray-400 font-normal capitalize">
                                {" "}
                                • {q.subtopic}
                              </span>
                            )}
                          </div>
                          {q.score !== undefined && (
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full text-xs shrink-0 ${getScoreBadgeClass(q.score)}`}
                            >
                              {(() => {
                                const norm = normalizeTo10(q.score);
                                return norm !== null ? `${norm}/10` : "—";
                              })()}
                              {q.verdict ? ` • ${q.verdict}` : ""}
                            </span>
                          )}
                        </div>
                        <div className="ml-4 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Answer:</span>{" "}
                            {answer || "(No answer)"}
                          </div>
                          {q.feedback && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">Feedback:</span>{" "}
                              {q.feedback}
                            </div>
                          )}
                          {/* ✅ THÊM ĐOẠN NÀY */}
                          {q.idealAnswer && (
                            <div className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-md px-3 py-2">
                              <span className="font-semibold">
                                Ideal answer:
                              </span>{" "}
                              {q.idealAnswer}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
