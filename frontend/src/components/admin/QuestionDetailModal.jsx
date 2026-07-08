// src/pages/admin/components/QuestionDetailModal.jsx
import React from 'react';
import {
  X,
  Star,
  CheckCircle,
  XCircle,
  Tag,
  Calendar,
  User,
  BookOpen,
} from 'lucide-react';

export default function QuestionDetailModal({ question, onClose }) {
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Question Details
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Question */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Question
            </h3>
            <p className="text-gray-900 dark:text-white text-lg">
              {question.question}
            </p>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Options
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <div
                  key={letter}
                  className={`p-3 rounded-lg border ${
                    letter === question.correctAnswer
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`font-semibold ${
                        letter === question.correctAnswer
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {letter}.
                    </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {question.options[letter]}
                    </span>
                    {letter === question.correctAnswer && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Explanation
            </h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-300">
                {question.explanation}
              </p>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Topic
              </h3>
              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800">
                {question.topic}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Difficulty
              </h3>
              <span
                className={`px-3 py-1.5 rounded-lg ${getDifficultyColor(question.difficulty)}`}
              >
                {question.difficulty}
              </span>
            </div>
          </div>

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg flex items-center gap-1.5"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {question.isActive ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Status: {question.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {question.isFeatured && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Featured
                </span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Created: {formatDate(question.createdAt)}
            </div>
            {question.createdBy && (
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                By: {question.createdBy.name || question.createdBy.email}
              </div>
            )}
          </div>

          {/* Stats */}
          {question.stats && (
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Attempts
                </p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {question.stats.totalAttempts || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Correct
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {question.stats.correctAttempts || 0}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Accuracy
                </p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {question.accuracy || 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
