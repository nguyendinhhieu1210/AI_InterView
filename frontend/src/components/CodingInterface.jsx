import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import EvaluationModal from '../components/EvaluationModal';
import { useNavigate } from 'react-router-dom';

const toMonacoLang = (lang = '') => {
  const map = {
    javascript: 'javascript', js: 'javascript',
    typescript: 'typescript', ts: 'typescript',
    python: 'python', py: 'python',
    java: 'java',
    cpp: 'cpp', 'c++': 'cpp',
    c: 'c',
    csharp: 'csharp', cs: 'csharp',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby', rb: 'ruby',
    swift: 'swift',
    kotlin: 'kotlin',
  };
  return map[lang.toLowerCase()] || 'plaintext';
};

const getStarterCode = (lang = '') => {
  const l = lang.toLowerCase();
  const map = {
    java: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
    python: `# Write your solution here\ndef solve():\n    pass\n\nprint(solve())`,
    javascript: `// Write your solution here\nfunction solve() {\n\n}\n\nconsole.log(solve());`,
    typescript: `// Write your solution here\nfunction solve(): void {\n\n}\n\nconsole.log(solve());`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your solution here\n    fmt.Println()\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    /* Write your solution here */\n    return 0;\n}`,
    rust: `fn main() {\n    // Write your solution here\n    println!("{}", 0);\n}`,
    kotlin: `fun main() {\n    // Write your solution here\n    println()\n}`,
    swift: `import Foundation\n\n// Write your solution here\nprint("")`,
    ruby: `# Write your solution here\ndef solve\nend\n\nputs solve`,
    php: `<?php\n// Write your solution here\n?>`,
    csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // Write your solution here\n    }\n}`,
  };
  return map[l] || `// Write your ${lang} solution here\n`;
};

const getExt = (lang = '') => {
  const map = {
    java: 'java', javascript: 'js', typescript: 'ts', python: 'py',
    cpp: 'cpp', c: 'c', csharp: 'cs', go: 'go', rust: 'rs',
    php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt',
  };
  return map[lang.toLowerCase()] || 'txt';
};

const LANG_BADGE = {
  java: 'border-orange-600 text-orange-800 bg-orange-100',
  python: 'border-blue-600 text-blue-800 bg-blue-100',
  javascript: 'border-yellow-600 text-yellow-800 bg-yellow-100',
  typescript: 'border-blue-600 text-blue-800 bg-blue-100',
  go: 'border-cyan-600 text-cyan-800 bg-cyan-100',
  cpp: 'border-indigo-600 text-indigo-800 bg-indigo-100',
  rust: 'border-red-600 text-red-800 bg-red-100',
  kotlin: 'border-purple-600 text-purple-800 bg-purple-100',
  swift: 'border-orange-600 text-orange-800 bg-orange-100',
};

const DIFF_BADGE = {
  beginner: 'border-blue-600 text-blue-800 bg-blue-100',
  intermediate: 'border-yellow-600 text-yellow-800 bg-yellow-100',
  advanced: 'border-red-600 text-red-800 bg-red-100',
};

const safeDisplayValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function CodingInterface({
  sessionId,
  problemStatement: initialProblemStatement,
  language: initialLanguage = 'java',
  topic = '',
  domain = '',
  difficulty = 'beginner',
  testCriteria: initialTestCriteria = '',
  exampleInput: initialExampleInput = '',
  exampleOutput: initialExampleOutput = '',
  onReset,
}) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const language = initialLanguage.toLowerCase();

  const [phase, setPhase] = useState('coding');
  const [codeProblem, setCodeProblem] = useState({
    problemStatement: initialProblemStatement,
    testCriteria: initialTestCriteria,
    exampleInput: initialExampleInput,
    exampleOutput: initialExampleOutput,
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'code',
    problemStatement: initialProblemStatement,
    testCriteria: initialTestCriteria,
    exampleInput: initialExampleInput,
    exampleOutput: initialExampleOutput,
  });
  const [code, setCode] = useState(() => getStarterCode(language));
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [explainCount, setExplainCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // FIX: Rename finalSessionEvaluation -> codeEvaluation (rõ ràng hơn)
  const [codeEvaluation, setCodeEvaluation] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [explainAnswersList, setExplainAnswersList] = useState([]);
  const [submittedCode, setSubmittedCode] = useState('');
  const [submittedProblem, setSubmittedProblem] = useState('');
  const [submittedExampleInput, setSubmittedExampleInput] = useState('');
  const [submittedExampleOutput, setSubmittedExampleOutput] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);

  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const getExplainQuestionText = (questionObj) => questionObj?.question || questionObj?.content || '';

  useEffect(() => {
    const id = 'cdi-highlight-style';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        .error-line-highlight { background-color: rgba(239,68,68,0.2); border-left: 3px solid #ef4444 !important; }
        .error-glyph { background-color: #ef4444; width: 6px !important; margin-left: 3px; border-radius: 2px; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const clearDecorations = () => {
    if (editorRef.current && decorationsRef.current.length) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  };

  useEffect(() => {
    setCodeProblem({
      problemStatement: initialProblemStatement,
      testCriteria: initialTestCriteria,
      exampleInput: initialExampleInput,
      exampleOutput: initialExampleOutput,
    });
    setCurrentQuestion({
      type: 'code',
      problemStatement: initialProblemStatement,
      testCriteria: initialTestCriteria,
      exampleInput: initialExampleInput,
      exampleOutput: initialExampleOutput,
    });
    setCode(getStarterCode(language));
    setPhase('coding');
    setFeedback(null);
    setExplainCount(0);
    setUserAnswer('');
    setCodeEvaluation(null);
    setExplainAnswersList([]);
    setSubmittedCode('');
    setSubmittedProblem('');
    setSubmittedExampleInput('');
    setSubmittedExampleOutput('');
    setIsModalOpen(false);
    clearDecorations();
  }, [initialProblemStatement, initialTestCriteria, initialExampleInput, initialExampleOutput, language]);

  const handleSubmitCode = async () => {
    setLoading(true);
    setFeedback(null);
    clearDecorations();
    try {
      const res = await api.post(`/live-coding/session/${sessionId}/submit`, { code }, { headers: { Authorization: `Bearer ${token}` } });
      const { correct, feedback: fb, nextQuestion } = res.data;
      if (!correct) {
        setFeedback({ type: 'error', message: fb || 'Code is incorrect. Check your logic.' });
        toast.error('Code incorrect');
        setLoading(false);
        return;
      }
      setSubmittedCode(code);
      setSubmittedProblem(codeProblem.problemStatement || '');
      setSubmittedExampleInput(safeDisplayValue(codeProblem.exampleInput));
      setSubmittedExampleOutput(safeDisplayValue(codeProblem.exampleOutput));
      setFeedback({ type: 'success', message: fb || '✅ Correct! Click "Continue" to explain.' });
      toast.success('Correct!');
      if (nextQuestion?.type === 'explain') {
        setCurrentQuestion(nextQuestion);
        setPhase('explain_pending');
        setExplainCount(1);
        setUserAnswer('');
        setExplainAnswersList([]);
      } else {
        setPhase('completed');
      }
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error;
      // FIX: Handle session expiry
      if (status === 404) {
        toast.error('Session expired. Redirecting...');
        setTimeout(() => navigate('/welcome'), 1500);
        return;
      }
      toast.error(errMsg || 'Failed to submit code');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToExplain = () => setPhase('explaining');

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error('Please enter your answer');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/live-coding/session/${sessionId}/explain`, { answer: userAnswer }, { headers: { Authorization: `Bearer ${token}` } });
      const { correct, feedback: fb, nextQuestion, evaluation, completedForCurrentCode, modelAnswer } = res.data;

      const newExplainAnswer = {
        question: getExplainQuestionText(currentQuestion),
        answer: userAnswer,
        isCorrect: correct,
        feedback: fb || (correct ? 'Correct' : 'Incorrect'),
        modelAnswer: modelAnswer || '',
      };
      const updatedList = [...explainAnswersList, newExplainAnswer];
      setExplainAnswersList(updatedList);

      setFeedback({
        type: correct ? 'success' : 'error',
        message: correct ? '✅ Correct' : '❌ Incorrect'
      });

      correct ? toast.success('✅ Correct') : toast.error('❌ Incorrect');

      // FIX: Set codeEvaluation (not finalSessionEvaluation)
      if (evaluation && completedForCurrentCode) {
        console.log('✅ Completed round, opening evaluation modal...');
        setCodeEvaluation(evaluation);  // FIX: Renamed from setCurrentCodeEvaluation
        setExplainAnswersList(updatedList);
        setCurrentQuestion(null);
        setPhase('review');
        setIsModalOpen(true);
        setLoading(false);
        return;
      }

      if (nextQuestion?.type === 'explain') {
        setCurrentQuestion(nextQuestion);
        setExplainCount(prev => prev + 1);
        setUserAnswer('');
        setPhase('explaining');
      } else if (nextQuestion?.type === 'code') {
        const newCodeProblemData = {
          problemStatement: nextQuestion.problemStatement || '',
          testCriteria: nextQuestion.testCriteria || '',
          exampleInput: nextQuestion.exampleInput || '',
          exampleOutput: nextQuestion.exampleOutput || '',
        };
        setCodeProblem(newCodeProblemData);
        setCurrentQuestion({ type: 'code', ...newCodeProblemData });
        setCode(getStarterCode(language));
        setPhase('coding');
        setExplainCount(0);
        setUserAnswer('');
        setFeedback(null);
        setCodeEvaluation(null);
        setExplainAnswersList([]);
        setSubmittedCode('');
        setSubmittedProblem('');
        setSubmittedExampleInput('');
        setSubmittedExampleOutput('');
        toast.success('Cycle completed! New code question ready.');
      } else {
        setPhase('completed');
      }
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error;
      // FIX: Handle session expiry
      if (status === 404) {
        toast.error('Session expired. Redirecting...');
        setTimeout(() => navigate('/welcome'), 1500);
        return;
      }
      console.error('Submit answer error:', err);
      toast.error(errMsg || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleNextCode = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/live-coding/session/${sessionId}/next-code`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { nextQuestion } = res.data;
      if (nextQuestion?.type === 'code') {
        const newCodeProblemData = {
          problemStatement: nextQuestion.problemStatement || '',
          testCriteria: nextQuestion.testCriteria || '',
          exampleInput: nextQuestion.exampleInput || '',
          exampleOutput: nextQuestion.exampleOutput || '',
        };
        setCodeProblem(newCodeProblemData);
        setCurrentQuestion({ type: 'code', ...newCodeProblemData });
        setCode(getStarterCode(language));
        setPhase('coding');
        setExplainCount(0);
        setUserAnswer('');
        setFeedback(null);
        setCodeEvaluation(null);
        setExplainAnswersList([]);
        setSubmittedCode('');
        setSubmittedProblem('');
        setSubmittedExampleInput('');
        setSubmittedExampleOutput('');
        setIsModalOpen(false);  // FIX: Auto-close modal after moving to next code
        toast.success('New coding question ready!');
      } else {
        toast.error('Could not load next question');
      }
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error;
      // FIX: Handle session expiry
      if (status === 404) {
        toast.error('Session expired. Redirecting...');
        setTimeout(() => navigate('/welcome'), 1500);
        return;
      }
      toast.error(errMsg || 'Error loading next question');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Change topic? All progress will be lost.')) onReset();
  };

  const handleExit = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setShowExitModal(false);
    navigate('/welcome');
  };

  const cancelExit = () => {
    setShowExitModal(false);
  };

  // FIX: Remove the "completed" screen (không cần, vì user click Next → tiếp tục)
  // Nếu muốn show completion message, show trong phase 'review' instead

  const langBadgeClass = LANG_BADGE[language] || (isDark ? 'border-gray-600 text-gray-300 bg-gray-700' : 'border-gray-400 text-gray-700 bg-gray-100');
  const diffBadgeClass = DIFF_BADGE[difficulty] || (isDark ? 'border-gray-600 text-gray-300 bg-gray-700' : 'border-gray-400 text-gray-700 bg-gray-100');
  const fileName = `Main.${getExt(language)}`;
  const isSubmitCodeDisabled = loading || phase === 'explain_pending' || phase === 'explaining' || phase === 'review';
  const explainQuestionText = (phase === 'explaining' || phase === 'explain_pending') && currentQuestion?.type === 'explain' ? getExplainQuestionText(currentQuestion) : '';

  return (
    <>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-sm`}>
          <button onClick={handleExit} className={`${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition px-3 py-1.5 rounded-lg text-sm`}>
            ← Exit
          </button>
          <button onClick={handleReset} className={`${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'} transition px-3 py-1.5 rounded-lg text-sm`}>
            ↺ Topic
          </button>
          <span className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>{topic || 'Live Coding'}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${langBadgeClass}`}>{initialLanguage}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${diffBadgeClass}`}>{difficulty}</span>
          {domain && <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} ml-auto hidden sm:inline`}>{domain}</span>}
          {codeEvaluation && (
            <button onClick={() => setIsModalOpen(true)} className={`ml-auto sm:ml-0 text-xs ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} px-3 py-1.5 rounded-lg transition`}>
              View Result
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-md`}>
                <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} px-4 sm:px-5 py-2.5 text-sm font-mono flex justify-between items-center border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <span className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>📁 {fileName}</span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} ${isDark ? 'bg-gray-800' : 'bg-gray-200'} px-2 py-0.5 rounded`}>{initialLanguage.toUpperCase()}</span>
                </div>
                <Editor
                  height="520px"
                  language={toMonacoLang(language)}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  onMount={(editor) => (editorRef.current = editor)}
                  theme={isDark ? 'vs-dark' : 'light'}
                  options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, lineNumbers: 'on', tabSize: 4 }}
                />
              </div>
              <button onClick={handleSubmitCode} disabled={isSubmitCodeDisabled} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-base transition shadow-md">
                {loading ? 'Checking...' : '▶ Submit Code'}
              </button>
            </div>

            {/* Right: Problem, Feedback, Explanation */}
            <div className="space-y-5 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-100px)] pr-1 custom-scroll">
              {/* Problem card */}
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-md flex flex-col max-h-[500px] overflow-hidden`}>
                <div className="sticky top-0 z-10 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-base px-5 pt-5 pb-2 bg-inherit">📝 Problem</div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 custom-scroll">
                  <pre className={`whitespace-pre-wrap break-words text-sm leading-relaxed font-sans ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{codeProblem.problemStatement}</pre>
                  {codeProblem.exampleInput && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">📥 Example Input</p>
                      <pre className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-3 rounded-lg ${isDark ? 'text-green-300' : 'text-green-800'} text-xs whitespace-pre-wrap break-words`}>{safeDisplayValue(codeProblem.exampleInput)}</pre>
                    </div>
                  )}
                  {codeProblem.exampleOutput && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">📤 Example Output</p>
                      <pre className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-3 rounded-lg ${isDark ? 'text-blue-300' : 'text-blue-800'} text-xs whitespace-pre-wrap break-words`}>{safeDisplayValue(codeProblem.exampleOutput)}</pre>
                    </div>
                  )}
                  {codeProblem.testCriteria && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">🔍 Constraints</p>
                      <pre className={`whitespace-pre-wrap break-words text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{codeProblem.testCriteria}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback card */}
              {feedback && (
                <div className={`p-4 rounded-xl border text-sm ${feedback.type === 'error'
                    ? (isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800')
                    : (isDark ? 'bg-green-900/30 border-green-700 text-green-200' : 'bg-green-50 border-green-300 text-green-800')
                  }`}>
                  <div className="font-semibold">{feedback.message}</div>
                  {feedback.type === 'success' && phase === 'explain_pending' && (
                    <button onClick={handleContinueToExplain} className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1.5 px-4 rounded-lg transition">
                      Continue → Answer Question
                    </button>
                  )}
                </div>
              )}

              {/* Explanation card */}
              {phase === 'explaining' && currentQuestion?.type === 'explain' && explainQuestionText && (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-indigo-500/60 rounded-xl p-5 shadow-md border`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">🤖 Explain ({explainCount}/3)</div>
                    <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">Explain</span>
                  </div>
                  <p className={`${isDark ? 'text-white' : 'text-gray-800'} text-sm mb-4 leading-relaxed break-words`}>{explainQuestionText}</p>
                  <textarea rows={4} value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Your answer..." className={`w-full ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none`} />
                  <button onClick={handleSubmitAnswer} disabled={loading} className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition">{loading ? 'Submitting...' : 'Submit Answer'}</button>
                </div>
              )}

              {/* FIX: Show "Next Code" button when in review phase */}
              {phase === 'review' && codeEvaluation && (
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-900/30 border-amber-700' : 'bg-amber-50 border-amber-300'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                    ✅ Code evaluation complete! Ready for the next question?
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <EvaluationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onNext={handleNextCode} 
        evaluation={codeEvaluation}  // FIX: Renamed from currentCodeEvaluation
        explainAnswers={explainAnswersList} 
        problemStatement={submittedProblem} 
        code={submittedCode} 
        exampleInput={submittedExampleInput} 
        exampleOutput={submittedExampleOutput} 
      />

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className={`max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 rounded-2xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Confirm Exit
              </h3>
              <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
                Are you sure you want to exit the coding session?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Yes, Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}