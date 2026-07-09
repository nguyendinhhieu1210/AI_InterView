// frontend/src/Pages/user/UserExamDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Calendar,
  Award,
  ChevronDown,
  ChevronUp,
  Send,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';
import api from '../services/api';

export default function UserExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [examSet, setExamSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const fetchExamDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/user/exam-sets/${id}`);
      setExamSet(response.data.data);

      const initialAnswers = {};
      response.data.data.questions.forEach((q) => {
        initialAnswers[q._id] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Fetch exam detail error:', error);
      toast.error('Failed to load exam');
      navigate('/exam-sets');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchExamDetail();
  }, [fetchExamDetail]);

  const handleAnswerChange = (questionId, value) => {
    if (submitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    const unanswered = Object.values(answers).filter((a) => !a).length;
    if (unanswered > 0) {
      toast.error(`Please answer all questions (${unanswered} unanswered)`);
      return;
    }

    if (!window.confirm('Are you sure you want to submit your answers?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/user/exam-sets/${id}/submit`, {
        answers,
      });
      setResult(response.data.data);
      setSubmitted(true);
      toast.success(response.data.data.message);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm('Reset all answers?')) return;
    const resetAnswers = {};
    examSet.questions.forEach((q) => {
      resetAnswers[q._id] = '';
    });
    setAnswers(resetAnswers);
  };

  const toggleExpand = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'bg-green-500/10 text-green-600 border-green-500/20',
      Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      Hard: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      Expert: 'bg-red-500/10 text-red-600 border-red-500/20',
    };
    return colors[difficulty] || colors.Medium;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter((a) => a).length;
  };

  const getProgressPercentage = () => {
    return (getAnsweredCount() / examSet?.totalQuestions) * 100 || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted mt-4 font-medium">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!examSet) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text">Exam not found</h3>
          <BaseButton
            variant="primary"
            size="sm"
            onClick={() => navigate('/exam-sets')}
            className="mt-4"
          >
            Back to Exam Sets
          </BaseButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 min-w-0">
            <BaseButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/exam-sets')}
              className="flex items-center gap-2 p-0 hover:bg-transparent group"
            >
              <ArrowLeft className="w-5 h-5 text-text group-hover:text-primary transition-colors" />
              <span className="hidden sm:inline text-text group-hover:text-primary transition-colors font-medium">
                Back
              </span>
            </BaseButton>
            <div className="hidden sm:block h-6 w-px bg-border"></div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-semibold text-text truncate">
                {examSet.name}
              </h1>
              <p className="text-xs text-muted flex items-center gap-2">
                <span>{examSet.programmingLanguage}</span>
                <span className="w-1 h-1 rounded-full bg-muted"></span>
                <span>{examSet.totalQuestions} questions</span>
              </p>
            </div>
          </div>

          <BaseButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/welcome')}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all duration-200 text-primary text-sm"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </BaseButton>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Exam Info Card */}
        <BaseCard className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-text truncate">
                {examSet.name}
              </h2>
              {examSet.description && (
                <p className="text-muted mt-1 text-sm line-clamp-2">
                  {examSet.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <BaseBadge
                  variant="primary"
                  rounded
                  className="px-3 py-1 text-xs"
                >
                  {examSet.programmingLanguage}
                </BaseBadge>
                <span className="text-xs text-muted flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {examSet.totalQuestions} questions
                </span>
                <span className="text-xs text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(examSet.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {!submitted && (
              <div className="flex items-center gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="px-3 py-2 text-sm text-muted hover:text-danger transition-colors"
                  title="Reset all answers"
                >
                  <RotateCcw className="w-4 h-4" />
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="md"
                  onClick={handleSubmit}
                  disabled={
                    submitting || getAnsweredCount() < examSet.totalQuestions
                  }
                  className="px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </BaseButton>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {!submitted && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted font-medium">Progress</span>
                <span className="text-text font-medium">
                  {getAnsweredCount()} / {examSet.totalQuestions} answered
                  <span className="text-muted font-normal ml-1">
                    ({Math.round(getProgressPercentage())}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-bg/50 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-secondary rounded-full h-2.5 transition-all duration-500 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}
        </BaseCard>

        {/* Result Card */}
        {submitted && result && (
          <BaseCard className="p-5 sm:p-6 border-2 border-success/20 bg-success/5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Results
                </h3>
                <p className="text-sm text-muted">{result.message}</p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {result.score}%
                  </p>
                  <p className="text-xs text-muted">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-success">
                    {result.correctCount}/{result.totalQuestions}
                  </p>
                  <p className="text-xs text-muted">Correct</p>
                </div>
                <div className="text-center">
                  <BaseBadge
                    variant={result.isPassed ? 'success' : 'danger'}
                    rounded
                    className="px-4 py-1.5 text-sm font-semibold"
                  >
                    {result.isPassed ? '✅ Passed' : '❌ Failed'}
                  </BaseBadge>
                </div>
              </div>
            </div>
          </BaseCard>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Questions
              {submitted && (
                <span className="text-sm text-muted font-normal">
                  ({result?.correctCount}/{examSet.totalQuestions} correct)
                </span>
              )}
            </h3>
            {!submitted && (
              <span className="text-xs text-muted">
                {getAnsweredCount()} of {examSet.totalQuestions} answered
              </span>
            )}
          </div>

          {examSet.questions.map((question, index) => {
            const userAnswer = answers[question._id];
            const isExpanded = expandedQuestions[question._id];
            const questionResult =
              submitted &&
              result?.results?.find((r) => r.questionId === question._id);

            const isCorrect = submitted && questionResult?.isCorrect;
            const isWrong =
              submitted && questionResult && !questionResult?.isCorrect;

            return (
              <BaseCard
                key={question._id}
                className={`p-5 transition-all duration-300 ${
                  isCorrect
                    ? 'border-2 border-success bg-success/5'
                    : isWrong
                      ? 'border-2 border-danger bg-danger/5'
                      : 'hover:border-primary/20'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                        isCorrect
                          ? 'bg-success text-white'
                          : isWrong
                            ? 'bg-danger text-white'
                            : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-text font-medium leading-relaxed">
                        {question.question}
                      </p>
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 ${getDifficultyColor(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-1.5 flex items-center gap-2">
                      {isWrong && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-danger px-3 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" />
                          Incorrect
                        </span>
                      )}
                      {isCorrect && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-success px-3 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Correct
                        </span>
                      )}
                      {/* ✅ Hiển thị đáp án user đã chọn - NỔI BẬT */}
                      {isWrong && userAnswer && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-danger bg-danger/10 px-3 py-1 rounded-full border border-danger/30">
                          <span>Your answer:</span>
                          <span className="font-bold">{userAnswer}</span>
                        </span>
                      )}
                      {isCorrect && userAnswer && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-3 py-1 rounded-full border border-success/30">
                          <span>Your answer:</span>
                          <span className="font-bold">{userAnswer}</span>
                        </span>
                      )}
                    </div>

                    {/* Options Grid */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((key) => {
                        const optionText = question.options[key];
                        if (!optionText) return null;

                        const isSelected = userAnswer === key;
                        const isCorrectAnswer =
                          submitted && questionResult?.correctAnswer === key;
                        const isWrongAnswer =
                          submitted && isSelected && !questionResult?.isCorrect;

                        let optionClass =
                          'border-border hover:border-primary/30 bg-card';
                        let statusIcon = null;
                        let textColor = 'text-text';

                        if (submitted) {
                          if (isCorrectAnswer) {
                            optionClass =
                              'border-2 border-success bg-success/10';
                            statusIcon = (
                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                            );
                            textColor = 'text-success';
                          } else if (isWrongAnswer) {
                            // ✅ ĐÁP ÁN USER CHỌN SAI - NỔI BẬT MÀU ĐỎ
                            optionClass =
                              'border-2 border-danger bg-danger/10 ring-2 ring-danger/30';
                            statusIcon = (
                              <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                            );
                            textColor = 'text-danger font-semibold';
                          } else {
                            optionClass = 'border border-border opacity-50';
                            textColor = 'text-muted';
                          }
                        } else if (isSelected) {
                          optionClass = 'border-2 border-primary bg-primary/5';
                        }

                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${optionClass} ${
                              submitted ? 'cursor-default' : 'hover:bg-bg/50'
                            }`}
                            onClick={() => {
                              if (!submitted) {
                                handleAnswerChange(question._id, key);
                              }
                            }}
                          >
                            <input
                              type="radio"
                              name={`q-${question._id}`}
                              value={key}
                              checked={isSelected}
                              onChange={() => {}}
                              disabled={submitted}
                              className="w-4 h-4 text-primary border-border focus:ring-primary flex-shrink-0"
                            />
                            <span
                              className={`font-semibold text-sm ${textColor} flex-shrink-0`}
                            >
                              {key}.
                            </span>
                            <span className={`text-sm flex-1 ${textColor}`}>
                              {optionText}
                            </span>
                            {statusIcon}
                          </label>
                        );
                      })}
                    </div>

                    {/* ✅ Hiển thị rõ đáp án user đã chọn (dạng text) */}
                    {isWrong && userAnswer && (
                      <div className="mt-3 p-3 bg-danger/10 rounded-lg border border-danger/30">
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-danger" />
                          <span className="text-danger font-medium">
                            You selected:
                          </span>
                          <span className="text-danger font-bold bg-danger/20 px-2 py-0.5 rounded">
                            {userAnswer}
                          </span>
                          <span className="text-danger/70">
                            - This is incorrect
                          </span>
                        </div>
                      </div>
                    )}

                    {isCorrect && userAnswer && (
                      <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/30">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-success font-medium">
                            You selected:
                          </span>
                          <span className="text-success font-bold bg-success/20 px-2 py-0.5 rounded">
                            {userAnswer}
                          </span>
                          <span className="text-success/70">- Correct!</span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {submitted && questionResult && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <button
                          onClick={() => toggleExpand(question._id)}
                          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide Explanation
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show Explanation
                            </>
                          )}
                        </button>
                        {isExpanded && (
                          <div
                            className={`mt-2 p-4 rounded-xl border ${
                              isCorrect
                                ? 'bg-success/5 border-success/20'
                                : 'bg-danger/5 border-danger/20'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-text">
                                💡 Explanation:
                              </span>
                              <p className="text-sm text-muted flex-1">
                                {questionResult.explanation}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-sm font-medium text-text">
                                ✅ Correct Answer:
                              </span>
                              <BaseBadge
                                variant="success"
                                rounded
                                className="px-2 py-0.5 text-xs"
                              >
                                {questionResult.correctAnswer}
                              </BaseBadge>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </BaseCard>
            );
          })}
        </div>

        {/* Bottom Submit Button */}
        {!submitted && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <div className="text-sm text-muted">
              <span className="font-medium">{getAnsweredCount()}</span> of{' '}
              <span className="font-medium">{examSet.totalQuestions}</span>{' '}
              questions answered
              {getAnsweredCount() < examSet.totalQuestions && (
                <span className="text-warning ml-2">
                  ({examSet.totalQuestions - getAnsweredCount()} remaining)
                </span>
              )}
            </div>
            <BaseButton
              variant="primary"
              size="lg"
              onClick={handleSubmit}
              disabled={
                submitting || getAnsweredCount() < examSet.totalQuestions
              }
              className="px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 min-w-[160px] justify-center"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Exam
                </>
              )}
            </BaseButton>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
