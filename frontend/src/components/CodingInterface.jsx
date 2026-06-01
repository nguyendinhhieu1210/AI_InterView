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
  const [currentCodeEvaluation, setCurrentCodeEvaluation] = useState(null);
  const [finalSessionEvaluation, setFinalSessionEvaluation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [explainAnswersList, setExplainAnswersList] = useState([]);
  const [submittedCode, setSubmittedCode] = useState('');
  const [submittedProblem, setSubmittedProblem] = useState('');
  const [submittedExampleInput, setSubmittedExampleInput] = useState('');
  const [submittedExampleOutput, setSubmittedExampleOutput] = useState('');

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
    setCurrentCodeEvaluation(null);
    setFinalSessionEvaluation(null);
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
      toast.error(err.response?.data?.error || 'Failed to submit code');
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
      
      // Display only "✅ Correct" / "❌ Incorrect"
      setFeedback({ 
        type: correct ? 'success' : 'error', 
        message: correct ? '✅ Correct' : '❌ Incorrect' 
      });
      
      correct ? toast.success('✅ Correct') : toast.error('❌ Incorrect');

      if (evaluation && completedForCurrentCode) {
        console.log('✅ Completed round, opening evaluation modal...');
        setCurrentCodeEvaluation(evaluation);
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
        setCurrentCodeEvaluation(null);
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
      console.error('Submit answer error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit answer');
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
        setCurrentCodeEvaluation(null);
        setExplainAnswersList([]);
        setSubmittedCode('');
        setSubmittedProblem('');
        setSubmittedExampleInput('');
        setSubmittedExampleOutput('');
        toast.success('New coding question ready!');
      } else {
        toast.error('Could not load next question');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error loading next question');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Change topic? All progress will be lost.')) onReset();
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Progress will not be saved.')) {
      navigate('/welcome');
    }
  };

  if (phase === 'completed' && finalSessionEvaluation) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center p-6`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full shadow-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>🎉 Interview Completed</h2>
          <div className="space-y-5">
            <div className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} p-4 rounded-xl`}>
              <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>{finalSessionEvaluation.summary || 'Thank you for participating.'}</p>
              {finalSessionEvaluation.feedback && <p className={`text-sm mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{finalSessionEvaluation.feedback}</p>}
            </div>
            {finalSessionEvaluation.strengths?.length > 0 && (
              <div><h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">✅ Strengths</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {finalSessionEvaluation.strengths.map((s, i) => <li key={i} className={isDark ? 'text-gray-300' : 'text-gray-700'}>{s}</li>)}
                </ul>
              </div>
            )}
            {finalSessionEvaluation.weaknesses?.length > 0 && (
              <div><h3 className="font-semibold text-rose-600 dark:text-rose-400 mb-2">⚠️ Areas to improve</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {finalSessionEvaluation.weaknesses.map((w, i) => <li key={i} className={isDark ? 'text-gray-300' : 'text-gray-700'}>{w}</li>)}
                </ul>
              </div>
            )}
            <button onClick={onReset} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition">Start Over</button>
          </div>
        </div>
      </div>
    );
  }

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
          {currentCodeEvaluation && (
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

              {/* Feedback card - only one line */}
              {feedback && (
                <div className={`p-4 rounded-xl border text-sm ${
                  feedback.type === 'error'
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
            </div>
          </div>
        </div>
      </div>

      <EvaluationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onNext={handleNextCode} evaluation={currentCodeEvaluation} explainAnswers={explainAnswersList} problemStatement={submittedProblem} code={submittedCode} exampleInput={submittedExampleInput} exampleOutput={submittedExampleOutput} />
    </>
  );
}