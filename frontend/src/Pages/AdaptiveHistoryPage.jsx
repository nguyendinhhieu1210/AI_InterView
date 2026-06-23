// frontend/src/pages/AdaptiveHistoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Award,
  BarChart3,
} from 'lucide-react';

// Import Base Components
//import
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdaptiveHistoryPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchAdaptiveHistory();
  }, []);

  const fetchAdaptiveHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/adaptive/history');
      if (res.data.success) {
        setSessions(res.data.history);
      } else {
        setError('Failed to load history');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load adaptive interview history');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
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

  const getScoreColor = (score10) => {
    if (score10 >= 8) return 'text-success';
    if (score10 >= 6) return 'text-warning';
    if (score10 >= 4) return 'text-warning/80';
    return 'text-error';
  };

  const getDifficultyVariant = (difficulty) => {
    const map = {
      easy: 'success',
      medium: 'warning',
      hard: 'error',
    };
    return map[difficulty?.toLowerCase()] || 'default';
  };

  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted animate-pulse">Loading adaptive history...</p>
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
            onClick={fetchAdaptiveHistory}
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
        {/* Header - Back button row */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-5 h-5" />}
            onClick={() => navigate('/history')}
            className="group gap-2 text-muted hover:text-primary hover:gap-3 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Back
          </BaseButton>
          <div className="bg-card/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-soft border border-border">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-semibold text-text">
              {sessions.length} Adaptive Sessions
            </span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-normal pb-2 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            Adaptive Interview History
          </h1>
          <p className="text-muted mt-2 text-sm md:text-base">
            AI-powered interviews that adapt to your knowledge level
          </p>
        </div>

        {sessions.length === 0 ? (
          <BaseCard className="p-12 text-center">
            <Brain className="w-20 h-20 text-primary/40 mx-auto mb-4 animate-float" />
            <h3 className="text-xl font-semibold text-text mb-2">
              No adaptive interviews yet
            </h3>
            <p className="text-muted mb-4">
              Start an adaptive interview and test your knowledge in real-time.
            </p>
            <BaseButton
              variant="primary"
              onClick={() => navigate('/adaptive-interview')}
            >
              Start Adaptive Interview →
            </BaseButton>
          </BaseCard>
        ) : (
          <>
            {/* Stats summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <BaseCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-violet-100 dark:bg-violet-950/40 rounded-xl">
                    <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">
                      {sessions.length}
                    </div>
                    <div className="text-xs text-muted">Total Sessions</div>
                  </div>
                </div>
              </BaseCard>
              <BaseCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 rounded-xl">
                    <Award className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">
                      {sessions.length > 0
                        ? (
                            sessions.reduce(
                              (sum, s) => sum + s.totalScore / 10,
                              0
                            ) / sessions.length
                          ).toFixed(1)
                        : '0'}
                    </div>
                    <div className="text-xs text-muted">Avg Score (0-10)</div>
                  </div>
                </div>
              </BaseCard>
              <BaseCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-success/20 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text">
                      {sessions.filter((s) => s.totalScore / 10 >= 7).length}
                    </div>
                    <div className="text-xs text-muted">High Scores (≥7.0)</div>
                  </div>
                </div>
              </BaseCard>
            </div>

            {/* Session Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSessions.map((session) => {
                const score10 = (session.totalScore / 10).toFixed(1);
                const scoreValue = parseFloat(score10);

                return (
                  <div
                    key={session.id}
                    className="group bg-card rounded-2xl shadow-soft hover:shadow-lg transition-all duration-300 border-l-8 border-l-violet-500 overflow-hidden flex flex-col hover:-translate-y-1"
                  >
                    <div className="p-5 flex-1">
                      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                        <BaseBadge
                          variant="info"
                          rounded
                          className="flex items-center gap-1"
                        >
                          <Brain className="w-3 h-3" /> Adaptive
                        </BaseBadge>
                        <BaseBadge
                          variant={getDifficultyVariant(session.difficulty)}
                          size="sm"
                          rounded
                        >
                          {session.difficulty || 'Medium'}
                        </BaseBadge>
                      </div>

                      <h3 className="text-lg font-bold text-text mb-2 line-clamp-1">
                        {session.topic || 'Untitled Session'}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-muted mb-3">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />{' '}
                          {formatDateTime(session.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />{' '}
                          {session.totalQuestions || 0} questions
                        </span>
                      </div>

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-border">
                        <div>
                          <span className="text-xs text-muted">
                            Average Score
                          </span>
                          <div
                            className={`text-2xl font-bold ${getScoreColor(scoreValue)}`}
                          >
                            {score10}
                            <span className="text-sm font-normal text-muted">
                              /10
                            </span>
                          </div>
                        </div>
                        <BaseButton
                          variant="ghost"
                          size="sm"
                          rightIcon={
                            <Eye className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                          }
                          onClick={() =>
                            navigate(
                              session.detailPath ||
                                `/adaptive/detail/${session.id}`
                            )
                          }
                          className="text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 group/btn"
                        >
                          Details
                        </BaseButton>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      className={`w-9 h-9 rounded-full text-sm font-semibold ${
                        currentPage === p
                          ? 'shadow-md scale-105'
                          : 'hover:bg-primary/10'
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

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
