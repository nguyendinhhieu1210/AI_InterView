// frontend/src/components/admin/CreateQuestionModal.jsx
import React, { useState } from 'react';
import { X, Plus, Tag, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

export default function CreateQuestionModal({
  editingQuestion,
  onClose,
  onSuccess,
  programmingLanguages, // Đổi từ topics
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: editingQuestion?.question || '',
    options: {
      A: editingQuestion?.options?.A || '',
      B: editingQuestion?.options?.B || '',
      C: editingQuestion?.options?.C || '',
      D: editingQuestion?.options?.D || '',
    },
    correctAnswer: editingQuestion?.correctAnswer || 'A',
    explanation: editingQuestion?.explanation || '',
    programmingLanguage: editingQuestion?.programmingLanguage || '', // Đổi từ topic
    difficulty: editingQuestion?.difficulty || 'Medium',
    tags: editingQuestion?.tags || [],
    isFeatured: editingQuestion?.isFeatured || false,
  });

  const [newTag, setNewTag] = useState('');

  // Mapping màu sắc cho các mức độ khó
  const difficultyColorMap = {
    Easy: '#22c55e', // xanh lá
    Medium: '#eab308', // vàng
    Hard: '#f97316', // cam
    Expert: '#ef4444', // đỏ
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.question.trim()) {
        toast.error('Please enter the question');
        setLoading(false);
        return;
      }
      if (
        !formData.options.A.trim() ||
        !formData.options.B.trim() ||
        !formData.options.C.trim() ||
        !formData.options.D.trim()
      ) {
        toast.error('Please fill in all 4 options');
        setLoading(false);
        return;
      }
      if (!formData.explanation.trim()) {
        toast.error('Please provide an explanation');
        setLoading(false);
        return;
      }
      if (!formData.programmingLanguage.trim()) {
        // Đổi từ topic
        toast.error('Please enter a programming language');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        correctAnswer: formData.correctAnswer.toUpperCase(),
      };

      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion._id}`, payload);
        toast.success('Question updated successfully!');
      } else {
        await api.post('/admin/questions', payload);
        toast.success('Question created successfully!');
      }

      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {editingQuestion ? 'Edit Question' : 'Create New Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.question}
              onChange={(e) => handleChange('question', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none"
              placeholder="Enter your question..."
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Option {letter} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.options[letter]}
                  onChange={(e) =>
                    handleChange(`options.${letter}`, e.target.value)
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                  placeholder={`Option ${letter}`}
                />
              </div>
            ))}
          </div>

          {/* Correct Answer & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleChange('correctAnswer', letter)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                      formData.correctAnswer === letter
                        ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty - đã được fix màu sắc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                style={{
                  color: difficultyColorMap[formData.difficulty] || 'inherit',
                }}
              >
                <option value="Easy" style={{ color: '#22c55e' }}>
                  Easy
                </option>
                <option value="Medium" style={{ color: '#eab308' }}>
                  Medium
                </option>
                <option value="Hard" style={{ color: '#f97316' }}>
                  Hard
                </option>
                <option value="Expert" style={{ color: '#ef4444' }}>
                  Expert
                </option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Explanation <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => handleChange('explanation', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none"
              placeholder="Explain why this is the correct answer..."
            />
          </div>

          {/* Programming Language - Đổi từ Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Programming Language <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.programmingLanguage}
              onChange={(e) =>
                handleChange('programmingLanguage', e.target.value)
              }
              list="language-suggestions"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
              placeholder="e.g., JavaScript, Python, React, Node.js..."
            />
            <datalist id="language-suggestions">
              {programmingLanguages &&
                programmingLanguages.map((lang) => (
                  <option key={lang.name} value={lang.name} />
                ))}
            </datalist>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a programming language or select from suggestions
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                placeholder="Add tag and press Enter..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Featured */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={formData.isFeatured}
              onChange={(e) => handleChange('isFeatured', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor="featured"
              className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Feature this question
            </label>
          </div>

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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              )}
              {editingQuestion ? 'Update Question' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
