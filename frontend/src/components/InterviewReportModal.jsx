import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Award, ThumbsUp, ThumbsDown, Lightbulb, Clock } from 'lucide-react';

export default function InterviewReportModal({ reportData, onClose }) {
  const [expandedItems, setExpandedItems] = useState({});
  const { finalScore, summary, topic, difficulty, conversation } = reportData;
  const questionBreakdown = summary?.questionBreakdown || [];

  const toggleItem = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const formatScore = (score) => {
    if (score === null || score === undefined) return '—';
    return `${score}/10`;
  };

  const getScoreColor = (score) => {
    if (score === null) return 'text-gray-400';
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getUserAnswer = (questionNumber) => {
    if (!conversation) return null;
    let qCount = 0;
    for (let i = 0; i < conversation.length; i++) {
      if (conversation[i].role === 'assistant' && conversation[i].type === 'question') {
        qCount++;
        if (qCount === questionNumber && conversation[i+1]?.role === 'user') {
          return conversation[i+1].content;
        }
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full h-auto max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Award className="w-7 h-7 text-yellow-500" />
              Interview Report
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {topic} • {difficulty?.toUpperCase()} • Final Score: {finalScore}/10
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overall Score */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Score</p>
              <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">{finalScore}/10</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Based on {questionBreakdown.length} answers</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-3"><ThumbsUp className="w-5 h-5" /> Strengths</div>
              {summary?.strengths?.length > 0 ? (
                <ul className="space-y-2">{summary.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> {s}</li>)}</ul>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400">No specific strengths recorded.</p>}
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold mb-3"><ThumbsDown className="w-5 h-5" /> Weaknesses</div>
              {summary?.weaknesses?.length > 0 ? (
                <ul className="space-y-2">{summary.weaknesses.map((w, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><span className="text-red-500 mt-0.5">✗</span> {w}</li>)}</ul>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400">No specific weaknesses noted.</p>}
            </div>
          </div>

          {/* Learning Roadmap */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 font-semibold mb-3"><Lightbulb className="w-5 h-5" /> Learning Roadmap</div>
            {summary?.learningRoadmap?.length > 0 ? (
              <ul className="space-y-2">{summary.learningRoadmap.map((item, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"><span className="text-yellow-500 mt-0.5">•</span> {item}</li>)}</ul>
            ) : <p className="text-sm text-gray-500 dark:text-gray-400">Keep practicing to identify areas for improvement.</p>}
          </div>

          {/* Interview Timeline with full details */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Interview Timeline</h4>
            <div className="space-y-3">
              {questionBreakdown.map((item, idx) => {
                const userAnswer = getUserAnswer(item.questionNumber);
                return (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <button onClick={() => toggleItem(idx)} className="w-full flex justify-between items-start p-4 text-left bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-gray-500 dark:text-gray-400">Q{item.questionNumber}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreColor(item.score)} bg-opacity-20`}>Score: {formatScore(item.score)} ({item.verdict || 'N/A'})</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{item.question}</p>
                      </div>
                      <div className="flex-shrink-0">{expandedItems[idx] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}</div>
                    </button>
                    {expandedItems[idx] && (
                      <div className="p-5 border-t border-gray-200 dark:border-gray-700 space-y-4 bg-white dark:bg-gray-800">
                        <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Your Answer</p><div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{userAnswer || 'No answer recorded.'}</div></div>
                        {item.idealAnswer && <div><p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Ideal Answer</p><div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-gray-700 dark:text-gray-300 text-sm">{item.idealAnswer}</div></div>}
                        {item.feedback && <div><p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Feedback</p><div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-gray-700 dark:text-gray-300 text-sm">{item.feedback}</div></div>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {item.correctConcepts?.length > 0 && <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3"><p className="font-semibold text-green-700 dark:text-green-300 mb-1">✓ Correct Concepts</p><ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">{item.correctConcepts.map((c, i) => <li key={i}>{c}</li>)}</ul></div>}
                          {item.missingConcepts?.length > 0 && <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3"><p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">📚 Missing Concepts</p><ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">{item.missingConcepts.map((m, i) => <li key={i}>{m}</li>)}</ul></div>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium">Close Report</button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }.animate-fadeIn { animation: fadeIn 0.2s ease-out; }`}</style>
    </div>
  );
}