import { useState } from 'react';
import { ChevronDown, ChevronUp, Award, Clock } from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseBadge } from '../components/base/BaseBadge';
import { BaseModal } from '../components/base/BaseModal';

export default function InterviewReportModal({ reportData, onClose }) {
  const [expandedItems, setExpandedItems] = useState({});
  const { finalScore, summary, topic, difficulty, conversation } = reportData;
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
            <p className="text-sm text-muted mt-1">
              {topic} • {difficulty?.toUpperCase()} • Final Score: {finalScore}
              /10
            </p>
          </div>
        </div>
      }
    >
      {/* Content với scroll */}
      <div className="flex-1 overflow-y-auto px-1 -mr-1 max-h-[65vh]">
        <div className="space-y-6 pr-1">
          {/* Overall Score */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5">
            <div>
              <p className="text-sm font-medium text-muted">Overall Score</p>
              <p className="text-5xl font-bold text-primary">{finalScore}/10</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted">
                Based on {questionBreakdown.length} answers
              </p>
            </div>
          </div>

          {/* Interview Timeline */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-text flex items-center gap-2 sticky top-0 bg-card py-2 z-10">
              <Clock className="w-5 h-5" /> Interview Timeline
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
                            Score: {formatScore(item.score)} (
                            {item.verdict || 'N/A'})
                          </BaseBadge>
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
                        <div className="flex items-center gap-3">
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
                              Ideal Answer
                            </p>
                            <div className="bg-success/5 rounded-lg p-3 text-text text-sm max-h-40 overflow-y-auto">
                              {item.idealAnswer}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {item.feedback && (
                          <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                              Feedback
                            </p>
                            <div className="bg-secondary/5 rounded-lg p-3 text-text text-sm">
                              {item.feedback}
                            </div>
                          </div>
                        )}

                        {/* Correct & Missing Concepts */}
                        {(item.correctConcepts?.length > 0 ||
                          item.missingConcepts?.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {item.correctConcepts?.length > 0 && (
                              <div className="bg-success/5 rounded-lg p-3">
                                <p className="font-semibold text-success mb-1">
                                  ✓ Correct Concepts
                                </p>
                                <ul className="list-disc list-inside text-muted space-y-1 max-h-32 overflow-y-auto">
                                  {item.correctConcepts.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.missingConcepts?.length > 0 && (
                              <div className="bg-warning/5 rounded-lg p-3">
                                <p className="font-semibold text-warning mb-1">
                                  📚 Missing Concepts
                                </p>
                                <ul className="list-disc list-inside text-muted space-y-1 max-h-32 overflow-y-auto">
                                  {item.missingConcepts.map((m, i) => (
                                    <li key={i}>{m}</li>
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
        <div className="text-xs text-muted">
          {questionBreakdown.length} questions answered
        </div>
        <BaseButton variant="primary" onClick={onClose} className="px-6 py-2.5">
          Close Report
        </BaseButton>
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
          background: var(--border-color);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: var(--muted-text);
        }
      `}</style>
    </BaseModal>
  );
}
