// components/StartInterviewModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, Sparkles, Zap } from 'lucide-react';

// Import Base Components
import { BaseButton } from './base/BaseButton';
import { BaseInput } from './base/BaseInput';
import { BaseModal } from './base/BaseModal';

export const StartInterviewModal = ({ isOpen, onClose, onStart }) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTopic('');
      setDifficulty('medium');
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
      onStart({ topic, difficulty });
    } else {
      // Fallback: navigate trực tiếp
      navigate('/interview', { state: { topic, difficulty } });
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

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          leftIcon={!loading && <Sparkles className="w-5 h-5" />}
          disabled={loading || !topic.trim()}
          className="mt-2 py-3 shadow-md hover:shadow-lg"
        >
          {loading ? 'Starting...' : 'Start Interview'}
        </BaseButton>
      </form>
    </BaseModal>
  );
};
