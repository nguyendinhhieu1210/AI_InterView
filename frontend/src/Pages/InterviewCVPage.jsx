import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Award, User, Loader2, ClipboardList,
  FileText, HelpCircle, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { useInterview } from '../contexts/InterviewContext';
import { useAuth } from '../contexts/AuthContext';

export default function InterviewCVPage() {
  const navigate = useNavigate();
  const { interviewData, clearInterview, isGenerating } = useInterview();
  const { isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState({ mcq: [], text: [] });
  const [cvInfo, setCvInfo] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('mcq');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isGenerating) return;
    if (!interviewData) navigate('/welcome');
  }, [interviewData, isGenerating, navigate]);

  useEffect(() => {
    if (isGenerating) {
      setLoading(true);
      return;
    }
    if (interviewData) {
      setQuestions(interviewData.questions || { mcq: [], text: [] });
      setCvInfo(interviewData.cvInfo);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [interviewData, isGenerating]);

  const handleAnswerChange = (key, value) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitting(true);
    try {
      const allSkills = [
        ...(cvInfo?.selectedSkills?.frontend || []),
        ...(cvInfo?.selectedSkills?.backend || []),
        ...(cvInfo?.selectedSkills?.theory || []),
        ...(cvInfo?.selectedSkills?.devops || [])
      ];
      const payload = {
        questions,
        answers,
        selectedSkills: allSkills,
        cvName: cvInfo?.fullName || ''
      };
      const res = await api.post('/cv/submit-answers', payload);
      if (res.data.success) {
        setResults(res.data.results);
        setSubmitted(true);
      } else {
        alert('Grading failed: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    clearInterview();
    navigate('/welcome');
  };

  const mcqList = questions.mcq || [];
  const textList = questions.text || [];
  const totalQuestions = mcqList.length + textList.length;
  const answeredMcq = Object.keys(answers).filter(k => k.startsWith('mcq_')).length;
  const answeredText = Object.keys(answers).filter(k => k.startsWith('text_')).length;
  const answeredTotal = answeredMcq + answeredText;
  const progressPercent = totalQuestions === 0 ? 0 : (answeredTotal / totalQuestions) * 100;

  const mcqResults = results?.mcq || [];
  const textResults = results?.text || [];
  const totalScore = results?.totalScore || 0;
  const userName = user?.fullName || user?.userName || 'Candidate';

  const computeStrengthsWeaknesses = () => {
    if (!results) return { strengths: [], weaknesses: [], suggestions: [] };
    const strengths = [];
    const weaknesses = [];
    const suggestions = [];

    const correctMcq = mcqResults.filter(r => r.isCorrect).length;
    if (correctMcq === mcqResults.length && mcqResults.length > 0) {
      strengths.push('Perfect score on multiple choice questions – good theoretical knowledge.');
    } else if (correctMcq >= mcqResults.length * 0.7) {
      strengths.push('Strong performance on multiple choice questions.');
    } else if (correctMcq <= mcqResults.length * 0.4) {
      weaknesses.push('Low accuracy on multiple choice questions. Review core concepts.');
      suggestions.push('Re‑study fundamental topics and practice with similar quizzes.');
    }

    let totalEssayScore = 0;
    textResults.forEach(r => { totalEssayScore += r.score || 0; });
    const avgEssay = textResults.length ? totalEssayScore / textResults.length : 0;
    if (avgEssay >= 8) {
      strengths.push('Excellent essay answers – clear reasoning and technical depth.');
    } else if (avgEssay >= 6) {
      strengths.push('Good essay answers, but can be improved with more examples.');
    } else if (avgEssay < 5 && textResults.length > 0) {
      weaknesses.push('Essay answers lack detail or miss key points.');
      suggestions.push('Focus on structuring answers: define terms, give examples, and explain trade‑offs.');
    }

    textResults.forEach((r) => {
      if (r.strengths?.length) strengths.push(...r.strengths.slice(0, 1));
      if (r.mistakes?.length) weaknesses.push(...r.mistakes.slice(0, 2));
      if (r.improvements?.length) suggestions.push(...r.improvements.slice(0, 2));
    });

    return {
      strengths: [...new Set(strengths)].slice(0, 5),
      weaknesses: [...new Set(weaknesses)].slice(0, 5),
      suggestions: [...new Set(suggestions)].slice(0, 5)
    };
  };

  const { strengths, weaknesses, suggestions } = computeStrengthsWeaknesses();

  if (loading || isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <p className="mt-6 text-muted font-medium">
            {isGenerating ? 'Preparing your personalized interview...' : 'Loading interview...'}
          </p>
        </div>
      </div>
    );
  }

  if (mcqList.length === 0 && textList.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center p-8 bg-card rounded-2xl shadow-soft border border-border">
          <p className="text-error font-semibold">No questions were generated.</p>
          <button onClick={handleBack} className="mt-4 px-5 py-2 bg-primary text-white rounded-lg hover:brightness-105 transition shadow-md">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={handleBack}
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

        {/* CV Info Card */}
        {cvInfo && (
          <div className="bg-card rounded-2xl shadow-soft p-5 mb-6 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <User size={22} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text">
                {cvInfo.fullName || 'Candidate'}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.values(cvInfo.selectedSkills || {}).flat().map((skill, i) => (
                <span key={i} className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Interview Card */}
        <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
          {/* Header card với gradient nhẹ */}
          <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-6 border-b border-border">
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-7 h-7 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold text-text">Interview Questions</h1>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                  {mcqList.length} MCQ
                </span>
                <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
                  {textList.length} Essay
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!submitted && totalQuestions > 0 && (
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

          {/* Tabs */}
          <div className="flex border-b border-border px-6">
            <button
              onClick={() => setActiveSection('mcq')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'mcq' ? 'text-primary' : 'text-muted hover:text-text'}`}
            >
              <HelpCircle className="w-4 h-4" /> MCQ
              {submitted && mcqResults.length > 0 && ` (${mcqResults.filter(r => r.isCorrect).length}/${mcqList.length})`}
              {activeSection === 'mcq' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
            <button
              onClick={() => setActiveSection('text')}
              className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-all relative ${activeSection === 'text' ? 'text-primary' : 'text-muted hover:text-text'}`}
            >
              <FileText className="w-4 h-4" /> Essay Questions
              {activeSection === 'text' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>}
            </button>
          </div>

          {/* Questions Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-6">
            {/* MCQ Section */}
            <div style={{ display: activeSection === 'mcq' ? 'block' : 'none' }}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" /> Multiple Choice Questions
                </h2>
                {mcqList.map((q, idx) => {
                  const isGraded = submitted && mcqResults[idx];
                  const isCorrect = isGraded && mcqResults[idx].isCorrect;
                  const userChoice = answers[`mcq_${idx}`];
                  const resultScore = isGraded ? mcqResults[idx].score : null;
                  return (
                    <div
                      key={`mcq-${idx}`}
                      className={`group rounded-xl p-5 border transition-all duration-300 ${
                        submitted
                          ? isCorrect
                            ? 'border-success/50 bg-success/5'
                            : 'border-error/50 bg-error/5'
                          : 'bg-muted/5 border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <p className="font-medium text-text flex-1">{q.question}</p>
                        {submitted && (
                          <div className="flex-shrink-0">
                            {isCorrect ? <CheckCircle className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-error" />}
                          </div>
                        )}
                      </div>
                      <div className="ml-10 space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={`${idx}-opt-${optIdx}`}
                            className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${
                              submitted
                                ? 'cursor-default'
                                : 'hover:bg-primary/10'
                            } ${
                              submitted && opt === q.correctAnswer
                                ? 'bg-success/20 border-success/50'
                                : ''
                            } ${
                              submitted && userChoice === opt && !isCorrect
                                ? 'bg-error/20 border-error/50'
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name={`mcq_${idx}`}
                              value={opt}
                              checked={userChoice === opt}
                              onChange={() => handleAnswerChange(`mcq_${idx}`, opt)}
                              disabled={submitted}
                              className="mt-0.5 w-4 h-4 text-primary focus:ring-primary disabled:opacity-70"
                            />
                            <span
                              className={`text-sm ${
                                submitted && opt === q.correctAnswer
                                  ? 'text-success font-medium'
                                  : submitted && userChoice === opt && !isCorrect
                                    ? 'text-error font-medium'
                                    : 'text-text'
                              }`}
                            >
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                      {submitted && isGraded && (
                        <div className="ml-10 mt-3 space-y-3">
                          <div className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                            <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" /> Explanation
                            </p>
                            <p className="text-sm text-text">{mcqResults[idx].explanation || 'No explanation available.'}</p>
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
                            <span>{resultScore}/10</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {mcqList.length === 0 && (
                  <p className="text-muted text-center py-8">No multiple choice questions available.</p>
                )}
              </div>
            </div>

            {/* Essay Section */}
            <div style={{ display: activeSection === 'text' ? 'block' : 'none' }}>
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Essay Questions
                </h2>
                {textList.map((q, idx) => {
                  const essayResult = submitted && textResults[idx];
                  const resultScore = essayResult?.score;
                  const isLowScore = resultScore < 5;
                  return (
                    <div
                      key={`text-${idx}`}
                      className={`rounded-xl p-5 border transition-all duration-300 ${
                        submitted
                          ? isLowScore
                            ? 'border-error/50 bg-error/5'
                            : 'border-success/50 bg-success/5'
                          : 'bg-muted/5 border-border hover:border-primary/30'
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
                          onChange={(e) => handleAnswerChange(`text_${idx}`, e.target.value)}
                          disabled={submitted}
                        />
                      </div>
                      {submitted && essayResult && (
                        <div className="ml-10 mt-3 space-y-3">
                          <div className="p-3 rounded-lg bg-warning/5 border-l-4 border-warning">
                            <p className="text-xs font-semibold text-warning mb-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> Your answer
                            </p>
                            <p className="text-sm text-text whitespace-pre-wrap">{essayResult.yourAnswer || 'Not answered'}</p>
                          </div>
                          {essayResult.importantKeywords && essayResult.importantKeywords.length > 0 && (
                            <div className="p-3 rounded-lg bg-success/5 border-l-4 border-success">
                              <p className="text-xs font-semibold text-success mb-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Matched keywords
                              </p>
                              <p className="text-sm text-text">{essayResult.importantKeywords.join(', ')}</p>
                            </div>
                          )}
                          {essayResult.aiSuggestedAnswer && (
                            <div className="p-3 rounded-lg bg-primary/10 border-l-4 border-primary">
                              <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Suggested answer
                              </p>
                              <p className="text-sm text-text whitespace-pre-wrap">{essayResult.aiSuggestedAnswer}</p>
                            </div>
                          )}
                          {essayResult.strengths && essayResult.strengths.length > 0 && (
                            <div className="p-3 rounded-lg bg-success/20 border-l-4 border-success">
                              <p className="text-xs font-semibold text-success">✅ Strengths</p>
                              <p className="text-sm text-text">{essayResult.strengths.join('; ')}</p>
                            </div>
                          )}
                          {essayResult.mistakes && essayResult.mistakes.length > 0 && (
                            <div className="p-3 rounded-lg bg-error/20 border-l-4 border-error">
                              <p className="text-xs font-semibold text-error">❌ Weaknesses</p>
                              <p className="text-sm text-text">{essayResult.mistakes.join('; ')}</p>
                            </div>
                          )}
                          {essayResult.improvements && essayResult.improvements.length > 0 && (
                            <div className="p-3 rounded-lg bg-primary/20 border-l-4 border-primary">
                              <p className="text-xs font-semibold text-primary">📚 Improvements</p>
                              <p className="text-sm text-text">{essayResult.improvements.join('; ')}</p>
                            </div>
                          )}
                          <div className={`p-3 rounded-lg font-semibold text-sm flex items-center gap-2 ${
                            resultScore >= 7 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}>
                            <span>Score:</span>
                            <span>{resultScore}/10</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {textList.length === 0 && (
                  <p className="text-muted text-center py-8">No essay questions available.</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            {!submitted && totalQuestions > 0 && (
              <div className="mt-8 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-primary hover:brightness-105 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Submit Answers
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted mt-3">
                  * Review your answers carefully before submitting
                </p>
              </div>
            )}

            {/* Results after submission */}
            {submitted && (
              <div className="mt-8 pt-4 border-t border-border text-center">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-lg font-bold text-text">Your total score: {totalScore}/100</p>
                  <p className="text-sm text-muted mt-1">{results?.level}</p>

                  <div className="mt-4 text-left space-y-3">
                    {strengths.length > 0 && (
                      <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                        <p className="font-semibold text-success">✅ Strengths</p>
                        <ul className="list-disc list-inside text-sm text-muted">
                          {strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {weaknesses.length > 0 && (
                      <div className="p-3 bg-warning/10 rounded-lg border border-warning/30">
                        <p className="font-semibold text-warning">⚠️ Areas for Improvement</p>
                        <ul className="list-disc list-inside text-sm text-muted">
                          {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                    
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button onClick={handleBack} className="px-5 py-2 bg-primary text-white rounded-lg hover:brightness-105 transition shadow-md">
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
  );
}