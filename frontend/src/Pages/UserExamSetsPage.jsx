// frontend/src/Pages/user/UserExamSetsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Play,
  Calendar,
  Home,
  Sparkles,
  Zap,
  BookOpen,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';
import api from '../services/api';

export default function UserExamSetsPage() {
  const navigate = useNavigate();
  const [examSets, setExamSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    total: 0,
  });

  const fetchExamSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.pageSize,
        ...(selectedLanguage && { programmingLanguage: selectedLanguage }),
      };

      const response = await api.get('/user/exam-sets', { params });
      setExamSets(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total || 0,
      }));
    } catch (error) {
      console.error('Fetch exam sets error:', error);
      toast.error('Failed to load exam sets');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, selectedLanguage]);

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await api.get('/user/exam-sets/languages');
      setLanguages(response.data.data || []);
    } catch (error) {
      console.error('Fetch languages error:', error);
    }
  }, []);

  useEffect(() => {
    fetchExamSets();
    fetchLanguages();
  }, [fetchExamSets, fetchLanguages]);

  const handleStartExam = (examSetId) => {
    navigate(`/exam/${examSetId}`);
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
      Easy: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      Medium:
        'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
      Hard: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
      Expert:
        'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    };
    return colors[difficulty] || colors.Medium;
  };

  const handleClearFilters = () => {
    setSelectedLanguage('');
    setShowFilters(false);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ─── Header ─── */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/welcome')}
              className="flex items-center gap-2 group p-0 hover:bg-transparent"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-base">AI</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                  AI Interview
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Exam Sets
                </p>
              </div>
            </BaseButton>
            <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exam Sets
              </h2>
            </div>
          </div>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-200 text-blue-600 dark:text-blue-400"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </BaseButton>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
        {/* ── Welcome Section ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Practice
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Exam Sets
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {pagination.total} exam sets available for practice
            </p>
          </div>
          <BaseBadge
            variant="primary"
            rounded
            className="px-4 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          >
            <Zap className="w-4 h-4 inline mr-1.5" />
            {pagination.total} Sets
          </BaseBadge>
        </div>

        {/* ── Filters ── */}
        <BaseCard className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 w-full sm:w-auto"
              >
                <Filter className="w-4 h-4" />
                Filters
                {selectedLanguage && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    {selectedLanguage}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </BaseButton>
            </div>

            {selectedLanguage && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                Clear Filters ✕
              </BaseButton>
            )}
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
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 dark:text-gray-100 outline-none transition-all duration-200"
                  >
                    <option value="">All Languages</option>
                    {languages.map((lang) => (
                      <option
                        key={lang.programmingLanguage}
                        value={lang.programmingLanguage}
                      >
                        {lang.programmingLanguage} ({lang.count} exam sets)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <BaseButton
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Reset All Filters
                  </BaseButton>
                </div>
              </div>
            </div>
          )}
        </BaseCard>

        {/* ── Exam Sets Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <BaseCard
                key={i}
                className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </div>
              </BaseCard>
            ))}
          </div>
        ) : examSets.length === 0 ? (
          <BaseCard className="p-12 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Exam Sets Available
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {selectedLanguage
                ? `No exam sets found for "${selectedLanguage}"`
                : 'Check back later for new exam sets from instructors'}
            </p>
            {selectedLanguage && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                View all exam sets →
              </BaseButton>
            )}
          </BaseCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examSets.map((examSet) => (
              <BaseCard
                key={examSet._id}
                hover
                className="p-6 flex flex-col group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300"
              >
                {/* Header - Tên exam set */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {examSet.name}
                  </h3>
                </div>

                {/* Language & Questions */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
                    {examSet.programmingLanguage}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    {examSet.totalQuestions || 0} questions
                  </span>
                </div>

                {/* Description */}
                {examSet.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 flex-1">
                    {examSet.description}
                  </p>
                )}

                {/* Difficulty Stats */}
                {examSet.difficultyStats && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(examSet.difficultyStats)
                      .filter(([, count]) => count > 0)
                      .map(([level, count]) => (
                        <span
                          key={level}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(level)}`}
                        >
                          {level}: {count}
                        </span>
                      ))}
                  </div>
                )}

                {/* Footer - Created date & Start button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(examSet.createdAt)}</span>
                  </div>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartExam(examSet._id)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl hover:scale-105 transition-all duration-200 font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="w-4 h-4" />
                    Start Practice
                  </BaseButton>
                </div>
              </BaseCard>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && examSets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{' '}
              of {pagination.total} exam sets
            </div>
            <div className="flex items-center gap-2">
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page - 1,
                  }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              >
                Previous
              </BaseButton>
              <span className="text-sm text-gray-700 dark:text-gray-200 px-3">
                Page {pagination.page} of{' '}
                {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={
                  pagination.page >=
                  Math.ceil(pagination.total / pagination.pageSize)
                }
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
              >
                Next
              </BaseButton>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
      `}</style>
    </div>
  );
}
