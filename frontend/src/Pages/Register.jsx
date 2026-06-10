import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Lock, FileText, Brain, ClipboardList, BarChart3, Sparkles,
    AlertCircle, CheckCircle, ChevronRight, Eye, EyeOff, Shield, Zap, Users, Clock, UserPlus,
    Code, Cpu, LayoutTemplate, Target, Award, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import '../App.css';

export default function Register() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    const [form, setForm] = useState({
        userName: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordMatchError, setPasswordMatchError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [termsError, setTermsError] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [generalError, setGeneralError] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        setGeneralError('');
        setSuggestions([]);
        setSuccessMessage('');

        if (name === 'password') {
            calculatePasswordStrength(value);
            if (form.confirmPassword && value !== form.confirmPassword) {
                setPasswordMatchError('Passwords do not match');
            } else {
                setPasswordMatchError('');
            }
        }
        if (name === 'confirmPassword') {
            if (form.password && value !== form.password) {
                setPasswordMatchError('Passwords do not match');
            } else {
                setPasswordMatchError('');
            }
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        setPasswordStrength(strength);
    };

    const getPasswordStrengthLabel = () => {
        if (passwordStrength < 25) return 'Very Weak';
        if (passwordStrength < 50) return 'Weak';
        if (passwordStrength < 75) return 'Medium';
        if (passwordStrength < 100) return 'Strong';
        return 'Very Strong';
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength < 25) return 'bg-red-400';
        if (passwordStrength < 50) return 'bg-orange-400';
        if (passwordStrength < 75) return 'bg-yellow-400';
        if (passwordStrength < 100) return 'bg-green-400';
        return 'bg-emerald-500';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError('');
        setSuggestions([]);
        setSuccessMessage('');

        if (form.password !== form.confirmPassword) {
            setPasswordMatchError('Passwords do not match');
            return;
        }
        if (!acceptedTerms) {
            setTermsError('Please accept the Terms of Service');
            return;
        }
        setTermsError('');

        setLoading(true);
        try {
            const response = await api.post('/auth/register', {
                userName: form.userName,
                fullName: form.fullName,
                email: form.email,
                password: form.password,
                confirmPassword: form.confirmPassword,
            });
            setSuccessMessage('Registration successful! Redirecting to verification...');
            localStorage.setItem('tempEmail', response.data.email);
            setTimeout(() => {
                navigate('/verify-otp', { state: { email: response.data.email, purpose: 'email-verification' } });
            }, 2000);
        } catch (error) {
            const errData = error.response?.data;
            if (errData) {
                if (errData.usernameTaken) {
                    setGeneralError(errData.message);
                    setSuggestions(errData.suggestions || []);
                } else {
                    setGeneralError(errData.message || 'Registration failed, please try again');
                }
            } else {
                setGeneralError('Unable to connect to server');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setForm({ ...form, userName: suggestion });
        setGeneralError('');
        setSuggestions([]);
    };

    const interviewTypes = [
        { icon: FileText, label: 'CV Analysis Interview', description: 'AI analyzes your CV and asks relevant questions', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        { icon: Brain, label: 'Adaptive Interview', description: 'Questions adapt to your skill level in real-time', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
        { icon: ClipboardList, label: 'Standard Interview', description: 'Traditional Q&A format with AI scoring', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
        { icon: Code, label: 'Coding Interview', description: 'Live coding challenges with AI evaluation', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    ];

    const features = [
        { icon: Target, label: 'Personalized Questions', color: 'text-rose-500' },
        { icon: Zap, label: 'Real-time Feedback', color: 'text-amber-500' },
        { icon: Award, label: 'Skill Assessment', color: 'text-cyan-500' },
        { icon: TrendingUp, label: 'Progress Tracking', color: 'text-lime-500' },
    ];

    const stats = [
        { value: '1000+', label: 'Interviews Completed', icon: Users },
        { value: '96%', label: 'Satisfaction Rate', icon: Zap },
        { value: '24/7', label: 'AI Support', icon: Clock },
    ];

    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 px-4 py-8 sm:px-6 lg:px-8 ${
            isDark
                ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900'
                : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
        }`}>
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left info panel */}
                <div className="hidden lg:block flex-1">
                    <div className={`relative rounded-3xl p-8 shadow-xl border transition-all duration-300 ${
                        isDark
                            ? 'bg-gray-800/60 backdrop-blur-sm border-gray-700'
                            : 'bg-white/60 backdrop-blur-sm border-white/50'
                    }`}>
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        AI Interview System
                                    </h2>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Intelligent recruitment platform
                                    </p>
                                </div>
                            </div>

                            <h1 className={`text-4xl xl:text-5xl font-bold mb-6 leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Ready to Ace Your
                                <span className="block bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                                    AI Interview?
                                </span>
                            </h1>

                            <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                Join thousands of candidates who've improved their interview skills with our AI-driven platform.
                            </p>

                            {/* Interview Types */}
                            <div className="mb-8">
                                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Cpu className="w-4 h-4 text-indigo-500" />
                                    Interview Modes
                                </h3>
                                <div className="space-y-3">
                                    {interviewTypes.map((type, idx) => {
                                        const Icon = type.icon;
                                        return (
                                            <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${type.bg} hover:scale-[1.02]`}>
                                                <div className={`p-2 rounded-lg ${type.bg}`}>
                                                    <Icon className={`w-5 h-5 ${type.color}`} />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                        {type.label}
                                                    </p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {type.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="flex flex-wrap gap-3 mb-8">
                                {features.map((feature, idx) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                            <Icon className={`w-4 h-4 ${feature.color}`} />
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {feature.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {stats.map((stat, idx) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={idx} className="text-center">
                                            <div className="flex justify-center mb-2">
                                                <Icon className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                                {stat.value}
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {stat.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Register Card */}
                <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
                    <div className={`rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
                        isDark
                            ? 'bg-gray-800 border-gray-700 shadow-gray-950/50'
                            : 'bg-white border-gray-100 shadow-indigo-100/50'
                    }`}>
                        <div className={`relative pt-8 px-8 pb-6 text-center border-b ${
                            isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gradient-to-r from-gray-50 to-white border-gray-100'
                        }`}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                            <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-md mb-4">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                Create an account
                            </h2>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Start your AI interview journey today
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <UserPlus className="w-4 h-4 text-indigo-500" />
                                    Full Name
                                </label>
                                <input
                                    name="fullName"
                                    type="text"
                                    placeholder="Nguyen Van A"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                            : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                    }`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <User className="w-4 h-4 text-indigo-500" />
                                    Username
                                </label>
                                <input
                                    name="userName"
                                    type="text"
                                    placeholder="johndoe"
                                    value={form.userName}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('userName')}
                                    onBlur={() => setFocusedField(null)}
                                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none ${
                                        focusedField === 'userName'
                                            ? 'border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/30'
                                            : `border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500`
                                    } ${
                                        isDark
                                            ? 'bg-gray-700 text-white placeholder-gray-400'
                                            : 'bg-white text-gray-800'
                                    }`}
                                    required
                                />
                                {suggestions.length > 0 && (
                                    <div className="mt-2 animate-slideDown">
                                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Available suggestions:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSuggestionClick(sug)}
                                                    className={`text-xs px-2 py-1 rounded-lg transition ${
                                                        isDark
                                                            ? 'bg-indigo-950/50 text-indigo-300 hover:bg-indigo-900'
                                                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                    }`}
                                                >
                                                    {sug}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Mail className="w-4 h-4 text-indigo-500" />
                                    Email Address
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                            : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                    }`}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
                                        className={`w-full px-4 py-3 rounded-xl border outline-none pr-12 ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                                : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                        }`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                                            isDark ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'
                                        }`}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {form.password && (
                                    <div className="mt-2 space-y-1 animate-slideDown">
                                        <div className="flex justify-between text-xs">
                                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Strength:</span>
                                            <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                                                {getPasswordStrengthLabel()}
                                            </span>
                                        </div>
                                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                            <div className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} style={{ width: `${passwordStrength}%` }} />
                                        </div>
                                        <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            <CheckCircle className="w-3 h-3" /> Min. 6 chars, uppercase, number & symbol
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <Lock className="w-4 h-4 text-indigo-500" />
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 rounded-xl border pr-12 outline-none transition ${
                                            passwordMatchError
                                                ? 'border-red-300 ring-2 ring-red-100 dark:border-red-700 dark:ring-red-900/30'
                                                : isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                                                    : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                        }`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                                            isDark ? 'text-gray-400 hover:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'
                                        }`}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {passwordMatchError && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-red-500 text-xs animate-shake">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{passwordMatchError}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-start gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptedTerms}
                                    onChange={(e) => {
                                        setAcceptedTerms(e.target.checked);
                                        if (termsError) setTermsError('');
                                    }}
                                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <label htmlFor="terms" className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    I agree to the{' '}
                                    <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                                    <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Privacy Policy</span>
                                </label>
                            </div>
                            {termsError && <p className="text-red-500 text-xs -mt-1">{termsError}</p>}

                            {generalError && !suggestions.length && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{generalError}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-xl animate-slideDown">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className={`w-full border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className={`px-3 ${isDark ? 'bg-gray-800 text-gray-500' : 'bg-white text-gray-400'}`}>
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition ${
                                    isDark
                                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-indigo-500'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-indigo-300'
                                }`}
                            >
                                <Shield className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">Sign In Instead</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
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