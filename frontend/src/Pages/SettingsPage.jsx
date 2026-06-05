import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Bell, Mail, Save, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, BellRing, Shield, KeyRound } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleDarkMode } = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [authLoading, isAuthenticated, navigate]);

  const [emailNotifications, setEmailNotifications] = useState(() => localStorage.getItem('emailNotifications') === 'true');
  const [browserNotifications, setBrowserNotifications] = useState(() => localStorage.getItem('browserNotifications') === 'true');
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
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen transition-colors py-8 px-4 sm:px-6 lg:px-8 bg-bg text-text">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/welcome')}
          className="group mb-8 flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 font-medium"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">Settings</h1>
          <p className="text-muted mt-1">Manage your preferences and account security</p>
        </div>

        <div className="space-y-6">
          {/* Appearance Card */}
          <div className="rounded-2xl shadow-soft border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Appearance</h3>
                  <p className="text-xs text-muted">Customize your visual experience</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  <span className="font-medium text-text">Dark Mode</span>
                  <p className="text-sm text-muted mt-0.5">Switch between light and dark themes</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  style={{ backgroundColor: theme === 'dark' ? 'var(--primary)' : 'var(--border-color)' }}
                >
                  <span className={`${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300`} />
                  <span className="absolute left-1.5 text-[10px] text-white/70">{theme !== 'dark' && '☀️'}</span>
                  <span className="absolute right-1.5 text-[10px] text-white/70">{theme === 'dark' && '🌙'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="rounded-2xl shadow-soft border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-success to-teal-500 shadow-md">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Notifications</h3>
                  <p className="text-xs text-muted">Manage how you receive updates</p>
                </div>
              </div>
              <div className="space-y-5 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted" />
                    <div>
                      <p className="font-medium text-text">Email Notifications</p>
                      <p className="text-sm text-muted mt-0.5">Receive interview results and tips</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BellRing className="w-5 h-5 text-muted" />
                    <div>
                      <p className="font-medium text-text">Browser Notifications</p>
                      <p className="text-sm text-muted mt-0.5">Show popups for new activity</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={browserNotifications}
                      onChange={(e) => setBrowserNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <button
                  onClick={saveNotificationPrefs}
                  className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:brightness-105"
                >
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="rounded-2xl shadow-soft border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-warning to-orange-500 shadow-md">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text">Security</h3>
                  <p className="text-xs text-muted">Update your password</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-5 pt-2 border-t border-border">
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-primary outline-none pr-12 transition-colors bg-card border-border text-text"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(!showOld)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                    >
                      {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-primary outline-none pr-12 transition-colors bg-card border-border text-text"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                    >
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-primary outline-none pr-12 transition-colors bg-card border-border text-text"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <div className="flex items-center gap-2 text-error bg-error/10 p-3 rounded-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-xl">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{passwordSuccess}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={changing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-warning to-orange-500 text-white rounded-xl transition-all shadow-md disabled:opacity-70 hover:brightness-105"
                >
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