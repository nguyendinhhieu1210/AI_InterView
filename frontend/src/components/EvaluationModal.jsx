import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import toast from 'react-hot-toast';
import { X, CheckCircle, XCircle, Copy, Check } from 'lucide-react';

// Import Base Components
import { BaseButton } from '../components/base/BaseButton';
import { BaseCard } from '../components/base/BaseCard';
import { BaseBadge } from '../components/base/BaseBadge';

const safeDisplayValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function EvaluationModal({
  isOpen,
  onClose,
  onNext,
  evaluation = {},
  explainAnswers = [],
  problemStatement = '',
  code = '',
  exampleInput = '',
  exampleOutput = '',
}) {
  const [copied, setCopied] = useState(false);

  if (!evaluation || !evaluation.summary) {
    return null;
  }

  const displayProblem = problemStatement || 'No problem description.';
  const displayExampleInput =
    safeDisplayValue(exampleInput) || 'No example input.';
  const displayExampleOutput =
    safeDisplayValue(exampleOutput) || 'No example output.';

  const correctAnswers = explainAnswers.filter((a) => a.isCorrect).length;
  const totalAnswers = explainAnswers.length;
  const accuracy =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAccuracyBadgeVariant = () => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'error';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-left">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-card border border-border shadow-soft max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 z-10 px-6 py-4 border-b border-border bg-card">
                  <div className="flex items-center justify-between gap-4">
                    <Dialog.Title className="text-2xl font-bold text-text">
                      📊 Code Evaluation Report
                    </Dialog.Title>
                    <BaseButton
                      variant="ghost"
                      size="sm"
                      leftIcon={<X className="w-6 h-6" />}
                      onClick={onClose}
                      className="p-1 rounded-lg hover:bg-muted/10 text-muted"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Overall Summary */}
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5">
                    <h4 className="font-semibold text-primary mb-2 text-base">
                      🎯 Overall Assessment
                    </h4>
                    <p className="text-text leading-relaxed">
                      {evaluation.summary}
                    </p>
                    {evaluation.feedback && (
                      <div className="mt-3 text-sm text-primary font-medium">
                        💡 {evaluation.feedback}
                      </div>
                    )}
                  </div>

                  {/* Problem + Input/Output */}
                  <div>
                    <h4 className="font-semibold text-primary mb-3">
                      📝 Problem Statement
                    </h4>
                    <div className="p-4 bg-muted/5 rounded-xl">
                      <div className="text-text text-sm whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto">
                        {displayProblem}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exampleInput && (
                        <div className="bg-muted/10 p-3 rounded-lg border border-border">
                          <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                            📥 Example Input
                          </p>
                          <code className="text-success text-xs whitespace-pre-wrap break-words block">
                            {displayExampleInput}
                          </code>
                        </div>
                      )}
                      {exampleOutput && (
                        <div className="bg-muted/10 p-3 rounded-lg border border-border">
                          <p className="text-xs font-semibold text-muted mb-2 uppercase tracking-wide">
                            📤 Example Output
                          </p>
                          <code className="text-primary text-xs whitespace-pre-wrap break-words block">
                            {displayExampleOutput}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Your Code */}
                  {code && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-primary">
                          💻 Your Submitted Code
                        </h4>
                        <BaseButton
                          variant="ghost"
                          size="sm"
                          leftIcon={
                            copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )
                          }
                          onClick={handleCopyCode}
                          className={`text-xs px-3 py-1.5 rounded-lg transition ${
                            copied
                              ? 'text-success bg-success/20'
                              : 'text-text bg-muted/20 hover:bg-muted/30'
                          }`}
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </BaseButton>
                      </div>
                      <div className="bg-muted/10 p-4 rounded-xl border border-border max-h-72 overflow-y-auto">
                        <pre className="text-text text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                          {code}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Explanation Q&A */}
                  {explainAnswers && explainAnswers.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-warning text-base">
                          💬 Explanation Q&A ({correctAnswers}/{totalAnswers})
                        </h4>
                        <BaseBadge
                          variant={getAccuracyBadgeVariant()}
                          rounded
                          className="px-3 py-1 text-sm font-medium"
                        >
                          {accuracy}% correct
                        </BaseBadge>
                      </div>

                      <div className="space-y-4">
                        {explainAnswers.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border-l-4 ${
                              item.isCorrect
                                ? 'border-success bg-success/5'
                                : 'border-error bg-error/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <BaseBadge
                                  variant={item.isCorrect ? 'success' : 'error'}
                                  size="sm"
                                  rounded
                                  className="px-2.5 py-0.5 text-sm font-bold"
                                >
                                  #{idx + 1}
                                </BaseBadge>
                                <span
                                  className={`text-xs font-semibold ${
                                    item.isCorrect
                                      ? 'text-success'
                                      : 'text-error'
                                  }`}
                                >
                                  {item.isCorrect
                                    ? '✅ Correct'
                                    : '❌ Incorrect'}
                                </span>
                              </div>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm font-medium text-text mb-1">
                                Question:
                              </p>
                              <p className="text-sm text-muted leading-relaxed">
                                {item.question}
                              </p>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm font-medium text-text mb-1">
                                Your Answer:
                              </p>
                              <p className="text-sm text-muted leading-relaxed italic">
                                {item.answer}
                              </p>
                            </div>

                            {item.feedback && (
                              <div
                                className={`text-sm mb-3 px-3 py-2 rounded ${
                                  item.isCorrect
                                    ? 'bg-success/20 text-success'
                                    : 'bg-error/20 text-error'
                                }`}
                              >
                                {item.feedback}
                              </div>
                            )}

                            {item.modelAnswer && (
                              <div className="rounded-lg p-3 border border-primary/20 bg-primary/5">
                                <p className="text-xs font-semibold text-primary mb-2">
                                  🤖 Expected Answer (AI Model):
                                </p>
                                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words">
                                  {item.modelAnswer}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {evaluation.strengths && evaluation.strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-success mb-3">
                        ✅ Strengths
                      </h4>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i} className="text-sm flex gap-2 text-text">
                            <span className="text-success font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {evaluation.weaknesses &&
                    evaluation.weaknesses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-error mb-3">
                          ⚠️ Areas to Improve
                        </h4>
                        <ul className="space-y-2">
                          {evaluation.weaknesses.map((w, i) => (
                            <li
                              key={i}
                              className="text-sm flex gap-2 text-text"
                            >
                              <span className="text-error font-bold">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="sticky bottom-0 flex gap-3 p-6 border-t border-border bg-card">
                  <BaseButton
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={onClose}
                    className="py-3 font-semibold"
                  >
                    Close Report
                  </BaseButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
