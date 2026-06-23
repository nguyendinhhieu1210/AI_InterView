import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  HelpCircle,
  Brain,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/interview/history');
      const rawList =
        res.data?.success && Array.isArray(res.data.history)
          ? res.data.history
          : [];
      const normalized = rawList.map((item) => ({
        id: item.id,
        topic: item.topic || 'General',
        difficulty: item.difficulty || 'N/A',
        totalQuestions: item.totalQuestions || 0,
        createdAt: item.createdAt,
        totalScore: item.totalScore || 0,
        mcqScore: item.mcqScore,
        mcqCount: item.mcqCount,
        essayScore: item.essayScore,
        essayCount: item.essayCount,
        detailPath: `/history/${item.id}`,
      }));
      normalized.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(normalized);
    } catch (err) {
      console.error(err);
      setError('Failed to load interview history');
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
        <p className="text-muted animate-pulse">Loading interview history...</p>
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
            onClick={fetchInterviewHistory}
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
            className="group gap-2 text-primary hover:text-primary/80 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Back
          </BaseButton>
          <div className="bg-card/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-soft border border-border">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-semibold text-text">
              {history.length} Interview sessions
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold pb-2">
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Interview History
            </span>
          </h1>
          <p className="text-muted mt-2">Topic‑based MCQ + Essay interviews</p>
        </div>

        {history.length === 0 ? (
          <BaseCard className="p-12 text-center">
            <Brain className="w-20 h-20 text-primary/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text">
              No interviews yet
            </h3>
            <BaseButton
              variant="primary"
              onClick={() => navigate('/welcome')}
              className="mt-4"
            >
              Start your first interview →
            </BaseButton>
          </BaseCard>
        ) : (
          <>
            {/* Grid of interview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHistory.map((item) => (
                <div
                  key={item.id}
                  className="group bg-card rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border-l-8 border-l-primary overflow-hidden flex flex-col"
                >
                  <div className="p-5 flex-1">
                    {/* Topic and Difficulty badges */}
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                      <BaseBadge variant="primary" rounded>
                        {item.topic}
                      </BaseBadge>
                      <BaseBadge variant="default" size="sm" rounded>
                        {item.difficulty}
                      </BaseBadge>
                    </div>

                    {/* Date and questions count */}
                    <div className="flex items-center gap-3 text-xs text-muted mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.createdAt)}</span>
                      <HelpCircle className="w-3.5 h-3.5 ml-1" />
                      <span>{item.totalQuestions} questions</span>
                    </div>

                    {/* MCQ & Essay scores */}
                    <div className="flex justify-between text-sm text-text/80 mb-2">
                      <span>
                        MCQ: {item.mcqScore}/{item.mcqCount * 10}
                      </span>
                      <span>
                        Essay: {item.essayScore}/{item.essayCount * 10}
                      </span>
                    </div>

                    {/* Total score */}
                    <div className="flex justify-end items-baseline gap-1 mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted">Total</span>
                      <span
                        className={`text-2xl font-bold ${getScoreColor(item.totalScore)}`}
                      >
                        {item.totalScore}
                        <span className="text-sm text-muted">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Detail button */}
                  <div className="p-4 pt-0">
                    <BaseButton
                      variant="ghost"
                      fullWidth
                      rightIcon={<Eye className="w-4 h-4" />}
                      onClick={() => navigate(item.detailPath)}
                      className="gap-2 text-primary hover:bg-primary/10 py-2 rounded-xl font-medium"
                    >
                      Details
                    </BaseButton>
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
