// components/StartInterviewModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Brain, Target, Sparkles, Zap, MessageSquare } from 'lucide-react';

export const StartInterviewModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [mode, setMode] = useState('classic');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTopic('');
      setDifficulty('medium');
      setMode('classic');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (mode === 'classic') {
      navigate('/interview', { state: { topic, difficulty } });
    } else {
      navigate('/adaptive-interview', { state: { topic, difficulty } });
    }
    
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
        <div className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
          <div className="relative px-6 pt-5 pb-3 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Start New Interview
              </h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Topic / Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-4 w-4 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React Developer, Node.js"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      difficulty === level
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode - improved for both themes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Interview Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('classic')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    mode === 'classic'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-100">Classic</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10 fixed questions</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('adaptive')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    mode === 'adaptive'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-gray-800/30 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-gray-800 dark:text-gray-100">Adaptive</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Smart follow-up AI</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{loading ? 'Starting...' : 'Continue'}</span>
            </button>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};