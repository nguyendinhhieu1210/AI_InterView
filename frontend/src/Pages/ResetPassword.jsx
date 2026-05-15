import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import api from '../services/api';

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || '';
    const otp = location.state?.otp || '';

    const calculateStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 6) strength += 25;
        if (/[A-Z]/.test(pass)) strength += 25;
        if (/[0-9]/.test(pass)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
        setPasswordStrength(strength);
    };

    const getStrengthColor = () => {
        if (passwordStrength < 25) return 'bg-red-400';
        if (passwordStrength < 50) return 'bg-orange-400';
        if (passwordStrength < 75) return 'bg-yellow-400';
        if (passwordStrength < 100) return 'bg-green-400';
        return 'bg-emerald-500';
    };

    const getStrengthLabel = () => {
        if (passwordStrength < 25) return 'Very Weak';
        if (passwordStrength < 50) return 'Weak';
        if (passwordStrength < 75) return 'Medium';
        if (passwordStrength < 100) return 'Strong';
        return 'Very Strong';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!newPassword || !confirmPassword) {
            setError('Please fill in both fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                otp,
                newPassword,
                confirmPassword
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset password failed');
        } finally {
            setLoading(false);
        }
    };

    if (!email || !otp) {
        navigate('/forgot-password');
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden px-4 py-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg...')] opacity-30"></div>
            <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40"></div>
            <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40"></div>
            <div className="absolute bottom-0 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-30"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
                    <div className="relative pt-8 px-8 pb-6 text-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                        <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-md mb-4">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Create new password</h2>
                        <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account</p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <Lock className="w-4 h-4 text-indigo-500" />
                                    New password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            calculateStrength(e.target.value);
                                        }}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {newPassword && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Strength:</span>
                                            <span className={`font-medium ${getStrengthColor().replace('bg-', 'text-')}`}>
                                                {getStrengthLabel()}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${getStrengthColor()} transition-all duration-300`} style={{ width: `${passwordStrength}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <Lock className="w-4 h-4 text-indigo-500" />
                                    Confirm new password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
                                    >
                                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl animate-shake">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        Reset password
                                        <CheckCircle className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-indigo-300 transition"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </button>
                        </form>
                    ) : (
                        <div className="p-8 text-center space-y-4 animate-slideDown">
                            <div className="inline-flex p-3 bg-green-100 rounded-full">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Password reset successful!</h3>
                            <p className="text-gray-500">Redirecting you to login...</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slideDown { animation: slideDown 0.2s ease-out; }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
}