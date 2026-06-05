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
        {/* Gradient border effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-blue-500 rounded-2xl blur opacity-75 animate-pulse"></div>
        <div className="relative bg-card backdrop-blur-xl rounded-2xl shadow-soft border border-border overflow-hidden">
          <div className="relative px-6 pt-5 pb-3 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-text">Start New Interview</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted/10 transition-colors">
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Topic */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Topic / Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., React Developer, Node.js"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white dark:bg-gray-800 text-text placeholder:text-muted focus:ring-2 focus:ring-primary outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      difficulty === level
                        ? 'bg-primary text-white shadow-md scale-105'
                        : 'bg-muted/20 text-text hover:bg-muted/30'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Interview Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode('classic')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    mode === 'classic'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-white dark:bg-gray-800 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-warning" />
                    <span className="font-medium text-text">Classic</span>
                  </div>
                  <p className="text-xs text-muted mt-1">10 fixed questions</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('adaptive')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    mode === 'adaptive'
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-white dark:bg-gray-800 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5 text-success" />
                    <span className="font-medium text-text">Adaptive</span>
                  </div>
                  <p className="text-xs text-muted mt-1">Smart follow-up AI</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full mt-4 py-3 bg-primary hover:brightness-105 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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