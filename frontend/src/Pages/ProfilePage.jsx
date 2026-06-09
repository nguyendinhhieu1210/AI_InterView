// ProfilePage.jsx – dùng HistoryContext
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Mail, Calendar, Camera, ArrowLeft, Loader2,
    Edit3, Zap, Clock, Briefcase,
    CheckCircle, AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from '../contexts/HistoryContext';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading, user: authUser, logout } = useAuth();
    const { normal, cv, adaptive, coding, loading: historyLoading } = useHistory();

    // User data
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fullName, setFullName] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) navigate('/login');
    }, [authLoading, isAuthenticated, navigate]);

    // Fetch profile
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

    useEffect(() => {
        if (isAuthenticated && authUser) {
            fetchProfile();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, authUser, authLoading]);

    // Update profile (giữ nguyên)
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

    const compressImage = (file, maxWidth = 800, quality = 0.8) => {
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
                    const mimeType = file.type || 'image/jpeg';
                    resolve(canvas.toDataURL(mimeType, quality));
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
        const previousAvatar = avatarPreview;
        try {
            const base64 = await compressImage(file, 800, 0.8);
            setAvatarPreview(base64);
            const ok = await updateProfileData(undefined, base64, '✨ Avatar updated!');
            if (!ok) setAvatarPreview(previousAvatar);
        } catch (err) {
            console.error(err);
            setError('Failed to process image. Please try again.');
            setTimeout(() => setError(''), 4000);
            setAvatarPreview(previousAvatar);
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

    const formatScoreDisplay = (item) => {
        if (item.type === 'coding') return null;
        let score = item.totalScore;
        if (item.type === 'adaptive') {
            if (score > 10) score = score / 10;
            return `${score}/10 Score`;
        }
        return `${score} score`;
    };

    // === Tạo merged history từ context ===
    const allHistory = (() => {
        // Standard (normal)
        const normalList = (normal || []).map(item => ({
            id: `interview_${item.id}`,
            type: 'standard',
            topic: item.topic || 'General Interview',
            difficulty: item.difficulty || 'Medium',
            totalQuestions: item.totalQuestions || 0,
            createdAt: item.createdAt,
            totalScore: item.totalScore || 0,
        }));
        // CV
        const cvList = (cv || []).map(item => {
            let questionCount = 0;
            if (item.results && Array.isArray(item.results)) questionCount = item.results.length;
            else if (item.questions) {
                if (Array.isArray(item.questions)) questionCount = item.questions.length;
                else if (typeof item.questions === 'object') questionCount = Object.keys(item.questions).length;
            }
            return {
                id: `cv_${item._id}`,
                type: 'cv',
                topic: item.cvName || 'CV Review',
                difficulty: 'CV',
                totalQuestions: questionCount,
                createdAt: item.createdAt,
                totalScore: item.totalScore || 0,
            };
        });
        // Adaptive
        const adaptiveList = (adaptive || []).map(item => ({
            id: `adaptive_${item.id}`,
            type: 'adaptive',
            topic: item.topic || 'Adaptive Interview',
            difficulty: 'Adaptive',
            totalQuestions: item.totalQuestions || 0,
            createdAt: item.createdAt,
            totalScore: item.totalScore || 0,
        }));
        // Coding
        const codingList = (coding || []).map(item => ({
            id: `coding_${item._id || item.id}`,
            type: 'coding',
            topic: item.title || 'Coding Challenge',
            difficulty: 'Coding',
            totalQuestions: item.questions?.length || item.totalQuestions || 0,
            createdAt: item.createdAt,
            totalScore: null,
        }));

        const merged = [...normalList, ...cvList, ...adaptiveList, ...codingList];
        merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return merged;
    })();

    const totalInterviews = allHistory.length;
    const recentActivities = allHistory.slice(0, 4).map(item => ({
        ...item,
        scoreDisplay: formatScoreDisplay(item),
        relativeDate: getRelativeTime(item.createdAt)
    }));

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    const displayName = user.fullName || user.userName;
    const avatarLetter = displayName.charAt(0).toUpperCase();
    const joinDate = formatDate(user.createdAt);

    const getScoreColorClass = (item) => {
        if (item.type === 'coding') return 'bg-muted/20 text-muted';
        const score = item.totalScore;
        if (typeof score !== 'number') return 'bg-muted/20 text-muted';
        let percent = item.type === 'adaptive' ? score * 10 : score;
        if (percent >= 90) return 'bg-success/20 text-success';
        if (percent >= 75) return 'bg-warning/20 text-warning';
        if (percent >= 50) return 'bg-warning/10 text-warning';
        return 'bg-muted/20 text-muted';
    };

    const getDifficultyBadgeClass = (difficulty) => {
        if (!difficulty) return 'bg-muted/20 text-muted';
        const lower = difficulty.toLowerCase();
        if (lower === 'cv') return 'bg-secondary/20 text-secondary';
        if (lower === 'easy') return 'bg-success/20 text-success';
        if (lower === 'medium') return 'bg-warning/20 text-warning';
        if (lower === 'hard') return 'bg-error/20 text-error';
        if (lower === 'coding') return 'bg-primary/20 text-primary';
        if (lower === 'adaptive') return 'bg-secondary/20 text-secondary';
        return 'bg-muted/20 text-muted';
    };

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
                {/* Back button */}
                <button
                    onClick={() => navigate('/welcome')}
                    className="group mb-6 flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 font-medium bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
                    {/* LEFT COLUMN - Profile Card */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <div className="relative overflow-hidden rounded-2xl shadow-soft border border-border bg-card transition-all duration-500 hover:shadow-md">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary via-secondary to-pink-500 opacity-90"></div>
                            <div className="absolute top-0 left-0 w-full h-32 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                            <div className="relative pt-16 pb-6 px-6 text-center">
                                {/* Avatar */}
                                <div className="relative inline-block mx-auto group">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-pink-500 blur-xl opacity-60 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-card object-cover shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:shadow-md" />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold border-4 border-card shadow-soft transition-all group-hover:scale-105">
                                                {avatarLetter}
                                            </div>
                                        )}
                                        <label className="absolute bottom-1 right-1 p-2.5 bg-primary rounded-full cursor-pointer hover:brightness-105 transition-all duration-200 shadow-md ring-2 ring-card hover:scale-110">
                                            {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                                            <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                        </label>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className="mt-4">
                                    {!editMode ? (
                                        <div className="group/name">
                                            <h2 className="text-2xl font-bold text-text">{fullName}</h2>
                                            <div className="flex items-center justify-center gap-2 mt-1">
                                                <p className="text-sm text-muted">@{user.userName}</p>
                                                <button onClick={() => setEditMode(true)} className="opacity-0 group-hover/name:opacity-100 transition-opacity text-primary hover:text-primary/80">
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
                                                className="w-full px-4 py-2 rounded-xl border-2 border-border bg-card text-text focus:ring-2 focus:ring-primary outline-none text-center transition-all"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-center">
                                                <button type="submit" disabled={updating} className="px-4 py-1.5 bg-primary hover:brightness-105 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                                </button>
                                                <button type="button" onClick={() => {
                                                    setEditMode(false);
                                                    setFullName(user.fullName || user.userName);
                                                }} className="px-4 py-1.5 bg-muted/30 hover:bg-muted/40 text-text rounded-lg text-sm font-medium transition-all">
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                {/* Role badge */}
                                <div className="mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${user.role === 'admin' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted/20 text-muted border border-border'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-primary animate-pulse' : 'bg-muted'}`}></span>
                                        {user.role === 'admin' ? 'Administrator' : 'Member'}
                                    </span>
                                </div>

                                {/* Contact info */}
                                <div className="mt-5 space-y-2.5 text-left">
                                    <div className="flex items-center gap-3 text-muted p-2 rounded-xl hover:bg-muted/10 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm break-all text-text">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted p-2 rounded-xl hover:bg-muted/10 transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Calendar className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm text-text">Joined {joinDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Total Sessions + Recent Activity */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        {/* Total Sessions Card */}
                        <div className="rounded-2xl shadow-soft border border-border bg-card">
                            <div className="p-6 text-center">
                                <div className="inline-flex p-3 rounded-full bg-primary/10 mb-4">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-5xl font-black text-text">{totalInterviews}</div>
                                <div className="text-muted mt-1">Total Interview Sessions</div>
                                <p className="text-xs text-muted/70 mt-2">
                                    Includes Standard, CV, Adaptive, and Coding interviews
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="rounded-2xl shadow-soft border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-success/20 to-teal-500/20 rounded-xl">
                                        <Clock className="w-5 h-5 text-success" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text">Recent Activity</h3>
                                    {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-muted" />}
                                </div>
                                {/* Không cần refresh riêng vì context tự cập nhật, có thể bỏ nút hoặc giữ nhưng vô dụng */}
                            </div>

                            <div className="p-5 divide-y divide-border">
                                {historyLoading ? (
                                    <div className="space-y-4">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                                                <div className="w-8 h-8 rounded-xl bg-muted/20"></div>
                                                <div className="flex-1">
                                                    <div className="h-4 bg-muted/20 rounded w-3/4 mb-2"></div>
                                                    <div className="h-3 bg-muted/20 rounded w-1/2"></div>
                                                </div>
                                                <div className="w-16 h-6 bg-muted/20 rounded-full"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : recentActivities.length === 0 ? (
                                    <div className="text-center py-8 text-muted">
                                        <p>No interview attempts yet.</p>
                                        <button onClick={() => navigate('/interview')} className="mt-3 text-primary hover:underline text-sm">
                                            Start your first interview →
                                        </button>
                                    </div>
                                ) : (
                                    recentActivities.map(activity => (
                                        <div key={activity.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 group hover:bg-muted/5 rounded-lg px-2 transition-all">
                                            <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-text truncate">{activity.topic}</p>
                                                    {activity.difficulty && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyBadgeClass(activity.difficulty)}`}>
                                                            {activity.difficulty === 'CV' ? '📄 CV' :
                                                                activity.difficulty === 'Coding' ? '💻 Coding' :
                                                                    activity.difficulty === 'Adaptive' ? '🧠 Adaptive' : activity.difficulty}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                                    <Clock className="w-3 h-3" /> {activity.relativeDate}
                                                    {activity.totalQuestions > 0 && ` • ${activity.totalQuestions} questions`}
                                                </p>
                                            </div>
                                            {activity.scoreDisplay && (
                                                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getScoreColorClass(activity)}`}>
                                                    {activity.scoreDisplay}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                                {!historyLoading && allHistory.length > 4 && (
                                    <button
                                        onClick={() => navigate('/history')}
                                        className="w-full mt-4 text-center text-sm text-primary hover:underline py-2 transition-all hover:bg-primary/5 rounded-lg"
                                    >
                                        View all activity →
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                {error && (
                    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-error bg-error/10 p-3 rounded-xl shadow-soft z-50 border border-error/30">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="fixed bottom-4 right-4 flex items-center gap-2 text-success bg-success/10 p-3 rounded-xl shadow-soft z-50 border border-success/30">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{success}</span>
                    </div>
                )}
            </div>
        </div>
    );
}