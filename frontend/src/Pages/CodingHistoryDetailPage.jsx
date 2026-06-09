import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Code,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Brain,
  Terminal,
  FileText,
  Layers,
  Copy,
  Check,
  Award,
  TrendingUp,
  BarChart,
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function CodingHistoryDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [expandedRound, setExpandedRound] = useState(null);

  useEffect(() => {
    fetchSessionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/live-coding/sessions/${sessionId}`);
      if (res.data.success && res.data.session) {
        setSession(res.data.session);
      } else {
        throw new Error("Session not found");
      }
    } catch (err) {
      console.error("Failed to load session detail:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load session details",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const getTotalScore = () => {
    let total = 0;
    session?.codeHistory?.forEach((round) => {
      if (round.evaluation?.score) total += round.evaluation.score;
      else if (round.explainAnswers) {
        const correctCount = round.explainAnswers.filter(
          (a) => a.isCorrect,
        ).length;
        total += correctCount * 10;
      }
    });
    return total;
  };

  const getCorrectCount = () => {
    let correct = 0;
    session?.codeHistory?.forEach((round) => {
      if (round.explainAnswers) {
        correct += round.explainAnswers.filter((a) => a.isCorrect).length;
      }
    });
    return correct;
  };

  const getTotalQuestions = () => {
    let total = 0;
    session?.codeHistory?.forEach((round) => {
      if (round.explainAnswers) total += round.explainAnswers.length;
    });
    return total;
  };

  const getScoreColor = (score, max = 100) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return "text-success";
    if (percent >= 60) return "text-warning";
    if (percent >= 40) return "text-warning/80";
    return "text-error";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted">Loading session details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <div className="bg-card rounded-2xl p-8 text-center max-w-md shadow-soft border border-border">
          <AlertCircle className="w-14 h-14 text-error mx-auto mb-4" />
          <p className="text-text mb-6">{error}</p>
          <button
            onClick={fetchSessionDetail}
            className="px-5 py-2.5 bg-primary text-white rounded-xl flex items-center gap-2 mx-auto hover:brightness-105 transition shadow-md"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const codeHistory = session.codeHistory || [];
  const totalScore = getTotalScore();
  const totalQuestions = getTotalQuestions();
  const correctCount = getCorrectCount();
  const maxPossibleScore = totalQuestions * 10;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/coding-history")}
            className="group flex items-center gap-2 text-muted hover:text-primary bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
        </div>

        {/* Session Info Card - cải thiện layout với nhãn rõ ràng */}
        <div className="bg-card rounded-2xl shadow-soft border border-border p-6 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                <Code className="w-4 h-4" />
                <span>Live Coding Interview</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-text mb-4">
                {session.topic}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-muted" />
                  <span className="text-muted">Language:</span>
                  <span className="font-semibold text-text">
                    {session.language}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted" />
                  <span className="text-muted">Domain:</span>
                  <span className="font-semibold text-text">
                    {session.domain}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted" />
                  <span className="text-muted">Date:</span>
                  <span className="font-medium text-text">
                    {formatDate(session.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
              Difficulty: {session.difficulty}
            </div>
          </div>
        </div>

        {/* 4 Stats Cards - màu rose */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
          <div className="group bg-card rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition">
              <TrendingUp className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div
              className={`text-3xl font-bold ${getScoreColor(totalScore, maxPossibleScore)} leading-none`}
            >
              {totalScore}
              <span className="text-sm text-muted">/{maxPossibleScore}</span>
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Total Score
            </div>
          </div>

          <div className="group bg-card rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition">
              <ListChecks className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">
              {totalQuestions}
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Total Questions
            </div>
          </div>

          <div className="group bg-card rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-success/30 transition">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="text-3xl font-bold text-success leading-none">
              {correctCount}
            </div>
            <div className="text-xs text-muted mt-2 font-medium">
              Correct Answers
            </div>
          </div>

          <div className="group bg-card rounded-2xl p-5 text-center shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:scale-105">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition">
              <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 leading-none">
              {accuracy}%
            </div>
            <div className="text-xs text-muted mt-2 font-medium">Accuracy</div>
          </div>
        </div>

        {/* Code History Rounds */}
        {codeHistory.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 text-center shadow-soft border border-border">
            <Code className="w-20 h-20 text-primary/40 mx-auto mb-4" />
            <p className="text-muted">
              No code submissions in this session yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-text border-l-4 border-primary pl-3">
              <Award className="w-5 h-5 text-primary" /> Rounds & Explanations
            </h2>

            {codeHistory.map((round, idx) => (
              <div
                key={idx}
                className="bg-card rounded-2xl border-l-8 border-l-rose-500 shadow-soft hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedRound(expandedRound === idx ? null : idx)
                  }
                  className="w-full p-5 text-left flex justify-between items-start hover:bg-muted/5 transition"
                >
                  <div className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Code className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shadow-sm">
                          Round {idx + 1}
                        </span>
                        <span className="text-xs text-muted">
                          {formatDate(round.submittedAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text text-base line-clamp-1">
                        {round.problemStatement.substring(0, 100)}...
                      </h3>
                    </div>
                  </div>
                  {expandedRound === idx ? (
                    <ChevronUp className="w-5 h-5 text-muted shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted shrink-0 ml-2" />
                  )}
                </button>

                {expandedRound === idx && (
                  <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-border pt-5">
                    {/* Problem Statement full */}
                    <div>
                      <p className="font-semibold text-text mb-2 text-sm flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Problem Statement
                      </p>
                      <pre className="whitespace-pre-wrap font-sans text-muted bg-muted/5 p-4 rounded-xl border border-border text-sm">
                        {round.problemStatement}
                      </pre>
                    </div>

                    {/* Submitted Code */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-text text-sm flex items-center gap-1">
                          <Terminal className="w-4 h-4" /> Your Code
                        </p>
                        <button
                          onClick={() => copyToClipboard(round.code, idx)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition text-muted"
                        >
                          {copiedCodeIndex === idx ? (
                            <Check className="w-4 h-4 inline mr-1" />
                          ) : (
                            <Copy className="w-4 h-4 inline mr-1" />
                          )}
                          {copiedCodeIndex === idx ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                        {round.code}
                      </pre>
                    </div>

                    {/* Explanation Q&A */}
                    {round.explainAnswers &&
                      round.explainAnswers.length > 0 && (
                        <div>
                          <p className="font-semibold text-text mb-3 text-sm flex items-center gap-1">
                            <Brain className="w-4 h-4" /> Explanation Q&A (
                            {round.explainAnswers.length} questions)
                          </p>
                          <div className="space-y-4">
                            {round.explainAnswers.map((qa, qIdx) => (
                              <div
                                key={qIdx}
                                className="border-l-4 border-primary pl-4 py-2"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {qa.isCorrect ? (
                                    <CheckCircle className="w-5 h-5 text-success" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-error" />
                                  )}
                                  <span className="font-medium text-text">
                                    Question {qIdx + 1}
                                  </span>
                                </div>
                                <p className="text-muted mb-2 text-sm">
                                  {qa.question}
                                </p>
                                <div className="bg-muted/5 p-3 rounded-lg mb-2 border border-border">
                                  <span className="text-xs font-semibold text-muted">
                                    Your answer:
                                  </span>
                                  <p className="text-text mt-1 text-sm">
                                    {qa.answer}
                                  </p>
                                </div>
                                {qa.feedback && (
                                  <div
                                    className={`text-sm p-2 rounded ${
                                      qa.isCorrect
                                        ? "bg-success/10 text-success"
                                        : "bg-error/10 text-error"
                                    }`}
                                  >
                                    {qa.feedback}
                                  </div>
                                )}
                                {qa.modelAnswer && (
                                  <div className="mt-2 text-sm bg-primary/10 p-2 rounded text-muted">
                                    <span className="font-semibold text-primary">
                                      AI answer:
                                    </span>{" "}
                                    {qa.modelAnswer}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Final Evaluation */}
                    {round.evaluation && (
                      <div className="mt-4 bg-primary/5 rounded-xl p-4 border border-primary/20">
                        <p className="font-semibold text-primary mb-2 text-sm flex items-center gap-1">
                          <BarChart className="w-4 h-4" /> AI Evaluation
                        </p>
                        <p className="text-sm text-muted mb-3">
                          {round.evaluation.summary}
                        </p>
                        {round.evaluation.feedback && (
                          <div className="mb-3 p-2 bg-card rounded-lg text-sm text-muted border border-border">
                            <span className="font-semibold">Feedback:</span>{" "}
                            {round.evaluation.feedback}
                          </div>
                        )}
                        {round.evaluation.strengths?.length > 0 && (
                          <div className="mb-3">
                            <p className="font-semibold text-success text-sm flex items-center gap-1">
                              <ThumbsUp className="w-4 h-4" /> Strengths
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted">
                              {round.evaluation.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {round.evaluation.weaknesses?.length > 0 && (
                          <div>
                            <p className="font-semibold text-error text-sm flex items-center gap-1">
                              <ThumbsDown className="w-4 h-4" /> Areas to
                              improve
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted">
                              {round.evaluation.weaknesses.map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slideDown { animation: slideDown 0.25s ease-out; }
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
