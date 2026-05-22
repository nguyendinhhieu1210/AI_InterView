import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Award, TrendingUp, CheckCircle, XCircle,
    ChevronDown, ChevronUp, Loader2, AlertCircle, Trash2, FileText, Tag,
    ThumbsUp, ThumbsDown, Lightbulb, ListChecks, BarChart, Brain
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function CVHistoryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { darkMode } = useTheme();
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
    }, [id]);

    const fetchCVDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/cv/history/${id}`);
            if (response.data?.success && response.data.history) {
                setCvSession(response.data.history);
            } else {
                throw new Error('CV session not found');
            }
        } catch (err) {
            console.error('CV detail fetch error:', err);
            if (err.response?.status === 404) {
                setError('CV interview not found. It may have been deleted.');
            } else if (err.response?.status === 401) {
                return;
            } else {
                setError(err.message || 'Failed to load CV interview details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this CV interview?')) return;
        try {
            await api.delete(`/cv/history/${id}`);
            navigate('/history');
        } catch (error) {
            alert('Delete failed');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
        if (score >= 60) return 'text-amber-600 dark:text-amber-400';
        if (score >= 40) return 'text-orange-600 dark:text-orange-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
        if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
        if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
        return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid date';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const handleLogout = () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('loginTime');
            navigate('/login');
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
        const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
        const resetAndStart = () => resetIdleTimer();
        events.forEach(event => window.addEventListener(event, resetAndStart));
        resetIdleTimer();
        return () => {
            events.forEach(event => window.removeEventListener(event, resetAndStart));
            if (idleTimer.current) clearTimeout(idleTimer.current);
            if (countdownTimer.current) clearTimeout(countdownTimer.current);
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse leading-relaxed">Loading CV session...</p>
                </div>
            </div>
        );
    }

    if (error || !cvSession) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-xl max-w-md w-full">
                    <AlertCircle className="w-14 h-14 text-rose-500 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{error || 'CV session not found'}</p>
                    <button onClick={() => navigate('/history')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md">
                        Back to History
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
        questions = { mcq: [], text: [] }
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
        if (result.type === 'mcq') {
            const mcqIndex = results.filter(r => r.type === 'mcq').indexOf(result);
            return {
                ...result,
                options: mcqOptionsMap[`mcq_${mcqIndex}`] || []
            };
        }
        return result;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 transition-colors duration-300">
            {isLoggingOut && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center animate-fadeIn">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-700 dark:text-gray-300">Logging out...</p>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/history')}
                        className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:shadow"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Back to History</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                    </button>
                </div>

                {/* Thông tin chính */}
                <div className="mb-10">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-2">
                        <FileText className="w-4 h-4" />
                        <span>CV-Based Interview</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold leading-[1.25] pb-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                        {cvName || 'CV Interview'}
                    </h1>
                    {skillTags && skillTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {skillTags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 text-xs rounded-full font-medium shadow-sm leading-relaxed">
                                    <Tag className="w-3 h-3" /> {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 flex items-center gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        Completed on {formatDate(createdAt)}
                    </p>
                </div>

                {/* 4 thẻ thống kê - giữ nguyên màu gốc */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/70 transition">
                            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className={`text-3xl font-bold ${getScoreColor(totalScore)} leading-none`}>
                            {totalScore}<span className="text-sm text-gray-500 dark:text-gray-400">/{maxPossibleScore}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Total Score</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/70 transition">
                            <ListChecks className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{totalQuestions}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Total Questions</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70 transition">
                            <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-none">{results.filter(r => r.isCorrect === true).length}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Correct Answers</div>
                    </div>

                    <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/70 transition">
                            <BarChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 leading-none">{Math.round((totalScore / maxPossibleScore) * 100)}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">Accuracy</div>
                    </div>
                </div>

                {/* Danh sách câu hỏi */}
                <div className="space-y-5 mb-12">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white border-l-4 border-indigo-500 pl-3 leading-tight">
                        <Award className="w-5 h-5 text-indigo-500" /> Questions & Answers
                    </h2>

                    {enrichedResults.map((result, idx) => {
                        const isCorrect = result.isCorrect === true;
                        const userAnswer = result.type === 'essay'
                            ? (result.yourAnswer || 'No answer')
                            : (result.userAnswer || 'No answer');
                        const aiReview = result.review || result.feedback || '';
                        const aiSuggestedAnswer = result.aiSuggestedAnswer || result.sampleAnswer || '';
                        const explanation = result.explanation && result.explanation !== 'No explanation provided.' ? result.explanation : '';
                        const questionText = result.question || `Question ${idx + 1}`;
                        const options = result.options || [];

                        // MCQ
                        if (result.type === 'mcq') {
                            return (
                                <div
                                    key={idx}
                                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/70 dark:border-gray-700/70 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    <button
                                        onClick={() => setExpandedQuestion(expandedQuestion === `cv_${idx}` ? null : `cv_${idx}`)}
                                        className="w-full p-5 text-left flex justify-between items-start hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition"
                                    >
                                        <div className="flex gap-4">
                                            {isCorrect ? (
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shadow-sm leading-relaxed">
                                                        MCQ
                                                    </span>
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getScoreBg(result.score || 0)} text-gray-800 dark:text-gray-200 leading-relaxed`}>
                                                        Score: {result.score || 0}/10
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-gray-800 dark:text-white text-base leading-relaxed">
                                                    {questionText}
                                                </h3>
                                            </div>
                                        </div>
                                        {expandedQuestion === `cv_${idx}` ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                        )}
                                    </button>

                                    {expandedQuestion === `cv_${idx}` && (
                                        <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-gray-100 dark:border-gray-700/50 pt-5">
                                            {/* Các lựa chọn MCQ */}
                                            <div className="space-y-3">
                                                {options.map((opt, optIdx) => {
                                                    const isCorrectOption = opt === result.correctAnswer;
                                                    const isUserOption = opt === userAnswer;
                                                    let bgClass = 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700';
                                                    let textClass = 'text-gray-700 dark:text-gray-300';
                                                    let icon = null;
                                                    if (isCorrectOption) {
                                                        bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700';
                                                        textClass = 'text-emerald-800 dark:text-emerald-200 font-medium';
                                                        icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
                                                    } else if (isUserOption) {
                                                        bgClass = 'bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700';
                                                        textClass = 'text-rose-800 dark:text-rose-200 font-medium';
                                                        icon = <XCircle className="w-5 h-5 text-rose-500" />;
                                                    }
                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${bgClass} shadow-sm`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono text-sm font-bold w-6 text-gray-500 dark:text-gray-400 leading-none">
                                                                    {String.fromCharCode(65 + optIdx)}.
                                                                </span>
                                                                <span className={`text-sm ${textClass} leading-relaxed`}>{opt}</span>
                                                            </div>
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {explanation && (
                                                <div className="mt-4 bg-indigo-50/70 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                                                    <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2 text-sm flex items-center gap-1 leading-relaxed">
                                                        <Brain className="w-4 h-4" /> AI Explanation
                                                    </p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
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
                                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/70 dark:border-gray-700/70 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <button
                                    onClick={() => setExpandedQuestion(expandedQuestion === `cv_${idx}` ? null : `cv_${idx}`)}
                                    className="w-full p-5 text-left flex justify-between items-start hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 mt-0.5">
                                            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-sm leading-relaxed">
                                                    Essay
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getScoreBg(result.score || 0)} text-gray-800 dark:text-gray-200 leading-relaxed`}>
                                                    Score: {result.score || 0}/10
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-800 dark:text-white text-base leading-relaxed">
                                                {questionText}
                                            </h3>
                                        </div>
                                    </div>
                                    {expandedQuestion === `cv_${idx}` ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2" />
                                    )}
                                </button>

                                {expandedQuestion === `cv_${idx}` && (
                                    <div className="px-5 pb-6 space-y-5 animate-slideDown border-t border-gray-100 dark:border-gray-700/50 pt-5">
                                        {/* User Answer */}
                                        <div>
                                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1 text-sm leading-relaxed">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Your Answer
                                            </p>
                                            <div className="bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                                                {userAnswer}
                                            </div>
                                        </div>

                                        {/* AI Review */}
                                        {aiReview && (
                                            <div>
                                                <p className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1 text-sm leading-relaxed">
                                                    <Brain className="w-4 h-4" /> AI Review
                                                </p>
                                                <div className="bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                                    {aiReview}
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Suggested Answer */}
                                        {aiSuggestedAnswer && (
                                            <div>
                                                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1 text-sm leading-relaxed">
                                                    <Lightbulb className="w-4 h-4" /> AI Suggested Answer
                                                </p>
                                                <div className="bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {aiSuggestedAnswer}
                                                </div>
                                            </div>
                                        )}

                                        {/* Strengths */}
                                        {result.strengths?.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2 text-sm leading-relaxed">✅ Strengths</p>
                                                <ul className="space-y-2">
                                                    {result.strengths.map((s, i) => (
                                                        <li key={i} className="bg-emerald-50/70 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1 leading-relaxed">
                                                            <span className="text-emerald-500 mr-1">•</span> {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Mistakes */}
                                        {result.mistakes?.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-rose-700 dark:text-rose-300 mb-2 text-sm leading-relaxed">❌ Mistakes</p>
                                                <ul className="space-y-2">
                                                    {result.mistakes.map((m, i) => (
                                                        <li key={i} className="bg-rose-50/70 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1 leading-relaxed">
                                                            <span className="text-rose-500 mr-1">•</span> {m}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Ideal Keywords */}
                                        {result.idealAnswerKeywords?.length > 0 && (
                                            <div>
                                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm leading-relaxed">🔑 Important Keywords</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {result.idealAnswerKeywords.map((k, i) => (
                                                        <span key={i} className="px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs font-medium shadow-sm leading-relaxed">
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

                {/* AI Feedback Summary - giữ màu gốc */}
                {summary && (summary.strengths?.length > 0 || summary.weaknesses?.length > 0) && (
                    <div className="mt-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white leading-tight">
                                <Brain className="w-5 h-5 text-indigo-500" /> AI Feedback Summary
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {summary.strengths && summary.strengths.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-3 leading-relaxed">
                                        <ThumbsUp className="w-5 h-5" /> Strengths
                                    </div>
                                    <ul className="space-y-2">
                                        {summary.strengths.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-xl leading-relaxed">
                                                <span className="text-emerald-500 mt-0.5">•</span> {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {summary.weaknesses && summary.weaknesses.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-3 leading-relaxed">
                                        <ThumbsDown className="w-5 h-5" /> Areas for Improvement
                                    </div>
                                    <ul className="space-y-2">
                                        {summary.weaknesses.map((w, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-xl leading-relaxed">
                                                <span className="text-amber-500 mt-0.5">•</span> {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {summary.suggestions && summary.suggestions.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-3 leading-relaxed">
                                        <Lightbulb className="w-5 h-5" /> Suggestions
                                    </div>
                                    <ul className="space-y-2">
                                        {summary.suggestions.map((sug, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-xl leading-relaxed">
                                                <span className="text-indigo-500 mt-0.5">•</span> {sug}
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