// frontend/src/Pages/admin/ExamSetManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Filter,
  XCircle,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import ExamSetDetailModal from '../../components/admin/ExamSetDetailModal';
import CreateExamSetModal from '../../components/admin/CreateExamSetModal';

export default function ExamSetManagement() {
  const [examSets, setExamSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExamSet, setSelectedExamSet] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExamSet, setEditingExamSet] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // ✅ Stats state
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalQuestions: 0,
  });

  // ✅ fetchExamSets được bọc useCallback, deps là các state thực sự dùng bên trong
  const fetchExamSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedLanguage) params.programmingLanguage = selectedLanguage;
      if (searchTerm) params.search = searchTerm;

      // ✅ Luôn lấy tất cả (cả active và inactive)
      params.status = 'all';

      const response = await api.get('/admin/exam-sets', { params });
      setExamSets(response.data.data || []);

      if (response.data.stats) {
        setStats({
          total: response.data.stats.total || 0,
          active: response.data.stats.active || 0,
          inactive: response.data.stats.inactive || 0,
          totalQuestions: response.data.stats.totalQuestions || 0,
        });
      }
    } catch (error) {
      console.error('Fetch exam sets error:', error);
      toast.error('Failed to fetch exam sets');
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, searchTerm]);

  // ✅ fetchProgrammingLanguages không phụ thuộc state nào -> deps rỗng
  const fetchProgrammingLanguages = useCallback(async () => {
    try {
      const response = await api.get('/admin/programming-languages');
      setProgrammingLanguages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch programming languages:', error);
    }
  }, []);

  // ✅ CHỈ 1 useEffect DUY NHẤT — đã xóa useEffect cũ bị trùng lặp
  useEffect(() => {
    fetchExamSets();
    fetchProgrammingLanguages();
  }, [fetchExamSets, fetchProgrammingLanguages]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        '⚠️ Are you sure you want to permanently delete this exam set?\n\nThis action cannot be undone!'
      )
    )
      return;

    try {
      await api.delete(`/admin/exam-sets/${id}`);
      toast.success('Exam set permanently deleted successfully');
      await fetchExamSets();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete exam set');
    }
  };

  // ✅ Giống như ở QuestionManagement - dùng XCircle/CheckCircle
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/admin/exam-sets/${id}`, { isActive: !currentStatus });
      toast.success(
        `✅ Exam set ${!currentStatus ? 'activated' : 'deactivated'}`
      );
      await fetchExamSets();
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('Failed to update status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Medium:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      Expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[difficulty] || colors.Medium;
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

  // Toggle expand row
  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Lấy tên người tạo
  const getCreatorName = (examSet) => {
    if (examSet.createdBy) {
      if (typeof examSet.createdBy === 'object') {
        return examSet.createdBy.name || examSet.createdBy.email || 'Unknown';
      }
      return examSet.createdBy;
    }
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Layers className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              Exam Sets
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your grouped question collections by programming language
            </p>
          </div>
          <button
            onClick={() => {
              setEditingExamSet(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Exam Set
          </button>
        </div>
      </div>

      {/* ✅ Stats - Lấy từ backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Layers}
          label="Total Exam Sets"
          value={stats.total}
          color="bg-purple-500"
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
          icon={BookOpen}
          label="Total Questions"
          value={stats.totalQuestions}
          color="bg-blue-500"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search exam sets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchExamSets()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
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

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Programming Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white"
                >
                  <option value="">All Languages</option>
                  {programmingLanguages.map((lang) => (
                    <option key={lang.name} value={lang.name}>
                      {lang.name} ({lang.count} questions)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Show Status
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    Show Inactive Exam Sets
                  </label>
                  {showInactive && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (Inactive sets will appear in red)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exam Sets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[30%]">
                  Name & Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Questions
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
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : examSets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {showInactive
                          ? 'No exam sets found (including inactive)'
                          : 'No active exam sets found'}
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
                      >
                        Create your first exam set →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                examSets.map((examSet) => (
                  <React.Fragment key={examSet._id}>
                    <tr
                      className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                        !examSet.isActive ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => toggleExpand(examSet._id)}
                            className="mt-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <ChevronRight
                              className={`w-4 h-4 text-gray-400 transition-transform ${
                                expandedRows[examSet._id] ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium truncate ${
                                !examSet.isActive
                                  ? 'text-gray-400 dark:text-gray-500 line-through'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {examSet.name}
                            </p>
                            {examSet.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {examSet.description}
                              </p>
                            )}
                            {!examSet.isActive && (
                              <span className="inline-block mt-1 text-xs text-red-500 dark:text-red-400 font-medium">
                                ⚠️ Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-lg border ${
                            !examSet.isActive
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                              : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800'
                          }`}
                        >
                          {examSet.programmingLanguage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-lg border ${
                            !examSet.isActive
                              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                              : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                          }`}
                        >
                          {examSet.totalQuestions || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {examSet.difficultyStats &&
                            Object.entries(examSet.difficultyStats)
                              .filter(([_, count]) => count > 0)
                              .map(([level, count]) => (
                                <span
                                  key={level}
                                  className={`px-2 py-0.5 text-xs rounded ${
                                    !examSet.isActive
                                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                      : getDifficultyColor(level)
                                  }`}
                                >
                                  {level}: {count}
                                </span>
                              ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              examSet.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          <span
                            className={`text-sm ${
                              examSet.isActive
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {examSet.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(examSet.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedExamSet(examSet);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingExamSet(examSet);
                              setShowCreateModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            title="Edit Exam Set"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* ✅ Toggle Status - Giống như ở QuestionManagement */}
                          <button
                            onClick={() =>
                              handleToggleStatus(examSet._id, examSet.isActive)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              examSet.isActive
                                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                            }`}
                            title={examSet.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {examSet.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>

                          {/* ✅ Delete - Giống như ở QuestionManagement */}
                          <button
                            onClick={() => handleDelete(examSet._id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              examSet.isActive
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
                                : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:text-red-400'
                            }`}
                            title={
                              examSet.isActive
                                ? '⚠️ Deactivate first to delete'
                                : '🗑️ Delete exam set'
                            }
                            disabled={examSet.isActive}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded row */}
                    {expandedRows[examSet._id] && (
                      <tr className="bg-gray-50 dark:bg-gray-900/30">
                        <td colSpan="7" className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500 dark:text-gray-400">
                                Created By:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getCreatorName(examSet)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500 dark:text-gray-400">
                                Created:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {new Date(examSet.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-500 dark:text-gray-400">
                                Total Questions:
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {examSet.totalQuestions || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateExamSetModal
          editingExamSet={editingExamSet}
          onClose={() => {
            setShowCreateModal(false);
            setEditingExamSet(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingExamSet(null);
            fetchExamSets();
            fetchProgrammingLanguages();
          }}
          programmingLanguages={programmingLanguages}
        />
      )}

      {showDetailModal && selectedExamSet && (
        <ExamSetDetailModal
          examSet={selectedExamSet}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedExamSet(null);
          }}
          onUpdate={() => {
            fetchExamSets();
          }}
        />
      )}
    </div>
  );
}
