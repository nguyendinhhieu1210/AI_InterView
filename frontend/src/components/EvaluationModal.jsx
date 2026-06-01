import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTheme } from '../contexts/ThemeContext';

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
  isOpen, onClose, onNext,
  evaluation,
  explainAnswers = [],
  problemStatement = '',
  code = '',
  exampleInput = '',
  exampleOutput = ''
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!evaluation) return null;

  const displayProblem = problemStatement || 'No problem description.';
  const displayExampleInput = safeDisplayValue(exampleInput) || 'No example input.';
  const displayExampleOutput = safeDisplayValue(exampleOutput) || 'No example output.';

  const bgPanel = isDark ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-700';
  const bgCard = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const bgCode = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const buttonClose = isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const buttonNext = 'bg-indigo-600 hover:bg-indigo-700 text-white';

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
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-4xl transform overflow-hidden rounded-2xl ${bgPanel} ${borderClass} p-6 text-left align-middle shadow-xl max-h-[90vh] flex flex-col`}>
                <Dialog.Title className={`text-2xl font-bold ${textPrimary} mb-4`}>📊 Evaluation Report</Dialog.Title>

                <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scroll">
                  {/* Problem + Input/Output */}
                  <div className={`p-4 ${bgCard} rounded-xl`}>
                    <h4 className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-2">📝 Problem</h4>
                    <div className={`${textSecondary} text-sm whitespace-pre-wrap break-words max-h-40 overflow-y-auto`}>{displayProblem}</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className={`${bgCode} p-2 rounded`}>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📥 Input:</span>
                        <code className={`${isDark ? 'text-green-300' : 'text-green-700'} block mt-1 whitespace-pre-wrap break-words`}>{displayExampleInput}</code>
                      </div>
                      <div className={`${bgCode} p-2 rounded`}>
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📤 Output:</span>
                        <code className={`${isDark ? 'text-blue-300' : 'text-blue-700'} block mt-1 whitespace-pre-wrap break-words`}>{displayExampleOutput}</code>
                      </div>
                    </div>
                  </div>

                  {/* Code */}
                  {code && (
                    <div className={`p-4 ${bgCode} rounded-xl`}>
                      <h4 className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-2">💻 Your Code</h4>
                      <pre className={`${isDark ? 'text-green-300' : 'text-green-800'} text-xs whitespace-pre-wrap break-words`}>{code}</pre>
                    </div>
                  )}

                  {/* Overall AI Feedback */}
                  {evaluation.summary && (
                    <div className={`p-4 ${bgCard} rounded-xl`}>
                      <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">🤖 Overall Feedback</h4>
                      <p className={`${textSecondary} leading-relaxed`}>{evaluation.summary}</p>
                      {evaluation.feedback && (
                        <div className={`mt-2 text-sm border-t pt-2 ${isDark ? 'border-gray-600' : 'border-gray-300'} ${textSecondary}`}>
                          <span className="font-semibold">💬 Advice: </span>{evaluation.feedback}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation Q&A */}
                  {explainAnswers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-3">💬 Explanation Q&A</h4>
                      <div className="space-y-5">
                        {explainAnswers.map((item, idx) => (
                          <div key={idx} className={`p-4 ${bgCard} rounded-xl border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-500 font-bold text-sm">#{idx + 1}</span>
                                <div className="flex-1">
                                  <p className={`font-medium text-sm ${textPrimary}`}>{item.question}</p>
                                  <p className={`text-sm italic mt-1 ${textSecondary}`}>📝 Your answer: {item.answer}</p>
                                  <div className={`mt-2 text-xs px-2 py-1 rounded inline-block ${
                                    item.isCorrect
                                      ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800')
                                      : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                                  }`}>
                                    {item.isCorrect ? '✅ Correct' : '❌ Incorrect'} – {item.feedback}
                                  </div>
                                  
                                  {/* Full model answer */}
                                  {item.modelAnswer && (
                                    <div className={`mt-3 p-3 rounded-lg border ${isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-1">🤖 Model Answer (AI):</p>
                                      <p className={`text-sm ${textSecondary} whitespace-pre-wrap break-words`}>
                                        {item.modelAnswer}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths / Weaknesses */}
                  {evaluation.strengths?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">✅ Strengths</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evaluation.strengths.map((s, i) => <li key={i} className={textSecondary}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {evaluation.weaknesses?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-rose-600 dark:text-rose-400 mb-2">⚠️ Areas to improve</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {evaluation.weaknesses.map((w, i) => <li key={i} className={textSecondary}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-5 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <button onClick={onClose} className={`flex-1 ${buttonClose} py-2.5 rounded-xl font-medium transition`}>Close</button>
                  <button onClick={() => { onNext(); onClose(); }} className={`flex-1 ${buttonNext} py-2.5 rounded-xl font-semibold transition`}>➡ Next Coding Question</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}