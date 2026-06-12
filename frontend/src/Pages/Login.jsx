// Pages/Login.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Brain,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Shield,
  Zap,
  Users,
  Clock,
  ArrowRight,
  FileText,
  Code,
  Cpu,
  Target,
  Award,
  TrendingUp,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Login() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const redirectTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError("");
  };

  // Pages/Login.jsx - Phiên bản có debug
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
        rememberMe,
      });

      const { token, user, refreshToken } = response.data;

      // Dùng chung login() cho mọi role, key chung token/user (đã fix ở AuthContext)
      login(token, user, refreshToken);

      if (user.role === "admin" || user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/welcome", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
      setLoading(false);
    }
  };

  const interviewTypes = [
    {
      icon: FileText,
      label: "CV Analysis",
      description: "AI analyzes your CV",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      icon: Brain,
      label: "Adaptive",
      description: "Real-time skill adaptation",
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    {
      icon: Users,
      label: "Standard",
      description: "Traditional Q&A format",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      icon: Code,
      label: "Coding",
      description: "Live coding challenges",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  const features = [
    { icon: Target, label: "Personalized Questions", color: "text-rose-500" },
    { icon: Zap, label: "Real-time Feedback", color: "text-amber-500" },
    { icon: Award, label: "Skill Assessment", color: "text-cyan-500" },
    { icon: TrendingUp, label: "Progress Tracking", color: "text-lime-500" },
  ];

  const stats = [
    { value: "10K+", label: "Active Users", icon: Users },
    { value: "95%", label: "Success Rate", icon: CheckCircle },
    { value: "24/7", label: "AI Support", icon: Clock },
  ];

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 px-4 py-8 sm:px-6 lg:px-8 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900"
          : "bg-gradient-to-br from-slate-50 via-white to-blue-50"
      }`}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left panel */}
        <div className="hidden lg:block flex-1">
          <div
            className={`relative rounded-3xl p-8 shadow-xl border transition-all duration-300 ${
              isDark
                ? "bg-gray-800/60 backdrop-blur-sm border-gray-700"
                : "bg-white/60 backdrop-blur-sm border-white/50"
            }`}
          >
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                  >
                    AI Interview System
                  </h2>
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Intelligent recruitment platform
                  </p>
                </div>
              </div>
              <h1
                className={`text-4xl xl:text-5xl font-bold mb-6 leading-tight ${isDark ? "text-white" : "text-gray-800"}`}
              >
                Welcome Back to
                <span className="block bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  Your Future
                </span>
              </h1>
              <p
                className={`text-lg mb-8 leading-relaxed ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                Continue your journey toward interview mastery. Access your
                personalized dashboard, track progress, and get AI-powered
                insights.
              </p>

              {/* Interview Types */}
              <div className="mb-8">
                <h3
                  className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  Interview Modes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {interviewTypes.map((type, idx) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg transition-all ${type.bg}`}
                      >
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <div>
                          <p
                            className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                          >
                            {type.label}
                          </p>
                          <p
                            className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {type.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-8">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    >
                      <Icon className={`w-3.5 h-3.5 ${feature.color}`} />
                      <span
                        className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}
                      >
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
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                      >
                        {stat.value}
                      </div>
                      <div
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {stat.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
          <div
            className={`rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
              isDark
                ? "bg-gray-800 border-gray-700 shadow-gray-950/50"
                : "bg-white border-gray-100 shadow-indigo-100/50"
            }`}
          >
            <div
              className={`relative pt-8 px-8 pb-6 text-center border-b ${
                isDark
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gradient-to-r from-gray-50 to-white border-gray-100"
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"></div>
              <div className="inline-flex p-3 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl shadow-md mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
              >
                Welcome back
              </h2>
              <p
                className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label
                  className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  <Mail className="w-4 h-4 text-indigo-500" />
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="hello@example.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 ${
                    focusedField === "email"
                      ? "border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/30"
                      : `border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500`
                  } ${
                    isDark
                      ? "bg-gray-700 text-white placeholder-gray-400"
                      : "bg-white text-gray-800"
                  }`}
                  required
                />
              </div>

              <div>
                <label
                  className={`flex items-center gap-2 text-sm font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  <Lock className="w-4 h-4 text-indigo-500" />
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 pr-12 ${
                      focusedField === "password"
                        ? "border-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/30"
                        : `border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500`
                    } ${
                      isDark
                        ? "bg-gray-700 text-white placeholder-gray-400"
                        : "bg-white text-gray-800"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition ${
                      isDark
                        ? "text-gray-400 hover:text-indigo-400"
                        : "text-gray-400 hover:text-indigo-500"
                    }`}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-xl animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-400 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 rounded-xl font-semibold text-white text-base overflow-hidden group bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-full border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  ></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span
                    className={`px-3 ${isDark ? "bg-gray-800 text-gray-500" : "bg-white text-gray-400"}`}
                  >
                    New to AI Interview?
                  </span>
                </div>
              </div>

              <Link
                to="/"
                className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all group ${
                  isDark
                    ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 hover:border-indigo-500"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-indigo-300"
                }`}
              >
                <ChevronRight className="w-4 h-4 text-indigo-500" />
                <span className="font-medium">Create an account</span>
              </Link>
            </form>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes shake { 
                    0%,100%{transform:translateX(0)} 
                    25%{transform:translateX(-4px)} 
                    75%{transform:translateX(4px)} 
                }
                .animate-shake { animation: shake 0.3s ease-in-out; }
            `}</style>
    </div>
  );
}
