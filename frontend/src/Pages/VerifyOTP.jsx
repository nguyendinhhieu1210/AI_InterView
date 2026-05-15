import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Key, CheckCircle, AlertCircle, ArrowLeft, Mail, Shield } from 'lucide-react';
import api from '../services/api';

export default function VerifyOTP() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [redirectDelay, setRedirectDelay] = useState(false); // For reset password OTP delay
    const navigate = useNavigate();
    const location = useLocation();

    // Get email and purpose from state (or localStorage for email verification)
    const email = location.state?.email || localStorage.getItem('tempEmail') || '';
    const purpose = location.state?.purpose || 'email-verification'; // 'email-verification' or 'reset-password'

    useEffect(() => {
        if (!email) {
            // If no email, go back to home or register
            navigate('/');
        }
    }, [email, navigate]);

    // Countdown after successful email verification
    useEffect(() => {
        let timer;
        if (success && purpose === 'email-verification') {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/login');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [success, purpose, navigate]);

    // Delay navigation for reset password OTP success (2 seconds)
    useEffect(() => {
        let timer;
        if (redirectDelay) {
            timer = setTimeout(() => {
                navigate('/reset-password', { state: { email, otp } });
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [redirectDelay, navigate, email, otp]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp || otp.length < 6) {
            setError('Please enter the 6-digit OTP code');
            return;
        }
        setLoading(true);
        try {
            if (purpose === 'email-verification') {
                // Verify email during registration
                await api.post('/auth/verify-email', { email, otp });
                setSuccess(true);
                localStorage.removeItem('tempEmail');
            } else if (purpose === 'reset-password') {
                // Verify OTP for password reset
                const response = await api.post('/auth/verify-otp', { email, otp });
                if (response.data.verified) {
                    // OTP valid -> show success and delay navigation
                    setSuccess(true);
                    setRedirectDelay(true);
                } else {
                    setError('Invalid OTP code');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP code');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setLoading(true);
        try {
            if (purpose === 'email-verification') {
                await api.post('/auth/resend-verify-email', { email });
            } else if (purpose === 'reset-password') {
                await api.post('/auth/forgot-password', { email });
            }
            alert('A new OTP code has been sent to your email');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to resend code, please try again');
        } finally {
            setLoading(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden px-4 py-8">
            {/* Background decorations */}
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
                        <h2 className="text-2xl font-bold text-gray-800">
                            {purpose === 'email-verification' ? 'Verify Email' : 'Verify OTP'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            {purpose === 'email-verification' 
                                ? 'We have sent a 6-digit code to' 
                                : 'Enter the OTP code sent to your email'}
                        </p>
                        <p className="text-indigo-600 font-medium text-sm">{email}</p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <Key className="w-4 h-4 text-indigo-500" />
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition text-center text-2xl tracking-widest font-mono"
                                    maxLength={6}
                                    required
                                />
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
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Verify
                                        <CheckCircle className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
                                >
                                    Didn't receive code? Resend
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate(purpose === 'email-verification' ? '/register' : '/login')}
                                className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-indigo-300 transition"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {purpose === 'email-verification' ? 'Back to registration' : 'Back to login'}
                            </button>
                        </form>
                    ) : (
                        // Success screen
                        <div className="p-8 text-center space-y-4 animate-slideDown">
                            <div className="inline-flex p-3 bg-green-100 rounded-full">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {purpose === 'email-verification' ? 'Registration Successful!' : 'OTP Verified!'}
                            </h3>
                            <p className="text-gray-600">
                                {purpose === 'email-verification' 
                                    ? 'Congratulations! Your account has been successfully created. We hope you have a great experience with the AI Interview System.'
                                    : 'OTP validated successfully. Redirecting you to reset your password...'}
                            </p>
                            {purpose === 'email-verification' && (
                                <p className="text-sm text-gray-400">
                                    Redirecting to login in {countdown} seconds...
                                </p>
                            )}
                            {purpose === 'reset-password' && (
                                <div className="flex justify-center">
                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
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