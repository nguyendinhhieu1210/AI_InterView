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

// Semantic badge classes (still use specific colors for language/difficulty, but with opacity)
const LANG_BADGE = {
  java: 'border-primary/50 text-primary bg-primary/10',
  python: 'border-blue-500/50 text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  javascript: 'border-yellow-500/50 text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  typescript: 'border-blue-500/50 text-blue-500 bg-blue-50 dark:bg-blue-950/30',
  go: 'border-cyan-500/50 text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
  cpp: 'border-indigo-500/50 text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
  rust: 'border-red-500/50 text-red-500 bg-red-50 dark:bg-red-950/30',
  kotlin: 'border-purple-500/50 text-purple-500 bg-purple-50 dark:bg-purple-950/30',
  swift: 'border-orange-500/50 text-orange-500 bg-orange-50 dark:bg-orange-950/30',
};

const DIFF_BADGE = {
  beginner: 'border-success/50 text-success bg-success/10',
  intermediate: 'border-warning/50 text-warning bg-warning/10',
  advanced: 'border-error/50 text-error bg-error/10',
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
  const isDark = theme === 'dark'; // only for monaco editor theme
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

      if (evaluation && completedForCurrentCode) {
        console.log('✅ Completed round, opening evaluation modal...');
        setCodeEvaluation(evaluation);
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
        setIsModalOpen(false);
        toast.success('New coding question ready!');
      } else {
        toast.error('Could not load next question');
      }
    } catch (err) {
      const status = err.response?.status;
      const errMsg = err.response?.data?.error;
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

  const langBadgeClass = LANG_BADGE[language] || 'border-border text-muted bg-muted/10';
  const diffBadgeClass = DIFF_BADGE[difficulty] || 'border-border text-muted bg-muted/10';
  const fileName = `Main.${getExt(language)}`;
  const isSubmitCodeDisabled = loading || phase === 'explain_pending' || phase === 'explaining' || phase === 'review';
  const explainQuestionText = (phase === 'explaining' || phase === 'explain_pending') && currentQuestion?.type === 'explain' ? getExplainQuestionText(currentQuestion) : '';

  return (
    <>
      <div className="min-h-screen bg-bg">
        {/* Header */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
          <button onClick={handleExit} className="text-muted hover:text-text hover:bg-muted/10 transition px-3 py-1.5 rounded-lg text-sm">
            ← Exit
          </button>
          <button onClick={handleReset} className="text-muted hover:text-text hover:bg-muted/10 transition px-3 py-1.5 rounded-lg text-sm">
            ↺ Topic
          </button>
          <span className="font-semibold text-sm sm:text-base text-text">{topic || 'Live Coding'}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${langBadgeClass}`}>{initialLanguage}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${diffBadgeClass}`}>{difficulty}</span>
          {domain && <span className="text-xs text-muted ml-auto hidden sm:inline">{domain}</span>}
          {codeEvaluation && (
            <button onClick={() => setIsModalOpen(true)} className="ml-auto sm:ml-0 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition">
              View Result
            </button>
          )}
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-card rounded-xl overflow-hidden border border-border shadow-soft">
                <div className="bg-muted/10 px-4 sm:px-5 py-2.5 text-sm font-mono flex justify-between items-center border-b border-border">
                  <span className="flex items-center gap-2 text-text">📁 {fileName}</span>
                  <span className="text-xs text-muted bg-muted/20 px-2 py-0.5 rounded">{initialLanguage.toUpperCase()}</span>
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
              <button onClick={handleSubmitCode} disabled={isSubmitCodeDisabled} className="w-full bg-primary hover:brightness-105 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-base transition shadow-md">
                {loading ? 'Checking...' : '▶ Submit Code'}
              </button>
            </div>

            {/* Right: Problem, Feedback, Explanation */}
            <div className="space-y-5 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-100px)] pr-1 custom-scroll">
              {/* Problem card */}
              <div className="bg-card rounded-xl border border-border shadow-soft flex flex-col max-h-[500px] overflow-hidden">
                <div className="sticky top-0 z-10 flex items-center gap-2 text-primary font-semibold text-base px-5 pt-5 pb-2 bg-inherit">📝 Problem</div>
                <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 custom-scroll">
                  <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-sans text-text">{codeProblem.problemStatement}</pre>
                  {codeProblem.exampleInput && (
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-muted">📥 Example Input</p>
                      <pre className="bg-muted/10 p-3 rounded-lg text-success text-xs whitespace-pre-wrap break-words">{safeDisplayValue(codeProblem.exampleInput)}</pre>
                    </div>
                  )}
                  {codeProblem.exampleOutput && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-muted">📤 Example Output</p>
                      <pre className="bg-muted/10 p-3 rounded-lg text-primary text-xs whitespace-pre-wrap break-words">{safeDisplayValue(codeProblem.exampleOutput)}</pre>
                    </div>
                  )}
                  {codeProblem.testCriteria && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-muted">🔍 Constraints</p>
                      <pre className="whitespace-pre-wrap break-words text-xs mt-1 text-muted">{codeProblem.testCriteria}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback card */}
              {feedback && (
                <div className={`p-4 rounded-xl border text-sm ${feedback.type === 'error'
                    ? 'bg-error/10 border-error/30 text-error'
                    : 'bg-success/10 border-success/30 text-success'
                  }`}>
                  <div className="font-semibold">{feedback.message}</div>
                  {feedback.type === 'success' && phase === 'explain_pending' && (
                    <button onClick={handleContinueToExplain} className="mt-3 bg-primary hover:brightness-105 text-white text-sm py-1.5 px-4 rounded-lg transition">
                      Continue → Answer Question
                    </button>
                  )}
                </div>
              )}

              {/* Explanation card */}
              {phase === 'explaining' && currentQuestion?.type === 'explain' && explainQuestionText && (
                <div className="bg-card border border-primary/30 rounded-xl p-5 shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-primary font-semibold text-sm">🤖 Explain ({explainCount}/3)</div>
                    <span className="text-xs text-muted bg-muted/20 px-2 py-0.5 rounded-full">Explain</span>
                  </div>
                  <p className="text-text text-sm mb-4 leading-relaxed break-words">{explainQuestionText}</p>
                  <textarea rows={4} value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} placeholder="Your answer..." className="w-full bg-muted/5 border border-border text-text rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary resize-none" />
                  <button onClick={handleSubmitAnswer} disabled={loading} className="mt-3 w-full bg-primary hover:brightness-105 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition">{loading ? 'Submitting...' : 'Submit Answer'}</button>
                </div>
              )}

              {/* Next Code button in review phase */}
              {phase === 'review' && codeEvaluation && (
                <div className="p-4 rounded-xl border bg-warning/10 border-warning/30 text-warning">
                  <p className="text-sm mb-3">
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
        evaluation={codeEvaluation} 
        explainAnswers={explainAnswersList} 
        problemStatement={submittedProblem} 
        code={submittedCode} 
        exampleInput={submittedExampleInput} 
        exampleOutput={submittedExampleOutput} 
      />

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 rounded-2xl shadow-soft bg-card border border-border">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted/20">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-center text-text mb-2">
                Confirm Exit
              </h3>
              <p className="text-center text-muted mb-6">
                Are you sure you want to exit the coding session?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelExit}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-muted/20 hover:bg-muted/30 text-text"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary hover:brightness-105 text-white transition-all duration-200 shadow-md"
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