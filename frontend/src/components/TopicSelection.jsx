// frontend/src/components/TopicSelection.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  Edit2,
  Code2,
  FolderTree,
  BookOpen,
  Target,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Zap,
} from 'lucide-react';

// Import Base Components
import { BaseButton } from './base/BaseButton';
import { BaseCard } from './base/BaseCard';
import { BaseInput } from './base/BaseInput';
import { BaseBadge } from './base/BaseBadge';

const DIFFICULTY_CONFIG = {
  beginner: {
    label: 'Beginner',
    color: 'from-success to-teal-500',
    border: 'border-success/30',
    icon: '🌱',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'from-warning to-orange-500',
    border: 'border-warning/30',
    icon: '⚡',
  },
  advanced: {
    label: 'Advanced',
    color: 'from-error to-pink-500',
    border: 'border-error/30',
    icon: '🔥',
  },
};

export default function TopicSelection({ onSessionStart }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = useState('');
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState('beginner');

  const [loadingDomains, setLoadingDomains] = useState(false);
  const [, setLoadingTopics] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);

  const [showDomainList, setShowDomainList] = useState(true);
  const [showTopicList, setShowTopicList] = useState(false);

  const resetState = () => {
    setDomains([]);
    setSelectedDomain('');
    setTopics([]);
    setSelectedTopic('');
    setDifficulty('beginner');
    setShowDomainList(true);
    setShowTopicList(false);
  };

  const loadDomains = async () => {
    if (!token) return toast.error('Please log in');
    if (!language.trim())
      return toast.error('Please enter a programming language');

    try {
      setLoadingDomains(true);
      const res = await api.get('/live-coding/domains', {
        params: { language: language.trim().toLowerCase() },
        headers: { Authorization: `Bearer ${token}` },
      });

      const domainList = res.data?.domains || [];
      setDomains(domainList);
      setSelectedDomain('');
      setTopics([]);
      setSelectedTopic('');
      setShowDomainList(true);
      setShowTopicList(false);
      toast.success('Domains loaded successfully 🚀');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load domains');
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleSelectDomain = async (domain) => {
    try {
      setLoadingTopics(true);
      setSelectedDomain(domain);
      setTopics([]);
      setSelectedTopic('');
      setShowDomainList(false);
      setShowTopicList(true);

      const res = await api.get('/live-coding/topics', {
        params: { language: language.trim().toLowerCase(), domain },
        headers: { Authorization: `Bearer ${token}` },
      });

      const topicList = res.data?.topics || [];
      setTopics(topicList);
      toast.success('Topics loaded');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to load topics');
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setShowTopicList(false);
  };

  const handleEditDomain = () => {
    setShowDomainList(true);
    setSelectedDomain('');
    setTopics([]);
    setSelectedTopic('');
    setShowTopicList(false);
  };

  const handleEditTopic = () => {
    setShowTopicList(true);
    setSelectedTopic('');
  };

  const handleStartInterview = async () => {
    if (!selectedTopic) return toast.error('Please select a topic');
    try {
      setStartingInterview(true);
      const res = await api.post(
        '/live-coding/start',
        {
          language: language.trim().toLowerCase(),
          domain: selectedDomain,
          topicName: selectedTopic,
          difficulty,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { sessionId, question } = res.data;
      if (!question?.problemStatement) throw new Error('Invalid question data');

      onSessionStart({
        sessionId,
        language,
        domain: selectedDomain,
        topic: selectedTopic,
        difficulty,
        problemStatement: question.problemStatement,
        testCriteria: question.testCriteria || '',
        exampleInput: question.exampleInput || '',
        exampleOutput: question.exampleOutput || '',
      });
      toast.success('Interview started! 🚀');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to create question');
    } finally {
      setStartingInterview(false);
    }
  };

  const Step = ({ number, title, isActive, isCompleted, isLast = false }) => (
    <div className="relative flex-1">
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-2">
        <div className="relative flex items-center justify-center">
          <div
            className={`
            w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 z-10
            ${
              isCompleted
                ? 'bg-success text-white shadow-md'
                : isActive
                  ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                  : 'bg-muted/20 text-muted'
            }
          `}
          >
            {isCompleted ? <CheckCircle className="w-4 h-4" /> : number}
          </div>
          {!isLast && (
            <div className="hidden sm:block absolute left-full w-full h-0.5 bg-gradient-to-r from-muted/30 to-muted/10 -translate-y-1/2 top-1/2">
              <div
                className={`h-full transition-all duration-500 ${isCompleted ? 'bg-success w-full' : 'w-0'}`}
              />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left mt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Step {number}
          </p>
          <p
            className={`text-sm font-semibold ${isActive ? 'text-text' : 'text-muted'}`}
          >
            {title}
          </p>
        </div>
      </div>
    </div>
  );

  const stepsCompleted = {
    1: !!language,
    2: !!selectedDomain,
    3: !!selectedTopic,
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-card/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <BaseButton
            variant="ghost"
            size="sm"
            leftIcon={
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            }
            onClick={() => navigate('/welcome')}
            className="group gap-1.5 px-2 py-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary/10"
          >
            Back
          </BaseButton>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs font-medium text-muted">AI Interview</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <BaseBadge
            variant="primary"
            rounded
            className="mb-3 gap-1.5 px-2.5 py-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Live Coding Challenge
          </BaseBadge>
          <h1 className="text-3xl sm:text-4xl font-black leading-normal pb-2 text-primary">
            AI Live Coding Interview
          </h1>
          <p className="text-muted mt-2 text-sm max-w-xl mx-auto">
            Select your tech stack, domain, and difficulty — AI generates a
            tailored coding problem.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8 px-1">
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-1">
            <Step
              number={1}
              title="Language"
              isActive={!stepsCompleted[1]}
              isCompleted={stepsCompleted[1]}
              isLast={false}
            />
            <Step
              number={2}
              title="Domain"
              isActive={stepsCompleted[1] && !stepsCompleted[2]}
              isCompleted={stepsCompleted[2]}
              isLast={false}
            />
            <Step
              number={3}
              title="Topic"
              isActive={stepsCompleted[2] && !stepsCompleted[3]}
              isCompleted={stepsCompleted[3]}
              isLast={false}
            />
            <Step
              number={4}
              title="Difficulty"
              isActive={stepsCompleted[3] && !difficulty}
              isCompleted={!!difficulty && stepsCompleted[3]}
              isLast={true}
            />
          </div>
        </div>

        {/* Step 1: Language Card */}
        <BaseCard className="p-5 mb-5 hover:shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">
                1. Choose Language
              </h2>
              <p className="text-xs text-muted">Pick your preferred language</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <BaseInput
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  resetState();
                }}
                onKeyDown={(e) => e.key === 'Enter' && loadDomains()}
                placeholder="e.g., python, javascript, java, go, rust..."
                leftIcon={<Code2 className="w-4 h-4" />}
              />
            </div>
            <BaseButton
              variant="primary"
              loading={loadingDomains}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              onClick={loadDomains}
              disabled={loadingDomains}
              className="px-5 py-2.5"
            >
              {loadingDomains ? 'Loading...' : 'Analyze'}
            </BaseButton>
          </div>
        </BaseCard>

        {/* Step 2: Domain */}
        {domains.length > 0 && (
          <BaseCard className="p-5 mb-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">
                  2. Select Domain
                </h2>
                <p className="text-xs text-muted">Focus area</p>
              </div>
            </div>

            {!showDomainList && selectedDomain && (
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-text">
                    {selectedDomain}
                  </span>
                </div>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={handleEditDomain}
                  className="p-1.5 text-primary hover:bg-primary/10"
                />
              </div>
            )}

            {showDomainList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {domains.map((d) => (
                  <BaseButton
                    key={d}
                    variant="outline"
                    size="sm"
                    leftIcon={<FolderTree className="w-3.5 h-3.5" />}
                    onClick={() => handleSelectDomain(d)}
                    className="group justify-start px-3 py-2 hover:border-primary/50 hover:shadow-sm"
                  >
                    <span className="font-medium text-text">{d}</span>
                  </BaseButton>
                ))}
              </div>
            )}
          </BaseCard>
        )}

        {/* Step 3: Topic */}
        {topics.length > 0 && (
          <BaseCard className="p-5 mb-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-success/10 text-success">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">
                  3. Pick a Topic
                </h2>
                <p className="text-xs text-muted">Choose a specific topic</p>
              </div>
            </div>

            {!showTopicList && selectedTopic && (
              <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm text-text">
                    {selectedTopic}
                  </span>
                </div>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={handleEditTopic}
                  className="p-1.5 text-success hover:bg-success/10"
                />
              </div>
            )}

            {showTopicList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {topics.map((t) => (
                  <BaseButton
                    key={t}
                    variant="outline"
                    size="sm"
                    leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                    onClick={() => handleSelectTopic(t)}
                    className="group justify-start px-3 py-2 hover:border-success/50 hover:shadow-sm"
                  >
                    <span className="font-medium text-text">{t}</span>
                  </BaseButton>
                ))}
              </div>
            )}
          </BaseCard>
        )}

        {/* Step 4: Difficulty */}
        {selectedTopic && (
          <BaseCard className="p-5 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-warning/10 text-warning">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">
                  4. Set Difficulty
                </h2>
                <p className="text-xs text-muted">Challenge intensity</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(DIFFICULTY_CONFIG).map(
                ([key, { label, color, border, icon }]) => (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`
                    relative overflow-hidden group p-3 rounded-lg border transition-all duration-200
                    ${
                      difficulty === key
                        ? `bg-gradient-to-r ${color} text-white border-transparent shadow-md scale-[1.01]`
                        : `bg-card ${border} text-text hover:scale-[1.01] hover:shadow-sm`
                    }
                  `}
                  >
                    <div className="flex flex-col items-center text-center gap-1">
                      <span className="text-xl">{icon}</span>
                      <span className="font-bold text-sm">{label}</span>
                      <p
                        className={`text-[10px] ${difficulty === key ? 'text-white/80' : 'text-muted'}`}
                      >
                        {key === 'beginner' && 'Starter friendly'}
                        {key === 'intermediate' && 'Needs practice'}
                        {key === 'advanced' && 'Expert level'}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          </BaseCard>
        )}

        {/* Start Button */}
        {selectedTopic && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <BaseButton
              variant="primary"
              size="lg"
              fullWidth
              loading={startingInterview}
              leftIcon={
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              }
              rightIcon={
                <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              }
              onClick={handleStartInterview}
              disabled={startingInterview}
              className="py-3.5 text-base shadow-md hover:shadow-lg group"
            >
              {startingInterview ? 'Crafting challenge...' : 'Start Interview'}
            </BaseButton>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            AI-powered • Real-time execution • Personalized feedback
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
