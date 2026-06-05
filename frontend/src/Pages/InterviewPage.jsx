// src/pages/InterviewPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, HelpCircle, Send, Brain, TrendingUp,
  User, CheckCircle, XCircle, Award, AlertCircle
} from 'lucide-react';
import { generateQuestions } from '../services/interviewAPI';
import { useAuth } from '../contexts/AuthContext';

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
          <div className="text-center p-8 bg-card rounded-2xl shadow-soft border border-border max-w-md">
            <div className="text-error text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text mb-2">Something went wrong</h2>
            <p className="text-muted mb-4">{this.state.errorMsg || 'Failed to render interview page.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-primary text-white rounded-lg hover:brightness-105 transition shadow-md"
            >
              Reload Page
            </button>
          </div>
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

  const { isAuthenticated, user, token, updateActivity, logout } = useAuth();

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
        updateActivity();
        const data = await generateQuestions(topic, difficulty);
        if (isMounted.current) {
          const enriched = {
            mcq: (data.mcq || []).map((q, idx) => ({
              ...q,
              _uid: `mcq-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`
            })),
            text: (data.text || []).map((q, idx) => ({
              ...q,
              _uid: `text-${idx}-${q.question?.slice(0, 30) || idx}-${Date.now()}-${Math.random()}`
            }))
          };
          setQuestions(Object.freeze(enriched));
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
        if (isMounted.current) {
          setErrorMessage('Failed to generate questions. Please try again.');
          setTimeout(() => navigate('/welcome'), 2000);
        }
      }
    };

    fetchQuestions();
  }, [topic, difficulty, navigate, updateActivity]);

  const fetchWithAuth = async (url, options = {}) => {
    const currentToken = token;
    if (!currentToken) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${currentToken}`,
      ...options.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
      throw new Error('Your session has expired. Please login again.');
    }
    return response;
  };

  const handleAnswerChange = (qIndex, type, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const cleanQuestions = {
        mcq: questions.mcq.map(({ _uid, ...rest }) => rest),
        text: questions.text.map(({ _uid, ...rest }) => rest)
      };
      const payload = {
        topic,
        difficulty,
        questions: cleanQuestions,
        answers,
        userId: user?.id
      };
      const response = await fetchWithAuth('/api/interview/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (isMounted.current) {
        if (data.success) {
          setResults(data.results);
          setSubmitted(true);
        } else {
          throw new Error(data.message || 'Grading failed');
        }
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || 'Error submitting answers. Please try again.');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const switchTab = (tab) => {
    setActiveSection(tab);
  };

  const mcqCount = questions?.mcq?.length || 0;
  const textCount = questions?.text?.length || 0;
  const answeredMcq = Object.keys(answers).filter(k => k.startsWith('mcq_')).length;
  const answeredText = Object.keys(answers).filter(k => k.startsWith('text_')).length;
  const userName = user?.fullName || user?.userName || 'Guest';

  const totalQuestions = mcqCount + textCount;
  const answeredTotal = answeredMcq + answeredText;
  const progressPercent = totalQuestions === 0 ? 0 : (answeredTotal / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <p className="mt-6 text-muted font-medium">
            AI is generating questions about <span className="text-primary font-bold">“{topic}”</span>...
          </p>
        </div>
      </div>
    );
  }

  if (!questions || (mcqCount === 0 && textCount === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center p-8 bg-card rounded-2xl shadow-soft border border-border">
          <p className="text-error font-semibold">No questions available. Please try again.</p>
          <button onClick={() => navigate('/welcome')} className="mt-4 px-5 py-2 bg-primary text-white rounded-lg hover:brightness-105 transition shadow-md">
            Go Back
          </button>
        </div>
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
            <button
              onClick={() => navigate('/welcome')}
              className="group flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 font-medium bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border w-fit"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/70 backdrop-blur-sm rounded-full shadow-soft border border-border">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-text">{userName}</span>
              </div>
              {!submitted && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-card/70 backdrop-blur-sm rounded-full shadow-soft border border-border">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span className="text-xs font-medium text-muted">In Progress</span>
                </div>
              )}
              {submitted && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-full shadow-md">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Score: {totalScore}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-error">{errorMessage}</div>
              <button onClick={() => setErrorMessage('')} className="text-error hover:text-error/80">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
            {/* Header card với gradient nhẹ */}
            <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-6 border-b border-border">
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-7 h-7 text-primary" />
                  <h1 className="text-2xl md:text-3xl font-bold text-text">Interview: {topic}</h1>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">Difficulty: {difficulty}</span>
                  <span className="px-3 py-1 bg-muted/20 text-muted text-sm font-medium rounded-full">{mcqCount} MCQ</span>
                  <span className="px-3 py-1 bg-muted/20 text-muted text-sm font-medium rounded-full">{textCount} Essay</span>
                </div>
              </div>
            </div>

            {/* Progress bar - chỉ khi chưa submit */}
            {!submitted && (
              <div className="px-6 pt-6 pb-2 border-b border-border">
                <div className="flex justify-between text-sm text-muted mb-2">
                  <span>Progress</span>
                  <span>{answeredTotal} / {totalQuestions} answered</span>
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
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'mcq' ? 'text-primary' : 'text-muted hover:text-text'}`}
              >
                <HelpCircle className="w-4 h-4" /> MCQ {submitted && mcqResults.length > 0 && `(${mcqResults.filter(r => r.isCorrect).length}/${mcqCount})`}
                {activeSection === 'mcq' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
              </button>
              <button
                onClick={() => switchTab('text')}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'text' ? 'text-primary' : 'text-muted hover:text-text'}`}
              >
                <FileText className="w-4 h-4" /> Essay Questions
                {activeSection === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
              </button>
            </div>

            {/* Form content */}
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
              {/* MCQ Section */}
              <div style={{ display: activeSection === 'mcq' ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" /> Multiple Choice Questions
                  </h2>
                  {questions.mcq.map((q, idx) => {
                    const isGraded = submitted && mcqResults[idx];
                    const isCorrect = isGraded && mcqResults[idx].isCorrect;
                    const userChoice = answers[`mcq_${idx}`];
                    const stableKey = q._uid;

                    return (
                      <div
                        key={stableKey}
                        className={`group bg-muted/5 rounded-xl p-5 border transition-all duration-300 ${submitted
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
                          <p className="font-medium text-text flex-1">{q.question}</p>
                          {submitted && (
                            <div>
                              {isCorrect ? <CheckCircle className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-error" />}
                            </div>
                          )}
                        </div>

                        {/* Options */}
                        <div className="ml-10 space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrectAnswer = opt === q.correctAnswer;
                            const isUserAnswer = opt === userChoice;
                            let optionClass = 'flex items-start gap-3 cursor-pointer p-2 rounded-lg transition border border-transparent';
                            if (!submitted) optionClass += ' hover:bg-primary/10';
                            else if (isCorrectAnswer) optionClass += ' bg-success/20 border-success/50';
                            else if (isUserAnswer && !isCorrectAnswer) optionClass += ' bg-error/20 border-error/50';
                            else optionClass += ' opacity-70';

                            return (
                              <label key={`${stableKey}-opt-${optIdx}`} className={optionClass}>
                                <input
                                  type="radio"
                                  name={`mcq_${idx}`}
                                  value={opt}
                                  checked={userChoice === opt}
                                  onChange={() => handleAnswerChange(`mcq_${idx}`, 'mcq', opt)}
                                  disabled={submitted}
                                  className="mt-0.5 w-4 h-4"
                                />
                                <span className={`text-sm flex-1 ${submitted && isCorrectAnswer
                                  ? 'text-success font-semibold'
                                  : submitted && isUserAnswer && !isCorrectAnswer
                                    ? 'text-error font-semibold'
                                    : 'text-text'
                                  }`}>
                                  {opt}
                                </span>
                                {submitted && isCorrectAnswer && <span className="text-xs text-success font-semibold ml-auto">Correct</span>}
                                {submitted && isUserAnswer && !isCorrectAnswer && <span className="text-xs text-error font-semibold ml-auto">Your answer</span>}
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
                              <p className="text-sm text-text">{mcqResults[idx]?.explanation || 'No explanation available.'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-warning/5 border-l-4 border-warning">
                              <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Your answer
                              </p>
                              <p className="text-sm text-text">{userChoice || 'Not answered'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-success/5 border-l-4 border-success">
                              <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Correct answer
                              </p>
                              <p className="text-sm text-text">{q.correctAnswer}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-primary/10 text-primary font-semibold text-sm flex items-center gap-2">
                              <span>Score:</span>
                              <span>{mcqResults[idx]?.score || 0}/10</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Essay Section */}
              <div style={{ display: activeSection === 'text' ? 'block' : 'none' }}>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-text flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Essay Questions
                  </h2>
                  {questions.text.map((q, idx) => {
                    const essayResult = submitted && textResults[idx];
                    const isLowScore = essayResult?.score < 5;
                    const stableKey = q._uid;
                    return (
                      <div
                        key={stableKey}
                        className={`bg-muted/5 rounded-xl p-5 border transition-all duration-300 ${submitted
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
                          <p className="font-medium text-text flex-1">{q.question}</p>
                        </div>
                        <div className="ml-10">
                          <textarea
                            rows={4}
                            className="w-full p-3 rounded-xl border border-border bg-card text-text focus:ring-2 focus:ring-primary transition-all disabled:opacity-80"
                            placeholder="Type your answer here..."
                            value={answers[`text_${idx}`] || ''}
                            onChange={(e) => handleAnswerChange(`text_${idx}`, 'text', e.target.value)}
                            disabled={submitted}
                          />
                        </div>
                        {submitted && essayResult && (
                          <div className="ml-10 mt-3 space-y-3">
                            <div className="p-3 rounded-lg bg-warning/5 border-l-4 border-warning">
                              <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> Your answer
                              </p>
                              <p className="text-sm text-text whitespace-pre-wrap">{essayResult.userAnswer || 'Not answered'}</p>
                            </div>
                            {essayResult.idealAnswerKeywords?.length > 0 && (
                              <div className="p-3 rounded-lg bg-success/5 border-l-4 border-success">
                                <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Ideal keywords
                                </p>
                                <p className="text-sm text-text">{essayResult.idealAnswerKeywords.join(', ')}</p>
                              </div>
                            )}
                            {(essayResult.sampleAnswer || essayResult.aiSuggestedAnswer) && (
                              <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Sample answer
                                </p>
                                <p className="text-sm text-text whitespace-pre-wrap">{essayResult.sampleAnswer || essayResult.aiSuggestedAnswer}</p>
                              </div>
                            )}
                            <div className={`p-3 rounded-lg font-semibold text-sm flex items-center gap-2 ${essayResult.score >= 7 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                              }`}>
                              <span>Score:</span>
                              <span>{essayResult.score}/10</span>
                            </div>
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
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-primary hover:brightness-105 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Grading...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Submit Answers
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-muted mt-3">* Review your answers carefully before submitting</p>
                </div>
              )}

              {submitted && (
                <div className="mt-8 pt-4 border-t border-border text-center">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-lg font-bold text-text">Your total score: {totalScore}/100</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                      <button onClick={() => navigate('/welcome')} className="px-5 py-2 bg-primary text-white rounded-lg hover:brightness-105 transition shadow-md">
                        Back to Dashboard
                      </button>
                      <button onClick={() => navigate('/history')} className="px-5 py-2 bg-secondary text-white rounded-lg hover:brightness-105 transition shadow-md">
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
          <div className="mt-6 text-center text-xs text-muted">
            <TrendingUp className="inline w-3 h-3 mr-1" /> Powered by AI
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}