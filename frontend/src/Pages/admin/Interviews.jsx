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
        return "bg-gray-100 text-gray-700";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Interview Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and review all interview sessions
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Filter size={18} />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Interviews
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Average Score
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {stats.avgScore?.toFixed(1) || 0}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Unique Users
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {stats.uniqueUsers}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This Week
              </p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {stats.thisWeek}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic
              </label>
              <input
                type="text"
                placeholder="Search topic..."
                value={filters.topic}
                onChange={(e) =>
                  setFilters({ ...filters, topic: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
            >
              Clear all filters
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
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Interviews Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Topic
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Difficulty
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  </td>
                </tr>
              ) : interviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    No interviews found
                  </td>
                </tr>
              ) : (
                interviews.map((interview) => (
                  <tr
                    key={interview.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 text-white flex items-center justify-center font-bold text-xs">
                          {interview.userName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white text-sm">
                            {interview.userName || "Unknown User"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {interview.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800 dark:text-white">
                        {interview.topic}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(
                          interview.difficulty,
                        )}`}
                      >
                        {interview.difficulty || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${getScoreColor(
                            interview.totalScore,
                          )}`}
                        >
                          {interview.totalScore || 0}
                        </span>
                        <span className="text-xs text-gray-500">/ 100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {format(
                            new Date(interview.createdAt),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} ({totalInterviews} interviews)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Interview Details
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="text-blue-500 font-medium">
                    {selectedInterview.topic}
                  </span>
                  {" • "}
                  <span className="text-blue-400">
                    {selectedInterview.difficulty}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                    Total Score
                  </p>
                  <p
                    className={`text-2xl font-bold ${getScoreColor(selectedInterview.totalScore)}`}
                  >
                    {selectedInterview.totalScore}/100
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                    MCQ Score
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedInterview.mcqScore}/70
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                  <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                    Essay Score
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {selectedInterview.essayScore}/30
                  </p>
                </div>
              </div>

              {/* MCQ Questions */}
              {selectedInterview.mcqResults?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
                    Multiple Choice Questions
                  </h4>
                  <div className="space-y-4">
                    {selectedInterview.mcqResults.map((q, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium text-blue-600 dark:text-blue-400">
                            {idx + 1}. {q.question}
                          </p>
                          {q.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="text-indigo-400 font-medium">
                              Your answer:
                            </span>{" "}
                            <span
                              className={
                                q.isCorrect
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }
                            >
                              {q.userAnswer}
                            </span>
                          </p>
                          {!q.isCorrect && (
                            <p>
                              <span className="text-indigo-400 font-medium">
                                Correct answer:
                              </span>{" "}
                              <span className="text-emerald-600">
                                {q.correctAnswer}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 italic">
                            {q.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay Questions */}
              {selectedInterview.textResults?.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
                    Essay Questions
                  </h4>
                  <div className="space-y-4">
                    {selectedInterview.textResults.map((q, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                      >
                        <p className="font-medium text-blue-600 dark:text-blue-400 mb-3">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-indigo-400 font-medium mb-1">
                              Your answer:
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                              {q.userAnswer || "No answer provided"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-indigo-400 font-medium">
                              Score:
                            </span>
                            <span
                              className={`font-semibold ${getScoreColor(q.score * 10)}`}
                            >
                              {q.score}/10
                            </span>
                          </div>
                          {q.feedback && (
                            <div>
                              <p className="text-indigo-400 font-medium mb-1">
                                Feedback:
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {q.feedback}
                              </p>
                            </div>
                          )}
                          {q.sampleAnswer && (
                            <div>
                              <p className="text-indigo-400 font-medium mb-1">
                                Sample answer:
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                {q.sampleAnswer}
                              </p>
                            </div>
                          )}
                          {q.idealKeywords?.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-indigo-400 font-medium">
                                Ideal keywords:
                              </span>
                              {q.idealKeywords.map((kw, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                          {q.gradingExplanation && (
                            <div>
                              <p className="text-indigo-400 font-medium mb-1">
                                Grading explanation:
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                {q.gradingExplanation}
                              </p>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Delete Interview
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this interview from{" "}
              <span className="font-medium">{showDeleteModal.userName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal.id)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
