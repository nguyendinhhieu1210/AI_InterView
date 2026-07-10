// frontend/src/Pages/admin/QuestionManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Upload,
  Edit,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

import ExamSetModal from '../../components/admin/ExamSetModal';
import QuestionDetailModal from '../../components/admin/QuestionDetailModal';
import CreateQuestionModal from '../../components/admin/CreateQuestionModal';
import ImportExcelModal from '../../components/admin/ImportExcelModal';

export default function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExamSetModal, setShowExamSetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // ✅ Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
  });

  useEffect(() => {
    fetchQuestions();
    fetchProgrammingLanguages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.current,
    pagination.pageSize,
    selectedLanguage,
    selectedDifficulty,
    selectedStatus,
  ]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(selectedLanguage && { programmingLanguage: selectedLanguage }),
        ...(selectedDifficulty && { difficulty: selectedDifficulty }),
        ...(selectedStatus && { isActive: selectedStatus === 'active' }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.get('/admin/questions', { params });

      // ✅ Set questions và pagination
      setQuestions(response.data.data);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));

      // ✅ Lấy stats từ response (backend đã trả về)
      if (response.data.stats) {
        setStats({
          total: response.data.stats.total || 0,
          active: response.data.stats.active || 0,
          inactive: response.data.stats.inactive || 0,
          featured: response.data.stats.featured || 0,
        });
      } else {
        // Fallback: nếu backend chưa trả về stats
        // Không tính từ dữ liệu trang hiện tại
        console.warn('Stats not available in response');
      }
    } catch (error) {
      toast.error('Failed to fetch questions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgrammingLanguages = async () => {
    try {
      const response = await api.get('/programming-languages');
      setProgrammingLanguages(response.data.data);
    } catch (error) {
      console.error('Failed to fetch programming languages:', error);
    }
  };

  const handleDelete = async (id, isActive) => {
    if (isActive) {
      toast.error(
        '❌ Cannot delete active question. Please deactivate it first!',
        { duration: 3000 }
      );
      return;
    }

    if (
      !window.confirm(
        '⚠️ Are you sure you want to permanently delete this inactive question?\n\nThis action cannot be undone!'
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/questions/${id}`);
      toast.success('✅ Question permanently deleted successfully');
      await fetchQuestions();
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to delete question';

      if (error.response?.data?.examSets) {
        const examSetNames = error.response.data.examSets
          .map((es) => `• ${es.name}`)
          .join('\n');
        toast.error(
          `❌ Cannot delete question. It is being used in:\n${examSetNames}`,
          { duration: 5000 }
        );
      } else {
        toast.error(message);
      }
      console.error(error);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/questions/${id}`, { isActive: !currentStatus });
      toast.success(
        `✅ Question ${!currentStatus ? 'activated' : 'deactivated'}`
      );
      await fetchQuestions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      await api.put(`/admin/questions/${id}`, { isFeatured: !currentFeatured });
      toast.success(
        `✅ Question ${!currentFeatured ? 'featured' : 'unfeatured'}`
      );
      await fetchQuestions();
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  // ✅ Updated: Màu sắc cho difficulty - chỉ áp dụng cho text
  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'text-green-600 dark:text-green-400',
      Medium: 'text-yellow-600 dark:text-yellow-400',
      Hard: 'text-orange-600 dark:text-orange-400',
      Expert: 'text-red-600 dark:text-red-400',
    };
    return colors[difficulty] || colors.Medium;
  };

  // ✅ Updated: Background cho difficulty pill
  const getDifficultyBg = (difficulty) => {
    const colors = {
      Easy: 'bg-green-50 dark:bg-green-900/20',
      Medium: 'bg-yellow-50 dark:bg-yellow-900/20',
      Hard: 'bg-orange-50 dark:bg-orange-900/20',
      Expert: 'bg-red-50 dark:bg-red-900/20',
    };
    return colors[difficulty] || colors.Medium;
  };

  // ✅ Updated: Border cho difficulty pill
  const getDifficultyBorder = (difficulty) => {
    const colors = {
      Easy: 'border-green-200 dark:border-green-800',
      Medium: 'border-yellow-200 dark:border-yellow-800',
      Hard: 'border-orange-200 dark:border-orange-800',
      Expert: 'border-red-200 dark:border-red-800',
    };
    return colors[difficulty] || colors.Medium;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Question Bank
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your interview questions and exam sets
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Stats - Hiển thị chính xác từ backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Total Questions"
          value={stats.total}
          color="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Active"
          value={stats.active}
          color="bg-green-500"
        />
        <StatCard
          icon={XCircle}
          label="Inactive"
          value={stats.inactive}
          color="bg-red-500"
        />
        <StatCard
          icon={Star}
          label="Featured"
          value={stats.featured}
          color="bg-yellow-500"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Programming Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              >
                <option value="">All Languages</option>
                {programmingLanguages.map((lang) => (
                  <option key={lang.name} value={lang.name}>
                    {lang.name} ({lang.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              >
                <option value="">All Levels</option>
                <option
                  value="Easy"
                  className="text-green-600 dark:text-green-400"
                >
                  Easy
                </option>
                <option
                  value="Medium"
                  className="text-yellow-600 dark:text-yellow-400"
                >
                  Medium
                </option>
                <option
                  value="Hard"
                  className="text-orange-600 dark:text-orange-400"
                >
                  Hard
                </option>
                <option
                  value="Expert"
                  className="text-red-600 dark:text-red-400"
                >
                  Expert
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">✅ Active</option>
                <option value="inactive">❌ Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Questions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No questions found
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                      >
                        Create your first question →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((question) => (
                  <tr
                    key={question._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        {question.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {question.question}
                          </p>
                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {question.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {question.tags.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{question.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg border border-blue-100 dark:border-blue-800">
                        {question.programmingLanguage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* ✅ Updated: Difficulty pill with text color only, no emoji */}
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getDifficultyBg(question.difficulty)} ${getDifficultyBorder(question.difficulty)} ${getDifficultyColor(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${question.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {question.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(question.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedQuestion(question);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleFeatured(
                              question._id,
                              question.isFeatured
                            )
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            question.isFeatured
                              ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/50'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title={
                            question.isFeatured
                              ? 'Remove from featured'
                              : 'Add to featured'
                          }
                        >
                          <Star className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowCreateModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-blue-600 hover:text-blue-700 dark:text-blue-400"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleStatus(question._id, question.isActive)
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            question.isActive
                              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                          }`}
                          title={question.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {question.isActive ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(question._id, question.isActive)
                          }
                          className={`p-1.5 rounded-lg transition-colors ${
                            question.isActive
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:text-red-400'
                          }`}
                          title={
                            question.isActive
                              ? '⚠️ Deactivate first to delete'
                              : '🗑️ Delete question'
                          }
                          disabled={question.isActive}
                        >
                          <Trash2 className="w-4 h-4" />
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
        {!loading && questions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(
                pagination.current * pagination.pageSize,
                pagination.total
              )}{' '}
              of {pagination.total} questions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current: prev.current - 1,
                  }))
                }
                disabled={pagination.current === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                Page {pagination.current} of{' '}
                {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    current: prev.current + 1,
                  }))
                }
                disabled={
                  pagination.current >=
                  Math.ceil(pagination.total / pagination.pageSize)
                }
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateQuestionModal
          editingQuestion={editingQuestion}
          onClose={() => {
            setShowCreateModal(false);
            setEditingQuestion(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingQuestion(null);
            fetchQuestions();
            fetchProgrammingLanguages();
          }}
          programmingLanguages={programmingLanguages}
        />
      )}

      {showImportModal && (
        <ImportExcelModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchQuestions();
            fetchProgrammingLanguages();
          }}
        />
      )}

      {showExamSetModal && (
        <ExamSetModal
          onClose={() => setShowExamSetModal(false)}
          onSuccess={() => {
            setShowExamSetModal(false);
            toast.success('Exam set created successfully!');
          }}
          programmingLanguages={programmingLanguages}
        />
      )}

      {showDetailModal && selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedQuestion(null);
          }}
        />
      )}
    </div>
  );
}
