import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Trash2,
  Calendar,
  HelpCircle,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

import api from '../services/api';

export default function InterviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/interview/history/${id}`);
      if (response.data.success && response.data.interview) {
        setInterview(response.data.interview);
      } else {
        throw new Error('Interview not found');
      }
    } catch (err) {
      console.error('Detail fetch error:', err);
      if (err.response?.status === 404) {
        setError('Interview not found. It may have been deleted.');
      } else if (err.response?.status === 401) {
        return;
      } else {
        setError(err.message || 'Failed to load interview details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this interview?'))
      return;
    try {
      await api.delete(`/interview/history/${id}`);
      navigate('/history');
    } catch (error) {
      alert('Delete failed');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning/80';
    return 'text-error';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-success/20 text-success';
    if (score >= 60) return 'bg-warning/20 text-warning';
    if (score >= 40) return 'bg-warning/10 text-warning/80';
    return 'bg-error/20 text-error';
  };

  const getScoreBadgeVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'warning';
    return 'error';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-muted">Loading details...</span>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <BaseCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-text mb-4">{error || 'Interview not found'}</p>
          <BaseButton variant="primary" onClick={() => navigate('/history')}>
            Back to History
          </BaseButton>
        </BaseCard>
      </div>
    );
  }

  const mcqResults = interview.mcqResults || [];
  const essayResults = interview.textResults || [];

  return (
    <div className="min-h-screen bg-bg py-6 md:py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation & Delete */}
        <div className="flex justify-between items-center mb-6">
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            }
            onClick={() => navigate('/interview-history')}
            className="group gap-2 text-muted hover:text-primary bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Back
          </BaseButton>
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
            className="gap-2 text-error hover:text-error/80 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Delete
          </BaseButton>
        </div>

        {/* Title & Meta */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {interview.topic} · {interview.difficulty}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-4 text-muted text-sm mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />{' '}
              {formatDate(interview.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> {interview.totalQuestions}{' '}
              questions
            </span>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <BaseCard className="p-4 text-center hover:shadow-lg transition-all">
            <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
            <div
              className={`text-3xl font-bold ${getScoreColor(interview.totalScore)}`}
            >
              {interview.totalScore}
              <span className="text-base text-muted">/100</span>
            </div>
            <div className="text-xs text-muted mt-1">Total Score</div>
          </BaseCard>

          <BaseCard className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-success">
              {interview.mcqScore || 0}
              <span className="text-base text-muted">
                /{interview.mcqCount * 10}
              </span>
            </div>
            <div className="text-xs text-muted mt-1">MCQ Score</div>
          </BaseCard>

          <BaseCard className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-3xl font-bold text-secondary">
              {interview.essayScore || 0}
              <span className="text-base text-muted">
                /{interview.essayCount * 10}
              </span>
            </div>
            <div className="text-xs text-muted mt-1">Essay Score</div>
          </BaseCard>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-text">
            <Award className="w-5 h-5 text-primary" /> Questions & Answers
          </h2>

          {/* MCQ Questions */}
          {mcqResults.map((result, idx) => {
            const isCorrect = result.isCorrect;
            const userAnswer = result.userAnswer || '';
            const correctAnswer = result.correctAnswer;
            const explanation = result.explanation;
            const options = result.options || [];
            const questionText = result.question;
            const score = result.score || 0;

            return (
              <div
                key={`mcq-${idx}`}
                className="group bg-card backdrop-blur rounded-2xl border-l-8 border-l-primary shadow-soft hover:shadow-lg transition-all overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedQuestion(
                      expandedQuestion === `mcq_${idx}` ? null : `mcq_${idx}`
                    )
                  }
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/5 transition"
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="font-medium text-text">
                        Question {idx + 1}: {questionText}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <BaseBadge
                          variant={getScoreBadgeVariant(score)}
                          size="sm"
                          rounded
                        >
                          Score: {score}/10
                        </BaseBadge>
                      </div>
                    </div>
                  </div>
                  {expandedQuestion === `mcq_${idx}` ? (
                    <ChevronUp className="w-5 text-muted shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 text-muted shrink-0" />
                  )}
                </button>

                {expandedQuestion === `mcq_${idx}` && (
                  <div className="p-4 bg-muted/5 border-t border-border space-y-3 text-sm animate-slideDown">
                    <div className="space-y-2">
                      {options.map((option, optIdx) => {
                        const isCorrectOption = option === correctAnswer;
                        const isUserOption = option === userAnswer;
                        let bgClass = 'bg-card border-border';
                        let textClass = 'text-text';
                        let icon = null;

                        if (isCorrectOption) {
                          bgClass = 'bg-success/20 border-success/30';
                          textClass = 'text-success font-medium';
                          icon = (
                            <CheckCircle className="w-4 h-4 text-success" />
                          );
                        } else if (isUserOption) {
                          bgClass = 'bg-error/20 border-error/30';
                          textClass = 'text-error font-medium';
                          icon = <XCircle className="w-4 h-4 text-error" />;
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-center justify-between p-2 rounded-lg border ${bgClass} transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold w-6 text-muted">
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className={`text-sm ${textClass}`}>
                                {option}
                              </span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>
                    {explanation && (
                      <div className="mt-3 pt-2 border-t border-border">
                        <p className="font-semibold text-primary text-xs mb-1">
                          Explanation:
                        </p>
                        <p className="text-muted text-xs leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Essay Questions */}
          {essayResults.map((result, idx) => {
            const userAnswer = result.userAnswer || '';
            const sampleAnswer = result.sampleAnswer || '';
            const idealKeywords = result.idealAnswerKeywords || [];
            const score = result.score || 0;
            const explanation = result.explanation || '';
            const feedback = result.feedback || '';
            const questionText = result.question;

            return (
              <div
                key={`essay-${idx}`}
                className="group bg-card backdrop-blur rounded-2xl border-l-8 border-l-secondary shadow-soft hover:shadow-lg transition-all overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedQuestion(
                      expandedQuestion === `essay_${idx}`
                        ? null
                        : `essay_${idx}`
                    )
                  }
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-muted/5 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium text-text">
                      Question {idx + 1}: {questionText}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <BaseBadge
                        variant={getScoreBadgeVariant(score)}
                        size="sm"
                        rounded
                      >
                        Score: {score}/10
                      </BaseBadge>
                    </div>
                  </div>
                  {expandedQuestion === `essay_${idx}` ? (
                    <ChevronUp className="w-5 text-muted" />
                  ) : (
                    <ChevronDown className="w-5 text-muted" />
                  )}
                </button>
                {expandedQuestion === `essay_${idx}` && (
                  <div className="p-4 bg-muted/5 border-t border-border space-y-3 text-sm animate-slideDown">
                    <div>
                      <p className="font-semibold text-text">Your answer:</p>
                      <div className="bg-card p-3 rounded-lg mt-1 whitespace-pre-wrap border border-border text-text">
                        {userAnswer || '—'}
                      </div>
                    </div>
                    {sampleAnswer && (
                      <div>
                        <p className="font-semibold text-text">
                          Sample answer:
                        </p>
                        <div className="bg-card p-3 rounded-lg mt-1 border border-border text-text">
                          {sampleAnswer}
                        </div>
                      </div>
                    )}
                    {idealKeywords.length > 0 && (
                      <div>
                        <p className="font-semibold text-text">
                          Ideal keywords:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {idealKeywords.map((kw, i) => (
                            <BaseBadge key={i} variant="info" size="sm" rounded>
                              {kw}
                            </BaseBadge>
                          ))}
                        </div>
                      </div>
                    )}
                    {explanation && (
                      <div>
                        <p className="font-semibold text-primary">
                          Grading explanation:
                        </p>
                        <p className="text-muted text-xs">{explanation}</p>
                      </div>
                    )}
                    {feedback && (
                      <div>
                        <p className="font-semibold text-primary">Feedback:</p>
                        <p className="text-muted text-xs">{feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {mcqResults.length === 0 && essayResults.length === 0 && (
            <div className="text-center py-8 text-muted bg-card/50 rounded-2xl backdrop-blur border border-border">
              No questions found.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
      `}</style>
    </div>
  );
}
