import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, User, Brain, Zap, Award, ChevronDown, Settings, HelpCircle,
    BarChart3, MessageCircle, FileText, Mail, Phone, Globe, ExternalLink,
    CheckCircle, Clock, LayoutGrid, ArrowLeft, PlayCircle, Loader2, Code,
    Terminal, BookOpen, Cpu
} from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function HelpSupportPage() {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const cvInterviewRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/login');
    }, [authLoading, isAuthenticated, navigate]);

    const handleLogout = () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setTimeout(async () => {
            await logout();
            navigate('/login');
        }, 2000);
    };

    const scrollToCVInterview = () => {
        cvInterviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (authLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    // Hardcoded English text
    const text = {
        helpSupport: 'Help & Support',
        helpSubtitle: 'Get assistance and discover how our AI-powered platform personalizes interviews based on your CV, adaptive logic, or coding challenges.',
        interviewModesTitle: '🎯 Three Interview Modes',
        interviewModesDesc: 'Choose the approach that fits your preparation style. All modes use AI to generate personalized questions and feedback.',
        cvBasedTitle: '📄 CV‑Based Interview',
        cvBasedDesc: 'Upload your CV – the AI extracts your skills, projects, and experience to ask perfectly tailored questions.',
        adaptiveTitle: '🤖 Adaptive Interview',
        adaptiveDesc: 'Questions change in real‑time based on your answers. Strong answers unlock deeper topics, weak answers trigger guidance.',
        codingTitle: '💻 Coding Interview',
        codingDesc: 'Practice coding with AI-generated problems, run tests, then answer conceptual questions about your code.',
        howItWorks: 'How CV‑Based Interview Works',
        step1Title: 'Upload Your CV',
        step1Desc: 'Upload your CV (PDF). Choose target role, tech stack, and seniority level.',
        step2Title: 'AI Analysis & Parsing',
        step2Desc: 'AI extracts your skills, projects, work experience and education.',
        step3Title: 'Personalized Question Generation',
        step3Desc: 'AI generates relevant multiple-choice and open-ended questions based on your CV.',
        step4Title: 'Practice & Submit Answers',
        step4Desc: 'Answer questions in an interactive interface. Submit for evaluation.',
        step5Title: 'AI Scoring & Feedback',
        step5Desc: 'MCQ auto-graded instantly. Text answers receive AI scoring and detailed feedback.',
        step6Title: 'Performance Insights & Tips',
        step6Desc: 'Get overall score, personalized recommendations, and actionable tips.',
        adaptiveSystemTitle: 'Adaptive Interview System',
        adaptiveRealTime: 'Real-time Difficulty',
        adaptiveRealTimeDesc: 'Questions become harder or easier depending on your performance.',
        adaptiveFollowup: 'AI Follow-up Questions',
        adaptiveFollowupDesc: 'The AI asks deeper follow-up questions based on your answers.',
        adaptiveSkill: 'Skill Evaluation',
        adaptiveSkillDesc: 'Track strengths, weaknesses, and topic mastery instantly.',
        adaptiveFeedback: 'Personalized Feedback',
        adaptiveFeedbackDesc: 'Receive tailored recommendations to improve your interview skills.',
        adaptiveHighlight: 'Adaptive AI simulates real technical interviews',
        adaptiveHighlightDesc: 'Just like real interviewers, the AI adjusts questions according to your confidence level, technical depth, and response quality.',
        codingStep1Title: '1. Choose Language',
        codingStep1Desc: 'Select your programming language (Java, Python, JavaScript, C++, etc.).',
        codingStep2Title: '2. Choose Domain & Topic',
        codingStep2Desc: 'Pick a domain (OOP, DSA, Concurrency, etc.) and a specific topic (Array, LinkedList, Tree, etc.).',
        codingStep3Title: '3. AI Generates Problem',
        codingStep3Desc: 'AI creates a coding problem tailored to your language, domain, and topic.',
        codingStep4Title: '4. Write & Run Code',
        codingStep4Desc: 'Implement your solution in the built-in editor with test cases.',
        codingStep5Title: '5. Answer Conceptual Questions',
        codingStep5Desc: 'After solving correctly, answer 3 short questions about your code (time complexity, edge cases, etc.).',
        codingStep6Title: '6. AI Evaluation',
        codingStep6Desc: 'Receive detailed feedback on your code and conceptual answers.',
        topicSectionTitle: '📌 Manual Topic Entry (Standard Interview)',
        topicSectionDesc: 'No CV? No problem! Manually enter programming languages, frameworks, or topics (Java, Python, React, ...). The AI will generate standard interview questions (multiple-choice and open-ended) based on your chosen topics.',
        contactTitle: 'Contact & Support',
        emailSupport: 'Email Support',
        phoneSupport: 'Phone Support',
        facebook: 'Facebook',
        linkedin: 'LinkedIn',
        responseTime: 'Response time: Within 24 hours',
        businessHours: 'Mon-Fri 9am - 6pm (GMT+7)',
        quickActions: 'Quick Actions',
        backToDashboard: 'Back to Dashboard',
        knowledgeBase: 'Knowledge Base',
        reportIssue: 'Report an Issue',
        personalNote: 'Your questions are generated based on your CV content OR the topics you enter — fully personalized!',
        connectWithUs: 'Connect with us on social media for updates and tips.',
        howToUse: 'How to use?',
        back: 'Back to Dashboard',
        logout: 'Logging out',
        tryAdaptive: 'Try Adaptive Interview',
        tryCoding: 'Try Coding Interview'
    };

    const cvSteps = [
        { icon: FileText, title: text.step1Title, desc: text.step1Desc, color: 'blue' },
        { icon: Brain, title: text.step2Title, desc: text.step2Desc, color: 'purple' },
        { icon: Zap, title: text.step3Title, desc: text.step3Desc, color: 'amber' },
        { icon: MessageCircle, title: text.step4Title, desc: text.step4Desc, color: 'green' },
        { icon: HelpCircle, title: text.step5Title, desc: text.step5Desc, color: 'indigo' },
        { icon: TrendingUp, title: text.step6Title, desc: text.step6Desc, color: 'rose' },
    ];

    const codingSteps = [
        { icon: Terminal, title: text.codingStep1Title, desc: text.codingStep1Desc, color: 'cyan' },
        { icon: BookOpen, title: text.codingStep2Title, desc: text.codingStep2Desc, color: 'blue' },
        { icon: Cpu, title: text.codingStep3Title, desc: text.codingStep3Desc, color: 'violet' },
        { icon: Code, title: text.codingStep4Title, desc: text.codingStep4Desc, color: 'emerald' },
        { icon: MessageCircle, title: text.codingStep5Title, desc: text.codingStep5Desc, color: 'amber' },
        { icon: Award, title: text.codingStep6Title, desc: text.codingStep6Desc, color: 'indigo' },
    ];

    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-indigo-500',
        amber: 'from-amber-500 to-orange-500',
        green: 'from-green-500 to-emerald-500',
        indigo: 'from-indigo-500 to-blue-500',
        rose: 'from-rose-500 to-pink-500',
        cyan: 'from-cyan-500 to-teal-500',
        violet: 'from-violet-500 to-purple-500',
        emerald: 'from-emerald-500 to-green-500',
    };

    const contactLinks = {
        email: 'nguyendhieu1210@gmail.com',
        phone: '0866638629',
        facebookUrl: 'https://facebook.com/yourpage',
        linkedinUrl: 'https://linkedin.com/company/yourcompany'
    };

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} py-8 px-4 sm:px-6 lg:px-8`}>
            {isLoggingOut && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center animate-fadeIn">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-300">{text.logout}...</p>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/welcome')}
                    className="group mb-8 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>{text.back}</span>
                </button>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 md:p-8 mb-12 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <HelpCircle className="w-8 h-8 md:w-9 md:h-9" />
                            <h1 className="text-2xl md:text-3xl font-bold">{text.helpSupport}</h1>
                        </div>
                        <p className="text-indigo-100 text-sm md:text-base max-w-2xl mb-5">{text.helpSubtitle}</p>
                        <button onClick={scrollToCVInterview} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md">
                            <PlayCircle className="w-4 h-4" /> {text.howToUse}
                        </button>
                    </div>
                </div>

                <div className={`mb-12 rounded-2xl shadow-lg border transition-all duration-300 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{text.interviewModesTitle}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{text.interviewModesDesc}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                                <FileText className="w-8 h-8 text-indigo-500 mb-2" />
                                <h3 className="font-semibold text-gray-800 dark:text-white">{text.cvBasedTitle}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{text.cvBasedDesc}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                                <Brain className="w-8 h-8 text-purple-500 mb-2" />
                                <h3 className="font-semibold text-gray-800 dark:text-white">{text.adaptiveTitle}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{text.adaptiveDesc}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${darkMode ? 'bg-cyan-900/30' : 'bg-cyan-50'}`}>
                                <Code className="w-8 h-8 text-cyan-500 mb-2" />
                                <h3 className="font-semibold text-gray-800 dark:text-white">{text.codingTitle}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{text.codingDesc}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div ref={cvInterviewRef} className="mb-12 scroll-mt-24">
                    <div className={`rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                    <LayoutGrid className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{text.howItWorks}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cvSteps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const gradient = colorMap[step.color] || 'from-gray-500 to-gray-600';
                                    return (
                                        <div key={idx} className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-2 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800 border-gray-700/50' : 'bg-white/80 border-white/50'}`}>
                                            <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${gradient}`}></div>
                                            <div className="p-5">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex items-start gap-2 mb-2">
                                                    <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">{idx + 1}</span>
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{step.title}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`mt-6 rounded-xl p-4 flex items-center gap-3 border ${darkMode ? 'bg-indigo-900/20 border-indigo-800/50' : 'bg-indigo-50 border-indigo-100'}`}>
                                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{text.personalNote}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <div className={`rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                                    <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{text.adaptiveSystemTitle}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mt-2">
                                {[
                                    { icon: Zap, title: text.adaptiveRealTime, desc: text.adaptiveRealTimeDesc, gradient: 'from-yellow-500 to-orange-500' },
                                    { icon: Brain, title: text.adaptiveFollowup, desc: text.adaptiveFollowupDesc, gradient: 'from-violet-500 to-indigo-500' },
                                    { icon: TrendingUp, title: text.adaptiveSkill, desc: text.adaptiveSkillDesc, gradient: 'from-emerald-500 to-green-500' },
                                    { icon: Award, title: text.adaptiveFeedback, desc: text.adaptiveFeedbackDesc, gradient: 'from-cyan-500 to-blue-500' }
                                ].map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={index} className={`group/card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700/50 hover:border-violet-600/40' : 'bg-white/80 border-white hover:border-violet-200'}`}>
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg mb-4 group-hover/card:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item.desc}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={`mt-8 rounded-2xl p-5 border flex flex-col md:flex-row md:items-center gap-4 ${darkMode ? 'bg-violet-900/20 border-violet-700/30' : 'bg-violet-50 border-violet-100'}`}>
                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-1">{text.adaptiveHighlight}</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{text.adaptiveHighlightDesc}</p>
                                </div>
                                <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105">
                                    {text.tryAdaptive}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <div className={`rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-xl">
                                    <Code className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{text.codingTitle}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {codingSteps.map((step, idx) => {
                                    const Icon = step.icon;
                                    const gradient = colorMap[step.color] || 'from-gray-500 to-gray-600';
                                    return (
                                        <div key={idx} className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-2 hover:shadow-cyan-500/20 ${darkMode ? 'bg-gray-800 border-gray-700/50' : 'bg-white/80 border-white/50'}`}>
                                            <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${gradient}`}></div>
                                            <div className="p-5">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{step.title}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105">
                                    {text.tryCoding}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-12">
                    <div className={`rounded-2xl border-2 border-dashed p-6 transition-all ${darkMode ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-cyan-50 border-cyan-400'}`}>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className={`p-3 rounded-xl ${darkMode ? 'bg-cyan-800/50' : 'bg-cyan-100'}`}>
                                <Code className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{text.topicSectionTitle}</h3>
                                <p className="text-gray-600 dark:text-gray-300">{text.topicSectionDesc}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'SQL'].map((tag) => (
                                        <span key={tag} className={`px-2 py-1 rounded-lg text-xs font-mono ${darkMode ? 'bg-gray-800 text-cyan-300' : 'bg-white text-cyan-700 shadow-sm'}`}>
                                            {tag}
                                        </span>
                                    ))}
                                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">+ any topic you want</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className={`rounded-3xl shadow-2xl border p-6 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{text.contactTitle}</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <a href={`mailto:${contactLinks.email}`} className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-800/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                        <Mail className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{text.emailSupport}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{contactLinks.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{text.responseTime}</p>
                                    </div>
                                </a>
                                <a href={`tel:${contactLinks.phone}`} className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-800/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                        <Phone className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{text.phoneSupport}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{contactLinks.phone}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{text.businessHours}</p>
                                    </div>
                                </a>
                                <a href={contactLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-800/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                        <Globe className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{text.facebook}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">fb.me/aiinterview</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {text.connectWithUs}</p>
                                    </div>
                                </a>
                                <a href={contactLinks.linkedinUrl} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-800/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                        <FaLinkedin className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{text.linkedin}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">linkedin.com/company/aiinterview</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Follow for updates</p>
                                    </div>
                                </a>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="inline w-3 h-3 mr-1" /> Support team ready to assist you from Monday to Friday.
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-3xl shadow-2xl border p-6 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-500" /> {text.quickActions}
                            </h3>
                            <div className="space-y-3">
                                <button onClick={() => navigate('/welcome')} className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-indigo-900/30 hover:bg-indigo-900/50' : 'bg-indigo-50 hover:bg-indigo-100'}`}>
                                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{text.backToDashboard}</span>
                                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition" />
                                </button>
                                <button className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-gray-800/40 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.knowledgeBase}</span>
                                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition" />
                                </button>
                                <button className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-gray-800/40 hover:bg-gray-700/50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.reportIssue}</span>
                                    <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition" />
                                </button>
                            </div>
                        </div>
                        <div className={`rounded-3xl shadow-2xl border p-5 transition-all bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 ${darkMode ? 'border-indigo-800/50' : 'border-indigo-100'}`}>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white">100% CV‑based & Topic‑based Questions</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Every interview question is tailored specifically from your uploaded CV or the tech topics you enter — skills, projects, and experience.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .scroll-mt-24 { scroll-margin-top: 6rem; }
            `}</style>
        </div>
    );
}