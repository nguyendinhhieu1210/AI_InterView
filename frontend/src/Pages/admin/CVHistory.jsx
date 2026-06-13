// src/pages/admin/CVHistory.jsx
import { useState, useEffect } from "react";
import {
  FileText,
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
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function CVHistory() {
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
    avgScore: 0,
    uniqueUsers: 0,
    thisWeek: 0,
  });
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchSessions();
  }, [page, search, filters.fromDate, filters.toDate]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      };

      const response = await api.get("/cv/admin/sessions", { params });

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
      console.error("Failed to fetch CV sessions:", error);
      toast.error(
        error.response?.data?.message || "Failed to load CV sessions",
      );
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cv/admin/sessions/${id}`);
      toast.success("CV session deleted successfully");
      fetchSessions();
      setShowDeleteModal(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete CV session",
      );
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await api.get(`/cv/admin/sessions/${id}`);
      if (response.data.success) {
        setSelectedSession(response.data.session);
        setShowDetailModal(true);
      } else {
        toast.error("Failed to load CV session details");
      }
    } catch (error) {
      console.error("Failed to fetch CV session details:", error);
      toast.error(
        error.response?.data?.message || "Failed to load CV session details",
      );
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const resetFilters = () => {
    setFilters({ fromDate: "", toDate: "" });
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
            CV Interview History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage and review all CV-based interview sessions
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          placeholder="Search by user name, email, or CV name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* CV Sessions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  CV Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Skills
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
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No CV sessions found
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
                      <div>
                        <p className="font-medium text-sm text-gray-800 dark:text-white">
                          {session.userName || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {session.userEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        {session.cvName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(session.topic || []).slice(0, 2).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-violet-600 dark:text-violet-400"
                          >
                            {skill}
                          </span>
                        ))}
                        {(session.topic || []).length > 2 && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            +{session.topic.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-semibold ${getScoreColor(session.totalScore)}`}
                      >
                        {session.totalScore || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(
                            new Date(session.createdAt),
                            "dd/MM/yyyy HH:mm",
                          )}
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

      {/* Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-lg">
                  CV Interview Details
                </h3>
                <p className="text-indigo-100 text-sm mt-0.5">
                  {selectedSession.cvName}
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

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Score</p>
                  <p
                    className={`text-xl font-bold ${getScoreColor(selectedSession.totalScore)}`}
                  >
                    {selectedSession.totalScore}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">MCQ Score</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedSession.mcqScore || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Essay Score</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {selectedSession.textScore || 0}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {selectedSession.topic?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-white">
                    Skills Assessed
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.topic.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Questions & Answers */}
              {selectedSession.results?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-gray-800 dark:text-white">
                    Questions & Answers
                  </h4>
                  <div className="space-y-4">
                    {selectedSession.results.map((item, idx) => {
                      const isMCQ = item.isCorrect !== undefined;

                      return (
                        <div
                          key={idx}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* Header */}
                          <div
                            className={`px-4 py-2 flex justify-between items-center ${item.isCorrect ? "bg-emerald-50 dark:bg-emerald-950/20" : isMCQ ? "bg-red-50 dark:bg-red-950/20" : "bg-gray-50 dark:bg-gray-900/50"}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isMCQ ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"}`}
                              >
                                {isMCQ ? "MCQ" : "Essay"}
                              </span>
                              <span className="text-xs text-gray-500">
                                Difficulty: {item.difficulty || "N/A"}
                              </span>
                            </div>
                            {isMCQ ? (
                              <div className="flex items-center gap-1">
                                {item.isCorrect ? (
                                  <>
                                    <CheckCircle
                                      size={14}
                                      className="text-emerald-500"
                                    />
                                    <span className="text-xs text-emerald-600 font-medium">
                                      Correct (+{item.score})
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
                            ) : (
                              <span
                                className={`text-sm font-bold ${getScoreColor(item.score * 10)}`}
                              >
                                {item.score}/10
                              </span>
                            )}
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-3">
                            {/* Question */}
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {idx + 1}. {item.question}
                              </p>
                            </div>

                            {/* User Answer */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">
                                📝 Your answer:
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {item.yourAnswer ||
                                  item.userAnswer ||
                                  "No answer provided"}
                              </p>
                            </div>

                            {/* MCQ: show correct answer and explanation */}
                            {isMCQ && !item.isCorrect && (
                              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                                <p className="text-xs text-gray-500 mb-1">
                                  ✅ Correct answer:
                                </p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                  {item.correctAnswer}
                                </p>
                                {item.explanation && (
                                  <>
                                    <p className="text-xs text-gray-500 mt-2 mb-1">
                                      💡 Explanation:
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {item.explanation}
                                    </p>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Essay: AI Suggested Answer */}
                            {!isMCQ && item.aiSuggestedAnswer && (
                              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                  🤖 AI Suggested Answer:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {item.aiSuggestedAnswer}
                                </p>
                              </div>
                            )}

                            {/* Essay: Detailed Feedback (đã bao gồm strengths và weaknesses) */}
                            {!isMCQ && item.detailedFeedback && (
                              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
                                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                                  📖 Detailed Feedback:
                                </p>
                                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {item.detailedFeedback}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                Delete CV Session
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                Delete CV session from{" "}
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
