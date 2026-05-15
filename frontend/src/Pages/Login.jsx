// Pages/Login.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail, Lock, Brain, Eye, EyeOff, ChevronRight, AlertCircle,
    CheckCircle, Shield, Zap, Users, Clock, ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth();
    const redirectTimeoutRef = useRef(null);

    // Cleanup timeout khi component unmount
    useEffect(() => {
        return () => {
            if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
        };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.email || !form.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', {
                email: form.email,
                password: form.password,
                rememberMe
            });

            // =========================
            // DEBUG LOGIN RESPONSE
            // =========================
            console.log('========== FULL RESPONSE ==========');
            console.log(response);

            console.log('========== RESPONSE DATA ==========');
            console.log(response.data);

            const { token, user } = response.data;

            console.log('========== TOKEN ==========');
            console.log(token);

            console.log('========== USER ==========');
            console.log(user);

            // =========================
            // LOGIN
            // =========================
            login(token, user);

            // Kiểm tra localStorage sau khi login
            setTimeout(() => {
                console.log('========== LOCAL STORAGE TOKEN ==========');
                console.log(localStorage.getItem('token'));

                console.log('========== LOCAL STORAGE USER ==========');
                console.log(JSON.parse(localStorage.getItem('user')));
            }, 100);

            // Redirect sau 2 giây
            redirectTimeoutRef.current = setTimeout(() => {
                navigate('/welcome');
            }, 2000);

        } catch (err) {
            console.error('LOGIN ERROR:', err);

            setError(
                err.response?.data?.message ||
                'Login failed. Please try again.'
            );

            setLoading(false);
        }
    };

    const features = [
        { icon: Brain, label: 'AI-Powered Analysis', color: 'text-indigo-500' },
        { icon: Zap, label: 'Instant Feedback', color: 'text-blue-500' },
        { icon: Users, label: 'Community Learning', color: 'text-purple-500' },
    ];
    const stats = [
        { value: '10K+', label: 'Active Users', icon: Users },
        { value: '95%', label: 'Success Rate', icon: CheckCircle },
        { value: '24/7', label: 'AI Support', icon: Clock },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            {/* Background pattern và hiệu ứng giữ nguyên */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
            <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40"></div>
            <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40"></div>
            <div className="absolute bottom-0 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-30"></div>

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left panel */}
                <div className="hidden lg:block flex-1">
                    <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full blur-2xl opacity-60"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">AI Interview System</h2>
                                    <p className="text-gray-500 text-sm">Intelligent recruitment platform</p>
                                </div>
                            </div>
                            <h1 className="text-4xl xl:text-5xl font-bold mb-4 text-gray-800 leading-tight">
                                Welcome Back to
                                <span className="block bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">Your Future</span>
                            </h1>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Continue your journey toward interview mastery. Access your personalized dashboard, track progress, and get AI-powered insights.
                            </p>
                            <div className="space-y-4 mb-10">
                                {features.map((feature, idx) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div key={idx} className="flex items-center gap-3 group">
                                            <div className="p-2 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl group-hover:scale-110 transition-transform">
                                                <Icon className={`w-5 h-5 ${feature.color}`} />
                                            </div>
                                            <span className="text-gray-700 font-medium">{feature.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                {stats.map((stat, idx) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={idx} className="text-center">
                                            <div className="flex justify-center mb-2">
                                                <Icon className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                                            <div className="text-xs text-gray-500">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form */}
                <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
                        <div className="relative pt-8 px-8 pb-6 text-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                            <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-md mb-4">
                                <Shield className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
                            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <Mail className="w-4 h-4 text-indigo-500" />
                                    Email Address
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none text-gray-800 bg-white ${focusedField === 'email' ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'}`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <Lock className="w-4 h-4 text-indigo-500" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none text-gray-800 bg-white pr-12 ${focusedField === 'password' ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-indigo-300'}`}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl animate-shake">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-400" />
                                    <span className="text-sm text-gray-600">Remember me</span>
                                </label>
                                <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-600 hover:underline">Forgot password?</button>
                            </div>
                            <button type="submit" disabled={loading} className="relative w-full py-3.5 rounded-xl font-semibold text-white text-base overflow-hidden group bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70">
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Signing in...</>
                                    ) : (
                                        <>Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </span>
                            </button>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">New to AI Interview?</span></div>
                            </div>
                            <Link to="/register" className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-indigo-300 transition-all group">
                                <ChevronRight className="w-4 h-4 text-indigo-500" /><span className="font-medium">Create an account</span>
                            </Link>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes blob { 0% { transform: translate(0px,0px) scale(1); } 33% { transform: translate(30px,-50px) scale(1.1); } 66% { transform: translate(-20px,20px) scale(0.9); } 100% { transform: translate(0px,0px) scale(1); } }
                .animate-blob { animation: blob 7s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
                @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
        </div>
    );
}