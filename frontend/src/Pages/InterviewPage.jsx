// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  Send,
  Brain,
  TrendingUp,
  User,
  CheckCircle,
  XCircle,
  Award,
  AlertCircle,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ==================== Error Boundary ====================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    console.error('InterviewPage ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <BaseCard className="text-center p-8 max-w-md">
            <div className="text-error text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text mb-2">
              Something went wrong
            </h2>
            <p className="text-muted mb-4">
              {this.state.errorMsg || 'Failed to render interview page.'}
            </p>
            <BaseButton
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </BaseButton>
          </BaseCard>
        </div>
      );
    }
    return this.props.children;
  }
}
// ========================================================

export default function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty } = location.state || {};

  const { isAuthenticated, user, updateActivity } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('mcq');
  const [errorMessage, setErrorMessage] = useState('');

  const isMounted = useRef(true);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!topic) {
      navigate('/welcome');
      return;
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true);
        updateActivity();

        const { data } = await api.post('/interview/generate', {
          topic,
          difficulty,
        });

        if (isMounted.current) {
          if (!data.questions) {
            throw new Error(
              'Invalid response format: missing questions object'
            );
          }

          const mcqData = data.questions.mcq || [];
          const textData = data.questions.text || [];

          if (mcqData.length === 0 && textData.length === 0) {
            throw new Error('No questions generated');
          }

          const enriched = {
            mcq: mcqData.map((q, idx) => ({
              ...q,
              _uid: `mcq-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`,
            })),
            text: textData.map((q, idx) => ({
              ...q,
              _uid: `text-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`,
            })),
          };

          setQuestions(Object.freeze(enriched));
          setLoading(false);
        }
      } catch (error) {
        console.error('Generate questions error:', error);
        if (isMounted.current) {
          const errorMsg =
            error.response?.data?.message ||
            error.message ||
            'Failed to generate questions. Please try again.';
          setErrorMessage(errorMsg);
          setTimeout(() => navigate('/welcome'), 2000);
        }
      }
    };

    fetchQuestions();
  }, [topic, difficulty, navigate, updateActivity]);

  const handleAnswerChange = (qIndex, type, value) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const cleanQuestions = {
        mcq: questions.mcq.map(({ _uid, ...rest }) => rest),
        text: questions.text.map(({ _uid, ...rest }) => rest),
      };
      const payload = {
        topic,
        difficulty,
        questions: cleanQuestions,
        answers,
        userId: user?.id,
      };

      const { data } = await api.post('/interview/submit', payload);

      if (isMounted.current) {
        if (data.success) {
          setResults(data.results);
          setSubmitted(true);
        } else {
          throw new Error(data.message || 'Grading failed');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Error submitting answers. Please try again.';
      setErrorMessage(errorMsg);

      if (error.response?.status === 401) {
        setErrorMessage('Session expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setActiveSection(tab);
  };

  const mcqCount = questions?.mcq?.length || 0;
  const textCount = questions?.text?.length || 0;
  const answeredMcq = Object.keys(answers).filter((k) =>
    k.startsWith('mcq_')
  ).length;
  const answeredText = Object.keys(answers).filter((k) =>
    k.startsWith('text_')
  ).length;
  const userName = user?.fullName || user?.userName || 'Guest';

  const totalQuestions = mcqCount + textCount;
  const answeredTotal = answeredMcq + answeredText;
  const progressPercent =
    totalQuestions === 0 ? 0 : (answeredTotal / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <p className="mt-6 text-muted font-medium">
            AI is generating questions about{' '}
            <span className="text-primary font-bold">“{topic}”</span>...
          </p>
        </div>
      </div>
    );
  }

  if (!questions || (mcqCount === 0 && textCount === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <BaseCard className="text-center p-8">
          <p className="text-error font-semibold">
            No questions available. Please try again.
          </p>
          <BaseButton
            variant="primary"
            onClick={() => navigate('/welcome')}
            className="mt-4"
          >
            Go Back
          </BaseButton>
        </BaseCard>
      </div>
    );
  }

  const totalScore = results?.totalScore || 0;
  const mcqResults = results?.mcq || [];
  const textResults = results?.text || [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-bg py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <BaseButton
              variant="ghost"
              size="sm"
              leftIcon={
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              }
              onClick={() => navigate('/welcome')}
              className="group gap-2 text-muted hover:text-primary bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border w-fit"
            >
              Back to Dashboard
            </BaseButton>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <BaseBadge
                variant="default"
                rounded
                className="gap-2 px-3 py-1.5"
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text">
                  {userName}
                </span>
              </BaseBadge>
              {!submitted && (
                <BaseBadge
                  variant="success"
                  rounded
                  className="gap-2 px-3 py-1.5"
                >
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-xs font-medium">In Progress</span>
                </BaseBadge>
              )}
              {submitted && (
                <BaseBadge
                  variant="primary"
                  rounded
                  className="gap-2 px-3 py-1.5 shadow-md"
                >
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    Score: {totalScore}/100
                  </span>
                </BaseBadge>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-error">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-error hover:text-error/80"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Card */}
          <BaseCard className="overflow-hidden">
            {/* Header card với gradient nhẹ */}
            <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-6 border-b border-border">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-7 h-7 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold text-text">
                    Interview: {topic}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <BaseBadge variant="primary" rounded>
                    Difficulty: {difficulty}
                  </BaseBadge>
                  <BaseBadge variant="default" rounded>
                    {mcqCount} MCQ
                  </BaseBadge>
                  <BaseBadge variant="default" rounded>
                    {textCount} Essay
                  </BaseBadge>
                </div>
              </div>
            </div>

            {/* Progress bar - chỉ khi chưa submit */}
            {!submitted && (
              <div className="px-6 pt-6 pb-2 border-b border-border">
                <div className="flex justify-between text-sm text-muted mb-2">
                  <span>Progress</span>
                  <span>
                    {answeredTotal} / {totalQuestions} answered
                  </span>
                </div>
                <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Tab headers */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => switchTab('mcq')}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${
                  activeSection === 'mcq'
                    ? 'text-primary'
                    : 'text-muted hover:text-text'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> MCQ{' '}
                {submitted &&
                  mcqResults.length > 0 &&
                  `(${mcqResults.filter((r) => r.isCorrect).length}/${mcqCount})`}
                {activeSection === 'mcq' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              <button
                onClick={() => switchTab('text')}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${
                  activeSection === 'text'
                    ? 'text-primary'
                    : 'text-muted hover:text-text'
                }`}
              >
                <FileText className="w-4 h-4" /> Essay Questions
                {activeSection === 'text' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
            </div>

            {/* Form content */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="p-6"
            >
              {/* MCQ Section */}
              <div
                style={{ display: activeSection === 'mcq' ? 'block' : 'none' }}
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" /> Multiple
                    Choice Questions
                  </h2>
                  {questions.mcq.map((q, idx) => {
                    const isGraded = submitted && mcqResults[idx];
                    const isCorrect = isGraded && mcqResults[idx].isCorrect;
                    const userChoice = answers[`mcq_${idx}`];
                    const stableKey = q._uid;

                    return (
                      <div
                        key={stableKey}
                        className={`group bg-muted/5 rounded-xl p-5 border transition-all duration-300 ${
                          submitted
                            ? isCorrect
                              ? 'border-success/50 bg-success/5'
                              : 'border-error/50 bg-error/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <p className="font-medium text-text flex-1">
                            {q.question}
                          </p>
                          {submitted && (
                            <div>
                              {isCorrect ? (
                                <CheckCircle className="w-6 h-6 text-success" />
                              ) : (
                                <XCircle className="w-6 h-6 text-error" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Options */}
                        <div className="ml-10 space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrectAnswer = opt === q.correctAnswer;
                            const isUserAnswer = opt === userChoice;
                            let optionClass =
                              'flex items-start gap-3 cursor-pointer p-2 rounded-lg transition border border-transparent';
                            if (!submitted)
                              optionClass += ' hover:bg-primary/10';
                            else if (isCorrectAnswer)
                              optionClass += ' bg-success/20 border-success/50';
                            else if (isUserAnswer && !isCorrectAnswer)
                              optionClass += ' bg-error/20 border-error/50';
                            else optionClass += ' opacity-70';

                            return (
                              <label
                                key={`${stableKey}-opt-${optIdx}`}
                                className={optionClass}
                              >
                                <input
                                  type="radio"
                                  name={`mcq_${idx}`}
                                  value={opt}
                                  checked={userChoice === opt}
                                  onChange={() =>
                                    handleAnswerChange(`mcq_${idx}`, 'mcq', opt)
                                  }
                                  disabled={submitted}
                                  className="mt-0.5 w-4 h-4"
                                />
                                <span
                                  className={`text-sm flex-1 ${
                                    submitted && isCorrectAnswer
                                      ? 'text-success font-semibold'
                                      : submitted &&
                                          isUserAnswer &&
                                          !isCorrectAnswer
                                        ? 'text-error font-semibold'
                                        : 'text-text'
                                  }`}
                                >
                                  {opt}
                                </span>
                                {submitted && isCorrectAnswer && (
                                  <span className="text-xs text-success font-semibold ml-auto">
                                    Correct
                                  </span>
                                )}
                                {submitted &&
                                  isUserAnswer &&
                                  !isCorrectAnswer && (
                                    <span className="text-xs text-error font-semibold ml-auto">
                                      Your answer
                                    </span>
                                  )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Improved submitted details for MCQ */}
                        {submitted && (
                          <div className="ml-10 mt-3 space-y-3">
                            <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" /> Explanation
                              </p>
                              <p className="text-sm text-text">
                                {mcqResults[idx]?.explanation ||
                                  'No explanation available.'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-warning/5 border-l-4 border-warning">
                              <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Your answer
                              </p>
                              <p className="text-sm text-text">
                                {userChoice || 'Not answered'}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-success/5 border-l-4 border-success">
                              <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Correct
                                answer
                              </p>
                              <p className="text-sm text-text">
                                {q.correctAnswer}
                              </p>
                            </div>
                            <BaseBadge
                              variant={
                                mcqResults[idx]?.score >= 7
                                  ? 'success'
                                  : 'error'
                              }
                              rounded
                              className="p-3 text-sm font-semibold flex items-center gap-2"
                            >
                              <span>Score:</span>
                              <span>{mcqResults[idx]?.score || 0}/10</span>
                            </BaseBadge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Essay Section */}
              <div
                style={{ display: activeSection === 'text' ? 'block' : 'none' }}
              >
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Essay
                    Questions
                  </h2>
                  {questions.text.map((q, idx) => {
                    const essayResult = submitted && textResults[idx];
                    const isLowScore = essayResult?.score < 5;
                    const stableKey = q._uid;
                    return (
                      <div
                        key={stableKey}
                        className={`bg-muted/5 rounded-xl p-5 border transition-all duration-300 ${
                          submitted
                            ? isLowScore
                              ? 'border-error/50 bg-error/5'
                              : 'border-success/50 bg-success/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                            {idx + 1}
                          </div>
                          <p className="font-medium text-text flex-1">
                            {q.question}
                          </p>
                        </div>
                        <div className="ml-10">
                          <textarea
                            rows={4}
                            className="w-full p-3 rounded-xl border border-border bg-card text-text focus:ring-2 focus:ring-primary transition-all disabled:opacity-80"
                            placeholder="Type your answer here..."
                            value={answers[`text_${idx}`] || ''}
                            onChange={(e) =>
                              handleAnswerChange(
                                `text_${idx}`,
                                'text',
                                e.target.value
                              )
                            }
                            disabled={submitted}
                          />
                        </div>
                        {submitted && essayResult && (
                          <div className="ml-10 mt-3 space-y-3">
                            <div className="p-3 rounded-lg bg-warning/5 border-l-4 border-warning">
                              <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Your answer
                              </p>
                              <p className="text-sm text-text whitespace-pre-wrap">
                                {essayResult.userAnswer || 'Not answered'}
                              </p>
                            </div>
                            {essayResult.idealAnswerKeywords?.length > 0 && (
                              <div className="p-3 rounded-lg bg-success/5 border-l-4 border-success">
                                <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Ideal
                                  keywords
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {essayResult.idealAnswerKeywords.map(
                                    (kw, i) => (
                                      <BaseBadge
                                        key={i}
                                        variant="success"
                                        size="sm"
                                        rounded
                                      >
                                        {kw}
                                      </BaseBadge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                            {(essayResult.sampleAnswer ||
                              essayResult.aiSuggestedAnswer) && (
                              <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Sample answer
                                </p>
                                <p className="text-sm text-text whitespace-pre-wrap">
                                  {essayResult.sampleAnswer ||
                                    essayResult.aiSuggestedAnswer}
                                </p>
                              </div>
                            )}
                            <BaseBadge
                              variant={
                                essayResult.score >= 7 ? 'success' : 'error'
                              }
                              rounded
                              className="p-3 text-sm font-semibold flex items-center gap-2"
                            >
                              <span>Score:</span>
                              <span>{essayResult.score}/10</span>
                            </BaseBadge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button / Results Footer */}
              {!submitted && (
                <div className="mt-8 pt-4 border-t border-border">
                  <BaseButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitting}
                    leftIcon={!submitting && <Send className="w-5 h-5" />}
                    disabled={submitting}
                    className="py-3.5 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                  >
                    {submitting ? 'Grading...' : 'Submit Answers'}
                  </BaseButton>
                  <p className="text-center text-xs text-muted mt-3">
                    * Review your answers carefully before submitting
                  </p>
                </div>
              )}

              {submitted && (
                <div className="mt-8 pt-4 border-t border-border text-center">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-text">
                      Your total score: {totalScore}/100
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <BaseButton
                        variant="primary"
                        onClick={() => navigate('/welcome')}
                      >
                        Back to Dashboard
                      </BaseButton>
                      <BaseButton
                        variant="secondary"
                        onClick={() => navigate('/history')}
                      >
                        View History
                      </BaseButton>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </BaseCard>
          <div className="mt-6 text-center text-xs text-muted">
            <TrendingUp className="inline w-3 h-3 mr-1" /> Powered by AI
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
