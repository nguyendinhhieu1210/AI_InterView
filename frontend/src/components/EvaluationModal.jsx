import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

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
  exampleOutput = ''
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  if (!evaluation || !evaluation.summary) {
    return null;
  }

  // Prepare display values
  const displayProblem = problemStatement || 'No problem description.';
  const displayExampleInput = safeDisplayValue(exampleInput) || 'No example input.';
  const displayExampleOutput = safeDisplayValue(exampleOutput) || 'No example output.';

  // Theme variables
  const bgPanel = isDark ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';
  const bgCard = isDark ? 'bg-gray-700/50' : 'bg-gray-50';
  const bgCode = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const buttonClose = isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const buttonNext = 'bg-indigo-600 hover:bg-indigo-700 text-white';

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calculate accuracy stats
  const correctAnswers = explainAnswers.filter(a => a.isCorrect).length;
  const totalAnswers = explainAnswers.length;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

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
          {/* Sửa class text-center thành text-left để căn lề trái */}
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
              <Dialog.Panel className={`w-full max-w-4xl transform overflow-hidden rounded-2xl ${bgPanel} ${borderClass} border shadow-xl max-h-[92vh] flex flex-col`}>
                {/* Header */}
                <div className={`sticky top-0 z-10 px-6 py-4 border-b ${borderClass} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center justify-between gap-4">
                    <Dialog.Title className={`text-2xl font-bold ${textPrimary}`}>
                      📊 Code Evaluation Report
                    </Dialog.Title>
                    <button 
                      onClick={onClose}
                      className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Overall Summary - đã căn trái tự nhiên */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'border-indigo-700/50 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'}`}>
                    <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 text-base">🎯 Overall Assessment</h4>
                    <p className={`${textSecondary} leading-relaxed`}>{evaluation.summary}</p>
                    {evaluation.feedback && (
                      <div className={`mt-3 text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-700'} font-medium`}>
                        💡 {evaluation.feedback}
                      </div>
                    )}
                  </div>

                  {/* Problem + Input/Output */}
                  <div>
                    <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-3">📝 Problem Statement</h4>
                    <div className={`p-4 ${bgCard} rounded-xl`}>
                      <div className={`${textSecondary} text-sm whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto`}>
                        {displayProblem}
                      </div>
                    </div>

                    {/* Example Input/Output */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exampleInput && (
                        <div className={`${bgCode} p-3 rounded-lg border ${borderClass}`}>
                          <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 uppercase tracking-wide`}>📥 Example Input</p>
                          <code className={`${isDark ? 'text-green-300' : 'text-green-700'} text-xs whitespace-pre-wrap break-words block`}>
                            {displayExampleInput}
                          </code>
                        </div>
                      )}
                      {exampleOutput && (
                        <div className={`${bgCode} p-3 rounded-lg border ${borderClass}`}>
                          <p className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2 uppercase tracking-wide`}>📤 Example Output</p>
                          <code className={`${isDark ? 'text-blue-300' : 'text-blue-700'} text-xs whitespace-pre-wrap break-words block`}>
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
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400">💻 Your Submitted Code</h4>
                        <button
                          onClick={handleCopyCode}
                          className={`text-xs px-3 py-1.5 rounded-lg transition ${
                            copied
                              ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')
                              : (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
                          }`}
                        >
                          {copied ? '✅ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <div className={`${bgCode} p-4 rounded-xl border ${borderClass} max-h-72 overflow-y-auto`}>
                        <pre className={`${isDark ? 'text-gray-200' : 'text-gray-800'} text-xs font-mono leading-relaxed whitespace-pre-wrap break-words`}>
                          {code}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Explanation Q&A */}
                  {explainAnswers && explainAnswers.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 text-base">💬 Explanation Q&A ({correctAnswers}/{totalAnswers})</h4>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          accuracy >= 80 
                            ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')
                            : accuracy >= 60
                            ? (isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                            : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                        }`}>
                          {accuracy}% correct
                        </span>
                      </div>

                      <div className="space-y-4">
                        {explainAnswers.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border-l-4 ${
                              item.isCorrect
                                ? (isDark ? 'border-green-700 bg-green-900/10' : 'border-green-500 bg-green-50')
                                : (isDark ? 'border-red-700 bg-red-900/10' : 'border-red-500 bg-red-50')
                            }`}
                          >
                            {/* Question Number & Status */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${
                                  item.isCorrect
                                    ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')
                                    : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                                }`}>
                                  #{idx + 1}
                                </span>
                                <span className={`text-xs font-semibold ${
                                  item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {item.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                                </span>
                              </div>
                            </div>

                            {/* Question */}
                            <div className="mb-3">
                              <p className={`text-sm font-medium ${textPrimary} mb-1`}>Question:</p>
                              <p className={`text-sm ${textSecondary} leading-relaxed`}>{item.question}</p>
                            </div>

                            {/* Your Answer */}
                            <div className="mb-3">
                              <p className={`text-sm font-medium ${textPrimary} mb-1`}>Your Answer:</p>
                              <p className={`text-sm ${textSecondary} leading-relaxed italic`}>{item.answer}</p>
                            </div>

                            {/* Feedback */}
                            {item.feedback && (
                              <div className={`text-sm mb-3 px-3 py-2 rounded ${
                                item.isCorrect
                                  ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                                  : (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                              }`}>
                                {item.feedback}
                              </div>
                            )}

                            {/* Model Answer */}
                            {item.modelAnswer && (
                              <div className={`rounded-lg p-3 border ${isDark ? 'border-blue-700/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50'}`}>
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">🤖 Expected Answer (AI Model):</p>
                                <p className={`text-sm ${textSecondary} leading-relaxed whitespace-pre-wrap break-words`}>
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
                      <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-3">✅ Strengths</h4>
                      <ul className={`space-y-2`}>
                        {evaluation.strengths.map((s, i) => (
                          <li key={i} className={`text-sm flex gap-2 ${textSecondary}`}>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-3">⚠️ Areas to Improve</h4>
                      <ul className={`space-y-2`}>
                        {evaluation.weaknesses.map((w, i) => (
                          <li key={i} className={`text-sm flex gap-2 ${textSecondary}`}>
                            <span className="text-rose-600 dark:text-rose-400 font-bold">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className={`sticky bottom-0 flex gap-3 p-6 border-t ${borderClass} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <button 
                    onClick={onClose} 
                    className={`flex-1 ${buttonClose} py-3 rounded-xl font-semibold transition duration-200 hover:shadow-md`}
                  >
                    Close Report
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}