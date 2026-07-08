// frontend/src/components/admin/ExamSetDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Layers, BookOpen, Plus, Minus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function ExamSetDetailModal({ examSet, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [showAddQuestions, setShowAddQuestions] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  useEffect(() => {
    if (examSet) {
      setQuestions(examSet.questions || []);
    }
  }, [examSet]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleRemoveQuestion = async (questionId) => {
    if (!window.confirm('Remove this question from the exam set?')) return;

    try {
      await api.delete(
        `/admin/exam-sets/${examSet._id}/questions/${questionId}`
      );
      toast.success('Question removed from exam set');
      setQuestions(questions.filter((q) => q._id !== questionId));
      onUpdate();
      if (showAddQuestions) {
        loadAvailableQuestions();
      }
    } catch (error) {
      toast.error('Failed to remove question');
    }
  };

  const handleAddQuestions = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/exam-sets/${examSet._id}/questions`, {
        questionIds: selectedQuestions,
      });
      toast.success('Questions added successfully');

      setShowAddQuestions(false);
      setSelectedQuestions([]);
      setAvailableQuestions([]);

      const response = await api.get(`/admin/exam-sets/${examSet._id}`);
      setQuestions(response.data.data.questions || []);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add questions');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableQuestions = async () => {
    setLoadingAvailable(true);
    try {
      // ✅ Sửa: dùng programmingLanguage thay vì topic
      const response = await api.get('/admin/questions', {
        params: {
          programmingLanguage: examSet.programmingLanguage, // Đổi từ topic
          limit: 100,
          isActive: true,
        },
      });

      const allQuestions = response.data.data || [];
      const existingIds = questions.map((q) => q._id);
      const available = allQuestions.filter(
        (q) => !existingIds.includes(q._id)
      );
      setAvailableQuestions(available);
    } catch (error) {
      console.error('Load available questions error:', error);
      toast.error('Failed to load available questions');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const filteredAvailableQuestions = availableQuestions.filter((q) =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredAvailableQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredAvailableQuestions.map((q) => q._id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              {examSet?.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {/* ✅ Đổi từ topic → programmingLanguage */}
              {examSet?.programmingLanguage} • {questions.length} questions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
              {/* ✅ Đổi từ Topic → Programming Language */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Programming Language
              </p>
              <p className="font-medium text-gray-800 dark:text-white">
                {examSet?.programmingLanguage}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Questions
              </p>
              <p className="font-medium text-gray-800 dark:text-white">
                {questions.length}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Created
              </p>
              <p className="font-medium text-gray-800 dark:text-white text-sm">
                {formatDate(examSet?.createdAt)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p
                className={`font-medium ${examSet?.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                {examSet?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {/* Description */}
          {examSet?.description && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {examSet.description}
              </p>
            </div>
          )}

          {/* Difficulty Stats */}
          {examSet?.difficultyStats && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Distribution
              </h3>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(examSet.difficultyStats).map(
                  ([level, count]) =>
                    count > 0 && (
                      <div
                        key={level}
                        className={`px-3 py-1.5 rounded-lg ${getDifficultyColor(level)}`}
                      >
                        {level}: {count}
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {/* Questions List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Questions ({questions.length})
              </h3>
              <button
                onClick={() => {
                  setShowAddQuestions(!showAddQuestions);
                  if (!showAddQuestions) {
                    loadAvailableQuestions();
                  } else {
                    setAvailableQuestions([]);
                    setSelectedQuestions([]);
                    setSearchTerm('');
                  }
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Questions
              </button>
            </div>

            {/* Add Questions Panel */}
            {showAddQuestions && (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Questions ({availableQuestions.length})
                  </h4>
                  {availableQuestions.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
                    >
                      {selectedQuestions.length ===
                      filteredAvailableQuestions.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {loadingAvailable ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-sm text-gray-500">
                        Loading...
                      </span>
                    </div>
                  ) : filteredAvailableQuestions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                      {searchTerm
                        ? 'No questions match your search'
                        : 'No additional questions available for this programming language'}
                    </p>
                  ) : (
                    filteredAvailableQuestions.map((q) => (
                      <label
                        key={q._id}
                        className="flex items-start gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(q._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedQuestions([
                                ...selectedQuestions,
                                q._id,
                              ]);
                            } else {
                              setSelectedQuestions(
                                selectedQuestions.filter((id) => id !== q._id)
                              );
                            }
                          }}
                          className="mt-1 w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 dark:text-white line-clamp-2">
                            {q.question}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            {/* ✅ Đổi từ topic → programmingLanguage */}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              #{q.programmingLanguage}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(q.difficulty)}`}
                            >
                              {q.difficulty}
                            </span>
                            {q.tags &&
                              q.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowAddQuestions(false);
                      setSelectedQuestions([]);
                      setSearchTerm('');
                      setAvailableQuestions([]);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddQuestions}
                    disabled={selectedQuestions.length === 0 || loading}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    Add Selected ({selectedQuestions.length})
                  </button>
                </div>
              </div>
            )}

            {/* Questions Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {questions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                      >
                        <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No questions in this exam set</p>
                        <button
                          onClick={() => {
                            setShowAddQuestions(true);
                            loadAvailableQuestions();
                          }}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-1"
                        >
                          Add questions →
                        </button>
                      </td>
                    </tr>
                  ) : (
                    questions.map((q, index) => (
                      <tr
                        key={q._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                      >
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-800 dark:text-white line-clamp-2">
                            {q.question}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${getDifficultyColor(q.difficulty)}`}
                          >
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {q.tags &&
                              q.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            {q.tags && q.tags.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{q.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveQuestion(q._id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-500 hover:text-red-700"
                            title="Remove from exam set"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Metadata */}
          {examSet?.metadata && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Views
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {examSet.metadata.views || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Times Practiced
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {examSet.metadata.timesPracticed || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Average Score
                </p>
                <p className="font-medium text-gray-800 dark:text-white">
                  {examSet.metadata.averageScore || 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
