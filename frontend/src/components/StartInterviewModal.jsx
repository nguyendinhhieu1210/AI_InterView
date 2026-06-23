// components/StartInterviewModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Loader2,
  Brain,
  Target,
  Sparkles,
  Zap,
  MessageSquare,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from './base/BaseButton';
import { BaseCard } from './base/BaseCard';
import { BaseInput } from './base/BaseInput';
import { BaseModal } from './base/BaseModal';

export const StartInterviewModal = ({ isOpen, onClose, onStart }) => {
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
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (onStart) {
      // Nếu có callback onStart, gọi nó
      onStart({ topic, difficulty, mode });
    } else {
      // Fallback: navigate trực tiếp
      if (mode === 'classic') {
        navigate('/interview', { state: { topic, difficulty } });
      } else {
        navigate('/adaptive-interview', { state: { topic, difficulty } });
      }
    }

    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-text">Start New Interview</h3>
        </div>
      }
      size="md"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Topic */}
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            Topic / Role
          </label>
          <BaseInput
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., React Developer, Node.js"
            leftIcon={<Target className="h-4 w-4 text-primary" />}
            required
            autoFocus
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['easy', 'medium', 'hard'].map((level) => (
              <BaseButton
                key={level}
                type="button"
                variant={difficulty === level ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setDifficulty(level)}
                className={`py-2.5 text-sm font-medium transition-all ${
                  difficulty === level ? 'scale-105' : ''
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </BaseButton>
            ))}
          </div>
        </div>

        {/* Interview Mode */}
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            Interview Mode
          </label>
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

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          leftIcon={!loading && <Sparkles className="w-5 h-5" />}
          disabled={loading || !topic.trim()}
          className="mt-4 py-3 shadow-md hover:shadow-lg"
        >
          {loading ? 'Starting...' : 'Continue'}
        </BaseButton>
      </form>
    </BaseModal>
  );
};
