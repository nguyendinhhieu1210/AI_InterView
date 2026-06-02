import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Moon, Sun, Bell, Mail, Lock, Globe, Save, Loader2,
    AlertCircle, CheckCircle, Eye, EyeOff, BellRing, BellOff,
    Shield, Languages, Palette, KeyRound
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { theme, toggleDarkMode } = useTheme();       // 👈 Lấy theme (string)
    const darkMode = theme === 'dark';                 // 👈 Tính boolean
    const { language, changeLanguage, loadingLang } = useLanguage();
    const { isAuthenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [authLoading, isAuthenticated, navigate]);

    const [emailNotifications, setEmailNotifications] = useState(() => {
        return localStorage.getItem('emailNotifications') === 'true';
    });
    const [browserNotifications, setBrowserNotifications] = useState(() => {
        return localStorage.getItem('browserNotifications') === 'true';
    });

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changing, setChanging] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const saveNotificationPrefs = () => {
        localStorage.setItem('emailNotifications', emailNotifications);
        localStorage.setItem('browserNotifications', browserNotifications);
        setPasswordSuccess('Notification settings saved!');
        setTimeout(() => setPasswordSuccess(''), 3000);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        setChanging(true);
        try {
            await api.put('/users/change-password', { oldPassword, newPassword, confirmPassword });
            setPasswordSuccess('Password changed successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
            setTimeout(() => setPasswordError(''), 4000);
        } finally {
            setChanging(false);
        }
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

    if (!isAuthenticated) return null;

    return (
        <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'} py-8 px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/welcome')}
                    className="group mb-8 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and account security</p>
                </div>

                <div className="space-y-6">
                    {/* Appearance Card */}
                    <div className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                                    <Palette className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Appearance</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Customize your visual experience</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                <div>
                                    <span className="font-medium text-gray-800 dark:text-white">Dark Mode</span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Switch between light and dark themes</p>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className="relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                    style={{ backgroundColor: darkMode ? '#4f46e5' : '#cbd5e1' }}
                                >
                                    <span className={`${darkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300`} />
                                    <span className="absolute left-1.5 text-[10px] text-white/70">{!darkMode && '☀️'}</span>
                                    <span className="absolute right-1.5 text-[10px] text-white/70">{darkMode && '🌙'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Language Card */}
                    <div className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                                    <Languages className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Language</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred language</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                <div>
                                    <span className="font-medium text-gray-800 dark:text-white">Interface Language</span>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">App content will be translated</p>
                                </div>
                                <select
                                    value={language}
                                    onChange={(e) => changeLanguage(e.target.value)}
                                    disabled={loadingLang}
                                    className={`px-4 py-2 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                                >
                                    <option value="en">English</option>
                                    <option value="vi">Tiếng Việt</option>
                                </select>
                            </div>
                            {loadingLang && (
                                <div className="mt-3 flex items-center gap-2 text-indigo-500 text-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Notifications</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Manage how you receive updates</p>
                                </div>
                            </div>
                            <div className="space-y-5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">Email Notifications</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receive interview results and tips</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <BellRing className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">Browser Notifications</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Show popups for new activity</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={browserNotifications} onChange={(e) => setBrowserNotifications(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                </div>
                                <button onClick={saveNotificationPrefs} className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg">
                                    <Save className="w-4 h-4" /> Save Preferences
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className={`group rounded-2xl shadow-lg border transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${darkMode ? 'bg-gray-800/80 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-white/50 backdrop-blur-sm'}`}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Security</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Update your password</p>
                                </div>
                            </div>
                            <form onSubmit={handleChangePassword} className="space-y-5 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showOld ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showNew ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-indigo-500 outline-none pr-12 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                            required
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                {passwordError && (
                                    <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/30 p-3 rounded-xl">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" /> <span className="text-sm">{passwordError}</span>
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" /> <span className="text-sm">{passwordSuccess}</span>
                                    </div>
                                )}
                                <button type="submit" disabled={changing} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition-all shadow-md disabled:opacity-70">
                                    {changing ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
                                    Change Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}