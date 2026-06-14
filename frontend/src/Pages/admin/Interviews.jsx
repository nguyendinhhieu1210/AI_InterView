// src/pages/admin/Interviews.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Users,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    uniqueUsers: 0,
    thisWeek: 0,
  });
  const [filters, setFilters] = useState({
    difficulty: "",
    topic: "",
    fromDate: "",
    toDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const limit = 10;

  // Helper format date an toàn
  const formatDateSafe = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    return isNaN(date.getTime())
      ? "Invalid date"
      : format(date, "dd/MM/yyyy HH:mm");
  };

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search) params.search = search;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.topic) params.topic = filters.topic;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const response = await api.get("/interview/admin/interviews", { params });
      setInterviews(response.data.interviews || []);
      setTotalPages(response.data.pages || 1);
      setTotalInterviews(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
      toast.error("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get("/interview/admin/interviews/stats");
      setStats(response.data.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchStats();
  }, [fetchInterviews, fetchStats]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/interview/admin/interviews/${id}`);
      toast.success("Interview deleted successfully");
      fetchInterviews();
      fetchStats();
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete interview");
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await api.get(`/interview/admin/interviews/${id}`);
      setSelectedInterview(response.data.interview);
      setShowDetailModal(true);
    } catch (error) {
      console.error("Failed to fetch interview details:", error);
      toast.error("Failed to load interview details");
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400";
      case "hard":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const resetFilters = () => {
    setFilters({
      difficulty: "",
      topic: "",
      fromDate: "",
      toDate: "",
    });
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-500" /> Interview
            Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and review all standard interview sessions
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
                Total Interviews
              </p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
                {stats.total}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <FileText
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
                {stats.avgScore?.toFixed(1) || 0}
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
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Calendar
                size={16}
                className="text-purple-600 dark:text-purple-400"
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
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Interviews Table */}
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No interviews found
                    </p>
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr
                    key={interview.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 text-white flex items-center justify-center font-bold text-xs">
                          {interview.userName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800 dark:text-white">
                            {interview.userName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {interview.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {interview.topic}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`capitalize text-xs px-2 py-1 rounded-full ${getDifficultyColor(interview.difficulty)}`}
                      >
                        {interview.difficulty || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${getScoreColor(interview.totalScore)}`}
                      >
                        {interview.totalScore || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateSafe(interview.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(interview.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(interview)}
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
              Page {page} of {totalPages} ({totalInterviews} interviews)
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

      {/* Detail Modal - cập nhật màu xanh đồng bộ */}
      {showDetailModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">
                  Interview Details
                </h3>
                <p className="text-indigo-100 text-sm mt-0.5">
                  {selectedInterview.topic} • {selectedInterview.difficulty}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center font-bold">
                    {selectedInterview.userName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {selectedInterview.userName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedInterview.userEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Score</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(selectedInterview.totalScore)}`}
                  >
                    {selectedInterview.totalScore}/100
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">MCQ Score</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedInterview.mcqScore}/70
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Essay Score</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedInterview.essayScore}/30
                  </p>
                </div>
              </div>

              {/* MCQ Questions */}
              {selectedInterview.mcqResults?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-white">
                    Multiple Choice Questions
                  </h4>
                  <div className="space-y-4">
                    {selectedInterview.mcqResults.map((q, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <div
                          className={`px-4 py-2 flex justify-between items-center ${q.isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
                              MCQ
                            </span>
                            <span className="text-xs text-gray-500">
                              Difficulty: {q.difficulty || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {q.isCorrect ? (
                              <>
                                <CheckCircle
                                  size={14}
                                  className="text-emerald-500"
                                />
                                <span className="text-xs text-emerald-600 font-medium">
                                  Correct (+{q.score})
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle
                                  size={14}
                                  className="text-red-500"
                                />
                                <span className="text-xs text-red-600 font-medium">
                                  Incorrect (+0)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {idx + 1}. {q.question}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              📝 Your answer:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {q.userAnswer || "No answer provided"}
                            </p>
                          </div>
                          {!q.isCorrect && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">
                                ✅ Correct answer:
                              </p>
                              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                {q.correctAnswer}
                              </p>
                              {q.explanation && (
                                <>
                                  <p className="text-xs text-gray-500 mt-2 mb-1">
                                    💡 Explanation:
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {q.explanation}
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay Questions */}
              {selectedInterview.textResults?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-white">
                    Essay Questions
                  </h4>
                  <div className="space-y-4">
                    {selectedInterview.textResults.map((q, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                            Essay
                          </span>
                          <span
                            className={`text-sm font-bold ${getScoreColor(q.score * 10)}`}
                          >
                            {q.score}/10
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {idx + 1}. {q.question}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              📝 Your answer:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {q.userAnswer || "No answer provided"}
                            </p>
                          </div>
                          {q.feedback && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                📖 Feedback:
                              </p>
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {q.feedback}
                              </div>
                            </div>
                          )}
                          {q.sampleAnswer && (
                            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                              <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                🤖 Sample answer:
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {q.sampleAnswer}
                              </p>
                            </div>
                          )}
                          {q.idealKeywords?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-xs text-indigo-500 font-medium">
                                Ideal keywords:
                              </span>
                              {q.idealKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 rounded-full"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.gradingExplanation && (
                            <div className="text-xs text-gray-500 italic">
                              {q.gradingExplanation}
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
                Delete Interview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Delete interview from{" "}
                <span className="font-semibold">
                  {showDeleteModal.userName}
                </span>
                ? This action cannot be undone.
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
