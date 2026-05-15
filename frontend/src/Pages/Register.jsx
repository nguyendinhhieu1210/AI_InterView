import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Lock, FileText, Brain, Mic, BarChart3, Sparkles,
    AlertCircle, CheckCircle, ChevronRight, Eye, EyeOff, Shield, Zap, Users, Clock, UserPlus
} from 'lucide-react';
import api from '../services/api';
import '../App.css';

export default function Register() {
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
    const navigate = useNavigate();

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

    const features = [
        { icon: FileText, label: 'AI-Powered CV Analysis', color: 'text-blue-500' },
        { icon: Brain, label: 'Smart Question Generation', color: 'text-indigo-500' },
        { icon: Mic, label: 'Real-time Voice Interview', color: 'text-purple-500' },
        { icon: BarChart3, label: 'Instant Scoring & Feedback', color: 'text-emerald-500' },
    ];
    const stats = [
        { value: '500+', label: 'CVs Analyzed', icon: Users },
        { value: '95%', label: 'Accuracy Rate', icon: Zap },
        { value: '24/7', label: 'AI Support', icon: Clock },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg...')] opacity-30"></div>
            <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40"></div>
            <div className="absolute top-0 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40"></div>
            <div className="absolute bottom-0 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-30"></div>

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left info panel */}
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
                                Ready to Ace Your
                                <span className="block bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">AI Interview?</span>
                            </h1>
                            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                                Join thousands of candidates who've improved their interview skills with our AI-driven platform.
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

                {/* Register Card */}
                <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden">
                        <div className="relative pt-8 px-8 pb-6 text-center bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
                            <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-md mb-4">
                                <Sparkles className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Create an account</h2>
                            <p className="text-gray-500 text-sm mt-1">Start your AI interview journey today</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                                    <UserPlus className="w-4 h-4 text-indigo-500" />
                                    Full Name
                                </label>
                                <input
                                    name="fullName"
                                    type="text"
                                    placeholder="Nguyen Van A"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
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
                                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none text-gray-800 bg-white ${focusedField === 'userName'
                                        ? 'border-indigo-400 ring-2 ring-indigo-100'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                    required
                                />
                                {suggestions.length > 0 && (
                                    <div className="mt-2 animate-slideDown">
                                        <p className="text-xs text-gray-500 mb-1">Available suggestions:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSuggestionClick(sug)}
                                                    className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100"
                                                >
                                                    {sug}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none pr-12"
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
                                {form.password && (
                                    <div className="mt-2 space-y-1 animate-slideDown">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-500">Strength:</span>
                                            <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                                                {getPasswordStrengthLabel()}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} style={{ width: `${passwordStrength}%` }} />
                                        </div>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Min. 6 chars, uppercase, number & symbol
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
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
                                        className={`w-full px-4 py-3 rounded-xl border pr-12 ${passwordMatchError
                                            ? 'border-red-300 ring-2 ring-red-100'
                                            : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                                            } outline-none transition`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500"
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
                                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-400"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600">
                                    I agree to the{' '}
                                    <span className="text-indigo-600 hover:underline">Terms of Service</span> and{' '}
                                    <span className="text-indigo-600 hover:underline">Privacy Policy</span>
                                </label>
                            </div>
                            {termsError && <p className="text-red-500 text-xs -mt-1">{termsError}</p>}

                            {generalError && !suggestions.length && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{generalError}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-xl animate-slideDown">
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
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-3 bg-white text-gray-400">Already have an account?</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="w-full py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 hover:border-indigo-300 transition"
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