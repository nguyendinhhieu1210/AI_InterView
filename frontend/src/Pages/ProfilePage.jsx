// ProfilePage.jsx – Fixed score display and dark mode contrast
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Calendar, Camera, ArrowLeft, Loader2,
    Edit3, Award, Zap, Clock, TrendingUp, Briefcase,
    CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading, user: authUser, logout } = useAuth();

    // Dark mode – sync with 'dark' class on html element
    const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setDarkMode(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // User data state
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fullName, setFullName] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Combined history (interview + CV)
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalInterviews: 0,
        averageScore: 0,
        improvement: '+0%'
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Fetch profile from API
    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            const userData = response.data.user;
            setUser(userData);
            setFullName(userData.fullName || userData.userName || '');
            setAvatarPreview(userData.avatar || '');
        } catch (err) {
            if (err.response?.status === 401) {
                logout();
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch interview & CV history
    const fetchAllHistory = async () => {
        setHistoryLoading(true);
        setHistoryError('');
        try {
            const [normalRes, cvRes] = await Promise.all([
                api.get('/interview/history').catch(() => ({ data: { success: false, history: [] } })),
                api.get('/cv/history').catch(() => ({ data: { success: false, history: [] } }))
            ]);

            const normalList = normalRes.data?.success && Array.isArray(normalRes.data.history)
                ? normalRes.data.history
                : [];
            const normalizedNormal = normalList.map(item => ({
                id: `interview_${item.id}`,
                topic: item.topic || 'General Interview',
                difficulty: item.difficulty || 'Medium',
                totalQuestions: item.totalQuestions || 0,
                createdAt: item.createdAt,
                totalScore: item.totalScore || 0,
            }));

            const cvList = cvRes.data?.success && Array.isArray(cvRes.data.history)
                ? cvRes.data.history
                : [];
            const normalizedCV = cvList.map(item => {
                let questionCount = 0;
                if (item.results && Array.isArray(item.results)) questionCount = item.results.length;
                else if (item.questions) {
                    if (Array.isArray(item.questions)) questionCount = item.questions.length;
                    else if (typeof item.questions === 'object') questionCount = Object.keys(item.questions).length;
                }
                return {
                    id: `cv_${item._id}`,
                    topic: item.cvName || 'CV Review',
                    difficulty: 'CV',
                    totalQuestions: questionCount,
                    createdAt: item.createdAt,
                    totalScore: item.totalScore || 0,
                };
            });

            const merged = [...normalizedNormal, ...normalizedCV];
            merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setInterviewHistory(merged);

            const total = merged.length;
            let avgScore = 0;
            let improvement = '+0%';

            if (total > 0) {
                const sumScores = merged.reduce((sum, item) => sum + (item.totalScore || 0), 0);
                avgScore = Math.round(sumScores / total);

                const now = new Date();
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);

                const recent = merged.filter(item => new Date(item.createdAt) >= monthAgo);
                const prev = merged.filter(item => new Date(item.createdAt) < monthAgo);

                const recentAvg = recent.length ? recent.reduce((s, i) => s + i.totalScore, 0) / recent.length : 0;
                const prevAvg = prev.length ? prev.reduce((s, i) => s + i.totalScore, 0) / prev.length : 0;
                const change = prevAvg === 0 ? 0 : Math.round(recentAvg - prevAvg);
                improvement = `${change > 0 ? '+' : ''}${change}%`;
            }

            setStats({ totalInterviews: total, averageScore: avgScore, improvement });
        } catch (err) {
            console.error(err);
            setHistoryError('Could not load activity history');
            setInterviewHistory([]);
            setStats({ totalInterviews: 0, averageScore: 0, improvement: '+0%' });
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && authUser) {
            fetchProfile();
            fetchAllHistory();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, authUser, authLoading]);

    // Update profile (name or avatar)
    const updateProfileData = async (newFullName, newAvatar, customMsg = '') => {
        setUpdating(true);
        setError('');
        setSuccess('');
        try {
            const payload = {};
            if (newFullName !== undefined) payload.fullName = newFullName;
            if (newAvatar !== undefined) payload.avatar = newAvatar;
            const response = await api.put('/users/profile', payload);
            const updatedUser = response.data.user;
            setUser(updatedUser);
            setFullName(updatedUser.fullName || updatedUser.userName);
            if (newAvatar) setAvatarPreview(newAvatar);
            setSuccess(customMsg || 'Profile updated successfully');
            setTimeout(() => setSuccess(''), 4000);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed');
            setTimeout(() => setError(''), 4000);
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const compressImage = (file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError('Image too large (>5MB). Please choose a smaller one.');
            setTimeout(() => setError(''), 3000);
            return;
        }
        setUploadingAvatar(true);
        try {
            const base64 = await compressImage(file, 800, 0.7);
            setAvatarPreview(base64);
            const ok = await updateProfileData(undefined, base64, '✨ Avatar updated!');
            if (!ok) setAvatarPreview(user?.avatar || '');
        } catch (err) {
            console.error(err);
            setError('Failed to process image. Please try again.');
            setTimeout(() => setError(''), 4000);
            setAvatarPreview(user?.avatar || '');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateFullName = async (e) => {
        e.preventDefault();
        await updateProfileData(fullName, undefined);
        setEditMode(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getRelativeTime = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    // Format score with "score" instead of "%" or "pts"
    const formatScore = (score) => {
        if (typeof score !== 'number') return '0 score';
        const rounded = Math.round(score * 10) / 10;
        // Remove trailing .0 if whole number
        const display = rounded % 1 === 0 ? Math.round(rounded).toString() : rounded.toString();
        return `${display} score`;
    };

    const recentActivities = interviewHistory.slice(0, 4).map(item => ({
        id: item.id,
        action: item.topic,
        score: item.totalScore,
        date: getRelativeTime(item.createdAt),
        difficulty: item.difficulty,
        totalQuestions: item.totalQuestions,
    }));

    if (authLoading || loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
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
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const joinDate = formatDate(user.createdAt);

    const statsBoxes = [
        { icon: Zap, label: 'Interviews', value: stats.totalInterviews, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
        { icon: Award, label: 'Avg Score', value: `${stats.averageScore} score`, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        { icon: TrendingUp, label: 'Improvement', value: stats.improvement, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    ];

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50'} py-6 px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-7xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => navigate('/welcome')}
                    className="group mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium px-3 py-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
                    {/* LEFT COLUMN - Profile Card & Stats */}
                    <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                        {/* Profile Card */}
                        <div className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 ${darkMode ? 'bg-gray-900/80 backdrop-blur-sm border border-gray-800' : 'bg-white/90 backdrop-blur-sm border border-white/60'}`}>
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
                            <div className="absolute top-0 left-0 w-full h-32 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                            <div className="relative pt-16 pb-6 px-6 text-center">
                                {/* Avatar */}
                                <div className="relative inline-block mx-auto group">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-xl opacity-60 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl" />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white dark:border-gray-800 shadow-xl transition-all group-hover:scale-105">
                                                {avatarLetter}
                                            </div>
                                        )}
                                        <label className="absolute bottom-1 right-1 p-2.5 bg-indigo-600 rounded-full cursor-pointer hover:bg-indigo-700 transition-all duration-200 shadow-lg ring-2 ring-white dark:ring-gray-800 hover:scale-110">
                                            {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                                            <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                        </label>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="mt-4">
                                    {!editMode ? (
                                        <div className="group/name">
                                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">{fullName}</h2>
                                            <div className="flex items-center justify-center gap-2 mt-1">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.userName}</p>
                                                <button onClick={() => setEditMode(true)} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-indigo-500 hover:text-indigo-600">
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleUpdateFullName} className="mt-2 space-y-3">
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className={`w-full px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none text-center transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-white border-gray-200 focus:border-indigo-500'}`}
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-center">
                                                <button type="submit" disabled={updating} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                                </button>
                                                <button type="button" onClick={() => setEditMode(false)} className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all">Cancel</button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Role badge */}
                                <div className="mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${user.role === 'admin' ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                        {user.role === 'admin' ? 'Administrator' : 'Member'}
                                    </span>
                                </div>

                                {/* Contact info */}
                                <div className="mt-5 space-y-2.5 text-left">
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-sm break-all">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Calendar className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <span className="text-sm">Joined {joinDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats boxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {statsBoxes.map((stat, idx) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={idx} className={`group rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-white/60'} backdrop-blur-sm`}>
                                        <div className={`p-2 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform w-fit`}>
                                            <Icon className={`w-4 h-4 ${stat.color}`} />
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-xl font-bold text-gray-800 dark:text-white">{stat.value}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Recent Activity */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        <div className={`rounded-2xl shadow-xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800 backdrop-blur-sm' : 'bg-white/90 border-white/60 backdrop-blur-sm'}`}>
                            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl">
                                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity</h3>
                                {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-2" />}
                            </div>

                            <div className="p-5 divide-y divide-gray-100 dark:divide-gray-800">
                                {historyLoading ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                    </div>
                                ) : historyError ? (
                                    <div className="text-center py-6 text-red-500 dark:text-red-400 text-sm">{historyError}</div>
                                ) : recentActivities.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>No interview attempts yet.</p>
                                        <button onClick={() => navigate('/interview')} className="mt-3 text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
                                            Start your first interview →
                                        </button>
                                    </div>
                                ) : (
                                    recentActivities.map(activity => {
                                        // Improved score color for dark mode
                                        const getScoreColor = (score) => {
                                            if (score >= 90) return 'text-emerald-700 bg-emerald-100 dark:bg-emerald-700/80 dark:text-white';
                                            if (score >= 75) return 'text-amber-700 bg-amber-100 dark:bg-amber-700/80 dark:text-white';
                                            return 'text-gray-700 bg-gray-100 dark:bg-gray-600/80 dark:text-gray-100';
                                        };
                                        const getDifficultyBadge = (difficulty) => {
                                            if (!difficulty) return null;
                                            if (difficulty.toLowerCase() === 'cv') {
                                                return 'bg-purple-100 text-purple-800 dark:bg-purple-600/80 dark:text-white';
                                            }
                                            const map = {
                                                easy: 'bg-green-100 text-green-700 dark:bg-green-600/80 dark:text-white',
                                                medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600/80 dark:text-white',
                                                hard: 'bg-red-100 text-red-700 dark:bg-red-600/80 dark:text-white'
                                            };
                                            return map[difficulty.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-600/80 dark:text-gray-100';
                                        };
                                        return (
                                            <div key={activity.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-lg px-2 transition-all">
                                                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 group-hover:scale-110 transition-transform duration-300">
                                                    <Briefcase className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.action}</p>
                                                        {activity.difficulty && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyBadge(activity.difficulty)}`}>
                                                                {activity.difficulty === 'CV' ? '📄 CV' : activity.difficulty}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" /> {activity.date}
                                                        {activity.totalQuestions > 0 && ` • ${activity.totalQuestions} questions`}
                                                    </p>
                                                </div>
                                                {typeof activity.score === 'number' && (
                                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getScoreColor(activity.score)}`}>
                                                        {formatScore(activity.score)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                {!historyLoading && interviewHistory.length > 4 && (
                                    <button
                                        onClick={() => navigate('/history')}
                                        className="w-full mt-3 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline py-2 transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 rounded-lg"
                                    >
                                        View all activity →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating notifications */}
                {error && (
                    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl shadow-lg z-50">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl shadow-lg z-50">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{success}</span>
                    </div>
                )}
            </div>
        </div>
    );
}