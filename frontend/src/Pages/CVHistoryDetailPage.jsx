import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FileText,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  ListChecks,
  BarChart,
  Brain,
} from "lucide-react";
import api from "../services/api";

export default function CVHistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cvSession, setCvSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const idleTimer = useRef(null);
  const countdownTimer = useRef(null);
  const isCountingDown = useRef(false);

  useEffect(() => {
    fetchCVDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCVDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/cv/history/${id}`);
      if (response.data?.success && response.data.history) {
        setCvSession(response.data.history);
      } else {
        throw new Error("CV session not found");
      }
    } catch (err) {
      console.error("CV detail fetch error:", err);
      if (err.response?.status === 404) {
        setError("CV interview not found. It may have been deleted.");
      } else if (err.response?.status === 401) {
        return;
      } else {
        setError(err.message || "Failed to load CV interview details");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this CV interview?"))
      return;
    try {
      await api.delete(`/cv/history/${id}`);
      navigate("/history");
    } catch (error) {
      alert("Delete failed");
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-warning/80";
    return "text-error";
  };

  const getScoreBg = (score) => {
    if (score >= 80) return "bg-success/20 text-success";
    if (score >= 60) return "bg-warning/20 text-warning";
    if (score >= 40) return "bg-warning/10 text-warning/80";
    return "bg-error/20 text-error";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      navigate("/login");
    }, 2000);
  };

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (countdownTimer.current) clearTimeout(countdownTimer.current);
    if (isCountingDown.current) isCountingDown.current = false;
    idleTimer.current = setTimeout(() => {
      isCountingDown.current = true;
      countdownTimer.current = setTimeout(() => handleLogout(), 30 * 60 * 1000);
    }, 60 * 1000);
  };

  useEffect(() => {
    const events = ["mousemove", "keypress", "click", "scroll", "touchstart"];
    const resetAndStart = () => resetIdleTimer();
    events.forEach((event) => window.addEventListener(event, resetAndStart));
    resetIdleTimer();
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetAndStart),
      );
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted font-medium animate-pulse leading-relaxed">
            Loading CV session...
          </p>
        </div>
      </div>
    );
  }

  if (error || !cvSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <div className="bg-card backdrop-blur rounded-2xl p-8 text-center shadow-soft border border-border max-w-md w-full">
          <AlertCircle className="w-14 h-14 text-error mx-auto mb-4" />
          <p className="text-text mb-6 leading-relaxed">
            {error || "CV session not found"}
          </p>
          <button
            onClick={() => navigate("/cv-history")}
            className="px-5 py-2.5 bg-primary text-white rounded-xl hover:brightness-105 transition shadow-md"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const {
    cvName,
    topic: skillTags = [],
    totalScore = 0,
    createdAt,
    results = [],
    summary = {},
    questions = { mcq: [], text: [] },
  } = cvSession;

  const totalQuestions = results.length;
  const maxPossibleScore = totalQuestions * 10;

  // Map options for MCQ
  const mcqOptionsMap = {};
  if (questions.mcq && Array.isArray(questions.mcq)) {
    questions.mcq.forEach((q, idx) => {
      mcqOptionsMap[`mcq_${idx}`] = q.options || [];
    });
  }

  const enrichedResults = results.map((result, idx) => {
    if (result.type === "mcq") {
      const mcqIndex = results.filter((r) => r.type === "mcq").indexOf(result);
      return {
        ...result,
        options: mcqOptionsMap[`mcq_${mcqIndex}`] || [],
      };
    }
    return result;
  });

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6 transition-colors duration-300">
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-8 shadow-soft text-center animate-fadeIn border border-border">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text">Logging out...</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/cv-history")}
            className="group flex items-center gap-2 text-muted hover:text-primary bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-error hover:text-error/80 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>

        {/* Thông tin chính */}
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-primary text-sm font-medium mb-2">
            <FileText className="w-4 h-4" />
            <span>CV-Based Interview</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
            {cvName || "CV Interview"}
          </h1>
          {skillTags && skillTags.length > 0 && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
              {skillTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-100/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-xs rounded-full font-medium shadow-sm leading-relaxed"
                >
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
          <p className="text-muted text-sm mt-4 flex items-center justify-center sm:justify-start gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
            Completed on {formatDate(createdAt)}
          </p>
        </div>

        {/* 4 thẻ thống kê - đồng bộ màu teal/cyan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          <div className="group bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/60 transition">
              <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(totalScore)} leading-none`}
            >
              {totalScore}
              <span className="text-sm text-muted">/{maxPossibleScore}</span>
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Total Score
            </div>
          </div>

          <div className="group bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/60 transition">
              <ListChecks className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 leading-none">
              {totalQuestions}
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Total Questions
            </div>
          </div>

          <div className="group bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-success/30 transition">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="text-3xl font-bold text-success leading-none">
              {results.filter((r) => r.isCorrect === true).length}
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Correct Answers
            </div>
          </div>

          <div className="group bg-card/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/30 transition">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary leading-none">
              {Math.round((totalScore / maxPossibleScore) * 100)}%
            </div>
            <div className="text-xs text-muted mt-2 font-medium">Accuracy</div>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-5 mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-text border-l-4 border-primary pl-3 leading-tight">
            <Award className="w-5 h-5 text-primary" /> Questions & Answers
          </h2>

          {enrichedResults.map((result, idx) => {
            const isCorrect = result.isCorrect === true;
            const userAnswer =
              result.type === "essay"
                ? result.yourAnswer || "No answer"
                : result.userAnswer || "No answer";
            const aiReview = result.review || result.feedback || "";
            const aiSuggestedAnswer =
              result.aiSuggestedAnswer || result.sampleAnswer || "";
            const explanation =
              result.explanation &&
              result.explanation !== "No explanation provided."
                ? result.explanation
                : "";
            const questionText = result.question || `Question ${idx + 1}`;
            const options = result.options || [];

            // MCQ
            if (result.type === "mcq") {
              return (
                <div
                  key={idx}
                  className="bg-card backdrop-blur-sm rounded-2xl border-l-8 border-l-teal-500 shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedQuestion(
                        expandedQuestion === `cv_${idx}` ? null : `cv_${idx}`,
                      )
                    }
                    className="w-full p-5 text-left flex justify-between items-start hover:bg-muted/5 transition"
                  >
                    <div className="flex gap-4">
                      {isCorrect ? (
                        <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-error/20 flex items-center justify-center shrink-0 mt-0.5">
                          <XCircle className="w-5 h-5 text-error" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm leading-relaxed">
                            MCQ
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getScoreBg(result.score || 0)} leading-relaxed`}
                          >
                            Score: {result.score || 0}/10
                          </span>
                        </div>
                        <h3 className="font-semibold text-text text-base leading-relaxed">
                          {questionText}
                        </h3>
                      </div>
                    </div>
                    {expandedQuestion === `cv_${idx}` ? (
                      <ChevronUp className="w-5 h-5 text-muted shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted shrink-0 ml-2" />
                    )}
                  </button>

                  {expandedQuestion === `cv_${idx}` && (
                    <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-border pt-5">
                      <div className="space-y-3">
                        {options.map((opt, optIdx) => {
                          const isCorrectOption = opt === result.correctAnswer;
                          const isUserOption = opt === userAnswer;
                          let bgClass = "bg-muted/5 border-border";
                          let textClass = "text-text";
                          let icon = null;
                          if (isCorrectOption) {
                            bgClass = "bg-success/10 border-success/30";
                            textClass = "text-success font-medium";
                            icon = (
                              <CheckCircle className="w-5 h-5 text-success" />
                            );
                          } else if (isUserOption) {
                            bgClass = "bg-error/10 border-error/30";
                            textClass = "text-error font-medium";
                            icon = <XCircle className="w-5 h-5 text-error" />;
                          }
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${bgClass} shadow-sm`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm font-bold w-6 text-muted leading-none">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span
                                  className={`text-sm ${textClass} leading-relaxed`}
                                >
                                  {opt}
                                </span>
                              </div>
                              {icon}
                            </div>
                          );
                        })}
                      </div>

                      {explanation && (
                        <div className="mt-4 bg-primary/10 rounded-xl p-4 border border-primary/20">
                          <p className="font-semibold text-primary mb-2 text-sm flex items-center gap-1 leading-relaxed">
                            <Brain className="w-4 h-4" /> AI Explanation
                          </p>
                          <p className="text-sm text-muted leading-relaxed">
                            {explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // Essay
            return (
              <div
                key={idx}
                className="bg-card backdrop-blur-sm rounded-2xl border-l-8 border-l-cyan-500 shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedQuestion(
                      expandedQuestion === `cv_${idx}` ? null : `cv_${idx}`,
                    )
                  }
                  className="w-full p-5 text-left flex justify-between items-start hover:bg-muted/5 transition"
                >
                  <div className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-cyan-100 dark:bg-cyan-950/40 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 shadow-sm leading-relaxed">
                          Essay
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getScoreBg(result.score || 0)} leading-relaxed`}
                        >
                          Score: {result.score || 0}/10
                        </span>
                      </div>
                      <h3 className="font-semibold text-text text-base leading-relaxed">
                        {questionText}
                      </h3>
                    </div>
                  </div>
                  {expandedQuestion === `cv_${idx}` ? (
                    <ChevronUp className="w-5 h-5 text-muted shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted shrink-0 ml-2" />
                  )}
                </button>

                {expandedQuestion === `cv_${idx}` && (
                  <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-border pt-5">
                    <div>
                      <p className="font-semibold text-text mb-2 flex items-center gap-1 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>{" "}
                        Your Answer
                      </p>
                      <div className="bg-muted/5 border border-border rounded-xl p-4 whitespace-pre-wrap text-text text-sm leading-relaxed">
                        {userAnswer}
                      </div>
                    </div>

                    {aiReview && (
                      <div>
                        <p className="font-semibold text-primary mb-2 flex items-center gap-1 text-sm leading-relaxed">
                          <Brain className="w-4 h-4" /> AI Review
                        </p>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-muted text-sm leading-relaxed">
                          {aiReview}
                        </div>
                      </div>
                    )}

                    {aiSuggestedAnswer && (
                      <div>
                        <p className="font-semibold text-success mb-2 flex items-center gap-1 text-sm leading-relaxed">
                          <Lightbulb className="w-4 h-4" /> AI Suggested Answer
                        </p>
                        <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-muted text-sm leading-relaxed whitespace-pre-wrap">
                          {aiSuggestedAnswer}
                        </div>
                      </div>
                    )}

                    {result.strengths?.length > 0 && (
                      <div>
                        <p className="font-semibold text-success mb-2 text-sm leading-relaxed">
                          ✅ Strengths
                        </p>
                        <ul className="space-y-2">
                          {result.strengths.map((s, i) => (
                            <li
                              key={i}
                              className="bg-success/5 border border-success/20 rounded-xl px-3 py-2 text-sm text-muted flex items-start gap-1 leading-relaxed"
                            >
                              <span className="text-success mr-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.mistakes?.length > 0 && (
                      <div>
                        <p className="font-semibold text-error mb-2 text-sm leading-relaxed">
                          ❌ Mistakes
                        </p>
                        <ul className="space-y-2">
                          {result.mistakes.map((m, i) => (
                            <li
                              key={i}
                              className="bg-error/5 border border-error/20 rounded-xl px-3 py-2 text-sm text-muted flex items-start gap-1 leading-relaxed"
                            >
                              <span className="text-error mr-1">•</span> {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.idealAnswerKeywords?.length > 0 && (
                      <div>
                        <p className="font-semibold text-muted mb-2 text-sm leading-relaxed">
                          🔑 Important Keywords
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.idealAnswerKeywords.map((k, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium shadow-sm leading-relaxed"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Feedback Summary */}
        {summary &&
          (summary.strengths?.length > 0 || summary.weaknesses?.length > 0) && (
            <div className="mt-12 bg-card backdrop-blur-sm rounded-2xl shadow-soft border border-border overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 px-6 py-4 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2 text-text leading-tight">
                  <Brain className="w-5 h-5 text-primary" /> AI Feedback Summary
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {summary.strengths && summary.strengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-success font-semibold mb-3 leading-relaxed">
                      <ThumbsUp className="w-5 h-5" /> Strengths
                    </div>
                    <ul className="space-y-2">
                      {summary.strengths.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted bg-success/5 p-3 rounded-xl leading-relaxed"
                        >
                          <span className="text-success mt-0.5">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.weaknesses && summary.weaknesses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-warning font-semibold mb-3 leading-relaxed">
                      <ThumbsDown className="w-5 h-5" /> Areas for Improvement
                    </div>
                    <ul className="space-y-2">
                      {summary.weaknesses.map((w, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted bg-warning/5 p-3 rounded-xl leading-relaxed"
                        >
                          <span className="text-warning mt-0.5">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {summary.suggestions && summary.suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-primary font-semibold mb-3 leading-relaxed">
                      <Lightbulb className="w-5 h-5" /> Suggestions
                    </div>
                    <ul className="space-y-2">
                      {summary.suggestions.map((sug, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted bg-primary/5 p-3 rounded-xl leading-relaxed"
                        >
                          <span className="text-primary mt-0.5">•</span> {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slideDown { animation: slideDown 0.25s ease-out; }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
            `}</style>
    </div>
  );
}
