import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Send, Loader2, ArrowLeft, Brain, CheckCircle, Timer,
  Sparkles, User, Bot, Trophy, Home, RotateCw, AlertCircle,
  Mic, Award, CircleUser
} from 'lucide-react';
import api from '../services/api';
import InterviewReportModal from '../components/InterviewReportModal';
import { useAuth } from '../contexts/AuthContext';
import confetti from 'canvas-confetti';

const TOTAL_QUESTIONS = 8;

export default function AdaptiveInterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, difficulty } = location.state || { topic: 'React', difficulty: 'medium' };
  const { isAuthenticated, user, updateActivity } = useAuth();

  // Kiểm tra xác thực
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState('preparation');
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [error, setError] = useState(null);

  const [showReportModal, setShowReportModal] = useState(false);
  const [detailedReport, setDetailedReport] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isFinishedRef = useRef(false);   // ✅ thêm ref để chặn gọi API sau khi finish

  // Lấy tên hiển thị
  const displayName = user?.fullName || user?.userName || user?.email || 'User';

  const answeredCount = messages.filter(m => m.role === 'user').length;
  const progressPercent = (answeredCount / TOTAL_QUESTIONS) * 100;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (step === 'chat' && !isFinished && !loading && !isAnalyzing) {
      inputRef.current?.focus();
    }
  }, [step, isFinished, loading, isAnalyzing]);

  useEffect(() => {
    if (step === 'preparation' && ready && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === 'preparation' && ready && countdown === 0) {
      startAdaptiveSession();
    }
  }, [step, ready, countdown]);

  const startAdaptiveSession = async () => {
    setStep('chat');
    setLoading(true);
    setError(null);
    updateActivity();
    try {
      const res = await api.post('/adaptive/start', { topic, difficulty });
      setSessionId(res.data.sessionId);
      setMessages([{
        role: 'assistant',
        content: res.data.firstQuestion,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error(err);
      setError('Failed to start interview. Please check your connection and try again.');
      setMessages([{
        role: 'system',
        content: '⚠️ Unable to start the interview. Please refresh the page or try again later.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendAnswer = async () => {
    // ✅ chặn nếu đã finished hoặc đang xử lý
    if (!input.trim() || loading || isAnalyzing || isFinished || isFinishedRef.current) return;

    const userAnswer = input.trim();
    setInput('');
    updateActivity();

    setMessages(prev => [...prev, {
      role: 'user',
      content: userAnswer,
      timestamp: new Date().toISOString()
    }]);

    const currentAnswerCount = messages.filter(m => m.role === 'user').length + 1;
    const isLastAnswer = currentAnswerCount === TOTAL_QUESTIONS;

    if (isLastAnswer) {
      setIsAnalyzing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await api.post('/adaptive/answer', { sessionId, answer: userAnswer });

      // ✅ Nếu server báo finished, chặn ngay mọi lần gọi sau đó
      if (response.data.isFinished) {
        isFinishedRef.current = true;   // chặn gọi tiếp trong cùng lần render
        let finalScoreValue = response.data.finalScore;
        if (finalScoreValue === undefined || finalScoreValue === null) {
          const scores = response.data.conversation
            .filter(msg => msg.role === 'user' && typeof msg.score === 'number')
            .map(msg => msg.score);
          finalScoreValue = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
          finalScoreValue = Math.min(10, Math.max(0, parseFloat(finalScoreValue.toFixed(1))));
        }
        setFinalScore(finalScoreValue);

        setDetailedReport({
          finalScore: finalScoreValue,
          summary: response.data.summary,
          conversation: response.data.conversation,
          topic: topic,
          difficulty: difficulty
        });

        if (finalScoreValue >= 7) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        setTimeout(() => {
          setIsAnalyzing(false);
          setIsFinished(true);
          setStep('finished');
          setShowReportModal(true);
        }, 1000);
        return;   // ✅ không xử lý nextQuestion
      }
      // Xử lý câu hỏi tiếp theo (chỉ khi chưa finished)
      if (response.data.nextQuestion) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.nextQuestion,
          timestamp: new Date().toISOString()
        }]);
        if (!isLastAnswer) setLoading(false);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = 'Failed to process your answer. Please try again.';
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = 'The AI is taking too long to respond. Please try again in a moment.';
      }
      setError(errorMsg);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ ${errorMsg}`,
        timestamp: new Date().toISOString()
      }]);
      setInput(userAnswer);
      if (isLastAnswer) {
        setIsAnalyzing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const resetInterview = () => {
    isFinishedRef.current = false;   // reset ref
    setStep('preparation');
    setReady(false);
    setCountdown(3);
    setSessionId(null);
    setMessages([]);
    setInput('');
    setLoading(false);
    setIsAnalyzing(false);
    setIsFinished(false);
    setFinalScore(null);
    setError(null);
    setShowReportModal(false);
    setDetailedReport(null);
  };

  // Preparation step
  if (step === 'preparation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="relative max-w-lg w-full">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-indigo-300 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-300 dark:bg-blue-900/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
          <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-3xl shadow-2xl p-8 border border-white/30 dark:border-gray-700/50 transition-all duration-500">
            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl mb-6 ring-4 ring-white/50 dark:ring-gray-700/50">
              <Brain className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">Adaptive Interview</h2>
            <div className="flex justify-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-sm font-medium shadow-sm">{topic}</span>
              <span className={`px-3 py-1 rounded-full font-medium text-sm shadow-sm ${difficulty === 'easy' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40' :
                difficulty === 'medium' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40' :
                  'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40'
                }`}>{difficulty.toUpperCase()}</span>
            </div>
            {!ready ? (
              <>
                <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl p-5 mb-8 backdrop-blur-sm">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-indigo-500" /> How the interview works:</p>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>AI starts with an initial question tailored to your selected topic and difficulty</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>You answer naturally — AI analyzes your depth and adjusts subsequent questions</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>The conversation adapts in real-time, diving deeper where you excel</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span>After 8 questions, you'll receive a detailed score and analysis</span></li>
                  </ul>
                </div>
                <button onClick={() => setReady(true)} className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group">
                  <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" /> I'm ready — Start Interview
                </button>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-ping opacity-75"></div>
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-xl">
                    <Timer className="w-14 h-14 text-white" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="text-6xl font-black text-gray-800 dark:text-white tabular-nums">{countdown}</div>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{countdown === 1 ? "Take a deep breath..." : "Get ready..."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const showInputArea = step === 'chat' && !isFinished && !isAnalyzing && !loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header - đã bỏ nút logout */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Nút Exit về welcome */}
          <button onClick={() => navigate('/welcome')} className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          {/* Progress bar - chỉ hiển thị khi đang trong phỏng vấn */}
          {step === 'chat' && !isFinished && (
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{answeredCount}/{TOTAL_QUESTIONS}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          )}

          {/* Badges + thông tin user + nút reset */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 shadow-sm">
              <Brain className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-gray-800 dark:text-white text-sm">{topic}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-full font-medium text-sm shadow-sm ${difficulty === 'easy' ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40' :
              difficulty === 'medium' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40' :
                'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40'
              }`}>{difficulty}</div>

            {/* User info (không có logout) */}
            <div className="flex items-center gap-2 ml-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-full pl-3 pr-3 py-1">
                <CircleUser className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="font-medium">{displayName}</span>
              </div>
              {/* Chỉ hiển thị nút reset khi chưa kết thúc */}
              {!isFinished && (
                <button onClick={resetInterview} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title="Reset interview">
                  <RotateCw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar trên mobile */}
        {step === 'chat' && !isFinished && (
          <div className="md:hidden px-4 pb-2">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span>{answeredCount}/{TOTAL_QUESTIONS}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        )}
      </header>

      {/* Phần chat và các thành phần khác giữ nguyên */}
      <div className={`flex-1 max-w-4xl w-full mx-auto px-4 py-6 ${showInputArea ? 'pb-36' : 'pb-6'}`}>
        <div className="space-y-5">
          {messages.map((msg, idx) => {
            if (msg.role === 'system') {
              return (
                <div key={idx} className="flex justify-center animate-fadeIn">
                  <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl px-4 py-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4" />{msg.content}
                  </div>
                </div>
              );
            }
            const isUser = msg.role === 'user';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`flex max-w-[85%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${isUser ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700'}`}>
                    {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`relative rounded-2xl px-5 py-3 shadow-lg transition-all hover:shadow-xl ${isUser ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none' : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200/80 dark:border-gray-700/80'}`}>
                    {!isUser && <div className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Interviewer<span className="text-gray-400 dark:text-gray-500 text-[10px] font-normal ml-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>}
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && !isAnalyzing && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex gap-2 max-w-[85%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-md"><Bot className="w-4 h-4 text-white" /></div>
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl rounded-tl-none px-5 py-3 shadow-md border border-gray-200/80 dark:border-gray-700/80">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div><span className="text-sm text-gray-500 dark:text-gray-400 ml-1">AI is thinking</span></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center my-2 animate-fadeIn">
              <div className="bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl px-4 py-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showInputArea && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-4 transition-all shadow-lg">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none overflow-y-auto max-h-32 shadow-sm"
                  disabled={loading || isAnalyzing}
                />
              </div>
              <button
                onClick={sendAnswer}
                disabled={loading || isAnalyzing || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <><Send className="w-4 h-4" /><span className="hidden sm:inline">Send</span></>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center justify-center gap-1">
              <Mic className="w-3 h-3" /> AI adapts to your answers in real-time
            </p>
          </div>
        </div>
      )}

      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4 border border-white/20">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping"></div>
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative" />
            </div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">AI is analyzing your answers...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* Finished state - Score Card */}
      {isFinished && finalScore !== null && (
        <div className="mt-8 mb-4 animate-fadeIn px-4">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-2xl p-6 shadow-xl border border-indigo-100 dark:border-indigo-800 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600 flex items-center justify-center mb-4 shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Interview Completed!</h3>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent my-2">{finalScore}/10</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                {finalScore >= 8 ? "Excellent work! 🌟 You're a star!" : finalScore >= 6 ? "Good job! Keep improving 💪" : "Nice try! Review the report to level up 📚"}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => setShowReportModal(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md flex items-center gap-2 font-medium">
                  <Award className="w-4 h-4" /> View Full Report
                </button>
                <button onClick={() => navigate('/history')} className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl transition shadow-md flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4" /> History
                </button>
                <button onClick={resetInterview} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition shadow-sm flex items-center gap-2 font-medium">
                  <RotateCw className="w-4 h-4" /> New Interview
                </button>
                <button onClick={() => navigate('/welcome')} className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition shadow-sm flex items-center gap-2 font-medium">
                  <Home className="w-4 h-4" /> Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && detailedReport && (
        <InterviewReportModal reportData={detailedReport} onClose={() => setShowReportModal(false)} />
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