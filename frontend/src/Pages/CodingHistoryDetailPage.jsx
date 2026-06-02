import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, Code, Loader2, RefreshCw, AlertCircle,
    CheckCircle, XCircle, Brain, Terminal, FileText, Layers, Copy, Check,
    Award, TrendingUp, BarChart, ListChecks, Lightbulb, ThumbsUp, ThumbsDown,ChevronUp, ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function CodingHistoryDetailPage() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { token } = useAuth();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
    const [expandedRound, setExpandedRound] = useState(null);

    useEffect(() => {
        fetchSessionDetail();
    }, [sessionId]);

    const fetchSessionDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/live-coding/sessions/${sessionId}`);
            console.log('API response:', res.data);
            
            // ✅ SỬA: backend trả về { success: true, session: {...} }
            if (res.data.success && res.data.session) {
                setSession(res.data.session);
            } else {
                throw new Error('Session not found');
            }
        } catch (err) {
            console.error('Failed to load session detail:', err);
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to load session details'
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const copyToClipboard = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedCodeIndex(index);
        setTimeout(() => setCopiedCodeIndex(null), 2000);
    };

    // Helper tính tổng điểm & số câu đúng
    const getTotalScore = () => {
        let total = 0;
        session?.codeHistory?.forEach(round => {
            if (round.evaluation?.score) total += round.evaluation.score;
            // Nếu không có score, dùng số câu đúng * 10
            if (!round.evaluation?.score && round.explainAnswers) {
                const correctCount = round.explainAnswers.filter(a => a.isCorrect).length;
                total += correctCount * 10;
            }
        });
        return total;
    };

    const getCorrectCount = () => {
        let correct = 0;
        session?.codeHistory?.forEach(round => {
            if (round.explainAnswers) {
                correct += round.explainAnswers.filter(a => a.isCorrect).length;
            }
        });
        return correct;
    };

    const getTotalQuestions = () => {
        let total = 0;
        session?.codeHistory?.forEach(round => {
            if (round.explainAnswers) total += round.explainAnswers.length;
        });
        return total;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-sky-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <Loader2 className="w-12 h-12 text-sky-600 dark:text-sky-400 animate-spin mb-4" />
                <p className="text-slate-600 dark:text-gray-300">Loading session details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-sky-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-md shadow-xl">
                    <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
                    <button onClick={fetchSessionDetail} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center gap-2 mx-auto">
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
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate('/coding-history')}
                        className="group flex items-center gap-2 text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 transition-all duration-300 hover:gap-3 font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        Back 
                    </button>
                </div>

                {/* Session Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 text-sm font-medium mb-2">
                                <Code className="w-4 h-4" />
                                <span>Live Coding Interview</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                                {session.topic} – {session.language}
                            </h1>
                            <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-gray-300">
                                <span className="flex items-center gap-1"><Terminal className="w-4 h-4" /> {session.language}</span>
                                <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> {session.domain}</span>
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(session.createdAt)}</span>
                            </div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700">
                            Difficulty: {session.difficulty}
                        </div>
                    </div>
                </div>

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-sky-200 dark:group-hover:bg-sky-800/70 transition">
                            <TrendingUp className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className={`text-3xl font-bold ${accuracy >= 80 ? 'text-emerald-600 dark:text-emerald-400' : accuracy >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'} leading-none`}>
                            {totalScore}<span className="text-sm text-gray-500 dark:text-gray-400">/{maxPossibleScore}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Total Score</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70 transition">
                            <ListChecks className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">{totalQuestions}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Total Questions</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition">
                            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{correctCount}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Correct Answers</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/70 transition">
                            <BarChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">{accuracy}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Accuracy</div>
                    </div>
                </div>

                {/* Code History Rounds */}
                {codeHistory.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-md border border-slate-200 dark:border-gray-700">
                        <Code className="w-20 h-20 text-sky-300 dark:text-sky-500 mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-gray-400">No code submissions in this session yet.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white border-l-4 border-sky-500 pl-3">
                            <Award className="w-5 h-5 text-sky-500" /> Rounds & Explanations
                        </h2>

                        {codeHistory.map((round, idx) => (
                            <div
                                key={idx}
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-l-8 border-l-sky-500 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedRound(expandedRound === idx ? null : idx)}
                                    className="w-full p-5 text-left flex justify-between items-start hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Code className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shadow-sm">
                                                    Round {idx + 1}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(round.submittedAt)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white text-base">
                                                {round.problemStatement.substring(0, 100)}...
                                            </h3>
                                        </div>
                                    </div>
                                    {expandedRound === idx ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                    )}
                                </button>

                                {expandedRound === idx && (
                                    <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-gray-100 dark:border-gray-700/50 pt-5">
                                        {/* Problem Statement full */}
                                        <div>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm flex items-center gap-1">
                                                <FileText className="w-4 h-4" /> Problem Statement
                                            </p>
                                            <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-900/50 p-4 rounded-xl border border-slate-200 dark:border-gray-700 text-sm">
                                                {round.problemStatement}
                                            </pre>
                                        </div>

                                        {/* Submitted Code */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm flex items-center gap-1">
                                                    <Terminal className="w-4 h-4" /> Your Code
                                                </p>
                                                <button
                                                    onClick={() => copyToClipboard(round.code, idx)}
                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 transition text-slate-800 dark:text-gray-200"
                                                >
                                                    {copiedCodeIndex === idx ? <Check className="w-4 h-4 inline mr-1" /> : <Copy className="w-4 h-4 inline mr-1" />}
                                                    {copiedCodeIndex === idx ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                            <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                                                {round.code}
                                            </pre>
                                        </div>

                                        {/* Explanation Q&A */}
                                        {round.explainAnswers && round.explainAnswers.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm flex items-center gap-1">
                                                    <Brain className="w-4 h-4" /> Explanation Q&A ({round.explainAnswers.length} questions)
                                                </p>
                                                <div className="space-y-4">
                                                    {round.explainAnswers.map((qa, qIdx) => (
                                                        <div key={qIdx} className="border-l-4 border-sky-500 pl-4 py-2">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                {qa.isCorrect ? (
                                                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                                ) : (
                                                                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                                                )}
                                                                <span className="font-medium text-slate-800 dark:text-gray-200">Question {qIdx + 1}</span>
                                                            </div>
                                                            <p className="text-slate-700 dark:text-gray-300 mb-2 text-sm">{qa.question}</p>
                                                            <div className="bg-slate-50 dark:bg-gray-900/50 p-3 rounded-lg mb-2">
                                                                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Your answer:</span>
                                                                <p className="text-slate-800 dark:text-gray-200 mt-1 text-sm">{qa.answer}</p>
                                                            </div>
                                                            {qa.feedback && (
                                                                <div className={`text-sm p-2 rounded ${
                                                                    qa.isCorrect 
                                                                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200' 
                                                                        : 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200'
                                                                }`}>
                                                                    {qa.feedback}
                                                                </div>
                                                            )}
                                                            {qa.modelAnswer && (
                                                                <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-slate-700 dark:text-gray-300">
                                                                    <span className="font-semibold text-blue-700 dark:text-blue-300">AI answer:</span> {qa.modelAnswer}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Final Evaluation */}
                                        {round.evaluation && (
                                            <div className="mt-4 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-200 dark:border-sky-800">
                                                <p className="font-semibold text-sky-700 dark:text-sky-300 mb-2 text-sm flex items-center gap-1">
                                                    <BarChart className="w-4 h-4" /> AI Evaluation
                                                </p>
                                                <p className="text-sm text-slate-700 dark:text-gray-300 mb-3">{round.evaluation.summary}</p>
                                                {round.evaluation.feedback && (
                                                    <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded-lg text-sm text-slate-700 dark:text-gray-200">
                                                        <span className="font-semibold">Feedback:</span> {round.evaluation.feedback}
                                                    </div>
                                                )}
                                                {round.evaluation.strengths?.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-1">
                                                            <ThumbsUp className="w-4 h-4" /> Strengths
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-gray-300">
                                                            {round.evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {round.evaluation.weaknesses?.length > 0 && (
                                                    <div>
                                                        <p className="font-semibold text-rose-700 dark:text-rose-400 text-sm flex items-center gap-1">
                                                            <ThumbsDown className="w-4 h-4" /> Areas to improve
                                                        </p>
                                                        <ul className="list-disc list-inside text-sm text-slate-700 dark:text-gray-300">
                                                            {round.evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
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
            `}</style>
        </div>
    );
}