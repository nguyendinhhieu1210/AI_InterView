import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Target,
  BarChart3,
  Brain,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseBadge } from '../components/base/BaseBadge';
import { BaseModal } from '../components/base/BaseModal';

export default function InterviewReportModal({ reportData, onClose }) {
  const [expandedItems, setExpandedItems] = useState({});
  const { finalScore, summary, topic, totalQuestions, conversation } =
    reportData;
  const questionBreakdown = summary?.questionBreakdown || [];

  const toggleItem = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '—';
    return `${score}/10`;
  };

  const getScoreBadgeVariant = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getUserAnswer = (questionNumber) => {
    if (!conversation) return null;
    let qCount = 0;
    for (let i = 0; i < conversation.length; i++) {
      if (
        conversation[i].role === 'assistant' &&
        conversation[i].type === 'question'
      ) {
        qCount++;
        if (qCount === questionNumber && conversation[i + 1]?.role === 'user') {
          return conversation[i + 1].content;
        }
      }
    }
    return null;
  };

  // Get session type label
  const getSessionType = () => {
    const count = totalQuestions || 5;
    switch (count) {
      case 5:
        return { label: 'Quick Session', icon: '⚡', color: 'text-blue-500' };
      case 6:
        return {
          label: 'Balanced Session',
          icon: '📊',
          color: 'text-green-500',
        };
      case 7:
        return { label: 'Deep Session', icon: '🎯', color: 'text-purple-500' };
      case 8:
        return {
          label: 'Comprehensive Session',
          icon: '🏆',
          color: 'text-amber-500',
        };
      default:
        return { label: 'Adaptive Session', icon: '🧠', color: 'text-primary' };
    }
  };

  const sessionType = getSessionType();

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      size="2xl"
      showCloseButton={true}
      className="max-h-[92vh] flex flex-col"
      title={
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-2xl font-bold text-text flex items-center gap-2">
              <Award className="w-7 h-7 text-warning" />
              Interview Report
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-muted flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {topic}
              </span>
              <span className="text-muted">•</span>
              <span className="text-sm text-muted flex items-center gap-1">
                <span>{sessionType.icon}</span>
                {sessionType.label}
              </span>
              <span className="text-muted">•</span>
              <span className="text-sm text-muted flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                {totalQuestions || 5} questions
              </span>
              <span className="text-muted">•</span>
              <span className="text-sm font-semibold text-primary">
                Score: {finalScore}/10
              </span>
            </div>
          </div>
        </div>
      }
    >
      {/* Content với scroll */}
      <div className="flex-1 overflow-y-auto px-1 -mr-1 max-h-[65vh]">
        <div className="space-y-6 pr-1">
          {/* Overall Score Card */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Overall Score</p>
                <p className="text-5xl font-bold text-primary">
                  {finalScore}/10
                </p>
                <p className="text-sm text-muted mt-1">
                  Based on {questionBreakdown.length} answers
                </p>
              </div>
              <div className="text-right">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center shadow-lg">
                  <Brain className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xs text-muted mt-2">Adaptive AI</p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {summary?.overallEvaluation && (
            <div className="bg-muted/5 rounded-xl p-4 border border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted">Evaluation</p>
                  <p className="font-semibold text-text">
                    {summary.overallEvaluation}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Grade</p>
                  <p className="font-semibold text-text">
                    {summary.grade || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Hire Recommendation</p>
                  <p className="font-semibold text-text">
                    <BaseBadge
                      variant={
                        summary.hireRecommendation === 'Yes'
                          ? 'success'
                          : summary.hireRecommendation === 'Maybe'
                            ? 'warning'
                            : 'error'
                      }
                      size="sm"
                    >
                      {summary.hireRecommendation || 'N/A'}
                    </BaseBadge>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Questions</p>
                  <p className="font-semibold text-text">
                    {questionBreakdown.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interview Timeline */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-text flex items-center gap-2 sticky top-0 bg-card py-2 z-10">
              <Clock className="w-5 h-5 text-primary" /> Interview Timeline
            </h4>
            <div className="space-y-3">
              {questionBreakdown.map((item, idx) => {
                const userAnswer = getUserAnswer(item.questionNumber);
                return (
                  <div
                    key={idx}
                    className="border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30"
                  >
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full flex justify-between items-start p-4 text-left bg-muted/5 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-muted">
                            Q{item.questionNumber}
                          </span>
                          <BaseBadge
                            variant={getScoreBadgeVariant(item.score)}
                            size="sm"
                            rounded
                          >
                            {formatScore(item.score)} ({item.verdict || 'N/A'})
                          </BaseBadge>
                          {item.subtopic && (
                            <BaseBadge
                              variant="default"
                              size="sm"
                              rounded
                              className="border-border"
                            >
                              {item.subtopic}
                            </BaseBadge>
                          )}
                        </div>
                        <p className="text-text text-sm leading-relaxed line-clamp-2">
                          {item.question}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {expandedItems[idx] ? (
                          <ChevronUp className="w-5 h-5 text-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted" />
                        )}
                      </div>
                    </button>

                    {expandedItems[idx] && (
                      <div className="p-5 border-t border-border space-y-4 bg-card animate-slideDown">
                        {/* Full Question */}
                        <div>
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                            Question
                          </p>
                          <div className="bg-primary/5 rounded-lg p-3 text-text text-sm">
                            {item.question}
                          </div>
                          {item.subtopic && (
                            <p className="text-xs text-muted mt-1">
                              Subtopic:{' '}
                              <span className="font-medium">
                                {item.subtopic}
                              </span>
                            </p>
                          )}
                        </div>

                        {/* Your Answer */}
                        <div>
                          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                            Your Answer
                          </p>
                          <div className="bg-muted/5 rounded-lg p-3 text-text text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {userAnswer || 'No answer recorded.'}
                          </div>
                        </div>

                        {/* Score & Verdict */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <BaseBadge
                            variant={getScoreBadgeVariant(item.score)}
                            rounded
                            className="px-3 py-1.5 text-sm font-bold"
                          >
                            Score: {formatScore(item.score)}
                          </BaseBadge>
                          <span className="text-sm text-muted">
                            Verdict:{' '}
                            <span className="font-semibold text-text">
                              {item.verdict || 'N/A'}
                            </span>
                          </span>
                        </div>

                        {/* Ideal Answer */}
                        {item.idealAnswer && (
                          <div>
                            <p className="text-xs font-semibold text-success uppercase tracking-wide mb-2">
                              💡 Ideal Answer
                            </p>
                            <div className="bg-success/5 border border-success/20 rounded-lg p-3 text-text text-sm max-h-40 overflow-y-auto">
                              {item.idealAnswer}
                            </div>
                            {item.idealAnswerCode && (
                              <div className="mt-2 bg-gray-900 rounded-lg p-3 text-white text-sm font-mono overflow-x-auto">
                                <pre className="whitespace-pre-wrap">
                                  {item.idealAnswerCode}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback */}
                        {item.feedback && (
                          <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                              📝 Feedback
                            </p>
                            <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 text-text text-sm">
                              {item.feedback}
                            </div>
                          </div>
                        )}

                        {/* Correct & Missing Concepts */}
                        {(item.correctConcepts?.length > 0 ||
                          item.missingConcepts?.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {item.correctConcepts?.length > 0 && (
                              <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                                <p className="font-semibold text-success mb-1 flex items-center gap-1">
                                  ✓ Correct Concepts
                                </p>
                                <ul className="list-disc list-inside text-muted space-y-1 max-h-32 overflow-y-auto">
                                  {item.correctConcepts.map((c, i) => (
                                    <li key={i} className="text-sm">
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.missingConcepts?.length > 0 && (
                              <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                                <p className="font-semibold text-warning mb-1 flex items-center gap-1">
                                  📚 Missing Concepts
                                </p>
                                <ul className="list-disc list-inside text-muted space-y-1 max-h-32 overflow-y-auto">
                                  {item.missingConcepts.map((m, i) => (
                                    <li key={i} className="text-sm">
                                      {m}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border sticky bottom-0 bg-card">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{questionBreakdown.length} questions answered</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" />
            Adaptive AI
          </span>
        </div>
        <div className="flex gap-2">
          <BaseButton
            variant="secondary"
            onClick={onClose}
            className="px-6 py-2.5"
          >
            Close
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={() => window.print()}
            className="px-6 py-2.5"
          >
            Print Report
          </BaseButton>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.25s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
        .dark .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #4b5563;
        }
        .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </BaseModal>
  );
}
