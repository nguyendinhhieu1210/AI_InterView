// components/StartAdaptiveInterviewModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, Sparkles, Sliders, MessageSquare } from 'lucide-react';

// Import Base Components
import { BaseButton } from './base/BaseButton';
import { BaseInput } from './base/BaseInput';
import { BaseModal } from './base/BaseModal';

export const StartAdaptiveInterviewModal = ({ isOpen, onClose, onStart }) => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTopic('');
      setQuestionCount(5);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (onStart) {
      onStart({ topic, questionCount });
    } else {
      navigate('/adaptive-interview', {
        state: {
          topic,
          questionCount,
        },
      });
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
          <h3 className="text-xl font-bold text-text">
            Start Adaptive Interview
          </h3>
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

        {/* Question Count - FIXED VERSION */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-text">
              Number of Questions
            </label>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {questionCount} questions
            </span>
          </div>

          <div className="flex items-center gap-4 px-1">
            <Sliders className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 relative">
              <input
                type="range"
                min={5}
                max={8}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2 rounded-full bg-primary/20 dark:bg-primary/30 appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r 
                  [&::-webkit-slider-thumb]:from-primary [&::-webkit-slider-thumb]:to-secondary 
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
                  [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r 
                  [&::-moz-range-thumb]:from-primary [&::-moz-range-thumb]:to-secondary 
                  [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:shadow-lg"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((questionCount - 5) / 3) * 100}%, #e5e7eb ${((questionCount - 5) / 3) * 100}%, #e5e7eb 100%)`,
                }}
              />
              {/* Range markers */}
              <div className="flex justify-between px-0.5 mt-1.5">
                {[5, 6, 7, 8].map((num) => (
                  <span
                    key={num}
                    className={`text-xs font-medium transition-colors duration-200
                      ${
                        questionCount === num
                          ? 'text-primary font-bold'
                          : 'text-muted'
                      }`}
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Session type badge */}
          <div className="mt-4 flex justify-center">
            <div
              className={`
                px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300
                ${
                  questionCount === 5
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-400/30'
                    : questionCount === 6
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-400/30'
                      : questionCount === 7
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 ring-1 ring-purple-400/30'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-400/30'
                }
              `}
            >
              {questionCount === 5 && '⚡ Quick Session'}
              {questionCount === 6 && '📊 Balanced Session'}
              {questionCount === 7 && '🎯 Deep Session'}
              {questionCount === 8 && '🏆 Comprehensive Session'}
            </div>
          </div>
        </div>

        {/* Adaptive Info */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/5 dark:to-secondary/5 border border-primary/20 dark:border-primary/30">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-primary/20 mt-0.5">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">
                Adaptive Intelligence
              </p>
              <p className="text-xs text-muted mt-0.5">
                Questions adapt to your answers in real-time. The AI will adjust
                difficulty and follow-up questions based on your performance.
              </p>
            </div>
          </div>
        </div>

        <BaseButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          leftIcon={!loading && <MessageSquare className="w-5 h-5" />}
          disabled={loading || !topic.trim()}
          className="mt-2 py-3 shadow-md hover:shadow-lg"
        >
          {loading ? 'Starting...' : 'Start Adaptive Interview'}
        </BaseButton>
      </form>
    </BaseModal>
  );
};
