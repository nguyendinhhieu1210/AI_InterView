import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  Loader2,
  ArrowLeft,
  Brain,
  CheckCircle,
  Timer,
  Sparkles,
  User,
  Trophy,
  Home,
  RotateCw,
  AlertCircle,
  Mic,
  Award,
  CircleUser,
  Zap,
} from "lucide-react";
import api from "../services/api";
import InterviewReportModal from "../components/InterviewReportModal";
import { useAuth } from "../contexts/AuthContext";
import confetti from "canvas-confetti";

const TOTAL_QUESTIONS = 5; // Đã sửa từ 8 xuống 5

export default function AdaptiveInterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty } = location.state || {
    topic: "React",
    difficulty: "medium",
  };
  const { isAuthenticated, user, updateActivity } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState("preparation");
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [detailedReport, setDetailedReport] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isFinishedRef = useRef(false);

  const displayName = user?.fullName || user?.userName || user?.email || "User";
  const answeredCount = messages.filter((m) => m.role === "user").length;
  const progressPercent = (answeredCount / TOTAL_QUESTIONS) * 100;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (step === "chat" && !isFinished && !loading && !isAnalyzing) {
      inputRef.current?.focus();
    }
  }, [step, isFinished, loading, isAnalyzing]);

  useEffect(() => {
    if (step === "preparation" && ready && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === "preparation" && ready && countdown === 0) {
      startAdaptiveSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ready, countdown]);

  const startAdaptiveSession = async () => {
    setStep("chat");
    setLoading(true);
    setError(null);
    updateActivity();
    try {
      const res = await api.post("/adaptive/start", { topic, difficulty });
      setSessionId(res.data.sessionId);
      setMessages([
        {
          role: "assistant",
          content: res.data.firstQuestion,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to start interview. Please check your connection and try again.",
      );
      setMessages([
        {
          role: "system",
          content:
            "⚠️ Unable to start the interview. Please refresh the page or try again later.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (
      !input.trim() ||
      loading ||
      isAnalyzing ||
      isFinished ||
      isFinishedRef.current
    )
      return;

    const userAnswer = input.trim();
    setInput("");
    updateActivity();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userAnswer,
        timestamp: new Date().toISOString(),
      },
    ]);

    const currentAnswerCount =
      messages.filter((m) => m.role === "user").length + 1;
    const isLastAnswer = currentAnswerCount === TOTAL_QUESTIONS;

    if (isLastAnswer) {
      setIsAnalyzing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await api.post("/adaptive/answer", {
        sessionId,
        answer: userAnswer,
      });

      if (response.data.isFinished) {
        isFinishedRef.current = true;
        let finalScoreValue = response.data.finalScore;
        if (finalScoreValue === undefined || finalScoreValue === null) {
          const scores = response.data.conversation
            .filter(
              (msg) => msg.role === "user" && typeof msg.score === "number",
            )
            .map((msg) => msg.score);
          finalScoreValue = scores.length
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 5;
          finalScoreValue = Math.min(
            10,
            Math.max(0, parseFloat(finalScoreValue.toFixed(1))),
          );
        }
        setFinalScore(finalScoreValue);

        setDetailedReport({
          finalScore: finalScoreValue,
          summary: response.data.summary,
          conversation: response.data.conversation,
          topic: topic,
          difficulty: difficulty,
        });

        if (finalScoreValue >= 7) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        setTimeout(() => {
          setIsAnalyzing(false);
          setIsFinished(true);
          setStep("finished");
          setShowReportModal(true);
        }, 1000);
        return;
      }

      if (response.data.nextQuestion) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.data.nextQuestion,
            timestamp: new Date().toISOString(),
          },
        ]);
        if (!isLastAnswer) setLoading(false);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to process your answer. Please try again.";
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        errorMsg =
          "The AI is taking too long to respond. Please try again in a moment.";
      }
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `⚠️ ${errorMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setInput(userAnswer);
      if (isLastAnswer) {
        setIsAnalyzing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const resetInterview = () => {
    isFinishedRef.current = false;
    setStep("preparation");
    setReady(false);
    setCountdown(3);
    setSessionId(null);
    setMessages([]);
    setInput("");
    setLoading(false);
    setIsAnalyzing(false);
    setIsFinished(false);
    setFinalScore(null);
    setError(null);
    setShowReportModal(false);
    setDetailedReport(null);
  };

  const getDifficultyBadgeClass = () => {
    switch (difficulty) {
      case "easy":
        return "bg-success/20 text-success border border-success/30";
      case "medium":
        return "bg-warning/20 text-warning border border-warning/30";
      case "hard":
        return "bg-error/20 text-error border border-error/30";
      default:
        return "bg-muted/20 text-muted border border-muted/30";
    }
  };

  // Preparation step
  if (step === "preparation") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="relative max-w-lg w-full">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="relative bg-card rounded-3xl shadow-soft border border-border p-8 transition-all duration-500">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center shadow-md mb-6 ring-4 ring-primary/10">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-center text-text mb-2">
              Adaptive Interview
            </h2>
            <div className="flex justify-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium shadow-sm">
                {topic}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-medium text-sm shadow-sm ${getDifficultyBadgeClass()}`}
              >
                {difficulty.toUpperCase()}
              </span>
            </div>
            {!ready ? (
              <>
                <div className="bg-muted/5 rounded-2xl p-5 mb-8 border border-border">
                  <p className="font-semibold text-text flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-primary" /> How the
                    interview works:
                  </p>
                  <ul className="space-y-2 text-muted text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>
                        AI starts with an initial question tailored to your
                        selected topic and difficulty
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>
                        You answer naturally — AI analyzes your depth and
                        adjusts subsequent questions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>
                        The conversation adapts in real-time, diving deeper
                        where you excel
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span>
                        After {TOTAL_QUESTIONS} questions, you'll receive a
                        detailed score and analysis
                      </span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setReady(true)}
                  className="w-full py-3.5 bg-primary hover:brightness-105 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" />{" "}
                  I'm ready — Start Interview
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-success/30 animate-ping"></div>
                  <div className="relative w-32 h-32 rounded-full bg-success/20 flex items-center justify-center shadow-md">
                    <Timer className="w-14 h-14 text-success" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-6xl font-black text-text tabular-nums">
                    {countdown}
                  </div>
                  <p className="text-muted mt-2 font-medium">
                    {countdown === 1 ? "Take a deep breath..." : "Get ready..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showInputArea =
    step === "chat" && !isFinished && !isAnalyzing && !loading;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-card/80 border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate("/welcome")}
            className="group flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 font-medium"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          {step === "chat" && !isFinished && (
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>Progress</span>
                <span>
                  {answeredCount}/{TOTAL_QUESTIONS}
                </span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Topic badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 shadow-sm">
              <Brain className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary text-sm">
                {topic}
              </span>
            </div>
            {/* Difficulty badge */}
            <div
              className={`px-3 py-1.5 rounded-full font-semibold text-sm shadow-sm ${getDifficultyBadgeClass()}`}
            >
              {difficulty}
            </div>

            {/* User info */}
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-text bg-card/70 rounded-full pl-3 pr-3 py-1 border border-border shadow-sm">
                <CircleUser className="w-4 h-4 text-primary" />
                <span className="font-medium">{displayName}</span>
              </div>
              {!isFinished && (
                <button
                  onClick={resetInterview}
                  className="p-2 text-muted hover:text-text transition-colors hover:bg-muted/10 rounded-full"
                  title="Reset interview"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {step === "chat" && !isFinished && (
          <div className="md:hidden px-4 pb-2">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>Progress</span>
              <span>
                {answeredCount}/{TOTAL_QUESTIONS}
              </span>
            </div>
            <div className="w-full bg-muted/30 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* Chat messages */}
      <div
        className={`flex-1 max-w-4xl w-full mx-auto px-4 py-6 ${showInputArea ? "pb-36" : "pb-6"}`}
      >
        <div className="space-y-5">
          {messages.map((msg, idx) => {
            if (msg.role === "system") {
              return (
                <div key={idx} className="flex justify-center animate-fadeIn">
                  <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-2 text-error text-sm flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4" />
                    {msg.content}
                  </div>
                </div>
              );
            }
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
              >
                <div
                  className={`flex max-w-[85%] gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${isUser ? "bg-primary" : "bg-gradient-to-br from-primary to-secondary"}`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Zap className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`relative rounded-2xl px-5 py-3 shadow-soft transition-all hover:shadow-md ${isUser ? "bg-primary text-white rounded-tr-none" : "bg-card text-text rounded-tl-none border border-border"}`}
                  >
                    {!isUser && (
                      <div className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AI Interviewer
                        <span className="text-muted text-[10px] font-normal ml-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                      {msg.content.split("\n").map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && !isAnalyzing && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex gap-2 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card rounded-2xl rounded-tl-none px-5 py-3 shadow-soft border border-border">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <span className="text-sm text-muted ml-1">
                      AI is thinking
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center my-2 animate-fadeIn">
              <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-2 text-error text-sm flex items-center gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      {showInputArea && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border p-4 transition-all shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your answer here... Press Enter to send, Shift+Enter for new line"
                  rows={1}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-text placeholder:text-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none overflow-y-auto max-h-32 shadow-sm"
                  disabled={loading || isAnalyzing}
                />
              </div>
              <button
                onClick={sendAnswer}
                disabled={loading || isAnalyzing || !input.trim()}
                className="px-5 py-3 bg-primary hover:brightness-105 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-muted mt-2 flex items-center justify-center gap-1">
              <Mic className="w-3 h-3" /> AI adapts to your answers in real-time
            </p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-card rounded-2xl p-8 shadow-soft flex flex-col items-center gap-4 max-w-sm mx-4 border border-border">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
              <Loader2 className="w-12 h-12 text-primary animate-spin relative" />
            </div>
            <p className="text-lg font-semibold text-text">
              AI is analyzing your answers...
            </p>
            <p className="text-sm text-muted">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Finished state - Score Card */}
      {isFinished && finalScore !== null && (
        <div className="mt-8 mb-4 animate-fadeIn px-4">
          <div className="bg-card rounded-2xl p-6 shadow-soft border border-border">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 shadow-md">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-text mb-1">
                Interview Completed!
              </h3>
              <div className="text-5xl font-extrabold text-primary my-2">
                {finalScore}/10
              </div>
              <p className="text-sm text-muted mb-5">
                {finalScore >= 8
                  ? "Excellent work! 🌟 You're a star!"
                  : finalScore >= 6
                    ? "Good job! Keep improving 💪"
                    : "Nice try! Review the report to level up 📚"}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-5 py-2.5 bg-primary hover:brightness-105 text-white rounded-xl transition shadow-md flex items-center gap-2 font-medium"
                >
                  <Award className="w-4 h-4" /> View Full Report
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="px-5 py-2.5 bg-secondary hover:brightness-105 text-white rounded-xl transition shadow-md flex items-center gap-2 font-medium"
                >
                  <CheckCircle className="w-4 h-4" /> History
                </button>
                <button
                  onClick={resetInterview}
                  className="px-5 py-2.5 bg-card border border-border hover:bg-muted/10 text-text rounded-xl transition shadow-sm flex items-center gap-2 font-medium"
                >
                  <RotateCw className="w-4 h-4" /> New Interview
                </button>
                <button
                  onClick={() => navigate("/welcome")}
                  className="px-5 py-2.5 bg-card border border-border hover:bg-muted/10 text-text rounded-xl transition shadow-sm flex items-center gap-2 font-medium"
                >
                  <Home className="w-4 h-4" /> Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && detailedReport && (
        <InterviewReportModal
          reportData={detailedReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
