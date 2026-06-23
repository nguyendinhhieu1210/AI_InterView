import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function CVHistoryPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchCVHistory();
  }, []);

  const fetchCVHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/cv/history');
      const rawList =
        res.data?.success && Array.isArray(res.data.history)
          ? res.data.history
          : [];
      const normalized = rawList.map((item) => {
        let questionCount = 0;
        if (item.results && Array.isArray(item.results))
          questionCount = item.results.length;
        else if (item.questions) {
          if (Array.isArray(item.questions))
            questionCount = item.questions.length;
          else if (typeof item.questions === 'object')
            questionCount = Object.keys(item.questions).length;
        }
        let skillTags = [];
        if (item.topic) {
          if (Array.isArray(item.topic)) skillTags = item.topic;
          else if (typeof item.topic === 'string')
            skillTags = item.topic.split(',').map((s) => s.trim());
        }
        return {
          id: item._id,
          cvName: item.cvName || 'CV-based Interview',
          skillTags: skillTags.slice(0, 4),
          questionCount,
          createdAt: item.createdAt,
          totalScore: item.totalScore || 0,
          detailPath: `/cv-history/${item._id}`,
        };
      });
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load CV interview history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning/80';
    return 'text-error';
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted animate-pulse">
          Loading CV‑based interviews...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <BaseCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-error mx-auto mb-4" />
          <p className="text-text mb-6">{error}</p>
          <BaseButton
            variant="primary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchCVHistory}
          >
            Retry
          </BaseButton>
        </BaseCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header with Back button and Stats */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            }
            onClick={() => navigate('/history')}
            className="group gap-2 text-muted hover:text-primary bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Back
          </BaseButton>
          <div className="bg-card/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-soft border border-border">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-semibold text-text">
              {history.length} CV sessions
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold pb-2">
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
              CV-Based Interview History
            </span>
          </h1>
          <p className="text-muted mt-2">
            Interviews generated from your uploaded CV
          </p>
        </div>

        {history.length === 0 ? (
          <BaseCard className="p-12 text-center">
            <FileText className="w-20 h-20 text-primary/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text">
              No CV‑based interviews yet
            </h3>
            <BaseButton
              variant="primary"
              onClick={() => navigate('/welcome')}
              className="mt-4"
            >
              Upload a CV to start
            </BaseButton>
          </BaseCard>
        ) : (
          <>
            {/* Grid of CV interview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHistory.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-card rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden hover:scale-[1.02] border border-teal-200 dark:border-teal-800"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-200/30 to-transparent rounded-bl-3xl -z-0" />
                  <div className="p-5 relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-text truncate">
                        {item.cvName}
                      </h3>
                      <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>

                    {item.skillTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.skillTags.map((tag, idx) => (
                          <BaseBadge
                            key={idx}
                            variant="info"
                            size="sm"
                            rounded
                            className="bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400"
                          >
                            {tag}
                          </BaseBadge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-muted mb-4">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.createdAt)}</span>
                      <FileText className="w-3.5 h-3.5 ml-1" />
                      <span>{item.questionCount} questions</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs text-muted">
                          Overall Score
                        </span>
                        <div
                          className={`text-3xl font-black ${getScoreColor(item.totalScore)}`}
                        >
                          {item.totalScore}
                          <span className="text-sm text-muted">/100</span>
                        </div>
                      </div>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        rightIcon={<Eye className="w-4 h-4" />}
                        onClick={() => navigate(item.detailPath)}
                        className="gap-1 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 px-3 py-1.5 rounded-full"
                      >
                        Review
                      </BaseButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="p-2 rounded-xl disabled:opacity-40"
                >
                  <ChevronLeft className="w-5 h-5" />
                </BaseButton>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <BaseButton
                      key={p}
                      variant={currentPage === p ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handlePageChange(p)}
                      className={`w-9 h-9 rounded-full font-medium transition ${
                        currentPage === p ? 'shadow-md' : 'hover:bg-primary/10'
                      }`}
                    >
                      {p}
                    </BaseButton>
                  )
                )}

                <BaseButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="p-2 rounded-xl disabled:opacity-40"
                >
                  <ChevronRight className="w-5 h-5" />
                </BaseButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
