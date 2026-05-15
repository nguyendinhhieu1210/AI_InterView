import { useEffect, useRef,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LogOut, User, Brain, Zap, Award, ChevronDown, Settings, HelpCircle,
    BarChart3, MessageCircle, FileText, Mail, Phone, Globe, ExternalLink,
    CheckCircle, Clock, LayoutGrid, ArrowLeft, PlayCircle, Loader2
} from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

export default function HelpSupportPage() {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const { language } = useLanguage();
    const { user, isAuthenticated, loading: authLoading, logout } = useAuth(); // Lấy từ context

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dropdownRef = useRef(null);
    const howItWorksRef = useRef(null);

    // Chuyển hướng nếu chưa đăng nhập
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Xử lý logout thủ công (có delay 2s)
    const handleLogout = () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        setTimeout(async () => {
            await logout();
            navigate('/login');
        }, 2000);
    };

    // Click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const scrollToHowItWorks = () => {
        howItWorksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    const displayName = user.fullName || user.userName;
    const avatarUrl = user.avatar;
    const avatarLetter = displayName.charAt(0).toUpperCase();

    // Translation (giữ nguyên)
    const t = (key) => {
        const translations = {
            en: {
                helpSupport: 'Help & Support',
                helpSubtitle: 'Get assistance and discover how our AI-powered platform personalizes interviews based on your CV.',
                howItWorks: 'How the AI Interview System Works',
                step1Title: 'Upload Your CV',
                step1Desc: 'Upload your CV (PDF format). Choose your target role, tech stack, and seniority level.',
                step2Title: 'AI Analysis & Parsing',
                step2Desc: 'Our AI extracts your skills, projects, work experience and education from the CV.',
                step3Title: 'Personalized Question Generation',
                step3Desc: 'Based on your unique CV, AI generates relevant multiple-choice and open-ended questions.',
                step4Title: 'Practice & Submit Answers',
                step4Desc: 'Answer questions in an interactive interface. Submit responses for evaluation.',
                step5Title: 'AI Scoring & Feedback',
                step5Desc: 'MCQ auto-graded instantly. Text answers receive AI-powered scoring and detailed feedback.',
                step6Title: 'Performance Insights & Tips',
                step6Desc: 'Get overall score, personalized recommendations, and actionable tips to improve.',
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
                personalNote: 'Your questions are always generated based on your CV content — fully personalized!',
                connectWithUs: 'Connect with us on social media for updates and tips.',
                howToUse: 'How to use?',
                back: 'Back to Dashboard',
                logout: 'Logging out'
            },
            vi: {
                helpSupport: 'Trợ giúp & Hỗ trợ',
                helpSubtitle: 'Nhận trợ giúp và khám phá cách nền tảng AI cá nhân hóa phỏng vấn dựa trên CV của bạn.',
                howItWorks: 'Hệ thống phỏng vấn AI hoạt động thế nào',
                step1Title: 'Tải lên CV',
                step1Desc: 'Tải lên CV (PDF). Chọn vai trò, công nghệ và cấp độ mong muốn.',
                step2Title: 'AI phân tích CV',
                step2Desc: 'AI trích xuất kỹ năng, dự án, kinh nghiệm và học vấn từ CV.',
                step3Title: 'Tạo câu hỏi cá nhân hóa',
                step3Desc: 'Dựa trên CV của bạn, AI tạo ra câu hỏi trắc nghiệm và tự luận phù hợp.',
                step4Title: 'Luyện tập & nộp câu trả lời',
                step4Desc: 'Trả lời câu hỏi trong giao diện tương tác và nộp để được đánh giá.',
                step5Title: 'Chấm điểm & phản hồi bằng AI',
                step5Desc: 'Trắc nghiệm chấm ngay. Câu tự luận được AI chấm và nhận xét chi tiết.',
                step6Title: 'Kết quả & gợi ý cải thiện',
                step6Desc: 'Nhận điểm tổng, đề xuất cá nhân và mẹo cải thiện kỹ năng.',
                contactTitle: 'Liên hệ & Hỗ trợ',
                emailSupport: 'Hỗ trợ qua Email',
                phoneSupport: 'Hỗ trợ qua Điện thoại',
                facebook: 'Facebook',
                linkedin: 'LinkedIn',
                responseTime: 'Thời gian phản hồi: Trong vòng 24 giờ',
                businessHours: 'Thứ 2 - Thứ 6, 9h - 18h (GMT+7)',
                quickActions: 'Thao tác nhanh',
                backToDashboard: 'Quay lại Trang chính',
                knowledgeBase: 'Cơ sở kiến thức',
                reportIssue: 'Báo cáo sự cố',
                personalNote: 'Câu hỏi luôn được tạo dựa trên nội dung CV của bạn — cá nhân hóa hoàn toàn!',
                connectWithUs: 'Kết nối với chúng tôi qua mạng xã hội để nhận cập nhật và mẹo hữu ích.',
                howToUse: 'Cách sử dụng?',
                back: 'Quay lại trang chính',
                logout: 'Đang đăng xuất'
            }
        };
        return translations[language]?.[key] || translations['en'][key] || key;
    };

    const steps = [
        { icon: FileText, title: t('step1Title'), desc: t('step1Desc'), color: 'blue' },
        { icon: Brain, title: t('step2Title'), desc: t('step2Desc'), color: 'purple' },
        { icon: Zap, title: t('step3Title'), desc: t('step3Desc'), color: 'amber' },
        { icon: MessageCircle, title: t('step4Title'), desc: t('step4Desc'), color: 'green' },
        { icon: HelpCircle, title: t('step5Title'), desc: t('step5Desc'), color: 'indigo' },
        { icon: TrendingUp, title: t('step6Title'), desc: t('step6Desc'), color: 'rose' },
    ];

    const colorMap = {
        blue: 'from-blue-500 to-cyan-500',
        purple: 'from-purple-500 to-indigo-500',
        amber: 'from-amber-500 to-orange-500',
        green: 'from-green-500 to-emerald-500',
        indigo: 'from-indigo-500 to-blue-500',
        rose: 'from-rose-500 to-pink-500',
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
                        <p className="text-gray-700 dark:text-gray-300">{t('logout')}...</p>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/welcome')}
                    className="group mb-8 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>{t('back')}</span>
                </button>

                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 md:p-8 mb-12 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <HelpCircle className="w-8 h-8 md:w-9 md:h-9" />
                            <h1 className="text-2xl md:text-3xl font-bold">{t('helpSupport')}</h1>
                        </div>
                        <p className="text-indigo-100 text-sm md:text-base max-w-2xl mb-5">
                            {t('helpSubtitle')}
                        </p>
                        <button
                            onClick={scrollToHowItWorks}
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md"
                        >
                            <PlayCircle className="w-4 h-4" /> {t('howToUse')}
                        </button>
                    </div>
                </div>

                {/* How It Works Section - Only one */}
                <div ref={howItWorksRef} className="mb-12 scroll-mt-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                            <LayoutGrid className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{t('howItWorks')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const gradient = colorMap[step.color] || 'from-gray-500 to-gray-600';
                            return (
                                <div
                                    key={idx}
                                    className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-2 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}
                                >
                                    <div className={`h-2 rounded-t-2xl bg-gradient-to-r ${gradient}`}></div>
                                    <div className="p-5">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex items-start gap-2 mb-2">
                                            <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{step.title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className={`mt-6 rounded-xl p-4 flex items-center gap-3 border ${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-100'}`}>
                        <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('personalNote')}</p>
                    </div>
                </div>

                {/* Contact & Support Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className={`rounded-3xl shadow-2xl border p-6 transition-all ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('contactTitle')}</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <a href={`mailto:${contactLinks.email}`} className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-700/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <Mail className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{t('emailSupport')}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{contactLinks.email}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('responseTime')}</p>
                                    </div>
                                </a>
                                <a href={`tel:${contactLinks.phone}`} className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-700/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <Phone className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{t('phoneSupport')}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{contactLinks.phone}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('businessHours')}</p>
                                    </div>
                                </a>
                                <a href={contactLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-700/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <Globe className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{t('facebook')}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">fb.me/aiinterview</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {t('connectWithUs')}</p>
                                    </div>
                                </a>
                                <a href={contactLinks.linkedinUrl} target="_blank" rel="noopener noreferrer" className={`group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 ${darkMode ? 'bg-gray-700/40 hover:bg-indigo-900/30' : 'bg-gray-50 hover:bg-indigo-50'}`}>
                                    <div className={`p-2 rounded-lg shadow-sm group-hover:shadow group-hover:scale-105 transition ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        <FaLinkedin className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">{t('linkedin')}</p>
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
                                <Zap className="w-5 h-5 text-indigo-500" /> {t('quickActions')}
                            </h3>
                            <div className="space-y-3">
                                <button onClick={() => navigate('/welcome')} className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-indigo-900/30 hover:bg-indigo-900/50' : 'bg-indigo-50 hover:bg-indigo-100'}`}>
                                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{t('backToDashboard')}</span>
                                    <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition" />
                                </button>
                                <button className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-gray-700/40 hover:bg-gray-600/50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('knowledgeBase')}</span>
                                    <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition" />
                                </button>
                                <button className={`w-full flex items-center justify-between p-3 rounded-xl transition group ${darkMode ? 'bg-gray-700/40 hover:bg-gray-600/50' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('reportIssue')}</span>
                                    <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition" />
                                </button>
                            </div>
                        </div>
                        <div className={`rounded-3xl shadow-2xl border p-5 transition-all bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 ${darkMode ? 'border-indigo-800/50' : 'border-indigo-100'}`}>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-gray-800 dark:text-white">100% CV‑based Questions</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Every interview question is tailored specifically from your uploaded CV — skills, projects and experience.</p>
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