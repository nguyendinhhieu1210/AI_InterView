// frontend/src/pages/HistoryPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Loader2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  FileText,
  Cpu,
  Code,
  Eye,
} from "lucide-react";

// Import Base Components
import { BaseButton } from "../components/base/BaseButton";
import { BaseCard } from "../components/base/BaseCard";

import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const [counts, setCounts] = useState({
    interview: 0,
    cv: 0,
    adaptive: 0,
    coding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    fetchCounts();
    setTimeout(() => setPageLoaded(true), 50);
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [normalRes, cvRes, adaptiveRes, codingRes] = await Promise.all([
        api
          .get("/interview/history")
          .catch(() => ({ data: { success: false, history: [] } })),
        api
          .get("/cv/history")
          .catch(() => ({ data: { success: false, history: [] } })),
        api
          .get("/adaptive/history")
          .catch(() => ({ data: { success: false, history: [] } })),
        api
          .get("/live-coding/history")
          .catch(() => ({ data: { success: false, history: [] } })),
      ]);

      const normalCount =
        normalRes.data?.success && Array.isArray(normalRes.data.history)
          ? normalRes.data.history.length
          : 0;
      const cvCount =
        cvRes.data?.success && Array.isArray(cvRes.data.history)
          ? cvRes.data.history.length
          : 0;
      const adaptiveCount =
        adaptiveRes.data?.success && Array.isArray(adaptiveRes.data.history)
          ? adaptiveRes.data.history.length
          : 0;
      const codingCount = codingRes.data?.history?.length || 0;

      setCounts({
        interview: normalCount,
        cv: cvCount,
        adaptive: adaptiveCount,
        coding: codingCount,
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load history counts");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (type) => {
    switch (type) {
      case "interview":
        navigate("/interview-history");
        break;
      case "cv":
        navigate("/cv-history");
        break;
      case "adaptive":
        navigate("/adaptive-history");
        break;
      case "coding":
        navigate("/coding-history");
        break;
      default:
        break;
    }
  };

  // Màu sắc đồng bộ với các trang detail
  const themes = {
    interview: {
      bgIcon: "bg-indigo-100 dark:bg-indigo-900/40",
      textIcon: "text-indigo-600 dark:text-indigo-400",
      textCount: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800",
      hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-950/20",
    },
    cv: {
      bgIcon: "bg-teal-100 dark:bg-teal-950/40",
      textIcon: "text-teal-600 dark:text-teal-400",
      textCount: "text-teal-600 dark:text-teal-400",
      border: "border-teal-200 dark:border-teal-800",
      hoverBg: "hover:bg-teal-50 dark:hover:bg-teal-950/20",
    },
    adaptive: {
      bgIcon: "bg-violet-100 dark:bg-violet-900/40",
      textIcon: "text-violet-600 dark:text-violet-400",
      textCount: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
      hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-950/20",
    },
    coding: {
      bgIcon: "bg-rose-100 dark:bg-rose-900/40",
      textIcon: "text-rose-600 dark:text-rose-400",
      textCount: "text-rose-600 dark:text-rose-400",
      border: "border-rose-200 dark:border-rose-800",
      hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-950/20",
    },
  };

  const cards = [
    {
      id: "interview",
      title: "Standard",
      desc: "Topic-based MCQ + Essay interviews",
      icon: FileText,
      count: counts.interview,
      theme: themes.interview,
    },
    {
      id: "cv",
      title: "CV Based",
      desc: "Interviews generated from your CV",
      icon: FolderOpen,
      count: counts.cv,
      theme: themes.cv,
    },
    {
      id: "adaptive",
      title: "Adaptive",
      desc: "Difficulty adjusts to your skill level",
      icon: Cpu,
      count: counts.adaptive,
      theme: themes.adaptive,
    },
    {
      id: "coding",
      title: "Coding",
      desc: "Live coding with AI evaluation",
      icon: Code,
      count: counts.coding,
      theme: themes.coding,
    },
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted animate-pulse">Loading history data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
        <BaseCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-14 h-14 text-error mx-auto mb-4" />
          <p className="text-text mb-6">{error}</p>
          <BaseButton
            variant="primary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchCounts}
          >
            Retry
          </BaseButton>
        </BaseCard>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-bg transition-all duration-700 ${pageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 animate-slideDown">
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            }
            onClick={() => navigate("/welcome")}
            className="group gap-2 text-muted hover:text-primary hover:gap-3 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft border border-border"
          >
            Back to Dashboard
          </BaseButton>
          <div className="bg-card/80 backdrop-blur-sm rounded-full px-5 py-2 shadow-soft border border-border">
            <BarChart3 className="w-4 h-4 inline mr-2 text-primary" />
            <span className="font-semibold text-text">History Hub</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.25] pb-3 bg-gradient-to-r from-primary via-secondary to-pink-500 bg-clip-text text-transparent">
            Interview History
          </h1>
          <p className="text-muted mt-2 text-sm md:text-base max-w-2xl mx-auto">
            Select an interview type to view detailed history and performance
            analytics
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleNavigate(card.id)}
                className={`group cursor-pointer bg-card rounded-2xl border ${card.theme.border} ${card.theme.hoverBg} shadow-soft hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden transform-gpu flex flex-col`}
              >
                <div className="p-6 text-center flex flex-col items-center h-full">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full ${card.theme.bgIcon} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-8 h-8 ${card.theme.textIcon}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-text mb-2">
                    {card.title}
                  </h2>
                  <div className="min-h-[3rem] mb-4 flex items-center justify-center">
                    <p className="text-muted text-sm text-center line-clamp-2">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-4xl font-black ${card.theme.textCount}`}
                    >
                      {card.count}
                    </span>
                    <span className="text-muted text-sm ml-1">sessions</span>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-1 text-xs text-muted/60">
                    <Eye className="w-3 h-3" />
                    <span>Click to view history</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center text-muted/60 text-xs">
          <p>
            💡 Click on any card to see detailed history for that interview
            type.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.6s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }
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
