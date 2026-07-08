// src/pages/admin/components/ExamSetModal.jsx
import React, { useState } from 'react';
import { X, Layers, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function ExamSetModal({ onClose, onSuccess, topics }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    numberOfQuestions: 20,
  });
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.topic) {
      toast.error('Please select a topic');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/exam-set/create', formData);
      setResult(response.data.data);
      toast.success(response.data.message);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam set');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Create Exam Set
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Exam Set Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="e.g., Java Core Exam Set 1"
            />
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Topic <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.topic}
              onChange={(e) =>
                setFormData({ ...formData, topic: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.name} value={topic.name}>
                  {topic.name} ({topic.count} questions)
                </option>
              ))}
            </select>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={formData.numberOfQuestions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  numberOfQuestions: parseInt(e.target.value) || 20,
                })
              }
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Min: 5, Max: 100 questions
            </p>
          </div>

          {/* Result Preview */}
          {result && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
              <p className="font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exam Set Generated!
              </p>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                <p>
                  • <strong>Name:</strong> {result.name}
                </p>
                <p>
                  • <strong>Topic:</strong> {result.topic}
                </p>
                <p>
                  • <strong>Total Questions:</strong> {result.totalQuestions}
                </p>
                {result.difficultyStats && (
                  <div>
                    <strong>Difficulty Distribution:</strong>
                    <div className="flex gap-2 mt-1">
                      {Object.entries(result.difficultyStats).map(
                        ([level, count]) => (
                          <span
                            key={level}
                            className="px-2 py-0.5 bg-green-100 dark:bg-green-800/50 rounded text-xs"
                          >
                            {level}: {count}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              Generate Exam Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
