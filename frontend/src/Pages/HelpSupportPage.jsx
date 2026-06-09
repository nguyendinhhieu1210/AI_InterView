import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Zap,
  HelpCircle,
  BarChart3,
  MessageCircle,
  FileText,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  CheckCircle,
  Clock,
  ArrowLeft,
  PlayCircle,
  Loader2,
  Code,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

export default function HelpSupportPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [isLoggingOut] = useState(false);
  const guideRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  const scrollToGuide = () => {
    guideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (authLoading) {
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

  const features = [
    {
      id: "standard",
      title: "📋 Standard Interview",
      icon: MessageCircle,
      gradient: "from-primary to-secondary",
      badgeColor: "bg-primary/10 text-primary",
      description:
        "Manually enter any topic / technology you want to practice. AI generates MCQ + essay questions tailored to your input.",
      steps: [
        "Step 1: Enter a topic (e.g., Java, React, OOP, Node.js, SQL)",
        "Step 2: Choose difficulty (Easy / Medium / Hard)",
        "Step 3: AI generates 6–8 questions (MCQ + Essay) based on the topic",
        "Step 4: Answer questions directly in the interface",
        "Step 5: Submit → AI grades, explains answers, and gives detailed feedback",
      ],
    },
    {
      id: "cv",
      title: "📄 CV‑Based Interview",
      icon: FileText,
      gradient: "from-emerald-500 to-teal-500",
      badgeColor: "bg-emerald-500/10 text-emerald-600",
      description:
        "Upload your CV – AI extracts skills, projects, and experience to generate personalized questions.",
      steps: [
        "Step 1: Upload your CV (PDF)",
        "Step 2: AI analyzes and extracts information (skills, projects, experience)",
        "Step 3: Select focus areas / skills",
        "Step 4: AI generates MCQ + essay questions based on your CV",
        "Step 5: Answer and receive score + detailed feedback",
      ],
    },
    {
      id: "adaptive",
      title: "🤖 Adaptive Interview",
      icon: Brain,
      gradient: "from-violet-500 to-purple-500",
      badgeColor: "bg-violet-500/10 text-violet-600",
      description:
        "One-on-one interview with AI. Questions adapt in real-time based on your answers.",
      steps: [
        "Step 1: Enter a topic (e.g., React, Java, DSA)",
        "Step 2: Choose difficulty (Easy / Medium / Hard)",
        "Step 3: AI asks a question – you answer via voice or text",
        "Step 4: Based on your answer, AI decides next question (harder / easier / deeper)",
        "Step 5: After 8 questions, AI provides final score, evaluation, and learning roadmap",
      ],
    },
    {
      id: "coding",
      title: "💻 Coding Interview",
      icon: Code,
      gradient: "from-cyan-500 to-blue-500",
      badgeColor: "bg-cyan-500/10 text-cyan-600",
      description:
        "Solve AI-generated coding problems, run tests, then answer conceptual questions about your code.",
      steps: [
        "Step 1: Choose programming language (Java, Python, JavaScript, C++, ...)",
        "Step 2: Choose Domain (DSA, OOP, Concurrency, ...)",
        "Step 3: Choose specific Topic (Array, LinkedList, Tree, ...)",
        "Step 4: Choose difficulty (Beginner / Intermediate / Advanced)",
        "Step 5: AI generates a coding problem with test cases",
        "Step 6: Write code, run tests → if correct, proceed to 3 explanation questions",
        "Step 7: Answer questions (complexity, edge cases, etc.) → AI evaluates overall",
      ],
    },
  ];

  const contactLinks = {
    email: "nguyendhieu1210@gmail.com",
    phone: "0866638629",
    facebookUrl: "https://facebook.com/yourpage",
    linkedinUrl: "https://linkedin.com/company/yourcompany",
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate("/welcome")}
          className="group mb-8 flex items-center gap-2 text-muted hover:text-primary transition-all duration-300 font-medium bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-secondary p-6 md:p-8 mb-12 text-white shadow-soft">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="w-8 h-8 md:w-9 md:h-9" />
              <h1 className="text-2xl md:text-3xl font-bold">Help & Support</h1>
            </div>
            <p className="text-primary-100 text-sm md:text-base max-w-2xl mb-5">
              Learn how to use the 4 interview modes of AI Interview. Each mode
              is designed to help you practice effectively.
            </p>
            <button
              onClick={scrollToGuide}
              className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md"
            >
              <PlayCircle className="w-4 h-4" /> View detailed guide
            </button>
          </div>
        </div>

        {/* 4 Feature Cards - Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-card rounded-2xl shadow-soft border border-border p-5 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted line-clamp-2">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Guide Section */}
        <div ref={guideRef} className="space-y-8 scroll-mt-24">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden transition-all hover:shadow-md"
              >
                <div
                  className={`bg-gradient-to-r ${feature.gradient} px-6 py-4`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-7 h-7 text-white" />
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      {feature.title}
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-text mb-6">{feature.description}</p>
                  <div className="space-y-3">
                    {feature.steps.map((step, stepIdx) => (
                      <div key={stepIdx} className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full ${feature.badgeColor} flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}
                        >
                          {stepIdx + 1}
                        </div>
                        <p className="text-sm text-muted">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => {
                        if (feature.id === "standard")
                          navigate("/interview", {
                            state: { topic: "", difficulty: "medium" },
                          });
                        else if (feature.id === "cv") navigate("/cv-upload");
                        else if (feature.id === "adaptive")
                          navigate("/adaptive-interview");
                        else if (feature.id === "coding")
                          navigate("/live-coding");
                      }}
                      className="px-5 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium text-sm transition"
                    >
                      Try now →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl shadow-soft border border-border p-6 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-text">
                  Contact & Support
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <a
                  href={`mailto:${contactLinks.email}`}
                  className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-border hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="p-2 rounded-lg bg-muted/20 group-hover:scale-105 transition">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">Email Support</p>
                    <p className="text-sm text-muted mt-0.5">
                      {contactLinks.email}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Response time: Within 24 hours
                    </p>
                  </div>
                </a>
                <a
                  href={`tel:${contactLinks.phone}`}
                  className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-border hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="p-2 rounded-lg bg-muted/20 group-hover:scale-105 transition">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">Phone Support</p>
                    <p className="text-sm text-muted mt-0.5">
                      {contactLinks.phone}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Mon-Fri 9am - 6pm (GMT+7)
                    </p>
                  </div>
                </a>
                <a
                  href={contactLinks.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-border hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="p-2 rounded-lg bg-muted/20 group-hover:scale-105 transition">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">Facebook</p>
                    <p className="text-sm text-muted mt-0.5">
                      fb.me/aiinterview
                    </p>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Connect with us
                    </p>
                  </div>
                </a>
                <a
                  href={contactLinks.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border border-border hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="p-2 rounded-lg bg-muted/20 group-hover:scale-105 transition">
                    <FaLinkedin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">LinkedIn</p>
                    <p className="text-sm text-muted mt-0.5">
                      linkedin.com/company/aiinterview
                    </p>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Follow for updates
                    </p>
                  </div>
                </a>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted">
                <Clock className="inline w-3 h-3 mr-1" /> Support team ready to
                assist you from Monday to Friday.
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-3xl shadow-soft border border-border p-6 transition-all">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/welcome")}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition group bg-primary/5 hover:bg-primary/10"
                >
                  <span className="text-sm font-medium text-primary">
                    Back to Dashboard
                  </span>
                  <BarChart3 className="w-4 h-4 text-primary group-hover:translate-x-1 transition" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl transition group bg-muted/5 hover:bg-muted/10">
                  <span className="text-sm font-medium text-text">
                    Knowledge Base
                  </span>
                  <FileText className="w-4 h-4 text-muted group-hover:translate-x-1 transition" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-xl transition group bg-muted/5 hover:bg-muted/10">
                  <span className="text-sm font-medium text-text">
                    Report an Issue
                  </span>
                  <HelpCircle className="w-4 h-4 text-muted group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>
            <div className="bg-primary/5 rounded-3xl border border-primary/20 p-5 transition-all">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-text">
                    100% Personalized Questions
                  </h4>
                  <p className="text-xs text-muted mt-1">
                    Every question is tailored by AI based on your CV or
                    manually entered topics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .scroll-mt-24 { scroll-margin-top: 6rem; }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
    </div>
  );
}
