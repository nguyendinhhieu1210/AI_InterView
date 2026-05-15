// ProfilePage.jsx - Đã tích hợp AuthContext
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Calendar, Camera, ArrowLeft, Loader2,
    Edit3, Award, Zap, Clock, TrendingUp, Briefcase,
    Phone, Save, CheckCircle, AlertCircle, MapPin
} from 'lucide-react';
import api from '../services/api';
import { FaLinkedin, FaGithub, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

export default function ProfilePage() {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading, user: authUser } = useAuth(); // Lấy từ context

    // Dark mode (vẫn giữ riêng, nhưng có thể gộp với ThemeContext nếu có)
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme') setDarkMode(e.newValue === 'dark');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // User data state
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [fullName, setFullName] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [socialLinks, setSocialLinks] = useState({ linkedin: '', github: '', twitter: '' });

    const [updating, setUpdating] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState('info');

    // 1. Chuyển hướng nếu chưa đăng nhập (dùng AuthContext)
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    // 2. Fetch profile từ API (chỉ khi đã xác thực)
    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            const userData = response.data.user;
            setUser(userData);
            setFullName(userData.fullName || '');
            setAvatarPreview(userData.avatar || '');

            // Các thông tin bổ sung lưu trong localStorage (hoặc có thể lưu trên DB)
            setBio(localStorage.getItem('user_bio') || 'Passionate about AI and software development. Always eager to learn and share knowledge.');
            setPhone(localStorage.getItem('user_phone') || '');
            setLocation(localStorage.getItem('user_location') || 'Ho Chi Minh City, Vietnam');
            setWebsite(localStorage.getItem('user_website') || '');
            setSocialLinks({
                linkedin: localStorage.getItem('user_linkedin') || '',
                github: localStorage.getItem('user_github') || '',
                twitter: localStorage.getItem('user_twitter') || '',
            });
        } catch (err) {
            if (err.response?.status === 401) {
                // Nếu API trả về 401, logout (dùng AuthContext)
                // Tuy nhiên AuthContext đã có cơ chế, ta chỉ cần gọi logout hoặc để nó tự xử lý
                // Ở đây ta có thể trigger logout từ context nếu muốn
                // Nhưng tốt nhất là chỉ cần set error và navigate về login
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

    // Các hàm xử lý cập nhật (giữ nguyên)
    const updateProfileData = async (newFullName, newAvatar, customSuccessMsg = '') => {
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
            // Cập nhật localStorage cho user
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, ...updatedUser }));
            window.dispatchEvent(new Event('userUpdated'));
            setSuccess(customSuccessMsg || 'Profile updated successfully');
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

    const saveAdditionalInfo = () => {
        localStorage.setItem('user_bio', bio);
        localStorage.setItem('user_phone', phone);
        localStorage.setItem('user_location', location);
        localStorage.setItem('user_website', website);
        localStorage.setItem('user_linkedin', socialLinks.linkedin);
        localStorage.setItem('user_github', socialLinks.github);
        localStorage.setItem('user_twitter', socialLinks.twitter);
        setSuccess('Profile information saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
        setEditMode(false);
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
        setError('');
        setSuccess('');
        try {
            const compressedBase64 = await compressImage(file, 800, 0.7);
            setAvatarPreview(compressedBase64);
            const updated = await updateProfileData(undefined, compressedBase64, '✨ Avatar updated successfully!');
            if (!updated) setAvatarPreview(user?.avatar || '');
        } catch (err) {
            console.error('Avatar upload error:', err);
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
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper stats (có thể lấy từ API sau)
    const stats = [
        { icon: Zap, label: 'Interviews', value: '28', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', change: '+4' },
        { icon: Award, label: 'Avg Score', value: '87%', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', change: '+5%' },
        { icon: Clock, label: 'Hours Practiced', value: '56h', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', change: '+12h' },
        { icon: TrendingUp, label: 'Improvement', value: '+23%', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', change: 'This month' },
    ];

    const recentActivities = [
        { id: 1, action: 'Behavioral Interview', score: 94, date: '2 days ago', icon: Briefcase, type: 'success' },
        { id: 2, action: 'Technical: React & Node.js', score: 82, date: '5 days ago', icon: Zap, type: 'warning' },
        { id: 3, action: 'CV Review Completed', score: null, date: '1 week ago', icon: Edit3, type: 'info' },
        { id: 4, action: 'System Design Interview', score: 76, date: '2 weeks ago', icon: TrendingUp, type: 'default' },
    ];

    // Loading states
    if (authLoading || loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
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

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50'} py-6 px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-7xl mx-auto">
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
                        <div className={`relative overflow-hidden rounded-2xl shadow-xl transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 ${darkMode ? 'bg-gray-900/80 backdrop-blur-sm border border-gray-800' : 'bg-white/90 backdrop-blur-sm border border-white/60'}`}>
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 opacity-90"></div>
                            <div className="absolute top-0 left-0 w-full h-32 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 40%, white 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                            <div className="relative pt-16 pb-6 px-6 text-center">
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
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`w-full px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none text-center transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-white border-gray-200 focus:border-indigo-500'}`} autoFocus />
                                            <div className="flex gap-2 justify-center">
                                                <button type="submit" disabled={updating} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                                                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                                </button>
                                                <button type="button" onClick={() => setEditMode(false)} className="px-4 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all">Cancel</button>
                                            </div>
                                        </form>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${user.role === 'admin' ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                        {user.role === 'admin' ? 'Administrator' : 'Member'}
                                    </span>
                                </div>

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
                                    {phone && (
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all group">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Phone className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="text-sm">{phone}</span>
                                        </div>
                                    )}
                                    {location && (
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all group">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <MapPin className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="text-sm">{location}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-indigo-100 dark:border-gray-700">
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wide mb-2">Bio</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{bio}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {stats.map((stat, idx) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={idx} className={`group rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode ? 'bg-gray-900/80 border border-gray-800' : 'bg-white/80 border border-white/60'} backdrop-blur-sm`}>
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                                                <Icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                            {stat.change && (
                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                                    {stat.change}
                                                </span>
                                            )}
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

                    {/* RIGHT COLUMN */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                        <div className={`rounded-2xl shadow-xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800 backdrop-blur-sm' : 'bg-white/90 border-white/60 backdrop-blur-sm'}`}>
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 pt-5 pb-0">
                                <div className="flex gap-4">
                                    <button onClick={() => setActiveTab('info')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'info' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                        Personal Info
                                        {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>}
                                    </button>
                                    <button onClick={() => setActiveTab('social')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'social' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                        Social Links
                                        {activeTab === 'social' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>}
                                    </button>
                                </div>
                                {!editMode && (
                                    <button onClick={() => setEditMode(true)} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all">
                                        <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {!editMode ? (
                                    <>
                                        {activeTab === 'info' && (
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone Number</span>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">{phone || <span className="text-gray-400">Not provided</span>}</p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</span>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1 flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> {location}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Website</span>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">
                                                            {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{website.replace(/^https?:\/\//, '')}</a> : <span className="text-gray-400">Not provided</span>}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl col-span-full">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bio</span>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">{bio}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {activeTab === 'social' && (
                                            <div className="space-y-5">
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center">
                                                            <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">LinkedIn</p>
                                                            {socialLinks.linkedin ? <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">{socialLinks.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-sm text-gray-400">Not connected</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-full bg-gray-800/10 dark:bg-gray-700/50 flex items-center justify-center">
                                                            <FaGithub className="w-5 h-5 text-gray-800 dark:text-gray-300" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">GitHub</p>
                                                            {socialLinks.github ? <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">{socialLinks.github.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-sm text-gray-400">Not connected</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                                                            <FaTwitter className="w-5 h-5 text-[#1DA1F2]" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Twitter (X)</p>
                                                            {socialLinks.twitter ? <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all">{socialLinks.twitter.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="text-sm text-gray-400">Not connected</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); saveAdditionalInfo(); }} className="space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'}`} placeholder="+84 xxx xxx xxx" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
                                                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'}`} placeholder="City, Country" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Website</label>
                                                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'}`} placeholder="https://yourwebsite.com" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Bio</label>
                                                <textarea rows="3" value={bio} onChange={(e) => setBio(e.target.value)} className={`w-full px-4 py-2.5 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-200 focus:border-indigo-500'}`} placeholder="Tell us about yourself..."></textarea>
                                            </div>
                                            <div className="sm:col-span-2 pt-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Social Links</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <FaLinkedin className="w-5 h-5 text-[#0A66C2]" />
                                                        <input type="url" value={socialLinks.linkedin} onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="LinkedIn profile URL" />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <FaGithub className="w-5 h-5 text-gray-800 dark:text-gray-300" />
                                                        <input type="url" value={socialLinks.github} onChange={(e) => setSocialLinks({ ...socialLinks, github: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="GitHub profile URL" />
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <FaTwitter className="w-5 h-5 text-[#1DA1F2]" />
                                                        <input type="url" value={socialLinks.twitter} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Twitter/X profile URL" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end pt-4">
                                            <button type="submit" disabled={updating} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50">
                                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                                            </button>
                                            <button type="button" onClick={() => setEditMode(false)} className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-300">Cancel</button>
                                        </div>
                                    </form>
                                )}

                                {error && (
                                    <div className="mt-5 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="mt-5 flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm">{success}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={`rounded-2xl shadow-xl border transition-all ${darkMode ? 'bg-gray-900/80 border-gray-800 backdrop-blur-sm' : 'bg-white/90 border-white/60 backdrop-blur-sm'}`}>
                            <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
                                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl">
                                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Activity</h3>
                            </div>
                            <div className="p-5 divide-y divide-gray-100 dark:divide-gray-800">
                                {recentActivities.map(activity => {
                                    const Icon = activity.icon;
                                    const getScoreColor = (score) => {
                                        if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30';
                                        if (score >= 75) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
                                        return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
                                    };
                                    return (
                                        <div key={activity.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-lg px-2 transition-all">
                                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 group-hover:scale-110 transition-transform duration-300">
                                                <Icon className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.action}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {activity.date}</p>
                                            </div>
                                            {activity.score && <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${getScoreColor(activity.score)}`}>{activity.score}%</div>}
                                            {!activity.score && activity.type === 'info' && <div className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">Completed</div>}
                                        </div>
                                    );
                                })}
                                <button className="w-full mt-3 text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline py-2 transition-all hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 rounded-lg">View all activity →</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}