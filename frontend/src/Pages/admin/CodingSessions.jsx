// src/pages/admin/CodingSessions.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Code,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Users,
  X,
  Terminal,
  FileCode,
  MessageSquare,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CodingSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    uniqueUsers: 0,
    languages: [],
    thisWeek: 0,
  });
  const [filters, setFilters] = useState({
    language: "",
    difficulty: "",
    fromDate: "",
    toDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const limit = 10;

  // Helper format date an toàn
  const formatDateSafe = (dateValue, withTime = true) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Invalid date";
    return withTime
      ? format(date, "dd/MM/yyyy HH:mm")
      : format(date, "dd/MM/yyyy");
  };

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(filters.language && { language: filters.language }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      };

      const response = await api.get("/live-coding/admin/sessions", { params });

      if (response.data.success) {
        setSessions(response.data.sessions || []);
        setTotalPages(response.data.pages || 1);
        setTotalSessions(response.data.total || 0);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error("Failed to fetch coding sessions:", error);
      toast.error(
        error.response?.data?.message || "Failed to load coding sessions",
      );
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    filters.language,
    filters.difficulty,
    filters.fromDate,
    filters.toDate,
  ]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/live-coding/admin/sessions/${id}`);
      toast.success("Coding session deleted successfully");
      fetchSessions();
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete coding session",
      );
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await api.get(`/live-coding/admin/sessions/${id}`);
      if (response.data.success) {
        setSelectedSession(response.data.session);
        setShowDetailModal(true);
      } else {
        toast.error("Failed to load coding session details");
      }
    } catch (error) {
      console.error("Failed to fetch coding session details:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load coding session details",
      );
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
      case "intermediate":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
      case "advanced":
        return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
      // Giữ lại các trường hợp cũ nếu có (easy, medium, hard)
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

  const getLanguageColor = (language) => {
    const colors = {
      javascript:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
      python:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
      java: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
      cpp: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
      csharp:
        "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
      go: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
    };
    return (
      colors[language?.toLowerCase()] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
    );
  };

  const resetFilters = () => {
    setFilters({ language: "", difficulty: "", fromDate: "", toDate: "" });
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-indigo-500" /> Coding Sessions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monitor and review all live coding interview sessions
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
              <Terminal
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
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Calendar
                size={16}
                className="text-purple-600 dark:text-purple-400"
              />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Languages
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.languages?.length || 0}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <Code
                size={16}
                className="text-emerald-600 dark:text-emerald-400"
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
                Language
              </label>
              <input
                type="text"
                placeholder="Python, JavaScript, Java..."
                value={filters.language}
                onChange={(e) =>
                  setFilters({ ...filters, language: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Coding Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Language
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
                  Date
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Code className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No coding sessions found
                    </p>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 text-white flex items-center justify-center font-bold text-xs">
                          {session.userName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {session.userName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {session.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${getLanguageColor(session.language)}`}
                      >
                        {session.language}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {session.topic}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(session.difficulty)}`}
                      >
                        {session.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {session.totalQuestions}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateSafe(session.createdAt, true)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(session.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(session)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} ({totalSessions} sessions)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal - đồng bộ màu sắc */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Code size={20} /> Coding Session Details
                </h3>
                <p className="text-indigo-100 text-sm mt-0.5">
                  {selectedSession.language} • {selectedSession.topic} •{" "}
                  {selectedSession.difficulty}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold">
                    {selectedSession.userName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedSession.userName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedSession.userEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Language</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedSession.language}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Domain</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {selectedSession.domain}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Difficulty</p>
                  <p className="text-sm font-semibold capitalize text-gray-800 dark:text-white">
                    {selectedSession.difficulty}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {formatDateSafe(selectedSession.createdAt, true)}
                  </p>
                </div>
              </div>

              {/* Code History */}
              {selectedSession.codeHistory?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-white flex items-center gap-2">
                    <FileCode size={16} className="text-indigo-500" />
                    Code Attempts ({selectedSession.codeHistory.length})
                  </h4>
                  <div className="space-y-6">
                    {selectedSession.codeHistory.map((entry, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-900/50 dark:to-indigo-950/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            <span className="text-sm font-semibold text-gray-800 dark:text-white">
                              Attempt #{idx + 1}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateSafe(entry.submittedAt, true)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Problem Statement */}
                          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                              📋 Problem Statement:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {entry.problemStatement}
                            </p>
                          </div>

                          {/* Code Solution */}
                          <div>
                            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                              💻 Solution Code:
                            </p>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto font-mono max-h-64 overflow-y-auto">
                              <code>{entry.code}</code>
                            </pre>
                          </div>

                          {/* Explanation Q&A */}
                          {entry.explainAnswers?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                                <MessageSquare size={12} /> Explanation Q&A (
                                {entry.explainAnswers.length} questions)
                              </p>
                              <div className="space-y-3">
                                {entry.explainAnswers.map((qa, qaIdx) => (
                                  <div
                                    key={qaIdx}
                                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border-l-4 border-indigo-500"
                                  >
                                    <p className="text-sm font-medium text-gray-800 dark:text-white mb-2">
                                      Q{qaIdx + 1}: {qa.question}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                      <span className="font-semibold">
                                        Answer:
                                      </span>{" "}
                                      {qa.answer}
                                    </p>
                                    <div
                                      className={`text-xs p-2 rounded ${qa.isCorrect ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "bg-red-50 text-red-700 dark:bg-red-950/20"}`}
                                    >
                                      <span className="font-semibold">
                                        Feedback:
                                      </span>{" "}
                                      {qa.feedback}
                                    </div>
                                    {qa.modelAnswer &&
                                      qa.modelAnswer !== qa.feedback && (
                                        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 p-2 rounded">
                                          <span className="font-semibold">
                                            💡 Model Answer:
                                          </span>{" "}
                                          {qa.modelAnswer}
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Evaluation Summary */}
                          {entry.evaluation && (
                            <div>
                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                📊 Evaluation Summary:
                              </p>
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 space-y-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                  {entry.evaluation.summary}
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {entry.evaluation.feedback}
                                </p>
                                {entry.evaluation.strengths?.length > 0 && (
                                  <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                                      ✅ Strengths:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                      {entry.evaluation.strengths.map(
                                        (s, i) => (
                                          <li key={i}>{s}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                                {entry.evaluation.weaknesses?.length > 0 && (
                                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                                      ⚠️ Areas to Improve:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                                      {entry.evaluation.weaknesses.map(
                                        (w, i) => (
                                          <li key={i}>{w}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full">
            <div className="p-5">
              <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">
                Delete Coding Session
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Delete coding session from{" "}
                <span className="font-semibold">
                  {showDeleteModal.userName}
                </span>
                ?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteModal.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
