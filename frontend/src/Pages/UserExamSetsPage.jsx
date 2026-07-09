// frontend/src/Pages/user/UserExamSetsPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languages, setLanguages] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    total: 0,
  });

  // Giữ giá trị searchTerm mới nhất mà không cần khai làm dependency,
  // để gõ tìm kiếm không tự động fetch (chỉ fetch khi bấm Enter / Clear Filters).
  const searchTermRef = useRef(searchTerm);
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  const fetchExamSets = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.pageSize,
        ...(selectedLanguage && { programmingLanguage: selectedLanguage }),
        ...(searchTermRef.current && { search: searchTermRef.current }),
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
      Easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Medium:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Hard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      Expert: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[difficulty] || colors.Medium;
  };

  const handleClearFilters = () => {
    setSelectedLanguage('');
    setSearchTerm('');
    setShowFilters(false);
    // Nếu page đang > 1 thì reset về 1 để tránh fetch trang rỗng
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Subtle ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.07] dark:opacity-[0.05]"></div>
        <div className="absolute -bottom-60 -left-60 w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-[0.07] dark:opacity-[0.05]"></div>
      </div>

      {/* ─── Header ─── */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/welcome')}
              className="flex items-center gap-2 group p-0 hover:bg-transparent"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-base">AI</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-text leading-none">
                  AI Interview
                </h1>
                <p className="text-xs text-muted mt-0.5">Exam Sets</p>
              </div>
            </BaseButton>
            <div className="hidden sm:block h-6 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-text">Exam Sets</h2>
            </div>
          </div>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all duration-200 text-primary"
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
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Practice
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text">
              Exam Sets
            </h2>
            <p className="text-muted mt-1 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              {pagination.total} exam sets available for practice
            </p>
          </div>
          <BaseBadge variant="primary" rounded className="px-4 py-2 text-sm">
            <Zap className="w-4 h-4 inline mr-1.5" />
            {pagination.total} Sets
          </BaseBadge>
        </div>

        {/* ── Search and Filters ── */}
        <BaseCard className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search exam sets by name or language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchExamSets()}
                className="w-full pl-10 pr-4 py-2.5 bg-bg/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text placeholder-muted"
              />
            </div>

            <BaseButton
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg/50 border border-border rounded-xl hover:bg-bg/80 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </BaseButton>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Programming Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-bg/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text"
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
                    className="text-muted hover:text-primary transition-colors"
                  >
                    Clear Filters
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
              <BaseCard key={i} className="p-6 animate-pulse">
                <div className="h-6 bg-bg/50 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-bg/50 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-bg/50 rounded w-full mb-2"></div>
                <div className="h-4 bg-bg/50 rounded w-2/3 mb-4"></div>
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-bg/50 rounded w-16"></div>
                  <div className="h-6 bg-bg/50 rounded w-16"></div>
                  <div className="h-6 bg-bg/50 rounded w-16"></div>
                </div>
                <div className="h-10 bg-bg/50 rounded w-full"></div>
              </BaseCard>
            ))}
          </div>
        ) : examSets.length === 0 ? (
          <BaseCard className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-2">
              No Exam Sets Available
            </h3>
            <p className="text-muted">
              {selectedLanguage
                ? `No exam sets found for "${selectedLanguage}"`
                : 'Check back later for new exam sets from instructors'}
            </p>
            {selectedLanguage && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLanguage('')}
                className="mt-4 text-primary hover:text-primary/80"
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
                className="p-6 flex flex-col group hover:border-primary/40 transition-all duration-300"
              >
                {/* Header - Tên exam set */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-text group-hover:text-primary transition-colors line-clamp-2">
                    {examSet.name}
                  </h3>
                </div>

                {/* Language & Questions */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                    {examSet.programmingLanguage}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <BookOpen className="w-3.5 h-3.5" />
                    {examSet.totalQuestions || 0} questions
                  </span>
                </div>

                {/* Description */}
                {examSet.description && (
                  <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
                    {examSet.description}
                  </p>
                )}

                {/* Difficulty Stats - Hiển thị rõ ràng */}
                {examSet.difficultyStats && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(examSet.difficultyStats)
                      .filter(([, count]) => count > 0)
                      .map(([level, count]) => (
                        <span
                          key={level}
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${getDifficultyColor(level)}`}
                        >
                          {level}: {count}
                        </span>
                      ))}
                  </div>
                )}

                {/* Footer - Created date & Start button */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(examSet.createdAt)}</span>
                  </div>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartExam(examSet._id)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl hover:scale-105 transition-all duration-200 font-medium"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border rounded-xl px-6 py-4">
            <div className="text-sm text-muted">
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
                className="px-4 py-2 border border-border rounded-lg hover:bg-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </BaseButton>
              <span className="text-sm text-text px-3">
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
                className="px-4 py-2 border border-border rounded-lg hover:bg-bg/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
