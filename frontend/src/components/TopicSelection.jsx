import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Edit2, Code2, FolderTree, BookOpen, Target, ArrowLeft,
  CheckCircle, ChevronRight, Zap
} from 'lucide-react';

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'from-emerald-500 to-teal-500', border: 'border-emerald-200 dark:border-emerald-800', icon: '🌱' },
  intermediate: { label: 'Intermediate', color: 'from-amber-500 to-orange-500', border: 'border-amber-200 dark:border-amber-800', icon: '⚡' },
  advanced: { label: 'Advanced', color: 'from-rose-500 to-pink-500', border: 'border-rose-200 dark:border-rose-800', icon: '🔥' },
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
  const [loadingTopics, setLoadingTopics] = useState(false);
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
    if (!language.trim()) return toast.error('Please enter a programming language');

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
          <div className={`
            w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 z-10
            ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' :
              isActive ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md ring-2 ring-indigo-300/50 dark:ring-indigo-800/50' :
                'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
          `}>
            {isCompleted ? <CheckCircle className="w-4 h-4" /> : number}
          </div>
          {!isLast && (
            <div className="hidden sm:block absolute left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 -translate-y-1/2 top-1/2">
              <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-teal-500 w-full' : 'w-0'}`} />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left mt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Step {number}</p>
          <p className={`text-sm font-semibold ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{title}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/welcome')}
            className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">AI Interview</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero Section - đã đổi tiêu đề và thêm gradient màu sắc cho chữ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100/60 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium mb-3 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Coding Challenge</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black leading-normal pb-2 text-purple-600">
            AI Live Coding Interview
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xl mx-auto">
            Select your tech stack, domain, and difficulty — AI generates a tailored coding problem.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-8 px-1">
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-1">
            <Step number={1} title="Language" isActive={!stepsCompleted[1]} isCompleted={stepsCompleted[1]} isLast={false} />
            <Step number={2} title="Domain" isActive={stepsCompleted[1] && !stepsCompleted[2]} isCompleted={stepsCompleted[2]} isLast={false} />
            <Step number={3} title="Topic" isActive={stepsCompleted[2] && !stepsCompleted[3]} isCompleted={stepsCompleted[3]} isLast={false} />
            <Step number={4} title="Difficulty" isActive={stepsCompleted[3] && !difficulty} isCompleted={!!difficulty && stepsCompleted[3]} isLast={true} />
          </div>
        </div>

        {/* Step 1: Language Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 p-5 mb-5 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white">1. Choose Language</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pick your preferred language</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  resetState();
                }}
                onKeyDown={(e) => e.key === 'Enter' && loadDomains()}
                placeholder="e.g., python, javascript, java, go, rust..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={loadDomains}
              disabled={loadingDomains}
              className="px-5 py-2.5 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 rounded-lg text-white font-semibold transition shadow-sm hover:shadow flex items-center justify-center gap-1.5"
            >
              {loadingDomains ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                <>
                  Analyze <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Domain */}
        {domains.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 p-5 mb-5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800 dark:text-white">2. Select Domain</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Focus area</p>
              </div>
            </div>

            {!showDomainList && selectedDomain && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{selectedDomain}</span>
                </div>
                <button
                  onClick={handleEditDomain}
                  className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {showDomainList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSelectDomain(d)}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all text-left text-sm"
                  >
                    <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                      <FolderTree className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{d}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Topic */}
        {topics.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 p-5 mb-5 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800 dark:text-white">3. Pick a Topic</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose a specific topic</p>
              </div>
            </div>

            {!showTopicList && selectedTopic && (
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{selectedTopic}</span>
                </div>
                <button
                  onClick={handleEditTopic}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {showTopicList && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {topics.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectTopic(t)}
                    className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all text-left text-sm"
                  >
                    <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Difficulty */}
        {selectedTopic && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 p-5 mb-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800 dark:text-white">4. Set Difficulty</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Challenge intensity</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, { label, color, border, icon }]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key)}
                  className={`
                    relative overflow-hidden group p-3 rounded-lg border transition-all duration-200
                    ${difficulty === key
                      ? `bg-gradient-to-r ${color} text-white border-transparent shadow-md scale-[1.01]`
                      : `bg-white dark:bg-gray-900 ${border} text-gray-700 dark:text-gray-300 hover:scale-[1.01] hover:shadow-sm`
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center gap-1">
                    <span className="text-xl">{icon}</span>
                    <span className="font-bold text-sm">{label}</span>
                    <p className={`text-[10px] ${difficulty === key ? 'text-white/80' : 'text-gray-400'}`}>
                      {key === 'beginner' && 'Starter friendly'}
                      {key === 'intermediate' && 'Needs practice'}
                      {key === 'advanced' && 'Expert level'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Start Button */}
        {selectedTopic && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <button
              onClick={handleStartInterview}
              disabled={startingInterview}
              className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-60 py-3.5 rounded-xl text-white text-base font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              {startingInterview ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Crafting challenge...
                </span>
              ) : (
                <span>Start Interview <ChevronRight className="inline w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" /></span>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            AI-powered • Real-time execution • Personalized feedback
          </p>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99,102,241,0.5);
        }
      `}</style>
    </div>
  );
}